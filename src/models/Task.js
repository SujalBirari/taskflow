import { validateTaskForm, capitalise } from '../utils/validation.js';

export const CATEGORIES = ['Work', 'Personal', 'Study', 'Other'];
export const PRIORITIES  = ['Low', 'Medium', 'High'];
export const STATUSES    = ['Pending', 'Completed', 'Rejected'];

/**
 * Task — immutable-ish domain object with behaviour.
 *
 * Construction:
 *   new Task(title, opts)      — brand-new task
 *   Task.from(plainObject)     — rehydrate from JSON/localStorage
 */
export class Task {
    /**
     * @param {string} title
     * @param {{
     *   description?: string|null,
     *   category?: string|null,
     *   priority?: string|null,
     *   dueDate?: string|null,
     *   id?: string,
     *   status?: string,
     *   createdAt?: string,
     * }} opts
     */
    constructor(title, {
        description = null,
        category    = null,
        priority    = null,
        dueDate     = null,
        id          = crypto.randomUUID(),
        status      = 'Pending',
        createdAt   = new Date().toISOString().split('T')[0],
    } = {}) {
        this.id          = id;
        this.title       = title;
        this.description = description || null;
        this.category    = category    || null;
        this.priority    = priority    || null;
        this.dueDate     = dueDate     || null;
        this.status      = status;
        this.createdAt   = createdAt;
    }

    // ─── Status transitions ───────────────────────────────────────────────────

    /** Mark as completed. */
    complete() {
        this.status = 'Completed';
        return this;
    }

    /** Mark as rejected. */
    reject() {
        this.status = 'Rejected';
        return this;
    }

    /** Restore to pending. */
    reopen() {
        this.status = 'Pending';
        return this;
    }

    get isPending()   { return this.status?.toLowerCase() === 'pending'; }
    get isCompleted() { return this.status?.toLowerCase() === 'completed'; }
    get isRejected()  { return this.status?.toLowerCase() === 'rejected'; }

    /**
     * A task is overdue when it is still pending AND its due date is before today.
     * Completed / rejected tasks are never overdue.
     */
    get isOverdue() {
        if (!this.isPending || !this.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);                  // midnight local time
        return new Date(this.dueDate).getTime() < today.getTime();
    }

    // ─── Mutation ─────────────────────────────────────────────────────────────

    /**
     * Update editable fields. Validates title & dueDate.
     * @throws {Error} if validation fails
     */
    update({ title, description, catRaw, priRaw, dueDate }) {
        const errors = validateTaskForm({ title, dueDate, priRaw });
        if (errors.length > 0) {
            const err = new Error('Validation failed: ' + errors.map(e => e.message).join(' | '));
            err.fields = errors;
            err.isValidationError = true;
            throw err;
        }

        this.title       = title.trim();
        this.description = description?.trim() || null;
        this.category    = capitalise(catRaw);
        this.priority    = capitalise(priRaw);
        this.dueDate     = dueDate || null;

        return this;
    }

    // ─── Serialisation ────────────────────────────────────────────────────────

    /** Serialise to a plain object (for JSON storage). */
    toJSON() {
        return {
            id:          this.id,
            title:       this.title,
            description: this.description,
            category:    this.category,
            priority:    this.priority,
            dueDate:     this.dueDate,
            status:      this.status,
            createdAt:   this.createdAt,
        };
    }

    /**
     * Rehydrate a Task instance from a plain object.
     * @param {object} obj
     * @returns {Task}
     */
    static from(obj) {
        return new Task(obj.title, {
            id:          obj.id,
            description: obj.description,
            category:    obj.category,
            priority:    obj.priority,
            dueDate:     obj.dueDate,
            status:      obj.status,
            createdAt:   obj.createdAt,
        });
    }

    /**
     * Factory: validate inputs and return a new Task.
     * @throws {Error} if validation fails.
     */
    static create(title, { description, catRaw, priRaw, dueDate } = {}) {
        const titleCheck = validateTitle(title);
        if (!titleCheck.valid) throw new Error(titleCheck.error);

        const dateCheck = validateDueDate(dueDate);
        if (!dateCheck.valid)  throw new Error(dateCheck.error);

        return new Task(title, {
            description: description || null,
            category:    capitalise(catRaw),
            priority:    capitalise(priRaw),
            dueDate:     dueDate || null,
        });
    }
}
