/**
 * TaskView — all DOM rendering and UI interactions.
 * Receives callbacks from TaskController; never touches storage directly.
 */
export class TaskView {
    constructor() {
        this.taskList        = document.querySelector('#task-list');
        this.taskModal       = document.querySelector('#task-modal');
        this.taskTitleInput  = document.querySelector('#task-title');

        this.filterModal        = document.querySelector('#filter-modal');
        this.filterActiveBadge  = document.querySelector('#filter-active-badge');
        this.openFilterBtn      = document.querySelector('#open-filter-modal-btn');
        this.closeFilterX       = document.querySelector('#close-filter-modal-x');
        this.cancelFilterBtn    = document.querySelector('#cancel-filter-modal-btn');
        this.applyFilterBtn     = document.querySelector('#apply-filter-modal-btn');
        this.resetFilterBtn     = document.querySelector('#reset-filter-modal-btn');

        this.modalSortBy        = document.querySelector('#modal-sort-by');
        this.modalCategory      = document.querySelector('#modal-filter-category');
        this.modalPriority      = document.querySelector('#modal-filter-priority');
        this.modalStatus        = document.querySelector('#modal-filter-status');

        this.searchInput        = document.querySelector('#search-task-title');
        this.addTaskBtn         = document.querySelector('#add-task-btn');

        this.statTotal     = document.querySelector('#stat-total-tasks');
        this.statCompleted = document.querySelector('#stat-completed-tasks');
        this.statPending   = document.querySelector('#stat-pending-tasks');
        this.statOverdue   = document.querySelector('#stat-overdue-tasks');
    }

    // ─── Stats ───────────────────────────────────────────────────────────────

    /**
     * Render pre-computed stats — no data logic here.
     * @param {{ total: number, completed: number, pending: number, overdue: number }} stats
     */
    updateStats({ total, completed, pending, overdue }) {
        if (this.statTotal)     this.statTotal.textContent     = total;
        if (this.statCompleted) this.statCompleted.textContent = completed;
        if (this.statPending)   this.statPending.textContent   = pending;
        if (this.statOverdue)   this.statOverdue.textContent   = overdue;

        // Pulse the overdue card when count > 0
        const overdueCard = this.statOverdue?.closest('div[class*="border-amber"]');
        if (overdueCard) {
            overdueCard.classList.toggle('ring-2',              overdue > 0);
            overdueCard.classList.toggle('ring-amber-300',      overdue > 0);
            overdueCard.classList.toggle('dark:ring-amber-700', overdue > 0);
        }
    }

    // ─── Error feedback ──────────────────────────────────────────────────────

    /**
     * Display inline errors below the relevant form fields.
     * Also applies a red border ring to the offending input.
     *
     * @param {{ field: string, message: string }[]} fieldErrors
     */
    showFieldErrors(fieldErrors) {
        fieldErrors.forEach(({ field, message }) => {
            // Show the error span
            const span = document.querySelector(`#error-${field}`);
            if (span) {
                span.textContent = message;
                span.classList.remove('hidden');
            }
            // Highlight the input/select
            const input = document.querySelector(`#${field}`);
            if (input) {
                input.classList.add('border-red-400', 'dark:border-red-500',
                                    'ring-2', 'ring-red-300', 'dark:ring-red-700');
            }
        });
    }

    /**
     * Remove all inline field errors and input highlights.
     */
    clearFieldErrors() {
        ['task-title', 'task-due', 'task-priority'].forEach(field => {
            const span = document.querySelector(`#error-${field}`);
            if (span) {
                span.textContent = '';
                span.classList.add('hidden');
            }
            const input = document.querySelector(`#${field}`);
            if (input) {
                input.classList.remove('border-red-400', 'dark:border-red-500',
                                       'ring-2', 'ring-red-300', 'dark:ring-red-700');
            }
        });
    }

    /**
     * Fallback for non-field errors (e.g. unexpected runtime errors).
     * @param {string} message
     */
    showError(message) {
        alert(message);
    }

    // ─── Task List ───────────────────────────────────────────────────────────

    renderTasks(tasks, callbacks) {
        this.taskList.innerHTML = '';

        if (tasks.length === 0) {
            this.taskList.appendChild(this._buildEmptyState());
            return;
        }

        tasks.forEach(task => {
            this.taskList.appendChild(this._buildTaskItem(task, callbacks));
        });
    }

    _buildEmptyState() {
        const li = document.createElement('li');
        li.className = 'text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-200 dark:border-gray-700';
        li.innerHTML = `
            <svg class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                    M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2">
                </path>
            </svg>
            <p class="text-base font-medium text-gray-600 dark:text-gray-400">No tasks found</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or search query</p>
        `;
        return li;
    }

