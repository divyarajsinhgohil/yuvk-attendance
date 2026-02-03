// Global variables
let currentDate = new Date();
let weeklyChart = null;
let monthlyChart = null;
let performanceChart = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize storage usage display
    storageManager.updateStorageUsage();
    
    // Set current date to today automatically
    currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Remove time part
    
    // Set up date picker with today as default
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        const todayStr = storageManager.formatDate(currentDate);
        datePicker.value = todayStr;
        datePicker.max = todayStr; // Can't select future dates
    }
    
    // Initialize everything
    updateDateDisplay();
    loadYuvks();
    loadAttendance();
    updateTodayStats();
    initializeCharts();
    
    // Setup enhanced search with suggestions
    setupEnhancedSearch();
    
    // Auto-save reminder
    setTimeout(() => {
        showNotification('Welcome to YUVK Attendance System! All data auto-saved.', 'success');
    }, 1000);
    
    // Auto-save attendance every 30 seconds
    setInterval(autoSaveAttendance, 30000);
});

// ==================== DATE MANAGEMENT ====================

function updateDateDisplay() {
    // Update big date display
    document.getElementById('currentDate').textContent = 
        storageManager.getDateDisplay(currentDate);
    
    // Update date picker
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.value = storageManager.formatDate(currentDate);
    }
}

function previousDay() {
    currentDate.setDate(currentDate.getDate() - 1);
    updateDateDisplay();
    loadAttendance();
    updateTodayStats();
}

function nextDay() {
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (tomorrow <= today) {
        currentDate = tomorrow;
        updateDateDisplay();
        loadAttendance();
        updateTodayStats();
    } else {
        showNotification('Cannot select future dates!', 'warning');
    }
}

function changeDate(dateString) {
    if (!dateString) return;
    
    const selectedDate = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
        showNotification('Cannot select future dates!', 'warning');
        document.getElementById('datePicker').value = storageManager.formatDate(currentDate);
        return;
    }
    
    currentDate = selectedDate;
    updateDateDisplay();
    loadAttendance();
    updateTodayStats();
}

// ==================== YUVK MANAGEMENT ====================

function addYuvk() {
    const nameInput = document.getElementById('yuvkName');
    const mobileInput = document.getElementById('yuvkMobile');
    const shakhaInput = document.getElementById('yuvkShakha');
    
    const name = nameInput.value.trim();
    const mobile = mobileInput.value.trim();
    const shakha = shakhaInput.value.trim();
    
    if (!name) {
        showNotification('Please enter YUVK name', 'error');
        nameInput.focus();
        return;
    }
    
    // Check for duplicate names
    const existingYuvks = storageManager.getYuvks();
    const duplicate = existingYuvks.find(yuvk => 
        yuvk.name.toLowerCase() === name.toLowerCase()
    );
    
    if (duplicate) {
        showNotification(`YUVK "${name}" already exists!`, 'warning');
        nameInput.focus();
        return;
    }
    
    const yuvkData = {
        name: name,
        mobile: mobile,
        shakha: shakha
    };
    
    const newYuvk = storageManager.addYuvk(yuvkData);
    
    // Clear inputs
    nameInput.value = '';
    mobileInput.value = '';
    shakhaInput.value = '';
    
    // Refresh displays
    loadYuvks();
    loadAttendance();
    updateTodayStats();
    updateCharts();
    
    showNotification(`YUVK "${newYuvk.name}" added successfully!`, 'success');
    
    // Focus back to name input for next entry
    nameInput.focus();
}

function loadYuvks() {
    const yuvks = storageManager.getYuvks();
    document.getElementById('totalYuvks').textContent = yuvks.length;
}

// ==================== EDIT YUVK FUNCTIONALITY ====================

