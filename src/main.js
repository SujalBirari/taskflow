console.log("taskflow project initiated");

const tasks = [
    {
        id: crypto.randomUUID(),
        title: "Task 1",
        description: "Task 1 description",
        category: "Work",
        priority: "High",
        dueDate: "2022-01-01",
        status: "Pending",
        createdAt: "2022-01-01"
    },
    {
        id: crypto.randomUUID(),
        title: "Task 2",
        description: "Task 2 description",
        category: "Personal",
        priority: "Medium",
        dueDate: "2022-01-02",
        status: "Rejected",
        createdAt: "2022-01-01"
    },
    {
        id: crypto.randomUUID(),
        title: "Task 3",
        description: "Task 3 description",
        category: "Study",
        priority: "Low",
        dueDate: "2022-01-03",
        status: "Completed",
        createdAt: "2022-01-01"
    }
];

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
    loadTasks();
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
    loadTasks();
}

addTaskBtn.addEventListener('click', addTask);

function loadTasks() {
    taskList.innerHTML = '';

    tasks
        .filter(task => task.status === 'Pending')
        .forEach(task => {
            const listItem = document.createElement('li');
            listItem.className = 'bg-white p-3 rounded-lg shadow-sm border border-gray-100 mb-3 hover:shadow-md transition-shadow';

            const div = document.createElement('div');
            div.classList.add('flex', 'justify-between', 'items-center');

            // Left container for status and title
            const leftContainer = document.createElement('div');
            leftContainer.classList.add('flex', 'items-center', 'space-x-2');

            // Title span
            const span = document.createElement('span');
            span.textContent = task.title;
            span.classList.add('font-medium');

            leftContainer.appendChild(span);

            // Description tooltip
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

            // Right container (split into info and actions)
            const rightContainer = document.createElement('div');
            rightContainer.classList.add('flex', 'items-center', 'space-x-6');

            const infoContainer = document.createElement('div');
            infoContainer.classList.add('flex', 'items-center', 'space-x-2');

            // Category display
            if (task.category) {
                const categorySpan = document.createElement('span');
                categorySpan.textContent = task.category;
                categorySpan.className = 'bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded w-20 text-center inline-block';
                infoContainer.appendChild(categorySpan);
            }

            // Priority display
            if (task.priority) {
                const prioritySpan = document.createElement('span');
                prioritySpan.textContent = task.priority;
                let priorityColors = task.priority === 'High' ? 'bg-red-50 text-red-700' : task.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700';
                prioritySpan.className = `text-xs font-medium px-2 py-1 rounded w-20 text-center inline-block ${priorityColors}`;
                infoContainer.appendChild(prioritySpan);
            }

            // Due date display
            if (task.dueDate) {
                const dueDateSpan = document.createElement('span');
                dueDateSpan.textContent = task.dueDate;
                dueDateSpan.className = 'bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded w-24 text-center inline-block';
                infoContainer.appendChild(dueDateSpan);
            }

            const actionContainer = document.createElement('div');
            actionContainer.classList.add('flex', 'items-center', 'space-x-3', 'border-l', 'pl-4', 'border-gray-200');

            // Change button
            const changeTaskBtn = document.createElement('button');
            changeTaskBtn.title = 'Edit Task';
            changeTaskBtn.innerHTML = `<svg class="w-4 h-4 text-gray-400 hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>`;
            changeTaskBtn.classList.add('focus:outline-none', 'transition-colors');
            changeTaskBtn.addEventListener('click', () => {
                changeTask(task);
            });

            // Complete button
            const completeTaskBtn = document.createElement('button');
            completeTaskBtn.title = 'Complete Task';
            completeTaskBtn.innerHTML = `<svg class="w-5 h-5 text-gray-400 hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            completeTaskBtn.classList.add('focus:outline-none', 'transition-colors');
            completeTaskBtn.addEventListener('click', () => {
                task.status = 'Completed';
                loadTasks();
            });

            // Reject button
            const rejectTaskBtn = document.createElement('button');
            rejectTaskBtn.title = 'Reject Task';
            rejectTaskBtn.innerHTML = `<svg class="w-5 h-5 text-gray-400 hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
            rejectTaskBtn.classList.add('focus:outline-none', 'transition-colors');
            rejectTaskBtn.addEventListener('click', () => {
                task.status = 'Rejected';
                loadTasks();
            });

            // Delete button
            const deleteTaskBtn = document.createElement('button');
            deleteTaskBtn.title = 'Delete Task';
            deleteTaskBtn.innerHTML = `<svg class="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
            deleteTaskBtn.classList.add('focus:outline-none', 'transition-colors');
            deleteTaskBtn.addEventListener('click', () => {
                const index = tasks.findIndex(t => t.id === task.id);
                if (index > -1) {
                    tasks.splice(index, 1);
                    loadTasks();
                }
            });

            actionContainer.appendChild(changeTaskBtn);
            actionContainer.appendChild(completeTaskBtn);
            actionContainer.appendChild(rejectTaskBtn);
            actionContainer.appendChild(deleteTaskBtn);

            rightContainer.appendChild(infoContainer);
            rightContainer.appendChild(actionContainer);

            // Assemble the task item
            div.appendChild(leftContainer);
            div.appendChild(rightContainer);
            listItem.appendChild(div);
            taskList.appendChild(listItem);
        });
}

const app = () => {
    loadTasks();
}

app();