    _buildTaskItem(task, { onEdit, onComplete, onReject, onDelete }) {
        const li = document.createElement('li');
        li.className = 'bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mb-3 hover:shadow-md transition-shadow';

        // ── Wrapper ──────────────────────────────────────────────────────────
        const row = document.createElement('div');
        row.classList.add('flex', 'justify-between', 'items-center');

        // ── Left: title + info tooltip ───────────────────────────────────────
        const left = document.createElement('div');
        left.classList.add('flex', 'items-center', 'space-x-2');

        const titleSpan = document.createElement('span');
        titleSpan.textContent = task.title;
        titleSpan.classList.add('font-medium', 'text-gray-900', 'dark:text-gray-100');
        left.appendChild(titleSpan);

        // Info tooltip
        const descWrap = document.createElement('div');
        descWrap.classList.add('relative', 'group', 'flex', 'items-center');

        const infoBtn = document.createElement('button');
        infoBtn.textContent = 'i';
        infoBtn.classList.add('w-5', 'h-5', 'rounded-full', 'bg-gray-200', 'dark:bg-gray-700', 'text-xs',
            'text-gray-600', 'dark:text-gray-400', 'flex', 'items-center', 'justify-center', 'focus:outline-none');
        descWrap.appendChild(infoBtn);

        const descText = (task.description || '').trim();
        const createdAtText = task.createdAt || 'Unknown';
        const tooltip = document.createElement('div');
        tooltip.innerHTML = `
            ${descText ? `<div class="mb-1"><strong>Desc:</strong> ${descText}</div>` : ''}
            <div><strong>Created:</strong> ${createdAtText}</div>
        `;
        tooltip.classList.add('absolute', 'left-full', 'ml-2', 'w-48', 'p-2',
            'bg-gray-800', 'dark:bg-gray-900',
            'text-white', 'dark:text-gray-200',
            'text-xs', 'rounded', 'shadow-lg', 'opacity-0',
            'group-hover:opacity-100', 'transition-opacity', 'duration-200',
            'pointer-events-none', 'z-10',
            'border', 'border-gray-700', 'dark:border-gray-600');
        descWrap.appendChild(tooltip);
        left.appendChild(descWrap);

        // ── Right: badges + actions ──────────────────────────────────────────
        const right = document.createElement('div');
        right.classList.add('flex', 'items-center', 'space-x-6');

        const badges = document.createElement('div');
        badges.classList.add('flex', 'items-center', 'space-x-2');
        badges.appendChild(this._buildBadges(task));

        const actions = document.createElement('div');
        actions.classList.add('flex', 'items-center', 'space-x-3', 'border-l', 'pl-4', 'border-gray-200', 'dark:border-gray-700');
        actions.appendChild(this._buildActions(task, { onEdit, onComplete, onReject, onDelete }));

        right.appendChild(badges);
        right.appendChild(actions);

        row.appendChild(left);
        row.appendChild(right);
        li.appendChild(row);
        return li;
    }

    _buildBadges(task) {
        const frag = document.createDocumentFragment();

        if (task.category) {
            const s = document.createElement('span');
            s.textContent = task.category;
            s.className = 'bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded w-20 text-center inline-block';
            frag.appendChild(s);
        }

        if (task.priority) {
            const colors = task.priority === 'High'
                ? 'bg-red-50 text-red-700'
                : task.priority === 'Medium'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-green-50 text-green-700';
            const s = document.createElement('span');
            s.textContent = task.priority;
            s.className = `text-xs font-medium px-2 py-1 rounded w-20 text-center inline-block ${colors}`;
            frag.appendChild(s);
        }

        if (task.dueDate) {
            const s = document.createElement('span');
            s.textContent = task.dueDate;
            s.className = 'bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded w-24 text-center inline-block';
            frag.appendChild(s);
        }

        if (task.status && task.status.toLowerCase() !== 'pending') {
            const isCompleted = task.status.toLowerCase() === 'completed';
            const s = document.createElement('span');
            s.textContent = isCompleted ? 'Completed' : 'Rejected';
            s.className = `text-xs font-medium px-2 py-1 rounded w-20 text-center inline-block ${
                isCompleted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`;
            frag.appendChild(s);
        }

        return frag;
    }

    _buildActions(task, { onEdit, onComplete, onReject, onDelete }) {
        const frag = document.createDocumentFragment();

        const btn = (title, svgPath, hoverColor, handler) => {
            const b = document.createElement('button');
            b.title = title;
            b.classList.add('focus:outline-none', 'transition-colors', 'cursor-pointer');
            b.innerHTML = svgPath;
            b.addEventListener('click', () => handler(task));
            return b;
        };

        frag.appendChild(btn('Edit Task',
            `<svg class="w-4 h-4 text-gray-400 hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>`,
            'blue', onEdit));

        frag.appendChild(btn('Complete Task',
            `<svg class="w-5 h-5 text-gray-400 hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>`,
            'green', onComplete));

        frag.appendChild(btn('Reject Task',
            `<svg class="w-5 h-5 text-gray-400 hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>`,
            'orange', onReject));

        frag.appendChild(btn('Delete Task',
            `<svg class="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>`,
            'red', onDelete));

        return frag;
    }

    // ─── Task Modal ──────────────────────────────────────────────────────────