function openEditModal(yuvkId) {
    const data = storageManager.getData();
    const yuvk = data.yuvks.find(y => y.id === yuvkId);
    
    if (!yuvk) return;
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay" id="editModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-edit"></i> Edit YUVK Information</h3>
                    <button onclick="closeEditModal()" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" id="editName" value="${yuvk.name}" placeholder="Enter YUVK Name" required>
                    </div>
                    <div class="form-group">
                        <label>Mobile Number:</label>
                        <input type="text" id="editMobile" value="${yuvk.mobile}" placeholder="Mobile Number">
                    </div>
                    <div class="form-group">
                        <label>Shakha/Village:</label>
                        <input type="text" id="editShakha" value="${yuvk.shakha}" placeholder="Shakha/Village">
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeEditModal()" class="btn-secondary">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button onclick="deleteYuvk('${yuvkId}')" class="btn-danger" style="margin-right: auto;">
                        <i class="fas fa-trash"></i> Delete YUVK
                    </button>
                    <button onclick="saveYuvkEdit('${yuvkId}')" class="btn-primary">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing modal
    const existingModal = document.getElementById('editModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus on name input
    setTimeout(() => {
        document.getElementById('editName').focus();
    }, 100);
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.remove();
}

function saveYuvkEdit(yuvkId) {
    const name = document.getElementById('editName').value.trim();
    const mobile = document.getElementById('editMobile').value.trim();
    const shakha = document.getElementById('editShakha').value.trim();
    
    if (!name) {
        showNotification('Name is required!', 'error');
        return;
    }
    
    const updates = {
        name: name,
        mobile: mobile,
        shakha: shakha
    };
    
    if (storageManager.updateYuvk(yuvkId, updates)) {
        closeEditModal();
        loadYuvks();
        loadAttendance();
        updateTodayStats();
        updateCharts();
        showNotification('YUVK information updated successfully!', 'success');
    }
}

function deleteYuvk(yuvkId) {
    const yuvk = storageManager.getYuvks().find(y => y.id === yuvkId);
    if (!yuvk) return;
    
    if (confirm(`Are you sure you want to delete "${yuvk.name}"?\n\nThis will remove all attendance records for this YUVK.`)) {
        storageManager.deleteYuvk(yuvkId);
        closeEditModal();
        loadYuvks();
        loadAttendance();
        updateTodayStats();
        updateCharts();
        showNotification(`YUVK "${yuvk.name}" deleted successfully!`, 'success');
    }
}

// ==================== ATTENDANCE MANAGEMENT ====================

function loadAttendance() {
    const yuvks = storageManager.getYuvks();
    renderAttendanceList(yuvks);
}

function renderAttendanceList(yuvks) {
    const container = document.getElementById('attendanceGrid');
    const emptyState = document.getElementById('emptyState');
    const todayAttendance = storageManager.getAttendance(currentDate);
    
    container.innerHTML = '';
    
    if (yuvks.length === 0) {
        emptyState.style.display = 'flex';
        document.getElementById('yuvkCount').textContent = '0 YUVKs';
        return;
    }
    
    emptyState.style.display = 'none';
    document.getElementById('yuvkCount').textContent = `${yuvks.length} YUVK${yuvks.length !== 1 ? 's' : ''}`;
    
    // Calculate today's stats
    let presentCount = 0;
    let absentCount = 0;
    
    yuvks.forEach(yuvk => {
        const status = todayAttendance[yuvk.id];
        if (status === 'present') presentCount++;
        if (status === 'absent') absentCount++;
        
        const card = document.createElement('div');
        card.className = `yuvk-card ${status || 'unmarked'}`;
        card.innerHTML = `
            <div class="yuvk-info">
                <div class="yuvk-name">
                    ${yuvk.name}
                    <i class="fas fa-user" title="Click to edit"></i>
                </div>
                <div class="yuvk-details">
                    ${yuvk.mobile ? `<span><i class="fas fa-phone"></i> ${yuvk.mobile}</span>` : ''}
                    ${yuvk.shakha ? `<span><i class="fas fa-home"></i> ${yuvk.shakha}</span>` : ''}
                    <span><i class="fas fa-calendar"></i> ${storageManager.getDateDisplay(currentDate)}</span>
                </div>
            </div>
            <div class="yuvk-actions">
                <button onclick="markAttendance('${yuvk.id}', 'present')" 
                        class="yuvk-btn present-btn ${status === 'present' ? 'active' : ''}">
                    <i class="fas fa-check"></i> ${status === 'present' ? 'PRESENT' : 'PRESENT'}
                </button>
                <button onclick="markAttendance('${yuvk.id}', 'absent')" 
                        class="yuvk-btn absent-btn ${status === 'absent' ? 'active' : ''}">
                    <i class="fas fa-times"></i> ${status === 'absent' ? 'ABSENT' : 'ABSENT'}
                </button>
                <button onclick="openEditModal('${yuvk.id}')" class="yuvk-btn edit-btn" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;
        
        // Make entire card clickable for quick status toggle (except buttons)
        card.addEventListener('click', function(e) {
            if (!e.target.closest('button')) {
                // Toggle between present/absent
                const newStatus = status === 'present' ? 'absent' : 'present';
                markAttendance(yuvk.id, newStatus);
            }
        });
        
        container.appendChild(card);
    });
    
    // Update today's stats
    updateTodayStats(presentCount, absentCount, yuvks.length);
}

function updateTodayStats(present = null, absent = null, total = null) {
    if (present === null || absent === null || total === null) {
        const counts = storageManager.getAttendanceCountsForDate(currentDate);
        present = counts.present;
        absent = counts.absent;
        total = counts.total;
    }
    
    document.getElementById('presentToday').textContent = present;
    document.getElementById('absentToday').textContent = absent;
    
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
    const todayElement = document.getElementById('todayAttendance');
    todayElement.textContent = `${percentage}%`;
    
    // Update color based on percentage
    todayElement.className = 'stat-value';
    if (percentage >= 80) todayElement.classList.add('high');
    else if (percentage >= 50) todayElement.classList.add('medium');
    else todayElement.classList.add('low');
}

function markAttendance(yuvkId, status) {
    storageManager.markAttendance(currentDate, yuvkId, status);
    
    // Update the specific card
    const cards = document.querySelectorAll('.yuvk-card');
    cards.forEach(card => {
        const cardId = card.querySelector(`button[onclick*="${yuvkId}"]`);
        if (cardId) {
            card.className = `yuvk-card ${status}`;
            card.classList.add('updated');
            
            // Update button states
            const presentBtn = card.querySelector('.present-btn');
            const absentBtn = card.querySelector('.absent-btn');
            
            if (presentBtn) {
                presentBtn.className = `yuvk-btn present-btn ${status === 'present' ? 'active' : ''}`;
            }
            if (absentBtn) {
                absentBtn.className = `yuvk-btn absent-btn ${status === 'absent' ? 'active' : ''}`;
            }
        }
    });
    
    // Update statistics
    updateTodayStats();
    updateCharts();
    
    // Show notification
    const yuvk = storageManager.getYuvks().find(y => y.id === yuvkId);
    if (yuvk) {
        showNotification(`${yuvk.name} marked as ${status.toUpperCase()}`, 'success');
    }
}

function markAllPresent() {
    const yuvks = storageManager.getYuvks();
    if (yuvks.length === 0) {
        showNotification('No YUVKs to mark!', 'warning');
        return;
    }
    
    yuvks.forEach(yuvk => {
        storageManager.markAttendance(currentDate, yuvk.id, 'present');
    });
    
    // Re-render the entire list
    loadAttendance();
    updateCharts();
    showNotification(`All ${yuvks.length} YUVKs marked as PRESENT`, 'success');
}

function markAllAbsent() {
    const yuvks = storageManager.getYuvks();
    if (yuvks.length === 0) {
        showNotification('No YUVKs to mark!', 'warning');
        return;
    }
    
    yuvks.forEach(yuvk => {
        storageManager.markAttendance(currentDate, yuvk.id, 'absent');
    });
    
    // Re-render the entire list
    loadAttendance();
    updateCharts();
    showNotification(`All ${yuvks.length} YUVKs marked as ABSENT`, 'warning');
}

function saveAttendance() {
    showNotification('Attendance saved successfully!', 'success');
}

// ==================== ENHANCED SEARCH FUNCTIONALITY ====================

function setupEnhancedSearch() {
    const searchInput = document.getElementById('searchYuvk');
    const searchContainer = document.querySelector('.search-container');
    
    // Create suggestions dropdown
    const suggestionsHTML = `
        <div class="search-suggestions" id="searchSuggestions" style="display: none;">
            <div class="suggestion-header">
                <i class="fas fa-lightbulb"></i> Search Tips:
            </div>
            <div class="suggestion-item">
                <span class="suggestion-key">Name:</span> Enter full or partial name
            </div>
            <div class="suggestion-item">
                <span class="suggestion-key">Mobile:</span> Start with phone number
            </div>
            <div class="suggestion-item">
                <span class="suggestion-key">Shakha:</span> Type village/shakha name
            </div>
            <div class="suggestion-item">
                <span class="suggestion-key">Status:</span> Type "present" or "absent"
            </div>
            <div class="suggestion-item">
                <span class="suggestion-key">Clear:</span> Click <i class="fas fa-times"></i> to reset
            </div>
        </div>
    `;
    
    searchContainer.insertAdjacentHTML('beforeend', suggestionsHTML);
    
    // Add clear button to search
    const searchBox = document.querySelector('.search-box');
    const clearBtn = document.createElement('button');
    clearBtn.className = 'search-clear-btn';
    clearBtn.innerHTML = '<i class="fas fa-times"></i>';
    clearBtn.style.display = 'none';
    clearBtn.onclick = function() {
        searchInput.value = '';
        filterYuvks();
        this.style.display = 'none';
        document.getElementById('searchSuggestions').style.display = 'none';
    };
    
    searchBox.appendChild(clearBtn);
    
    // Search input event listeners
    searchInput.addEventListener('focus', function() {
        document.getElementById('searchSuggestions').style.display = 'block';
    });
    
    searchInput.addEventListener('blur', function() {
        setTimeout(() => {
            document.getElementById('searchSuggestions').style.display = 'none';
        }, 200);
    });
    
    searchInput.addEventListener('input', function() {
        clearBtn.style.display = this.value ? 'block' : 'none';
        filterYuvks();
        
        // Show live count
        const yuvks = storageManager.getYuvks();
        const filteredCount = getFilteredYuvks().length;
        
        // Update count with animation
        const countElement = document.getElementById('yuvkCount');
        countElement.textContent = `${filteredCount} of ${yuvks.length} YUVKs`;
        
        if (this.value && filteredCount === 0) {
            countElement.style.backgroundColor = 'var(--danger-color)';
        } else if (this.value) {
            countElement.style.backgroundColor = 'var(--warning-color)';
        } else {
            countElement.style.backgroundColor = 'var(--secondary-color)';
        }
    });
    
    // Keyboard shortcuts for search
    searchInput.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + A to select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            this.select();
        }
        
        // Escape to clear search
        if (e.key === 'Escape') {
            this.value = '';
            filterYuvks();
            clearBtn.style.display = 'none';
            this.blur();
        }
        
        // Enter to mark first result present
        if (e.key === 'Enter' && this.value) {
            e.preventDefault();
            const filteredYuvks = getFilteredYuvks();
            if (filteredYuvks.length > 0) {
                markAttendance(filteredYuvks[0].id, 'present');
                this.value = '';
                filterYuvks();
            }
        }
    });
}

function getFilteredYuvks() {
    const searchTerm = document.getElementById('searchYuvk').value.toLowerCase();
    const yuvks = storageManager.getYuvks();
    
    if (!searchTerm.trim()) return yuvks;
    
    return yuvks.filter(yuvk => {
        const todayAttendance = storageManager.getAttendance(currentDate);
        const status = todayAttendance[yuvk.id];
        
        return (
            yuvk.name.toLowerCase().includes(searchTerm) ||
            (yuvk.mobile && yuvk.mobile.includes(searchTerm)) ||
            (yuvk.shakha && yuvk.shakha.toLowerCase().includes(searchTerm)) ||
            (searchTerm === 'present' && status === 'present') ||
            (searchTerm === 'absent' && status === 'absent') ||
            (searchTerm === 'unmarked' && !status)
        );
    });
}

function filterYuvks() {
    const filteredYuvks = getFilteredYuvks();
    renderAttendanceList(filteredYuvks);
    
    // Highlight search terms
    highlightSearchTerms();
}

function highlightSearchTerms() {
    const searchTerm = document.getElementById('searchYuvk').value.toLowerCase();
    if (!searchTerm.trim()) return;
    
    const nameElements = document.querySelectorAll('.yuvk-name');
    const detailElements = document.querySelectorAll('.yuvk-details span');
    
    // Remove previous highlights
    document.querySelectorAll('.highlight').forEach(el => {
        el.classList.remove('highlight');
        el.innerHTML = el.innerHTML.replace(/<\/?mark>/g, '');
    });
    
    // Highlight in names
    nameElements.forEach(element => {
        const text = element.textContent;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const highlighted = text.replace(regex, '<mark>$1</mark>');
        element.innerHTML = highlighted;
        element.classList.add('highlight');
    });
    
    // Highlight in details
    detailElements.forEach(element => {
        const text = element.textContent;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const highlighted = text.replace(regex, '<mark>$1</mark>');
        element.innerHTML = highlighted;
        element.classList.add('highlight');
    });
}

// ==================== AUTO DATE FUNCTIONS ====================

function autoSetDate() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If currentDate is not today, ask user
    if (currentDate.getTime() !== today.getTime()) {
        if (confirm(`Today is ${storageManager.getDateDisplay(today)}.\n\nSwitch to today's date?`)) {
            currentDate = today;
            updateDateDisplay();
            loadAttendance();
            updateTodayStats();
            showNotification('Switched to today\'s date', 'info');
        }
    }
}

// Auto-check date every hour
setInterval(autoSetDate, 3600000);

// Check on page focus
window.addEventListener('focus', autoSetDate);

function autoSaveAttendance() {
    const data = storageManager.getData();
    const dateStr = storageManager.formatDate(currentDate);
    
    if (data.attendance[dateStr]) {
        // Auto-save silently
        console.log('Auto-saved attendance for', dateStr);
    }
}

// ==================== CHARTS ====================

function initializeCharts() {
    // Weekly Trend Chart
    const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
    weeklyChart = new Chart(weeklyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Attendance %',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3498db',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Attendance: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
    
    // Monthly Overview Chart
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChart = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Attendance %',
                data: [],
                backgroundColor: 'rgba(39, 174, 96, 0.7)',
                borderColor: 'rgba(39, 174, 96, 1)',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Attendance: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
    
    // Top Performers Chart
    const perfCtx = document.getElementById('performanceChart').getContext('2d');
    performanceChart = new Chart(perfCtx, {
        type: 'horizontalBar',
        data: {
            labels: [],
            datasets: [{
                label: 'Attendance %',
                data: [],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(230, 126, 34, 0.8)',
                    'rgba(46, 204, 113, 0.8)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(155, 89, 182, 1)',
                    'rgba(241, 196, 15, 1)',
                    'rgba(230, 126, 34, 1)',
                    'rgba(46, 204, 113, 1)'
                ],
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Attendance: ${context.parsed.x}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
    
    // Update all charts
    updateCharts();
}

function updateCharts() {
    updateWeeklyChart();
    updateMonthlyChart();
    updatePerformanceChart();
}

function updateWeeklyChart() {
    const weeklyStats = storageManager.getWeeklyStats();
    const dates = Object.keys(weeklyStats);
    const percentages = Object.values(weeklyStats).map(p => parseFloat(p));
    
    const labels = dates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    });
    
    if (weeklyChart) {
        weeklyChart.data.labels = labels;
        weeklyChart.data.datasets[0].data = percentages;
        weeklyChart.update();
    }
}

function updateMonthlyChart() {
    const monthlyStats = storageManager.getMonthlyStats();
    
    if (monthlyChart) {
        monthlyChart.data.labels = monthlyStats.months;
        monthlyChart.data.datasets[0].data = monthlyStats.percentages.map(p => parseFloat(p));
        monthlyChart.update();
    }
}

function updatePerformanceChart() {
    const topPerformers = storageManager.getTopPerformers(5);
    
    if (performanceChart) {
        performanceChart.data.labels = topPerformers.map(p => 
            p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name
        );
        performanceChart.data.datasets[0].data = topPerformers.map(p => p.percentage);
        performanceChart.update();
    }
}

// ==================== IMPORT/EXPORT ====================

function exportData(format) {
    if (format === 'json') {
        storageManager.exportToJSON();
        showNotification('Data exported as JSON file!', 'success');
    } else if (format === 'csv') {
        storageManager.exportToCSV();
        showNotification('Data exported as CSV file!', 'success');
    }
}

function exportPDF() {
    pdfGenerator.generateAttendanceReport();
    showNotification('PDF report generated!', 'success');
}

function exportDailyPDF() {
    pdfGenerator.generateDailyReport(currentDate);
    showNotification('Daily PDF report generated!', 'success');
}

function exportMonthlyPDF() {
    pdfGenerator.generateMonthlyReport();
    showNotification('Monthly PDF report generated!', 'success');
}

function importData() {
    // Show import options
    const importOptionsHTML = `
        <div class="modal-overlay" id="importOptionsModal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-file-import"></i> Import Data From</h3>
                    <button onclick="closeImportOptions()" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="import-options-grid">
                        <div class="import-option" onclick="importJSONData()">
                            <i class="fas fa-file-code fa-3x"></i>
                            <h4>JSON File</h4>
                            <p>Import from previous backup</p>
                        </div>
                        <div class="import-option" onclick="importCSVData()">
                            <i class="fas fa-file-csv fa-3x"></i>
                            <h4>CSV File</h4>
                            <p>Import from spreadsheet</p>
                        </div>
                        <div class="import-option" onclick="importPDFData()">
                            <i class="fas fa-file-pdf fa-3x"></i>
                            <h4>PDF File</h4>
                            <p>Extract data from PDF</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeImportOptions()" class="btn-secondary">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', importOptionsHTML);
}

function closeImportOptions() {
    const modal = document.getElementById('importOptionsModal');
    if (modal) modal.remove();
}

function importJSONData() {
    closeImportOptions();
    const fileInput = document.getElementById('importFile');
    fileInput.accept = '.json';
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            storageManager.importFromJSON(file)
                .then(result => {
                    showNotification(result.message, 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                })
                .catch(error => {
                    showNotification(error.message, 'error');
                });
        }
        fileInput.value = '';
    };
    fileInput.click();
}

function importCSVData() {
    closeImportOptions();
    const fileInput = document.getElementById('importFile');
    fileInput.accept = '.csv';
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            storageManager.importFromCSV(file)
                .then(result => {
                    showNotification(result.message, 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                })
                .catch(error => {
                    showNotification(error.message, 'error');
                });
        }
        fileInput.value = '';
    };
    fileInput.click();
}

function importPDFData() {
    closeImportOptions();
    const fileInput = document.getElementById('importFile');
    fileInput.accept = '.json,.csv,.pdf';
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (fileExtension === 'pdf') {
            importPDFFile(file)
                .then(result => {
                    showNotification(result.message, 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                })
                .catch(error => {
                    showNotification(error.message, 'error');
                });
        } else if (fileExtension === 'json') {
            storageManager.importFromJSON(file)
                .then(result => {
                    showNotification(result.message, 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                })
                .catch(error => {
                    showNotification(error.message, 'error');
                });
        } else if (fileExtension === 'csv') {
            storageManager.importFromCSV(file)
                .then(result => {
                    showNotification(result.message, 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                })
                .catch(error => {
                    showNotification(error.message, 'error');
                });
        } else {
            showNotification('Please select JSON, CSV, or PDF file', 'error');
        }
        
        fileInput.value = '';
    };
    
    fileInput.click();
}

function importPDFFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                // For PDF import, show modal for manual entry
                showPDFImportModal(file);
                resolve({ success: true, message: 'PDF file ready for import' });
            } catch (error) {
                reject({ success: false, message: 'Error reading PDF file' });
            }
        };
        
        reader.onerror = () => reject({ success: false, message: 'Error reading file' });
        reader.readAsDataURL(file);
    });
}

function showPDFImportModal(file) {
    // Create modal for PDF data entry
    const modalHTML = `
        <div class="modal-overlay" id="pdfImportModal">
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3><i class="fas fa-file-pdf"></i> Import Data from PDF</h3>
                    <button onclick="closePDFImportModal()" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="pdf-preview">
                        <div class="preview-header">
                            <i class="fas fa-info-circle"></i>
                            <span>PDF detected: <strong>${file.name}</strong></span>
                            <span class="file-size">(${(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <div class="preview-info">
                            <p>Since PDF files cannot be directly parsed, please:</p>
                            <ol>
                                <li>Open the PDF in another window</li>
                                <li>Manually enter the data below</li>
                                <li>Or copy-paste from the PDF</li>
                            </ol>
                        </div>
                    </div>
                    
                    <div class="quick-import">
                        <h4><i class="fas fa-bolt"></i> Quick Import Format</h4>
                        <textarea id="quickImportText" placeholder="Paste data in format:
Name, Mobile, Shakha
Rajesh Kumar, 9876543210, Village A
Mohan Singh, 8765432109, Village B
..."></textarea>
                        <button onclick="processQuickImport()" class="btn-primary">
                            <i class="fas fa-upload"></i> Import Pasted Data
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="closePDFImportModal()" class="btn-secondary">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closePDFImportModal() {
    const modal = document.getElementById('pdfImportModal');
    if (modal) modal.remove();
}

function processQuickImport() {
    const text = document.getElementById('quickImportText').value;
    if (!text.trim()) {
        showNotification('Please paste some data first', 'warning');
        return;
    }
    
    const lines = text.trim().split('\n');
    const importedYuvks = [];
    
    // Skip header if exists
    const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',').map(part => part.trim());
        if (parts.length >= 1) {
            const yuvkData = {
                name: parts[0],
                mobile: parts[1] || '',
                shakha: parts[2] || ''
            };
            
            // Check for duplicates
            const existingYuvks = storageManager.getYuvks();
            const duplicate = existingYuvks.find(yuvk => 
                yuvk.name.toLowerCase() === yuvkData.name.toLowerCase()
            );
            
            if (!duplicate) {
                storageManager.addYuvk(yuvkData);
                importedYuvks.push(yuvkData.name);
            }
        }
    }
    
    closePDFImportModal();
    
    if (importedYuvks.length > 0) {
        showNotification(`Imported ${importedYuvks.length} YUVKs successfully!`, 'success');
        setTimeout(() => {
            location.reload();
        }, 1000);
    } else {
        showNotification('No new YUVKs imported (may be duplicates)', 'info');
    }
}

// ==================== UTILITY FUNCTIONS ====================

function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    else if (type === 'error') icon = 'exclamation-circle';
    else if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }, 4000);
}

function clearAllData() {
    if (confirm(`⚠️ WARNING: This will delete ALL data!\n\n• All YUVKs\n• All attendance records\n• All statistics\n\nThis action cannot be undone!\n\nAre you absolutely sure?`)) {
        if (storageManager.clearAllData()) {
            showNotification('All data cleared successfully!', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    }
}

function printReport() {
    const printContent = document.querySelector('.main-panel').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>YUVK Attendance Report - ${storageManager.getDateDisplay(currentDate)}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                .yuvk-card { 
                    border: 1px solid #ddd; 
                    padding: 15px; 
                    margin-bottom: 10px; 
                    border-radius: 5px;
                    page-break-inside: avoid;
                }
                .present { border-left: 5px solid #27ae60; }
                .absent { border-left: 5px solid #e74c3c; }
                .unmarked { border-left: 5px solid #95a5a6; }
                .yuvk-name { font-weight: bold; font-size: 16px; color: #2c3e50; }
                .yuvk-details { color: #7f8c8d; font-size: 14px; margin: 5px 0; }
                @media print {
                    .no-print { display: none; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <h1>YUVK Attendance Report - ${storageManager.getDateDisplay(currentDate)}</h1>
            ${printContent}
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Print Report
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                    Close
                </button>
            </div>
        </body>
        </html>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    location.reload();
}

// ==================== WINDOW RESIZE HANDLING ====================

window.addEventListener('resize', function() {
    // Update charts on resize
    if (weeklyChart) weeklyChart.resize();
    if (monthlyChart) monthlyChart.resize();
    if (performanceChart) performanceChart.resize();
});

// ==================== KEYBOARD SHORTCUTS ====================

document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveAttendance();
    }
    
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchYuvk').focus();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        const editModal = document.getElementById('editModal');
        if (editModal) closeEditModal();
        
        const importModal = document.getElementById('importOptionsModal');
        if (importModal) closeImportOptions();
        
        const pdfModal = document.getElementById('pdfImportModal');
        if (pdfModal) closePDFImportModal();
    }
    
    // Left arrow for previous day
    if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea')) {
        previousDay();
    }
    
    // Right arrow for next day
    if (e.key === 'ArrowRight' && !e.target.matches('input, textarea')) {
        nextDay();
    }
});

// ==================== INITIALIZE ON LOAD ====================

// Add keyboard shortcuts hint
setTimeout(() => {
    console.log('📋 Keyboard Shortcuts:');
    console.log('• Ctrl/Cmd + S: Save attendance');
    console.log('• Ctrl/Cmd + F: Focus search');
    console.log('• Left/Right Arrow: Navigate dates');
    console.log('• Escape: Close modal');
}, 2000);