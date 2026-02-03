class PDFGenerator {
    constructor() {
        this.doc = new window.jspdf.jsPDF();
    }

    generateAttendanceReport() {
        const data = storageManager.getData();
        const stats = storageManager.getStatistics();
        const today = new Date();
        
        // Document setup
        this.doc.setProperties({
            title: 'YUVK Attendance Report',
            subject: 'Attendance Statistics',
            author: 'YUVK Attendance System',
            keywords: 'attendance, yuvk, report',
            creator: 'YUVK Attendance System'
        });
        
        // Header
        this.doc.setFillColor(44, 62, 80);
        this.doc.rect(0, 0, 210, 30, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(24);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('YUVK ATTENDANCE REPORT', 105, 20, { align: 'center' });
        
        this.doc.setTextColor(100, 100, 100);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`Generated: ${today.toLocaleDateString()} ${today.toLocaleTimeString()}`, 105, 28, { align: 'center' });
        
        // Reset text color
        this.doc.setTextColor(0, 0, 0);
        
        // Summary Section
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Summary Statistics', 20, 45);
        
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        
        const summaryData = [
            ['Total YUVKs', stats.totalYuvks],
            ['Total Sabha Days', stats.totalDays],
            ['Average Attendance', stats.avgAttendance + '%'],
            ['Highest Attendance', stats.highestAttendance + '%'],
            ['Lowest Attendance', stats.lowestAttendance + '%']
        ];
        
        this.doc.autoTable({
            startY: 50,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: { 
                fillColor: [52, 152, 219],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 10 },
            margin: { left: 20, right: 20 }
        });
        
        // YUVK List
        const finalY = this.doc.lastAutoTable.finalY + 15;
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('YUVK Attendance Details', 20, finalY);
        
        const yuvkData = data.yuvks.map((yuvk, index) => {
            const yuvkStats = storageManager.getYuvkStats(yuvk.id);
            return [
                index + 1,
                yuvk.name,
                yuvk.mobile || 'N/A',
                yuvk.shakha || 'N/A',
                yuvkStats.attendancePercent + '%',
                yuvkStats.lastAttended
            ];
        });
        
        this.doc.autoTable({
            startY: finalY + 5,
            head: [['#', 'Name', 'Mobile', 'Shakha', 'Attendance %', 'Last Attended']],
            body: yuvkData,
            theme: 'grid',
            headStyles: { 
                fillColor: [39, 174, 96],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 9 },
            margin: { left: 20, right: 20 },
            pageBreak: 'auto'
        });
        
        // Daily Attendance
        const finalY2 = this.doc.lastAutoTable.finalY + 15;
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Daily Attendance Summary', 20, finalY2);
        
        const dailyData = [];
        Object.keys(data.attendance).sort().forEach(date => {
            const dayAttendance = data.attendance[date];
            const presentCount = Object.values(dayAttendance).filter(status => status === 'present').length;
            const totalCount = data.yuvks.length;
            const percent = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '0';
            
            const dateObj = new Date(date);
            const formattedDate = dateObj.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            
            dailyData.push([
                formattedDate,
                `${presentCount}/${totalCount}`,
                percent + '%'
            ]);
        });
        
        this.doc.autoTable({
            startY: finalY2 + 5,
            head: [['Date', 'Present/Total', 'Percentage']],
            body: dailyData,
            theme: 'grid',
            headStyles: { 
                fillColor: [155, 89, 182],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 9 },
            margin: { left: 20, right: 20 }
        });
        
        // Footer
        const pageCount = this.doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.doc.setFontSize(8);
            this.doc.setTextColor(150, 150, 150);
            this.doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
            this.doc.text('YUVK Attendance System - Confidential', 105, 295, { align: 'center' });
        }
        
        // Save PDF
        const filename = `yuvk-attendance-report-${this.formatDate(today)}.pdf`;
        this.doc.save(filename);
    }

    generateIndividualReport(yuvkId) {
        const yuvkStats = storageManager.getYuvkStats(yuvkId);
        if (!yuvkStats) return;
        
        const data = storageManager.getData();
        const yuvk = data.yuvks.find(y => y.id === yuvkId);
        const today = new Date();
        
        // Document setup
        this.doc = new window.jspdf.jsPDF();
        this.doc.setProperties({
            title: `YUVK Report - ${yuvkStats.name}`,
            subject: 'Individual Attendance Report',
            author: 'YUVK Attendance System'
        });
        
        // Header with color
        this.doc.setFillColor(52, 152, 219);
        this.doc.rect(0, 0, 210, 40, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(20);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`YUVK ATTENDANCE REPORT`, 105, 20, { align: 'center' });
        
        this.doc.setFontSize(16);
        this.doc.text(yuvkStats.name.toUpperCase(), 105, 30, { align: 'center' });
        
        // Personal Details
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Personal Details', 20, 55);
        
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        
        const personalData = [
            ['Name', yuvkStats.name],
            ['Mobile', yuvkStats.mobile || 'Not Provided'],
            ['Shakha/Village', yuvkStats.shakha || 'Not Provided'],
            ['Date Joined', new Date(yuvk.createdAt).toLocaleDateString()]
        ];
        
        this.doc.autoTable({
            startY: 60,
            body: personalData,
            theme: 'plain',
            styles: { 
                fontSize: 11,
                cellPadding: 5
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 130 }
            },
            margin: { left: 20, right: 20 }
        });
        
        // Attendance Statistics
        const finalY = this.doc.lastAutoTable.finalY + 15;
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Attendance Statistics', 20, finalY);
        
        const statsData = [
            ['Total Sabha Days', yuvkStats.totalDays],
            ['Days Present', yuvkStats.presentDays],
            ['Days Absent', yuvkStats.totalDays - yuvkStats.presentDays],
            ['Attendance Percentage', yuvkStats.attendancePercent + '%'],
            ['Last Attended', yuvkStats.lastAttended]
        ];
        
        // Color code based on percentage
        const percent = parseFloat(yuvkStats.attendancePercent);
        let fillColor;
        if (percent >= 80) fillColor = [39, 174, 96]; // Green
        else if (percent >= 50) fillColor = [241, 196, 15]; // Yellow
        else fillColor = [231, 76, 60]; // Red
        
        this.doc.autoTable({
            startY: finalY + 5,
            body: statsData,
            theme: 'grid',
            headStyles: { 
                fillColor: fillColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 11 },
            margin: { left: 20, right: 20 }
        });
        
        // Attendance History
        const finalY2 = this.doc.lastAutoTable.finalY + 15;
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Attendance History', 20, finalY2);
        
        const attendanceData = [];
        Object.keys(data.attendance).sort().forEach(date => {
            const status = yuvk.attendance && yuvk.attendance[date] ? yuvk.attendance[date] : 'absent';
            const dateObj = new Date(date);
            const formattedDate = dateObj.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            
            attendanceData.push([
                formattedDate,
                status.toUpperCase(),
                status === 'present' ? '✅' : '❌'
            ]);
        });
        
        this.doc.autoTable({
            startY: finalY2 + 5,
            head: [['Date', 'Status', '']],
            body: attendanceData,
            theme: 'grid',
            headStyles: { 
                fillColor: [44, 62, 80],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 10 },
            margin: { left: 20, right: 20 },
            pageBreak: 'auto'
        });
        
        // Footer
        const pageCount = this.doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.doc.setFontSize(8);
            this.doc.setTextColor(150, 150, 150);
            this.doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
            this.doc.text(`Report generated: ${today.toLocaleDateString()}`, 105, 295, { align: 'center' });
        }
        
        // Save PDF
        const filename = `yuvk-${yuvkStats.name.replace(/\s+/g, '-').toLowerCase()}-report.pdf`;
        this.doc.save(filename);
    }

    generateDailyReport(date) {
        const dateStr = this.formatDate(date);
        const attendance = storageManager.getAttendanceForDate(dateStr);
        const yuvks = storageManager.getYuvks();
        const counts = storageManager.getAttendanceCountsForDate(date);
        
        // Document setup
        this.doc = new window.jspdf.jsPDF();
        this.doc.setProperties({
            title: `Daily Attendance - ${dateStr}`,
            subject: 'Daily Attendance Report'
        });
        
        // Header
        this.doc.setFillColor(155, 89, 182);
        this.doc.rect(0, 0, 210, 35, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(22);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('DAILY ATTENDANCE REPORT', 105, 20, { align: 'center' });
        
        const dateDisplay = new Date(dateStr).toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        this.doc.setFontSize(14);
        this.doc.text(dateDisplay, 105, 30, { align: 'center' });
        
        // Daily Summary
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Daily Summary', 20, 50);
        
        const percent = counts.total > 0 ? ((counts.present / counts.total) * 100).toFixed(1) : 0;
        
        const summaryData = [
            ['Total YUVKs', counts.total],
            ['Present', counts.present],
            ['Absent', counts.absent],
            ['Unmarked', counts.unmarked],
            ['Attendance Rate', percent + '%']
        ];
        
        this.doc.autoTable({
            startY: 55,
            body: summaryData,
            theme: 'grid',
            headStyles: { 
                fillColor: [52, 152, 219],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 11 },
            margin: { left: 20, right: 20 }
        });
        
        // Attendance List
        const finalY = this.doc.lastAutoTable.finalY + 15;
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Attendance List', 20, finalY);
        
        const attendanceData = yuvks.map((yuvk, index) => {
            const status = attendance[yuvk.id] || 'unmarked';
            return [
                index + 1,
                yuvk.name,
                yuvk.mobile || 'N/A',
                yuvk.shakha || 'N/A',
                status.toUpperCase()
            ];
        });
        
        this.doc.autoTable({
            startY: finalY + 5,
            head: [['#', 'Name', 'Mobile', 'Shakha', 'Status']],
            body: attendanceData,
            theme: 'grid',
            headStyles: { 
                fillColor: [39, 174, 96],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 9 },
            margin: { left: 20, right: 20 },
            pageBreak: 'auto',
            didDrawCell: (data) => {
                if (data.column.index === 4 && data.cell.raw === 'PRESENT') {
                    this.doc.setFillColor(39, 174, 96, 0.2);
                    this.doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                } else if (data.column.index === 4 && data.cell.raw === 'ABSENT') {
                    this.doc.setFillColor(231, 76, 60, 0.2);
                    this.doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                }
            }
        });
        
        // Footer
        const pageCount = this.doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.doc.setFontSize(8);
            this.doc.setTextColor(150, 150, 150);
            this.doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
            this.doc.text('Generated by YUVK Attendance System', 105, 295, { align: 'center' });
        }
        
        // Save PDF
        const filename = `daily-attendance-${dateStr}.pdf`;
        this.doc.save(filename);
    }

    // ============ MONTHLY REPORT FUNCTION ============
    generateMonthlyReport() {
        const data = storageManager.getData();
        const yuvks = storageManager.getYuvks();
        const today = new Date();
        const currentYear = today.getFullYear();
        
        this.doc = new window.jspdf.jsPDF();
        this.doc.setProperties({
            title: `YUVK Monthly Report - ${currentYear}`,
            subject: 'Monthly Attendance Analysis',
            author: 'YUVK Attendance System'
        });
        
        // Header
        this.doc.setFillColor(139, 69, 19); // Saddle Brown
        this.doc.rect(0, 0, 210, 40, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(22);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('YUVK MONTHLY ATTENDANCE REPORT', 105, 20, { align: 'center' });
        
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`Year: ${currentYear} | Generated: ${today.toLocaleDateString()}`, 105, 30, { align: 'center' });
        
        // Year Summary
        this.doc.setTextColor(0, 0, 0);
        const yearStats = this._calculateYearStats(currentYear, data, yuvks);
        
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Yearly Summary', 20, 50);
        
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        
        const summaryData = [
            ['Total YUVKs', yuvks.length],
            ['Total Sabha Days', yearStats.totalDays],
            ['Average Attendance', yearStats.avgAttendance.toFixed(1) + '%'],
            ['Best Month', yearStats.bestMonth],
            ['Best Month %', yearStats.bestMonthPercent + '%']
        ];
        
        this.doc.autoTable({
            startY: 55,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: { 
                fillColor: [255, 153, 51], // Saffron
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 10 },
            margin: { left: 20, right: 20 }
        });
        
        // Monthly Breakdown
        const finalY = this.doc.lastAutoTable.finalY + 15;
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Monthly Breakdown', 20, finalY);
        
        const monthlyData = this._getMonthlyData(currentYear, data, yuvks);
        
        this.doc.autoTable({
            startY: finalY + 5,
            head: [['Month', 'Sabha Days', 'Avg Attendance %', 'Best YUVK', 'Best %']],
            body: monthlyData,
            theme: 'grid',
            headStyles: { 
                fillColor: [34, 139, 34], // Forest Green
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 9 },
            margin: { left: 20, right: 20 },
            pageBreak: 'auto'
        });
        
        // Top Performers for the Year
        const finalY2 = this.doc.lastAutoTable.finalY + 15;
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Top Performers - Yearly', 20, finalY2);
        
        const topPerformers = this._getYearlyTopPerformers(currentYear, data, yuvks, 10);
        
        this.doc.autoTable({
            startY: finalY2 + 5,
            head: [['Rank', 'YUVK Name', 'Attendance %', 'Present Days', 'Total Days']],
            body: topPerformers,
            theme: 'grid',
            headStyles: { 
                fillColor: [65, 105, 225], // Royal Blue
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: { fontSize: 9 },
            margin: { left: 20, right: 20 }
        });
        
        // Footer
        const pageCount = this.doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.doc.setFontSize(8);
            this.doc.setTextColor(150, 150, 150);
            this.doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
            this.doc.text(`Mandir YUVK Attendance System - ${currentYear}`, 105, 295, { align: 'center' });
        }
        
        // Save PDF
        const filename = `yuvk-monthly-report-${currentYear}.pdf`;
        this.doc.save(filename);
    }

    // ============ PRIVATE HELPER METHODS ============
    
    _calculateYearStats(year, data, yuvks) {
        let totalDays = 0;
        let totalAttendance = 0;
        let bestMonth = '';
        let bestMonthPercent = 0;
        
        // Calculate for each month
        for (let month = 0; month < 12; month++) {
            let monthDays = 0;
            let monthAttendance = 0;
            
            Object.keys(data.attendance).forEach(dateStr => {
                const date = new Date(dateStr);
                if (date.getFullYear() === year && date.getMonth() === month) {
                    monthDays++;
                    const dayAttendance = data.attendance[dateStr];
                    const presentCount = Object.values(dayAttendance).filter(status => status === 'present').length;
                    const percentage = yuvks.length > 0 ? (presentCount / yuvks.length) * 100 : 0;
                    monthAttendance += percentage;
                }
            });
            
            if (monthDays > 0) {
                const avgMonthAttendance = monthAttendance / monthDays;
                totalDays += monthDays;
                totalAttendance += monthAttendance;
                
                if (avgMonthAttendance > bestMonthPercent) {
                    bestMonthPercent = avgMonthAttendance;
                    bestMonth = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
                }
            }
        }
        
        return {
            totalDays,
            avgAttendance: totalDays > 0 ? totalAttendance / totalDays : 0,
            bestMonth,
            bestMonthPercent: bestMonthPercent.toFixed(1)
        };
    }

    _getMonthlyData(year, data, yuvks) {
        const monthlyData = [];
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        for (let month = 0; month < 12; month++) {
            const monthName = monthNames[month];
            let sabhaDays = 0;
            let totalAttendance = 0;
            let bestYuvk = 'N/A';
            let bestPercentage = 0;
            const yuvkAttendance = {};
            
            // Calculate for this month
            Object.keys(data.attendance).forEach(dateStr => {
                const date = new Date(dateStr);
                if (date.getFullYear() === year && date.getMonth() === month) {
                    sabhaDays++;
                    const dayAttendance = data.attendance[dateStr];
                    const presentCount = Object.values(dayAttendance).filter(status => status === 'present').length;
                    totalAttendance += yuvks.length > 0 ? (presentCount / yuvks.length) * 100 : 0;
                    
                    // Track individual YUVKs
                    yuvks.forEach(yuvk => {
                        if (!yuvkAttendance[yuvk.id]) {
                            yuvkAttendance[yuvk.id] = {
                                name: yuvk.name,
                                presentDays: 0,
                                totalDays: 0
                            };
                        }
                        yuvkAttendance[yuvk.id].totalDays++;
                        if (dayAttendance[yuvk.id] === 'present') {
                            yuvkAttendance[yuvk.id].presentDays++;
                        }
                    });
                }
            });
            
            if (sabhaDays > 0) {
                // Find best YUVK
                Object.keys(yuvkAttendance).forEach(yuvkId => {
                    const yuvk = yuvkAttendance[yuvkId];
                    const percentage = (yuvk.presentDays / sabhaDays) * 100;
                    if (percentage > bestPercentage) {
                        bestPercentage = Math.round(percentage * 10) / 10;
                        bestYuvk = yuvk.name.length > 20 ? 
                            yuvk.name.substring(0, 17) + '...' : yuvk.name;
                    }
                });
                
                const avgAttendance = totalAttendance / sabhaDays;
                monthlyData.push([
                    monthName,
                    sabhaDays.toString(),
                    avgAttendance.toFixed(1) + '%',
                    bestYuvk,
                    bestPercentage + '%'
                ]);
            } else {
                // No data for this month
                monthlyData.push([
                    monthName,
                    '0',
                    '0%',
                    'N/A',
                    '0%'
                ]);
            }
        }
        
        return monthlyData;
    }

    _getYearlyTopPerformers(year, data, yuvks, limit = 10) {
        // Calculate attendance for each YUVK
        const yuvkStats = yuvks.map(yuvk => {
            let presentDays = 0;
            let totalDays = 0;
            
            Object.keys(data.attendance).forEach(dateStr => {
                const date = new Date(dateStr);
                if (date.getFullYear() === year) {
                    totalDays++;
                    if (data.attendance[dateStr][yuvk.id] === 'present') {
                        presentDays++;
                    }
                }
            });
            
            const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
            
            return {
                name: yuvk.name,
                percentage: percentage,
                presentDays: presentDays,
                totalDays: totalDays
            };
        });
        
        // Sort by percentage
        yuvkStats.sort((a, b) => b.percentage - a.percentage);
        
        // Return top performers
        return yuvkStats.slice(0, limit).map((yuvk, index) => [
            (index + 1).toString(),
            yuvk.name,
            yuvk.percentage.toFixed(1) + '%',
            yuvk.presentDays.toString(),
            yuvk.totalDays.toString()
        ]);
    }

    // ============ HELPER METHOD ============
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// Create global instance
const pdfGenerator = new PDFGenerator();