/**
 * TaskController — pure coordinator. No data logic, no DOM manipulation.
 *
 * Responsibilities:
 *  - Wire View events → Model operations
 *  - Subscribe to EventBus → re-render when Model changes
 *  - Pass Model data to View for rendering
 *
 * What it does NOT do:
 *  - Filter or sort tasks               (TaskManager.query)
 *  - Count or compute stats             (TaskManager.stats)
 *  - Validate input                     (TaskFactory / Task.update)
 *  - Display errors                     (TaskView.showError)
 *  - Reload from storage on every tick  (TaskManager maintains its own state)
 */
export class TaskController {
    /**
     * @param {import('../views/TaskView.js').TaskView}          view
     * @param {import('../services/TaskManager.js').TaskManager} taskManager
     * @param {import('../events/EventBus.js').EventBus}          eventBus
     */
    constructor(view, taskManager, eventBus) {
        this.view    = view;
        this.manager = taskManager;
        this.bus     = eventBus;

        this.currentSort    = 'newest';
        this.currentFilters = { category: '', priority: '', status: 'Pending' };

        this._bindViewEvents();
        this._subscribeToModelEvents();
    }

    // ─── Bootstrap ────────────────────────────────────────────────────────────

    /** Called once on startup — renders the initial state. */
    init() { this.refresh(); }

    // ─── View → Controller (UI events) ───────────────────────────────────────

    _bindViewEvents() {
        this.view.bindAddTaskBtn(() => this._openAddModal());
        this.view.bindSearchInput(() => this.refresh());

        this.view.bindOpenFilterModal(()  => this._openFilterModal());
        this.view.bindCloseFilterModal(() => this.view.closeFilterModal());
        this.view.bindApplyFilter(()      => this._applyFilter());
        this.view.bindResetFilter(()      => this._resetFilter());
    }

    // ─── Model → Controller (EventBus subscriptions) ─────────────────────────
    //
    // Only mutation events trigger a refresh.
    // 'tasks:loaded' is intentionally excluded — manager.load() is called
    // from refresh() itself, which would create an infinite loop.

    _subscribeToModelEvents() {
        const MUTATION_EVENTS = [
            'task:created',
            'task:updated',
            'task:completed',
            'task:rejected',
            'task:reopened',
            'task:deleted',
        ];

        MUTATION_EVENTS.forEach(event => {
            this.bus.subscribe(event, () => this.refresh());
        });
    }

    // ─── Task CRUD ────────────────────────────────────────────────────────────

    _openAddModal() {
        this.view.openAddModal(
            () => this._saveNewTask(),
            () => this.view.closeTaskModal()
        );
    }

    _saveNewTask() {
        const formData = this.view.readTaskForm();
        try {
            this.manager.add(formData.title, formData);
            // TaskManager publishes 'task:created' → subscription calls refresh()
        } catch (err) {
            this.view.showError(err.message); // ← View owns error display
            return;
        }
        this.view.closeTaskModal();
    }

    _openEditModal(task) {
        this.view.openEditModal(
            task,
            () => this._saveUpdatedTask(task),
            () => this.view.closeTaskModal()
        );
    }

    _saveUpdatedTask(task) {
        const formData = this.view.readTaskForm();
        try {
            this.manager.update(task.id, formData);
            // TaskManager publishes 'task:updated' → subscription calls refresh()
        } catch (err) {
            this.view.showError(err.message); // ← View owns error display
            return;
        }
        this.view.closeTaskModal();
    }

    _completeTask(task) { this.manager.complete(task.id); }
    _rejectTask(task)   { this.manager.reject(task.id); }
    _deleteTask(task)   { this.manager.remove(task.id); }

    // ─── Filter & Sort ────────────────────────────────────────────────────────

    _openFilterModal() {
        this.view.openFilterModal(this.currentSort, this.currentFilters);
    }

    _applyFilter() {
        const { sort, category, priority, status } = this.view.readFilterForm();
        this.currentSort = sort;
        Object.assign(this.currentFilters, { category, priority, status });
        this.view.closeFilterModal();
        this.refresh(); // filter/sort is UI-only state — no Model event
    }

    _resetFilter() {
        this.currentSort    = 'newest';
        this.currentFilters = { category: '', priority: '', status: 'Pending' };
        this.view.closeFilterModal();
        this.refresh(); // same
    }

    // ─── Refresh ─────────────────────────────────────────────────────────────
    //
    // The controller's only job here is to:
    //   1. Ask the Model for the current data (query + stats)
    //   2. Pass it to the View for rendering
    // — no filtering, no counting, no DOM work happens here.

    refresh() {
        // Query applies search, filters, and sort — all Model responsibility
        const tasks = this.manager.query(
            {
                search:   this.view.getSearchTerm(),
                category: this.currentFilters.category,
                priority: this.currentFilters.priority,
                status:   this.currentFilters.status,
            },
            this.currentSort
        );

        const isFilterActive =
            this.currentFilters.category !== ''        ||
            this.currentFilters.priority !== ''        ||
            this.currentFilters.status   !== 'Pending' ||
            this.currentSort             !== 'newest';

        // Hand pre-computed data to View — View never filters or counts itself
        this.view.updateFilterBadge(isFilterActive);
        this.view.updateStats(this.manager.stats); // ← stats object from Model
        this.view.renderTasks(tasks, {
            onEdit:     task => this._openEditModal(task),
            onComplete: task => this._completeTask(task),
            onReject:   task => this._rejectTask(task),
            onDelete:   task => this._deleteTask(task),
        });
    }
}