    openAddModal(onSave, onCancel) {
        this._clearTaskForm();
        this.clearFieldErrors();
        this.taskModal.classList.remove('hidden');
        this.taskTitleInput.focus();
        document.querySelector('#save-task').onclick = onSave;
        document.querySelector('#cancel-modal').onclick = onCancel;
        this._bindInlineErrorClear();
    }

    openEditModal(task, onSave, onCancel) {
        this.clearFieldErrors();
        this.taskTitleInput.value = task.title;
        document.querySelector('#task-desc').value     = task.description || '';
        document.querySelector('#task-category').value = task.category ? task.category.toLowerCase() : '';
        document.querySelector('#task-priority').value = task.priority ? task.priority.toLowerCase() : '';
        document.querySelector('#task-due').value      = task.dueDate || '';

        this.taskModal.classList.remove('hidden');
        this.taskTitleInput.focus();
        document.querySelector('#save-task').onclick    = onSave;
        document.querySelector('#cancel-modal').onclick = onCancel;
        this._bindInlineErrorClear();
    }

    closeTaskModal() {
        this.taskModal.classList.add('hidden');
        this.clearFieldErrors();
        this._clearTaskForm();
    }

    /**
     * Wire each validated input to clear its own error on user interaction.
     * Called once per modal open so listeners are always fresh.
     * @private
     */
    _bindInlineErrorClear() {
        const clearOn = (selector, field) => {
            const el = document.querySelector(selector);
            if (!el) return;
            // Use 'once: false' — we re-bind on every open, and the modal
            // is torn down (hidden) between sessions, so duplicates are harmless.
            el.addEventListener('input', () => {
                const span  = document.querySelector(`#error-${field}`);
                const input = document.querySelector(`#${field}`);
                if (span)  { span.textContent = ''; span.classList.add('hidden'); }
                if (input) {
                    input.classList.remove('border-red-400', 'dark:border-red-500',
                                           'ring-2', 'ring-red-300', 'dark:ring-red-700');
                }
            });
        };

        clearOn('#task-title',    'task-title');
        clearOn('#task-due',      'task-due');
        clearOn('#task-priority', 'task-priority');
    }

    readTaskForm() {
        const title       = this.taskTitleInput.value.trim();
        const description = document.querySelector('#task-desc').value.trim();
        const catRaw      = document.querySelector('#task-category').value;
        const priRaw      = document.querySelector('#task-priority').value;
        const dueDate     = document.querySelector('#task-due').value;
        return { title, description, catRaw, priRaw, dueDate };
    }

    _clearTaskForm() {
        this.taskTitleInput.value = '';
        document.querySelector('#task-desc').value    = '';
        document.querySelector('#task-category').selectedIndex = 0;
        document.querySelector('#task-priority').selectedIndex = 0;
        document.querySelector('#task-due').value     = '';
    }

    // ─── Filter / Sort Modal ─────────────────────────────────────────────────

    openFilterModal(currentSort, currentFilters) {
        if (this.modalSortBy)    this.modalSortBy.value    = currentSort;
        if (this.modalCategory)  this.modalCategory.value  = currentFilters.category;
        if (this.modalPriority)  this.modalPriority.value  = currentFilters.priority;
        if (this.modalStatus)    this.modalStatus.value    = currentFilters.status;
        if (this.filterModal)    this.filterModal.classList.remove('hidden');
    }

    closeFilterModal() {
        if (this.filterModal) this.filterModal.classList.add('hidden');
    }

    readFilterForm() {
        return {
            sort:     this.modalSortBy?.value     ?? 'newest',
            category: this.modalCategory?.value   ?? '',
            priority: this.modalPriority?.value   ?? '',
            status:   this.modalStatus?.value     ?? 'Pending',
        };
    }

    updateFilterBadge(isActive) {
        if (!this.filterActiveBadge) return;
        if (isActive) {
            this.filterActiveBadge.classList.remove('hidden');
        } else {
            this.filterActiveBadge.classList.add('hidden');
        }
    }

    // ─── Event Wiring ────────────────────────────────────────────────────────

    bindAddTaskBtn(handler)     { this.addTaskBtn?.addEventListener('click', handler); }
    bindSearchInput(handler)    { this.searchInput?.addEventListener('input', handler); }

    bindOpenFilterModal(handler)   { this.openFilterBtn?.addEventListener('click', handler); }
    bindCloseFilterModal(handler) {
        this.closeFilterX?.addEventListener('click', handler);
        this.cancelFilterBtn?.addEventListener('click', handler);
        this.filterModal?.addEventListener('click', e => {
            if (e.target === this.filterModal) handler();
        });
    }
    bindApplyFilter(handler)  { this.applyFilterBtn?.addEventListener('click', handler); }
    bindResetFilter(handler)  { this.resetFilterBtn?.addEventListener('click', handler); }

    getSearchTerm() {
        return this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';
    }

    /** Focus the search input field. */
    focusSearch() {
        if (this.searchInput) {
            this.searchInput.focus();
            // Optional: select all text if already populated
            this.searchInput.select();
        }
    }
}
