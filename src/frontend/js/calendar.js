// calendar.js - Calendar functionality for Wits student dashboard
document.addEventListener('DOMContentLoaded', function() {
    // API configuration
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocal 
        ? 'http://localhost:3000/api' 
        : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
    
    const TASKS_URL = `${API_BASE_URL}/tasks`;
    
    // Calendar state
    let currentDate = new Date();
    let currentView = 'month';
    let allTasks = [];
    let selectedDate = null;
    let editingTask = null;
    let currentUser = null;
    
    // DOM elements
    const calendarGrid = document.getElementById('calendarGrid');
    const currentPeriod = document.getElementById('currentPeriod');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const todayBtn = document.getElementById('todayBtn');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const tasksList = document.getElementById('tasksList');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    // Modal elements
    const taskModal = document.getElementById('taskModal');
    const taskDetailModal = document.getElementById('taskDetailModal');
    const closeModal = document.getElementById('closeModal');
    const closeDetailModal = document.getElementById('closeDetailModal');
    const taskForm = document.getElementById('taskForm');
    const modalTitle = document.getElementById('modalTitle');
    const saveBtn = document.getElementById('saveBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    // Form elements
    const taskTitle = document.getElementById('taskTitle');
    const taskDescription = document.getElementById('taskDescription');
    const taskDate = document.getElementById('taskDate');
    const taskTime = document.getElementById('taskTime');
    const taskCategory = document.getElementById('taskCategory');
    const taskPriority = document.getElementById('taskPriority');
    const taskStatus = document.getElementById('taskStatus');
    
    // Calendar data
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Check if essential elements exist before initializing
    if (!calendarGrid) {
        console.error('Calendar grid element not found');
        return;
    }
    
    // Initialize the calendar
    init();
    
    function init() {
        // Get current user from session storage
        currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) {
            showErrorState('Please log in to view calendar');
            return;
        }
        
        loadTasks();
        setupEventListeners();
        renderCalendar();
        updatePeriodDisplay();
    }
    
    function getCurrentUser() {
        try {
            const userData = sessionStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data from session storage:', error);
            return null;
        }
    }
    
    function setupEventListeners() {
        // Navigation buttons
        if (prevBtn) prevBtn.addEventListener('click', previousPeriod);
        if (nextBtn) nextBtn.addEventListener('click', nextPeriod);
        if (todayBtn) todayBtn.addEventListener('click', goToToday);
        
        // Add task button
        if (addTaskBtn) addTaskBtn.addEventListener('click', openAddTaskModal);
        
        // View toggle buttons
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                if (view) changeView(view);
            });
        });
        
        // Filter controls
        if (statusFilter) statusFilter.addEventListener('change', applyFilters);
        if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
        
        // Modal controls
        if (closeModal) closeModal.addEventListener('click', closeTaskModal);
        if (closeDetailModal) closeDetailModal.addEventListener('click', closeTaskDetailModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeTaskModal);
        
        // Form submission
        if (taskForm) taskForm.addEventListener('submit', handleFormSubmit);
        
        // Delete button
        if (deleteBtn) deleteBtn.addEventListener('click', handleDeleteTask);
        
        // Modal overlay clicks
        if (taskModal) {
            taskModal.addEventListener('click', (e) => {
                if (e.target === taskModal) closeTaskModal();
            });
        }
        
        if (taskDetailModal) {
            taskDetailModal.addEventListener('click', (e) => {
                if (e.target === taskDetailModal) closeTaskDetailModal();
            });
        }
    }
    
    async function loadTasks() {
        try {
            showLoadingState();
            
            const response = await fetch(`${TASKS_URL}/${currentUser.id}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    allTasks = [];
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } else {
                const data = await response.json();
                allTasks = data || [];
            }
            
            renderCalendar();
            renderTasksList();
        } catch (error) {
            console.error('Error fetching tasks:', error);
            showErrorState('Failed to load tasks. Please try again later.');
        }
    }
    
    function renderCalendar() {
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = '';
        
        if (currentView === 'month') {
            renderMonthView();
        } else if (currentView === 'week') {
            renderWeekView();
        } else if (currentView === 'day') {
            renderDayView();
        }
    }
    
    function renderMonthView() {
        // Add header row
        dayNames.forEach(day => {
            const headerCell = document.createElement('div');
            headerCell.className = 'calendar-header-cell';
            headerCell.textContent = day;
            calendarGrid.appendChild(headerCell);
        });
        
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const today = new Date();
        
        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            
            // Add classes for styling
            if (cellDate.getMonth() !== currentDate.getMonth()) {
                dayCell.classList.add('other-month');
            }
            
            if (cellDate.toDateString() === today.toDateString()) {
                dayCell.classList.add('today');
            }
            
            if (selectedDate && cellDate.toDateString() === selectedDate.toDateString()) {
                dayCell.classList.add('selected');
            }
            
            // Add day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = cellDate.getDate();
            dayCell.appendChild(dayNumber);
            
            // Add tasks for this day
            const dayTasks = getTasksForDate(cellDate);
            if (dayTasks.length > 0) {
                const tasksContainer = document.createElement('div');
                tasksContainer.className = 'day-tasks';
                
                dayTasks.slice(0, 3).forEach(task => {
                    const taskDot = document.createElement('div');
                    taskDot.className = `task-dot ${task.category} ${task.priority}`;
                    taskDot.textContent = task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title;
                    taskDot.title = task.title;
                    taskDot.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openTaskDetailModal(task);
                    });
                    tasksContainer.appendChild(taskDot);
                });
                
                if (dayTasks.length > 3) {
                    const moreIndicator = document.createElement('div');
                    moreIndicator.className = 'task-dot other';
                    moreIndicator.textContent = `+${dayTasks.length - 3} more`;
                    tasksContainer.appendChild(moreIndicator);
                }
                
                dayCell.appendChild(tasksContainer);
            }
            
            // Add click event to select date
            dayCell.addEventListener('click', () => selectDate(cellDate));
            
            calendarGrid.appendChild(dayCell);
        }
    }
    
    function renderWeekView() {
        // Implementation for week view would go here
        calendarGrid.innerHTML = '<div class="empty-state"><h3>Week View</h3><p>Week view coming soon!</p></div>';
    }
    
    function renderDayView() {
        // Implementation for day view would go here
        calendarGrid.innerHTML = '<div class="empty-state"><h3>Day View</h3><p>Day view coming soon!</p></div>';
    }
    
    function getTasksForDate(date) {
        const dateString = date.toISOString().split('T')[0];
        return allTasks.filter(task => task.date === dateString);
    }
    
    function renderTasksList() {
        if (!tasksList) return;
        
        tasksList.innerHTML = '';
        
        let filteredTasks = applyTaskFilters();
        
        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No tasks found</h3>
                    <p>Try adjusting your filters or add a new task.</p>
                </div>
            `;
            return;
        }
        
        // Sort tasks by date and time
        filteredTasks.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
            const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
            return dateA - dateB;
        });
        
        filteredTasks.forEach(task => {
            const taskItem = createTaskItem(task);
            tasksList.appendChild(taskItem);
        });
    }
    
    function createTaskItem(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.priority}`;
        if (task.status === 'completed') {
            taskItem.classList.add('completed');
        }
        
        const taskDate = new Date(task.date);
        const isOverdue = task.status !== 'completed' && taskDate < new Date();
        
        taskItem.innerHTML = `
            <div class="task-header">
                <div>
                    <div class="task-title">${task.title}</div>
                    <div class="task-time">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(task.date)}
                        ${task.time ? `<i class="fas fa-clock"></i> ${formatTime(task.time)}` : ''}
                        ${isOverdue ? '<i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i> Overdue' : ''}
                    </div>
                </div>
                <div class="task-priority ${task.priority}"></div>
            </div>
            <div class="task-category ${task.category}">${task.category}</div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-status ${task.status}">
                <i class="${getStatusIcon(task.status)}"></i>
                ${task.status.replace('_', ' ')}
            </div>
        `;
        
        taskItem.addEventListener('click', () => openTaskDetailModal(task));
        
        return taskItem;
    }
    
    function applyTaskFilters() {
        let filtered = [...allTasks];
        
        // Status filter
        if (statusFilter && statusFilter.value) {
            filtered = filtered.filter(task => task.status === statusFilter.value);
        }
        
        // Category filter
        if (categoryFilter && categoryFilter.value) {
            filtered = filtered.filter(task => task.category === categoryFilter.value);
        }
        
        return filtered;
    }
    
    function applyFilters() {
        renderTasksList();
    }
    
    function selectDate(date) {
        selectedDate = date;
        renderCalendar();
        
        // Filter tasks list to show only tasks for selected date
        const dateTasks = getTasksForDate(date);
        if (tasksList) {
            tasksList.innerHTML = '';
            
            if (dateTasks.length === 0) {
                tasksList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-day"></i>
                        <h3>No tasks for ${formatDate(date.toISOString().split('T')[0])}</h3>
                        <p>Click "Add Task" to create a new task for this date.</p>
                    </div>
                `;
            } else {
                dateTasks.forEach(task => {
                    const taskItem = createTaskItem(task);
                    tasksList.appendChild(taskItem);
                });
            }
        }
    }
    
    function changeView(view) {
        currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });
        
        renderCalendar();
        updatePeriodDisplay();
    }
    
    function previousPeriod() {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() - 7);
        } else if (currentView === 'day') {
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        renderCalendar();
        updatePeriodDisplay();
    }
    
    function nextPeriod() {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() + 7);
        } else if (currentView === 'day') {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        renderCalendar();
        updatePeriodDisplay();
    }
    
    function goToToday() {
        currentDate = new Date();
        selectedDate = null;
        renderCalendar();
        updatePeriodDisplay();
        renderTasksList();
    }
    
    function updatePeriodDisplay() {
        if (!currentPeriod) return;
        
        if (currentView === 'month') {
            currentPeriod.textContent = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        } else if (currentView === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            
            currentPeriod.textContent = `${formatDate(startOfWeek.toISOString().split('T')[0])} - ${formatDate(endOfWeek.toISOString().split('T')[0])}`;
        } else if (currentView === 'day') {
            currentPeriod.textContent = formatDate(currentDate.toISOString().split('T')[0]);
        }
    }
    
    function openAddTaskModal() {
        editingTask = null;
        resetTaskForm();
        
        if (modalTitle) modalTitle.textContent = 'Add New Task';
        if (saveBtn) saveBtn.textContent = 'Save Task';
        if (deleteBtn) deleteBtn.classList.add('hidden');
        
        // Set default date to selected date or today
        const defaultDate = selectedDate || new Date();
        if (taskDate) taskDate.value = defaultDate.toISOString().split('T')[0];
        
        if (taskModal) taskModal.classList.add('active');
    }
    
    function openEditTaskModal(task) {
        editingTask = task;
        populateTaskForm(task);
        
        if (modalTitle) modalTitle.textContent = 'Edit Task';
        if (saveBtn) saveBtn.textContent = 'Update Task';
        if (deleteBtn) deleteBtn.classList.remove('hidden');
        
        if (taskModal) taskModal.classList.add('active');
    }
    
    function openTaskDetailModal(task) {
        const taskDetailContent = document.getElementById('taskDetailContent');
        if (!taskDetailContent) return;
        
        const isOverdue = task.status !== 'completed' && new Date(task.date) < new Date();
        
        taskDetailContent.innerHTML = `
            <div class="detail-section">
                <div class="detail-label">Task Title</div>
                <div class="detail-value large">${task.title}</div>
            </div>
            
            ${task.description ? `
                <div class="detail-section">
                    <div class="detail-label">Description</div>
                    <div class="detail-value">${task.description}</div>
                </div>
            ` : ''}
            
            <div class="detail-section">
                <div class="detail-label">Date & Time</div>
                <div class="detail-value">
                    ${formatDate(task.date)}
                    ${task.time ? ` at ${formatTime(task.time)}` : ''}
                    ${isOverdue ? '<span style="color: #ef4444; font-weight: 600;"> (Overdue)</span>' : ''}
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-label">Category</div>
                <div class="detail-value">
                    <span class="task-category ${task.category}">${task.category}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-label">Priority</div>
                <div class="detail-value">
                    <span class="priority-indicator ${task.priority}">${task.priority}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-label">Status</div>
                <div class="detail-value">
                    <span class="status-indicator ${task.status}">
                        <i class="${getStatusIcon(task.status)}"></i>
                        ${task.status.replace('_', ' ')}
                    </span>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-label">Created</div>
                <div class="detail-value">${task.created_at ? formatDateTime(task.created_at) : 'N/A'}</div>
            </div>
            
            <div class="detail-section">
                <div class="detail-label">Last Updated</div>
                <div class="detail-value">${task.updated_at ? formatDateTime(task.updated_at) : 'N/A'}</div>
            </div>
        `;
        
        // Set up edit and delete buttons
        const editTaskBtn = document.getElementById('editTaskBtn');
        const deleteTaskBtn = document.getElementById('deleteTaskBtn');
        
        if (editTaskBtn) {
            editTaskBtn.onclick = () => {
                closeTaskDetailModal();
                openEditTaskModal(task);
            };
        }
        
        if (deleteTaskBtn) {
            deleteTaskBtn.onclick = () => {
                if (confirm('Are you sure you want to delete this task?')) {
                    deleteTask(task.id);
                    closeTaskDetailModal();
                }
            };
        }
        
        if (taskDetailModal) taskDetailModal.classList.add('active');
    }
    
    function closeTaskModal() {
        if (taskModal) taskModal.classList.remove('active');
        resetTaskForm();
        editingTask = null;
    }
    
    function closeTaskDetailModal() {
        if (taskDetailModal) taskDetailModal.classList.remove('active');
    }
    
    function resetTaskForm() {
        if (taskForm) taskForm.reset();
        if (taskStatus) taskStatus.value = 'pending';
    }
    
    function populateTaskForm(task) {
        if (taskTitle) taskTitle.value = task.title || '';
        if (taskDescription) taskDescription.value = task.description || '';
        if (taskDate) taskDate.value = task.date || '';
        if (taskTime) taskTime.value = task.time || '';
        if (taskCategory) taskCategory.value = task.category || '';
        if (taskPriority) taskPriority.value = task.priority || '';
        if (taskStatus) taskStatus.value = task.status || 'pending';
    }
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(taskForm);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            date: formData.get('date'),
            time: formData.get('time'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            status: formData.get('status'),
            user_id: currentUser.id
        };
        
        // Validate required fields
        if (!taskData.title || !taskData.date || !taskData.category || !taskData.priority || !taskData.status) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        try {
            let result;
            
            if (editingTask) {
                result = await updateTask(editingTask.id, taskData);
            } else {
                result = await createTask(taskData);
            }
            
            if (result) {
                closeTaskModal();
                await loadTasks();
                showNotification(editingTask ? 'Task updated successfully' : 'Task created successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving task:', error);
            showNotification('Failed to save task', 'error');
        }
    }
    
    async function handleDeleteTask() {
        if (!editingTask) return;
        
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                const success = await deleteTask(editingTask.id);
                if (success) {
                    closeTaskModal();
                    await loadTasks();
                    showNotification('Task deleted successfully', 'success');
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                showNotification('Failed to delete task', 'error');
            }
        }
    }
    
    async function createTask(taskData) {
        try {
            const response = await fetch(TASKS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }
    
    async function updateTask(taskId, taskData) {
        try {
            const response = await fetch(`${TASKS_URL}/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }
    
    async function deleteTask(taskId) {
        try {
            const response = await fetch(`${TASKS_URL}/${taskId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }
    
    // Utility functions
    function formatDate(dateString) {
        if (!dateString) return 'No date';
        
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        }
    }
    
    function formatTime(timeString) {
        if (!timeString) return '';
        
        const [hours, minutes] = timeString.split(':');
        const time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes));
        
        return time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'N/A';
        
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    function getStatusIcon(status) {
        const statusIcons = {
            'pending': 'fas fa-clock',
            'in_progress': 'fas fa-play-circle',
            'completed': 'fas fa-check-circle'
        };
        return statusIcons[status] || 'fas fa-clock';
    }
    
    function showLoadingState() {
        if (calendarGrid) {
            calendarGrid.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading calendar...</p>
                </div>
            `;
        }
    }
    
    function showErrorState(message) {
        if (calendarGrid) {
            calendarGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Something went wrong</h3>
                    <p>${message}</p>
                    <button class="action-btn primary" onclick="location.reload()">Try Again</button>
                </div>
            `;
        }
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
});

// Add notification styles if not already present
const notificationStyles = `
.notification {
    position: fixed;
    top: 100px;
    right: 20px;
    background: white;
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    max-width: 400px;
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    border-left: 4px solid #3b82f6;
}

.notification.success {
    border-left-color: #10b981;
}

.notification.error {
    border-left-color: #ef4444;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.notification-content i {
    font-size: 18px;
}

.notification.success .notification-content i {
    color: #10b981;
}

.notification.error .notification-content i {
    color: #ef4444;
}

.notification.info .notification-content i {
    color: #3b82f6;
}

.notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #64748b;
    padding: 4px;
    margin-left: 10px;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;

// Add styles to the document if not already present
if (!document.getElementById('calendar-notification-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'calendar-notification-styles';
    styleSheet.textContent = notificationStyles;
    document.head.appendChild(styleSheet);
}