class StorageManager {
    constructor() {
        this.storageKey = 'yuvkAttendanceDB';
        this.initDatabase();
    }

    initDatabase() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                yuvks: [],
                attendance: {},
                metadata: {
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    version: '1.0'
                }
            };
            this.saveData(initialData);
        }
    }

    getData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }

    saveData(data) {
        data.metadata.lastModified = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        this.updateStorageUsage();
    }

    updateStorageUsage() {
        const data = localStorage.getItem(this.storageKey);
        const size = data ? Math.ceil(data.length / 1024) : 0; // KB
        document.getElementById('storageUsed').textContent = `${size} KB`;
    }

    // YUVK Management
    addYuvk(yuvkData) {
        const data = this.getData();
        const yuvk = {
            id: 'yuvk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: yuvkData.name.trim(),
            mobile: yuvkData.mobile ? yuvkData.mobile.trim() : '',
            shakha: yuvkData.shakha ? yuvkData.shakha.trim() : '',
            createdAt: new Date().toISOString(),
            attendance: {}
        };
        
        data.yuvks.push(yuvk);
        this.saveData(data);
        return yuvk;
    }

    getYuvks() {
        return this.getData().yuvks;
    }

    updateYuvk(yuvkId, updates) {
        const data = this.getData();
        const index = data.yuvks.findIndex(y => y.id === yuvkId);
        if (index > -1) {
            data.yuvks[index] = { 
                ...data.yuvks[index], 
                ...updates,
                lastModified: new Date().toISOString()
            };
            this.saveData(data);
            return true;
        }
        return false;
    }

    deleteYuvk(yuvkId) {
        const data = this.getData();
        data.yuvks = data.yuvks.filter(y => y.id !== yuvkId);
        
        // Also remove attendance records for this YUVK
        Object.keys(data.attendance).forEach(date => {
            delete data.attendance[date][yuvkId];
        });
        
        this.saveData(data);
    }

    // Attendance Management
    markAttendance(date, yuvkId, status) {
        const data = this.getData();
        const dateStr = this.formatDate(date);
        
        if (!data.attendance[dateStr]) {
            data.attendance[dateStr] = {};
        }
        
        data.attendance[dateStr][yuvkId] = status;
        
        // Update individual YUVK attendance record
        const yuvkIndex = data.yuvks.findIndex(y => y.id === yuvkId);
        if (yuvkIndex > -1) {
            if (!data.yuvks[yuvkIndex].attendance) {
                data.yuvks[yuvkIndex].attendance = {};
            }
            data.yuvks[yuvkIndex].attendance[dateStr] = status;
        }
        
        this.saveData(data);
    }

    getAttendance(date) {
        const data = this.getData();
        const dateStr = this.formatDate(date);
        return data.attendance[dateStr] || {};
    }

    getTodayAttendance() {
        const today = this.formatDate(new Date());
        const attendance = this.getAttendance(new Date());
        const totalYuvks = this.getYuvks().length;
        
        if (totalYuvks === 0) return '0%';
        
        const presentCount = Object.values(attendance).filter(status => status === 'present').length;
        return ((presentCount / totalYuvks) * 100).toFixed(1) + '%';
    }

    getAttendanceForDate(dateStr) {
        const data = this.getData();
        return data.attendance[dateStr] || {};
    }

    // Statistics
    getStatistics() {
        const data = this.getData();
        const totalDays = Object.keys(data.attendance).length;
        const totalYuvks = data.yuvks.length;
        
        let totalPresentDays = 0;
        let highestAttendance = 0;
        let lowestAttendance = totalDays > 0 ? 100 : 0;
        
        Object.values(data.attendance).forEach(dayAttendance => {
            const presentCount = Object.values(dayAttendance).filter(status => status === 'present').length;
            const dayPercent = totalYuvks > 0 ? (presentCount / totalYuvks) * 100 : 0;
            
            totalPresentDays += presentCount;
            highestAttendance = Math.max(highestAttendance, dayPercent);
            if (dayPercent > 0) {
                lowestAttendance = Math.min(lowestAttendance, dayPercent);
            }
        });
        
        const avgAttendance = totalDays > 0 ? (totalPresentDays / (totalDays * totalYuvks)) * 100 : 0;
        
        return {
            totalYuvks,
            totalDays,
            avgAttendance: avgAttendance.toFixed(1),
            highestAttendance: highestAttendance.toFixed(1),
            lowestAttendance: lowestAttendance === 100 ? '0' : lowestAttendance.toFixed(1)
        };
    }

    getYuvkStats(yuvkId) {
        const data = this.getData();
        const yuvk = data.yuvks.find(y => y.id === yuvkId);
        if (!yuvk) return null;
        
        const totalDays = Object.keys(data.attendance).length;
        const presentDays = Object.values(yuvk.attendance || {}).filter(status => status === 'present').length;
        const attendancePercent = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0';
        
        // Find last attended date
        let lastAttended = 'Never';
        const attendanceDates = Object.keys(yuvk.attendance || {})
            .filter(date => yuvk.attendance[date] === 'present')
            .sort((a, b) => new Date(b) - new Date(a));
        
        if (attendanceDates.length > 0) {
            const lastDate = new Date(attendanceDates[0]);
            lastAttended = lastDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
        }
        
        return {
            name: yuvk.name,
            mobile: yuvk.mobile,
            shakha: yuvk.shakha,
            totalDays,
            presentDays,
            attendancePercent,
            lastAttended
        };
    }

    getMonthlyStats() {
        const data = this.getData();
        const monthlyStats = {};
        
        Object.keys(data.attendance).forEach(dateStr => {
            const date = new Date(dateStr);
            const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            if (!monthlyStats[monthYear]) {
                monthlyStats[monthYear] = {
                    total: 0,
                    present: 0,
                    days: 0
                };
            }
            
            const dayAttendance = data.attendance[dateStr];
            const presentCount = Object.values(dayAttendance).filter(status => status === 'present').length;
            const totalYuvks = data.yuvks.length;
            
            monthlyStats[monthYear].total += totalYuvks;
            monthlyStats[monthYear].present += presentCount;
            monthlyStats[monthYear].days += 1;
        });
        
        const months = Object.keys(monthlyStats).sort((a, b) => {
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            const dateA = new Date(`${monthA} 1, ${yearA}`);
            const dateB = new Date(`${monthB} 1, ${yearB}`);
            return dateA - dateB;
        });
        
        const percentages = months.map(month => {
            const stat = monthlyStats[month];
            return stat.total > 0 ? ((stat.present / stat.total) * 100).toFixed(1) : 0;
        });
        
        return { months, percentages };
    }

    getWeeklyStats() {
        const data = this.getData();
        const weeklyStats = {};
        const today = new Date();
        
        // Get last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDate(date);
            
            const dayAttendance = data.attendance[dateStr] || {};
            const presentCount = Object.values(dayAttendance).filter(status => status === 'present').length;
            const totalYuvks = data.yuvks.length;
            const percent = totalYuvks > 0 ? ((presentCount / totalYuvks) * 100).toFixed(1) : 0;
            
            weeklyStats[dateStr] = percent;
        }
        
        return weeklyStats;
    }

    getTopPerformers(count = 5) {
        const data = this.getData();
        const performers = data.yuvks.map(yuvk => {
            const stats = this.getYuvkStats(yuvk.id);
            return {
                id: yuvk.id,
                name: yuvk.name,
                percentage: parseFloat(stats.attendancePercent)
            };
        }).sort((a, b) => b.percentage - a.percentage).slice(0, count);
        
        return performers;
    }

    // Export/Import
    exportToJSON() {
        const data = this.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yuvk-attendance-${this.formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportToCSV() {
        const data = this.getData();
        let csv = 'Name,Mobile,Shakha,Total Days,Present Days,Attendance %,Last Attended\n';
        
        data.yuvks.forEach(yuvk => {
            const stats = this.getYuvkStats(yuvk.id);
            csv += `"${yuvk.name}","${yuvk.mobile}","${yuvk.shakha}",${stats.totalDays},${stats.presentDays},${stats.attendancePercent}%,"${stats.lastAttended}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yuvk-attendance-${this.formatDate(new Date())}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!importedData.yuvks || !importedData.attendance) {
                        throw new Error('Invalid data format');
                    }
                    
                    localStorage.setItem(this.storageKey, JSON.stringify(importedData));
                    this.updateStorageUsage();
                    resolve({ success: true, message: 'Data imported successfully!' });
                } catch (error) {
                    reject({ success: false, message: 'Invalid JSON file format' });
                }
            };
            reader.onerror = () => reject({ success: false, message: 'Error reading file' });
            reader.readAsText(file);
        });
    }

    importFromCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const lines = csv.split('\n');
                    
                    if (lines.length < 2) {
                        throw new Error('Empty CSV file');
                    }
                    
                    const data = {
                        yuvks: [],
                        attendance: {},
                        metadata: {
                            createdAt: new Date().toISOString(),
                            lastModified: new Date().toISOString(),
                            version: '1.0'
                        }
                    };
                    
                    // Skip header row
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        // Simple CSV parsing (for basic format)
                        const values = line.split(',').map(v => v.replace(/^"|"$/g, ''));
                        
                        if (values.length >= 3) {
                            const yuvk = {
                                id: 'yuvk_' + Date.now() + '_' + i,
                                name: values[0],
                                mobile: values[1] || '',
                                shakha: values[2] || '',
                                createdAt: new Date().toISOString(),
                                attendance: {}
                            };
                            data.yuvks.push(yuvk);
                        }
                    }
                    
                    localStorage.setItem(this.storageKey, JSON.stringify(data));
                    this.updateStorageUsage();
                    resolve({ success: true, message: 'CSV imported successfully!' });
                } catch (error) {
                    reject({ success: false, message: 'Error parsing CSV file' });
                }
            };
            reader.onerror = () => reject({ success: false, message: 'Error reading file' });
            reader.readAsText(file);
        });
    }

    clearAllData() {
        localStorage.removeItem(this.storageKey);
        this.initDatabase();
        this.updateStorageUsage();
        return true;
    }

    // Helper Methods
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getDateDisplay(date) {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    getAttendanceCountsForDate(date) {
        const attendance = this.getAttendance(date);
        const totalYuvks = this.getYuvks().length;
        const presentCount = Object.values(attendance).filter(status => status === 'present').length;
        const absentCount = Object.values(attendance).filter(status => status === 'absent').length;
        
        return {
            total: totalYuvks,
            present: presentCount,
            absent: absentCount,
            unmarked: totalYuvks - presentCount - absentCount
        };
    }
}

// Create global instance
const storageManager = new StorageManager();