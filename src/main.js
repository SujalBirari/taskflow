console.log("taskflow project initiated");

let tasks = [];

function loadStoredTasks() {
    try {
        const stored = JSON.parse(localStorage.getItem('tasks'));
        if (Array.isArray(stored)) {
            tasks = stored;
        } else {
            tasks = [];
        }
    } catch (e) {
        tasks = [];
    }
}
loadStoredTasks();

const categories = ["Work", "Personal", "Study", "Other"];
const priorities = ["Low", "Medium", "High"];

const addTaskBtn = document.querySelector("#add-task-btn");
const taskList = document.querySelector("#task-list");
const taskModal = document.querySelector("#task-modal");
const taskTitle = document.querySelector("#task-title");

function addTask() {
    console.log('Add task button clicked');

    taskModal.classList.remove("hidden");
    taskTitle.focus();

    const saveTaskBtn = document.querySelector("#save-task");
    saveTaskBtn.onclick = saveTask;

    const cancelTaskBtn = document.querySelector("#cancel-modal");
    cancelTaskBtn.onclick = cancelTask;
}

function changeTask(task) {
    taskTitle.value = task.title;
    document.querySelector('#task-desc').value = task.description || '';
    document.querySelector('#task-category').value = task.category ? task.category.toLowerCase() : '';
    document.querySelector('#task-priority').value = task.priority ? task.priority.toLowerCase() : '';
    document.querySelector('#task-due').value = task.dueDate || '';

    taskModal.classList.remove("hidden");
    taskTitle.focus();

    const saveTaskBtn = document.querySelector("#save-task");
    saveTaskBtn.onclick = () => saveUpdatedTask(task);

    const cancelTaskBtn = document.querySelector("#cancel-modal");
    cancelTaskBtn.onclick = cancelTask;
}

function saveTask() {
    const title = taskTitle.value.trim();
    const description = document.querySelector('#task-desc').value.trim();
    let catRaw = document.querySelector('#task-category').value;
    let priRaw = document.querySelector('#task-priority').value;
    const category = catRaw ? catRaw.charAt(0).toUpperCase() + catRaw.slice(1) : null;
    const priority = priRaw ? priRaw.charAt(0).toUpperCase() + priRaw.slice(1) : null;
    const dueDate = document.querySelector('#task-due').value;

    const createdAt = new Date().toISOString().split('T')[0];

    tasks.push({
        id: crypto.randomUUID(),
        title,
        description: description || null,
        category: category || null,
        priority: priority || null,
        dueDate: dueDate || null,
        status: 'Pending',
        createdAt
    });

    taskTitle.value = '';
    document.querySelector('#task-desc').value = '';
    document.querySelector('#task-category').selectedIndex = 0;
    document.querySelector('#task-priority').selectedIndex = 0;
    document.querySelector('#task-due').value = '';

    taskModal.classList.add('hidden');
    saveTasks();
    applyFiltersAndSort();
}

function cancelTask() {
    taskModal.classList.add("hidden");
    taskTitle.value = "";
    document.querySelector('#task-desc').value = "";
    document.querySelector('#task-category').selectedIndex = 0;
    document.querySelector('#task-priority').selectedIndex = 0;
    document.querySelector('#task-due').value = "";
}

function saveUpdatedTask(task) {
    task.title = taskTitle.value;
    task.description = document.querySelector('#task-desc').value;
    let cat = document.querySelector('#task-category').value;
    task.category = cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : null;

    let pri = document.querySelector('#task-priority').value;
    task.priority = pri ? pri.charAt(0).toUpperCase() + pri.slice(1) : null;

    task.dueDate = document.querySelector('#task-due').value;

    const taskIndex = tasks.findIndex(t => t.id === task.id);

    tasks[taskIndex] = task;

    cancelTask();
    saveTasks();
    applyFiltersAndSort();
}

addTaskBtn.addEventListener('click', addTask);

function updateStats() {
    const totalEl = document.querySelector('#stat-total-tasks');
    const completedEl = document.querySelector('#stat-completed-tasks');
    const pendingEl = document.querySelector('#stat-pending-tasks');
    if (totalEl) totalEl.textContent = tasks.length;
    if (completedEl) completedEl.textContent = tasks.filter(t => t.status && t.status.toLowerCase() === 'completed').length;
    if (pendingEl) pendingEl.textContent = tasks.filter(t => t.status && t.status.toLowerCase() === 'pending').length;
}

