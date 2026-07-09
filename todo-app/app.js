// Todo App with Local Storage

class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingId = null;

        // DOM Elements
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.categorySelect = document.getElementById('categorySelect');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.dateDisplay = document.getElementById('dateDisplay');
        this.totalCount = document.getElementById('totalCount');
        this.completedCount = document.getElementById('completedCount');
        this.activeCount = document.getElementById('activeCount');

        this.init();
    }

    init() {
        this.loadTasks();
        this.attachEventListeners();
        this.updateDate();
        this.render();
    }

    attachEventListeners() {
        // Add task
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Clear completed
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

        // Export/Import
        this.exportBtn.addEventListener('click', () => this.exportTasks());
        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.importTasksFromFile(e));

        // Clear all
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) {
            this.showNotification('Please enter a task');
            return;
        }

        const task = {
            id: Date.now(),
            text,
            completed: false,
            priority: this.prioritySelect.value,
            category: this.categorySelect.value,
            createdAt: new Date().toISOString(),
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.taskInput.value = '';
        this.render();
        this.showNotification('Task added successfully!');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.render();
        this.showNotification('Task deleted');
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const newText = prompt('Edit task:', task.text);
            if (newText && newText.trim()) {
                task.text = newText.trim();
                this.saveTasks();
                this.render();
                this.showNotification('Task updated');
            }
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    clearCompleted() {
        if (confirm('Delete all completed tasks?')) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.render();
            this.showNotification('Completed tasks cleared');
        }
    }

    clearAll() {
        if (confirm('Delete ALL tasks? This cannot be undone.')) {
            this.tasks = [];
            this.saveTasks();
            this.render();
            this.showNotification('All tasks cleared');
        }
    }

    exportTasks() {
        if (this.tasks.length === 0) {
            this.showNotification('No tasks to export');
            return;
        }

        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.showNotification('Tasks exported successfully!');
    }

    importTasksFromFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedTasks = JSON.parse(event.target.result);
                if (Array.isArray(importedTasks)) {
                    if (confirm('Replace existing tasks with imported ones?')) {
                        this.tasks = importedTasks;
                        this.saveTasks();
                        this.render();
                        this.showNotification('Tasks imported successfully!');
                    }
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showNotification('Error importing tasks: ' + error.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    saveTasks() {
        localStorage.setItem('todos', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('todos');
        this.tasks = saved ? JSON.parse(saved) : [];
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;

        this.totalCount.textContent = total;
        this.completedCount.textContent = completed;
        this.activeCount.textContent = active;
    }

    updateDate() {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.dateDisplay.textContent = today.toLocaleDateString('en-US', options);
    }

    render() {
        const filteredTasks = this.getFilteredTasks();
        this.taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            this.emptyState.classList.add('show');
        } else {
            this.emptyState.classList.remove('show');
            filteredTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item priority-${task.priority}`;
                if (task.completed) li.classList.add('completed');

                const taskDate = new Date(task.createdAt);
                const dateStr = taskDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                });

                li.innerHTML = `
                    <input
                        type="checkbox"
                        class="task-checkbox"
                        ${task.completed ? 'checked' : ''}
                        onchange="app.toggleTask(${task.id})"
                    >
                    <div class="task-content">
                        <div class="task-text">${this.escapeHtml(task.text)}</div>
                        <div class="task-meta">
                            <span class="task-badge badge-priority">${task.priority.toUpperCase()}</span>
                            <span class="task-badge badge-category">${task.category}</span>
                            <span class="task-date">${dateStr}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn-action btn-edit" onclick="app.editTask(${task.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="app.deleteTask(${task.id})" title="Delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;

                this.taskList.appendChild(li);
            });
        }

        this.updateStats();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        // Simple notification using browser alert, can be enhanced with toast
        console.log('Notification:', message);
        // Optional: Add a toast notification here
    }
}

// Initialize the app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();
});
