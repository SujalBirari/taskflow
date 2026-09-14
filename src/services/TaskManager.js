import { TaskFactory }    from '../factories/TaskFactory.js';
import { StorageService } from './StorageService.js';

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

/**
 * TaskManager — the authoritative collection of Task objects.
 *
 * Responsibilities:
 *  - Load / save through StorageService
 *  - CRUD operations (add, update, remove, status changes)
 *  - Filter & sort queries (returns new arrays; never mutates internal list)
 *  - Publish domain events via EventBus after every mutation
 */
export class TaskManager {
    /**
     * @param {StorageService}                     storageService
     * @param {import('../events/EventBus.js').EventBus} eventBus
     */
    constructor(storageService, eventBus) {
        this._storage = storageService;
        this._bus     = eventBus;
        /** @type {import('../models/Task.js').Task[]} */
        this._tasks   = [];
        this.load();
    }

    // ─── Persistence ─────────────────────────────────────────────────────────

    /** Reload Task instances from storage. */
    load() {
        const raw   = this._storage.load();
        this._tasks = raw.map(obj => TaskFactory.fromStorage(obj));
        this._bus?.publish('tasks:loaded', { tasks: this.getAll() });
        return this;
    }

    /** Persist the current task list to storage. */
    save() {
        this._storage.save(this._tasks);
        return this;
    }

    // ─── Read ────────────────────────────────────────────────────────────────

    /** Return a shallow copy of all tasks. */
    getAll() { return [...this._tasks]; }

    /** Return the Task with matching id, or undefined. */
    getById(id) { return this._tasks.find(t => t.id === id); }

    /** Total count of tasks. */
    get count()     { return this._tasks.length; }
    get pending()   { return this._tasks.filter(t => t.isPending); }
    get completed() { return this._tasks.filter(t => t.isCompleted); }
    get rejected()  { return this._tasks.filter(t => t.isRejected); }
    /** Pending tasks whose due date has passed. */
    get overdue()   { return this._tasks.filter(t => t.isOverdue); }

    /**
     * Pre-computed summary counts — the Model owns this logic.
     * @returns {{ total: number, completed: number, pending: number, rejected: number, overdue: number }}
     */
    get stats() {
        return {
            total:     this._tasks.length,
            completed: this._tasks.filter(t => t.isCompleted).length,
            pending:   this._tasks.filter(t => t.isPending).length,
            rejected:  this._tasks.filter(t => t.isRejected).length,
            overdue:   this._tasks.filter(t => t.isOverdue).length,
        };
    }

    // ─── Write ───────────────────────────────────────────────────────────────

    /**
     * Create and add a new task.
     * Publishes: task:created
     * @throws {Error} on validation failure
     */
    add(title, opts = {}) {
        const task = TaskFactory.create({ title, ...opts });
        this._tasks.push(task);
        this.save();
        this._bus?.publish('task:created', { task });
        return task;
    }

    /**
     * Update an existing task's editable fields.
     * Publishes: task:updated
     * @throws {Error} if task not found or validation fails
     */
    update(id, fields) {
        const task = this.getById(id);
        if (!task) throw new Error(`Task ${id} not found.`);
        task.update(fields);
        this.save();
        this._bus?.publish('task:updated', { task });
        return task;
    }

    /**
     * Set a task's status to 'Completed'.
     * Publishes: task:completed
     * @throws {Error} if task not found
     */
    complete(id) {
        const task = this.getById(id);
        if (!task) throw new Error(`Task ${id} not found.`);
        task.complete();
        this.save();
        this._bus?.publish('task:completed', { task });
        return task;
    }

    /**
     * Set a task's status to 'Rejected'.
     * Publishes: task:rejected
     * @throws {Error} if task not found
     */
    reject(id) {
        const task = this.getById(id);
        if (!task) throw new Error(`Task ${id} not found.`);
        task.reject();
        this.save();
        this._bus?.publish('task:rejected', { task });
        return task;
    }

    /**
     * Re-open a task (set status to 'Pending').
     * Publishes: task:reopened
     * @throws {Error} if task not found
     */
    reopen(id) {
        const task = this.getById(id);
        if (!task) throw new Error(`Task ${id} not found.`);
        task.reopen();
        this.save();
        this._bus?.publish('task:reopened', { task });
        return task;
    }

    /**
     * Remove a task by id.
     * Publishes: task:deleted
     * @returns {boolean} true if removed, false if not found
     */
    remove(id) {
        const before = this._tasks.length;
        this._tasks  = this._tasks.filter(t => t.id !== id);
        if (this._tasks.length !== before) {
            this.save();
            this._bus?.publish('task:deleted', { id });
            return true;
        }
        return false;
    }

    // ─── Filter & Sort ────────────────────────────────────────────────────────

    /**
     * Return a filtered + sorted subset of tasks.
     *
     * @param {{
     *   search?:   string,
     *   category?: string,
     *   priority?: string,
     *   status?:   string,
     * }} filters
     * @param {'newest'|'oldest'|'priority'|'dueDate'|'alphabetical'} sort
     * @returns {Task[]}
     */
    query(filters = {}, sort = 'newest') {
        let result = [...this._tasks];

        const { search, category, priority, status } = filters;

        if (search) {
            const term = search.toLowerCase();
            result = result.filter(t => t.title?.toLowerCase().includes(term));
        }
        if (category) {
            result = result.filter(t => t.category?.toLowerCase() === category.toLowerCase());
        }
        if (priority) {
            result = result.filter(t => t.priority?.toLowerCase() === priority.toLowerCase());
        }
        if (status && status !== 'All') {
            result = result.filter(t => t.status?.toLowerCase() === status.toLowerCase());
        }

        return this._sort(result, sort);
    }

    /** @private */
    _sort(tasks, sort) {
        const copy = [...tasks];
        switch (sort) {
            case 'oldest':
                return copy.sort((a, b) =>
                    (a.createdAt ? new Date(a.createdAt).getTime() : 0) -
                    (b.createdAt ? new Date(b.createdAt).getTime() : 0));

            case 'priority':
                return copy.sort((a, b) =>
                    (PRIORITY_WEIGHT[b.priority?.toLowerCase()] ?? 0) -
                    (PRIORITY_WEIGHT[a.priority?.toLowerCase()] ?? 0));

            case 'dueDate':
                return copy.sort((a, b) => {
                    if (a.dueDate && !b.dueDate) return -1;
                    if (!a.dueDate && b.dueDate) return  1;
                    if (!a.dueDate && !b.dueDate) return 0;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                });

            case 'alphabetical':
                return copy.sort((a, b) =>
                    (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' }));

            case 'newest':
            default:
                return copy.sort((a, b) =>
                    (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
                    (a.createdAt ? new Date(a.createdAt).getTime() : 0));
        }
    }
}