function loadTasks(tasksToRender) {
    taskList.innerHTML = '';

    if (tasksToRender === undefined) {
        loadStoredTasks();
    }
    updateStats();

    const tasksList = tasksToRender !== undefined
        ? tasksToRender
        : tasks.filter(task => task.status && task.status.toLowerCase() === 'pending');

    if (tasksList.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-200';
        emptyItem.innerHTML = `
            <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <p class="text-base font-medium text-gray-600">No tasks found</p>
            <p class="text-xs text-gray-400 mt-1">Try adjusting your filters or search query</p>
        `;
        taskList.appendChild(emptyItem);
        return;
    }

    tasksList.forEach(task => {
        const listItem = document.createElement('li');
        listItem.className = 'bg-white p-3 rounded-lg shadow-sm border border-gray-100 mb-3 hover:shadow-md transition-shadow';

        const div = document.createElement('div');
        div.classList.add('flex', 'justify-between', 'items-center');

        const leftContainer = document.createElement('div');
        leftContainer.classList.add('flex', 'items-center', 'space-x-2');

        const span = document.createElement('span');
        span.textContent = task.title;
        span.classList.add('font-medium');

        leftContainer.appendChild(span);

        const descContainer = document.createElement('div');
        descContainer.classList.add('relative', 'group', 'flex', 'items-center');

        const descBtn = document.createElement('button');
        descBtn.textContent = 'i';
        descBtn.classList.add('w-5', 'h-5', 'rounded-full', 'bg-gray-200', 'text-xs', 'text-gray-600', 'flex', 'items-center', 'justify-center', 'focus:outline-none');
        descContainer.appendChild(descBtn);

        const descText = (task.description || '').trim();
        const createdAtText = task.createdAt || 'Unknown';
        if (descText || createdAtText) {
            const tooltip = document.createElement('div');
            tooltip.innerHTML = `
                ${descText ? `<div class="mb-1"><strong>Desc:</strong> ${descText}</div>` : ''}
                <div><strong>Created:</strong> ${createdAtText}</div>
            `;
            tooltip.classList.add('absolute', 'left-full', 'ml-2', 'w-48', 'p-2', 'bg-gray-800', 'text-white', 'text-xs', 'rounded', 'shadow-lg', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'duration-200', 'pointer-events-none', 'z-10');
            descContainer.appendChild(tooltip);
        }

        leftContainer.appendChild(descContainer);

        const rightContainer = document.createElement('div');
        rightContainer.classList.add('flex', 'items-center', 'space-x-6');

        const infoContainer = document.createElement('div');
        infoContainer.classList.add('flex', 'items-center', 'space-x-2');

        if (task.category) {
            const categorySpan = document.createElement('span');
            categorySpan.textContent = task.category;
            categorySpan.className = 'bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded w-20 text-center inline-block';
            infoContainer.appendChild(categorySpan);
        }

        if (task.priority) {
            const prioritySpan = document.createElement('span');
            prioritySpan.textContent = task.priority;
            let priorityColors = task.priority === 'High' ? 'bg-red-50 text-red-700' : task.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700';
            prioritySpan.className = `text-xs font-medium px-2 py-1 rounded w-20 text-center inline-block ${priorityColors}`;
            infoContainer.appendChild(prioritySpan);
        }

        if (task.dueDate) {
            const dueDateSpan = document.createElement('span');
            dueDateSpan.textContent = task.dueDate;
            dueDateSpan.className = 'bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded w-24 text-center inline-block';
            infoContainer.appendChild(dueDateSpan);
        }

        if (task.status && task.status.toLowerCase() !== 'pending') {
            const statusSpan = document.createElement('span');
            const isCompleted = task.status.toLowerCase() === 'completed';
            statusSpan.textContent = isCompleted ? 'Completed' : 'Rejected';
            statusSpan.className = `text-xs font-medium px-2 py-1 rounded w-20 text-center inline-block ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`;
            infoContainer.appendChild(statusSpan);
        }

        const actionContainer = document.createElement('div');
        actionContainer.classList.add('flex', 'items-center', 'space-x-3', 'border-l', 'pl-4', 'border-gray-200');

        const changeTaskBtn = document.createElement('button');
        changeTaskBtn.title = 'Edit Task';
        changeTaskBtn.innerHTML = `<svg class="w-4 h-4 text-gray-400 hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>`;
        changeTaskBtn.classList.add('focus:outline-none', 'transition-colors', 'cursor-pointer');
        changeTaskBtn.addEventListener('click', () => {
            changeTask(task);
        });

        const completeTaskBtn = document.createElement('button');
        completeTaskBtn.title = 'Complete Task';
        completeTaskBtn.innerHTML = `<svg class="w-5 h-5 text-gray-400 hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        completeTaskBtn.classList.add('focus:outline-none', 'transition-colors', 'cursor-pointer');
        completeTaskBtn.addEventListener('click', () => {
            const targetTask = tasks.find(t => t.id === task.id);
            if (targetTask) {
                targetTask.status = 'Completed';
            }
            task.status = 'Completed';
            saveTasks();
            applyFiltersAndSort();
        });

        const rejectTaskBtn = document.createElement('button');
        rejectTaskBtn.title = 'Reject Task';
        rejectTaskBtn.innerHTML = `<svg class="w-5 h-5 text-gray-400 hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
        rejectTaskBtn.classList.add('focus:outline-none', 'transition-colors', 'cursor-pointer');
        rejectTaskBtn.addEventListener('click', () => {
            const targetTask = tasks.find(t => t.id === task.id);
            if (targetTask) {
                targetTask.status = 'Rejected';
            }
            task.status = 'Rejected';
            saveTasks();
            applyFiltersAndSort();
        });

        const deleteTaskBtn = document.createElement('button');
        deleteTaskBtn.title = 'Delete Task';
        deleteTaskBtn.innerHTML = `<svg class="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
        deleteTaskBtn.classList.add('focus:outline-none', 'transition-colors', 'cursor-pointer');
        deleteTaskBtn.addEventListener('click', () => {
            const index = tasks.findIndex(t => t.id === task.id);
            if (index > -1) {
                tasks.splice(index, 1);
                saveTasks();
                applyFiltersAndSort();
            }
        });

        actionContainer.appendChild(changeTaskBtn);
        actionContainer.appendChild(completeTaskBtn);
        actionContainer.appendChild(rejectTaskBtn);
        actionContainer.appendChild(deleteTaskBtn);

        rightContainer.appendChild(infoContainer);
        rightContainer.appendChild(actionContainer);

        div.appendChild(leftContainer);
        div.appendChild(rightContainer);
        listItem.appendChild(div);
        taskList.appendChild(listItem);
    });
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Backward-compatible search and filter helpers
function searchTasksByTitle(title) {
    return tasks.filter(task => task.title.toLowerCase().includes(title.toLowerCase()));
}

function filterTasksByCategory(category) {
    return tasks.filter(task => task.category === category);
}

function filterTasksByPriority(priority) {
    return tasks.filter(task => task.priority === priority);
}

function filterTasksByStatus(status) {
    return tasks.filter(task => task.status === status);
}

// Filter and Sort State
let currentSort = 'newest';
let currentFilters = {
    category: '',
    priority: '',
    status: 'Pending'
};

function applyFiltersAndSort() {
    loadStoredTasks();

    const searchInput = document.querySelector('#search-task-title');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let result = [...tasks];

    // Filter by title search
    if (searchTerm) {
        result = result.filter(task => task.title && task.title.toLowerCase().includes(searchTerm));
    }

    // Filter by category
    if (currentFilters.category) {
        result = result.filter(task => task.category && task.category.toLowerCase() === currentFilters.category.toLowerCase());
    }

    // Filter by priority
    if (currentFilters.priority) {
        result = result.filter(task => task.priority && task.priority.toLowerCase() === currentFilters.priority.toLowerCase());
    }

    // Filter by status (default is 'Pending', or specific status; 'All' displays all statuses)
    if (currentFilters.status && currentFilters.status !== 'All') {
        result = result.filter(task => task.status && task.status.toLowerCase() === currentFilters.status.toLowerCase());
    }

    // Sorting options: Newest, Oldest, Priority, DueDate, Alphabetical
    if (currentSort === 'newest') {
        result.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    } else if (currentSort === 'oldest') {
        result.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
        });
    } else if (currentSort === 'priority') {
        const priorityWeight = { 'high': 3, 'medium': 2, 'low': 1 };
        result.sort((a, b) => {
            const wA = priorityWeight[a.priority ? a.priority.toLowerCase() : ''] || 0;
            const wB = priorityWeight[b.priority ? b.priority.toLowerCase() : ''] || 0;
            return wB - wA;
        });
    } else if (currentSort === 'dueDate') {
        result.sort((a, b) => {
            if (a.dueDate && !b.dueDate) return -1;
            if (!a.dueDate && b.dueDate) return 1;
            if (!a.dueDate && !b.dueDate) return 0;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
    } else if (currentSort === 'alphabetical') {
        result.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
    }

    // Update active badge indicator on filter button
    const badge = document.querySelector('#filter-active-badge');
    if (badge) {
        const isFilterActive = currentFilters.category !== '' ||
                               currentFilters.priority !== '' ||
                               currentFilters.status !== 'Pending' ||
                               currentSort !== 'newest';
        if (isFilterActive) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    loadTasks(result);
}

// Modal DOM Elements & Listeners
const filterModal = document.querySelector('#filter-modal');
const openFilterModalBtn = document.querySelector('#open-filter-modal-btn');
const closeFilterModalX = document.querySelector('#close-filter-modal-x');
const cancelFilterModalBtn = document.querySelector('#cancel-filter-modal-btn');
const applyFilterModalBtn = document.querySelector('#apply-filter-modal-btn');
const resetFilterModalBtn = document.querySelector('#reset-filter-modal-btn');

const modalSortBy = document.querySelector('#modal-sort-by');
const modalFilterCategory = document.querySelector('#modal-filter-category');
const modalFilterPriority = document.querySelector('#modal-filter-priority');
const modalFilterStatus = document.querySelector('#modal-filter-status');

function openFilterModal() {
    if (modalSortBy) modalSortBy.value = currentSort;
    if (modalFilterCategory) modalFilterCategory.value = currentFilters.category;
    if (modalFilterPriority) modalFilterPriority.value = currentFilters.priority;
    if (modalFilterStatus) modalFilterStatus.value = currentFilters.status;

    if (filterModal) filterModal.classList.remove('hidden');
}

function closeFilterModal() {
    if (filterModal) filterModal.classList.add('hidden');
}

if (openFilterModalBtn) openFilterModalBtn.addEventListener('click', openFilterModal);
if (closeFilterModalX) closeFilterModalX.addEventListener('click', closeFilterModal);
if (cancelFilterModalBtn) cancelFilterModalBtn.addEventListener('click', closeFilterModal);

if (filterModal) {
    filterModal.addEventListener('click', (e) => {
        if (e.target === filterModal) {
            closeFilterModal();
        }
    });
}

if (applyFilterModalBtn) {
    applyFilterModalBtn.addEventListener('click', () => {
        if (modalSortBy) currentSort = modalSortBy.value;
        if (modalFilterCategory) currentFilters.category = modalFilterCategory.value;
        if (modalFilterPriority) currentFilters.priority = modalFilterPriority.value;
        if (modalFilterStatus) currentFilters.status = modalFilterStatus.value;

        closeFilterModal();
        applyFiltersAndSort();
    });
}

if (resetFilterModalBtn) {
    resetFilterModalBtn.addEventListener('click', () => {
        currentSort = 'newest';
        currentFilters = {
            category: '',
            priority: '',
            status: 'Pending'
        };
        if (modalSortBy) modalSortBy.value = 'newest';
        if (modalFilterCategory) modalFilterCategory.value = '';
        if (modalFilterPriority) modalFilterPriority.value = '';
        if (modalFilterStatus) modalFilterStatus.value = 'Pending';

        closeFilterModal();
        applyFiltersAndSort();
    });
}

// Live search listener
const searchInput = document.querySelector('#search-task-title');
if (searchInput) {
    searchInput.addEventListener('input', () => {
        applyFiltersAndSort();
    });
}

const app = () => {
    applyFiltersAndSort();
}

app();