$(document).ready(function() {
    // Check if this is the statistics page by looking for a unique element
    if ($('#start-date').length === 0) {
        // If the unique element is not found, this is not the statistics page, so do nothing
        return;
    }

    console.log("Initializing statistics page...");

    // Chart.js 관련 변수 추가
    let equipmentChart = null;
    let userChart = null;
    let reportData = null;
     
     // Clean up any datepicker-related elements that might interfere
     $('.flatpickr-calendar, .flatpickr-month, .flatpickr-weekdays, .flatpickr-days').remove();
     
     // Initialize Flatpickr with explicit configuration
     try {
         console.log("Initializing Flatpickr...");
         flatpickr("#start-date", {
             dateFormat: "Y-m-d",
             locale: "ko",
             static: true,
             inline: true,
             appendTo: document.getElementById('start-date').parentNode,
             position: "above",
             wrap: true,
             className: "custom-flatpickr"
         });
         flatpickr("#end-date", {
             dateFormat: "Y-m-d",
             locale: "ko",
             static: true,
             inline: true,
             appendTo: document.getElementById('end-date').parentNode,
             position: "above",
             wrap: true,
             className: "custom-flatpickr"
         });
         console.log("Flatpickr initialized successfully");
     } catch (e) {
         console.error("Flatpickr initialization failed:", e);
     }
    
    const fetchStatistics = () => {
        const startDate = $('#start-date').val();
        const endDate = $('#end-date').val();
        const equipmentStatsDiv = $('#equipment-stats');
        const userStatsDiv = $('#user-stats');
        const periodInfoPara = $('#period-info');
    
        // Clear previous results
        equipmentStatsDiv.empty();
        userStatsDiv.empty();
        periodInfoPara.empty();
    
        // Build query parameters
        const params = new URLSearchParams();
        if (startDate) {
            params.append('start_date', startDate);
        }
        if (endDate) {
            params.append('end_date', endDate);
        }
    
        // Fetch data from the backend
        $.get(`/api/statistics?${params.toString()}`)
            .done(function(data) {
                console.log("Statistics data fetched:", data);
                
                // 통계 데이터 저장
                reportData = data;
    
                // Display period info
                let periodText = "전체 기간";
                if (data.period_start && data.period_end) {
                    periodText = `${data.period_start} 부터 ${data.period_end} 까지 (${data.total_days_in_period} 일)`;
                } else if (data.period_start) {
                     periodText = `${data.period_start} 부터 현재까지`; 
                } else if (data.period_end) {
                     periodText = `시작부터 ${data.period_end} 까지`; 
                }
                 periodInfoPara.text(`통계 기간: ${periodText}`);
                 
                // 차트 렌더링
                renderEquipmentChart(data);
                renderUserChart(data);
    
    
                // Display equipment usage
                if (Object.keys(data.equipment_usage).length > 0) {
                    let equipmentHtml = '<ul class="list-disc pl-5">';
                    for (const [equipmentName, stats] of Object.entries(data.equipment_usage)) {
                        equipmentHtml += `<li><strong>${equipmentName}:</strong> 사용 ${stats.used_days} 일`;
                        if (stats.not_used_days !== 'N/A') {
                             equipmentHtml += `, 미사용 ${stats.not_used_days} 일`;
                        }
                        equipmentHtml += `<ul>`;
                        if (Object.keys(stats.users).length > 0) {
                            for (const [userName, days] of Object.entries(stats.users)) {
                                equipmentHtml += `<li>- ${userName}: ${days} 일</li>`;
                            }
                        } else {
                             equipmentHtml += `<li>- 사용 기록 없음</li>`;
                        }
                        equipmentHtml += `</ul></li>`;
                    }
                    equipmentHtml += '</ul>';
                    equipmentStatsDiv.html(equipmentHtml);
                } else {
                    equipmentStatsDiv.html('<p class="text-gray-500">해당 기간에 장비 사용 기록이 없습니다.</p>');
                }
    
                // Display user usage
                if (Object.keys(data.user_usage).length > 0) {
                    let userHtml = '<ul class="list-disc pl-5">';
                     for (const [userName, stats] of Object.entries(data.user_usage)) {
                        userHtml += `<li><strong>${userName}:</strong> 총 사용 ${stats.used_days} 일`;
                         userHtml += `<ul>`;
                         if (Object.keys(stats.equipment).length > 0) {
                             for (const [equipmentName, days] of Object.entries(stats.equipment)) {
                                 userHtml += `<li>- ${equipmentName}: ${days} 일</li>`;
                             }
                         } else {
                             userHtml += `<li>- 사용 기록 없음</li>`;
                         }
                         userHtml += `</ul></li>`;
                    }
                    userHtml += '</ul>';
                    userStatsDiv.html(userHtml);
                } else {
                    userStatsDiv.html('<p class="text-gray-500">해당 기간에 사용자 사용 기록이 없습니다.</p>');
                }
    
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.error("Error fetching statistics:", textStatus, errorThrown, jqXHR.responseJSON);
                equipmentStatsDiv.html(`<p class="text-red-600">통계 정보를 불러오는데 실패했습니다: ${jqXHR.responseJSON ? jqXHR.responseJSON.message : errorThrown}</p>`);
                userStatsDiv.empty(); 
                periodInfoPara.empty(); 
            });
    };
    
    // Chart.js 배경색 플러그인
    const chartBackgroundColorPlugin = {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart, args, options) => {
            const {ctx} = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = options.color || '#FFFFFF'; // 기본 흰색
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    };
    
    // 장비별 차트 렌더링 함수
    function renderEquipmentChart(data) {
        if (equipmentChart) {
            equipmentChart.destroy();
        }
        
        const equipmentNames = Object.keys(data.equipment_usage);
        const usedDays = equipmentNames.map(name => data.equipment_usage[name].used_days);
        const backgroundColors = generateChartColors(equipmentNames.length);
        
        const ctx = document.getElementById('equipment-chart').getContext('2d');
        equipmentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: equipmentNames,
                datasets: [{
                    label: '사용 일수',
                    data: usedDays,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            plugins: [chartBackgroundColorPlugin], // 배경색 플러그인 등록
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    customCanvasBackgroundColor: { // 플러그인 옵션
                        color: 'white',
                    },
                    title: {
                        display: true,
                        text: '장비별 사용 일수'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '일수'
                        }
                    }
                }
            }
        });
    }
    
    // 사용자별 차트 렌더링 함수
    function renderUserChart(data) {
        if (userChart) {
            userChart.destroy();
        }
        
        const userNames = Object.keys(data.user_usage);
        const usedDays = userNames.map(name => data.user_usage[name].used_days);
        const backgroundColors = generateChartColors(userNames.length);
        
        const ctx = document.getElementById('user-chart').getContext('2d');
        userChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: userNames,
                datasets: [{
                    label: '사용 일수',
                    data: usedDays,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            plugins: [chartBackgroundColorPlugin], // 배경색 플러그인 등록
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    customCanvasBackgroundColor: { // 플러그인 옵션
                        color: 'white',
                    },
                    title: {
                        display: true,
                        text: '사용자별 사용 일수'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '일수'
                        }
                    }
                }
            }
        });
    }
    
    function generateChartColors(count) {
        const colors = [
            '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B',
            '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF',
            '#0EA5E9', '#14B8A6', '#84CC16', '#EAB308', '#F97316'
        ];
        if (count <= colors.length) return colors.slice(0, count);
        const result = [];
        for (let i = 0; i < count; i++) result.push(colors[i % colors.length]);
        return result;
    }
    
    $('#fetch-stats-btn').on('click', fetchStatistics);
    
    $('.quick-select-btn').on('click', function() {
        const days = $(this).data('days');
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days);
        const startDateFormatted = startDate.toISOString().split('T')[0];
        $('#start-date').val(startDateFormatted);
        $('#end-date').val(endDate);
        fetchStatistics();
    });
    
    $('#export-csv').off('click').on('click', function() {
        if (!reportData) {
            alert('먼저 통계 조회를 해주세요.');
            return;
        }
        exportToCSV(reportData);
    });
    
    $('#export-pdf').off('click').on('click', function() {
        if (!reportData) {
            alert('먼저 통계 조회를 해주세요.');
            return;
        }
        exportToPDF(reportData);
    });
    
    function exportToCSV(data) {
        const periodStart = data.period_start || 'NA';
        const periodEnd = data.period_end || 'NA';
        const header = '구분,항목,사용 일수,미사용 일수,세부 내역\n';
        let csvContent = header;
        
        for (const [equipmentName, stats] of Object.entries(data.equipment_usage)) {
            const usedDays = stats.used_days;
            const notUsedDays = stats.not_used_days;
            let details = Object.entries(stats.users).map(([userName, days]) => `${userName}: ${days}일`).join(', ');
            csvContent += `장비,"${equipmentName}",${usedDays},${notUsedDays},"${details}"\n`;
        }
        
        for (const [userName, stats] of Object.entries(data.user_usage)) {
            const usedDays = stats.used_days;
            let details = Object.entries(stats.equipment).map(([equipmentName, days]) => `${equipmentName}: ${days}일`).join(', ');
            csvContent += `사용자,"${userName}",${usedDays},N/A,"${details}"\n`;
        }
        
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `장비예약통계_${periodStart}_${periodEnd}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    let isPdfExporting = false;
    
    // ArrayBuffer를 Base64로 변환하는 헬퍼 함수
    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
    
    async function exportToPDF(data) { // async로 변경
        if (isPdfExporting) {
            console.log('PDF 이미 다운로드 중...');
            return;
        }
        isPdfExporting = true;
        
        try {
            console.log('PDF 내보내기 시작...');
            const today = new Date();
            const dateString = today.toISOString().slice(0, 10);
            const periodStart = data.period_start || 'NA';
            const periodEnd = data.period_end || 'NA';
            
            if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
                console.error('jsPDF 라이브러리가 로드되지 않았습니다.');
                alert('PDF 생성에 필요한 jsPDF 라이브러리가 로드되지 않았습니다.');
                isPdfExporting = false;
                return;
            }
            
            const { jsPDF } = window.jspdf; // 또는 const jsPDF = window.jspdf.jsPDF;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });
    
            // 폰트 로드 및 추가
            try {
                const fontFile = await fetch('NanumGothic.ttf'); 
                if (!fontFile.ok) throw new Error(`폰트 파일 로드 실패: ${fontFile.statusText}. NanumGothic.ttf 파일이 현재 페이지와 같은 경로에 있는지 확인하세요.`);
                const fontBuffer = await fontFile.arrayBuffer();
                
                doc.addFileToVFS('NanumGothic.ttf', arrayBufferToBase64(fontBuffer));
                doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
                doc.setFont('NanumGothic'); 
                console.log('나눔고딕 폰트 추가 완료');
            } catch (fontError) {
                console.error('폰트 로드/추가 실패:', fontError);
                alert('PDF 한글 표시용 폰트를 로드하지 못했습니다: ' + fontError.message + '\n일부 내용이 깨질 수 있습니다.');
                doc.setFont('helvetica'); 
            }
            
            doc.setFontSize(18);
            doc.text('장비 예약 통계 보고서', 15, 20);
            
            doc.setFontSize(12);
            doc.text(`기간: ${periodStart} ~ ${periodEnd}`, 15, 30);
            doc.text(`생성일: ${dateString}`, 15, 36);
            
            console.log('차트 이미지 추가 중...');
            
            if (equipmentChart) {
                try {
                    const equipmentChartImg = equipmentChart.canvas.toDataURL('image/jpeg', 0.7); 
                    doc.addImage(equipmentChartImg, 'JPEG', 15, 45, 180, 70);
                } catch (chartErr) {
                    console.error('장비 차트 추가 실패:', chartErr);
                }
            }
            
            if (userChart) {
                try {
                    const userChartImg = userChart.canvas.toDataURL('image/jpeg', 0.7); 
                    doc.addImage(userChartImg, 'JPEG', 15, 120, 180, 70);
                } catch (chartErr) {
                    console.error('사용자 차트 추가 실패:', chartErr);
                }
            }
            
            console.log('테이블 데이터 준비 중...');
            const equipmentTableData = [];
            for (const [equipmentName, stats] of Object.entries(data.equipment_usage)) {
                let details = Object.entries(stats.users).map(([userName, days]) => `${userName}: ${days}일`).join(', ');
                equipmentTableData.push([
                    equipmentName,
                    stats.used_days + '일',
                    stats.not_used_days + '일',
                    details
                ]);
            }
            
            // AutoTable 플러그인 존재 여부 확인 (doc 인스턴스에 autoTable 메소드가 있는지 확인)
            if (typeof doc.autoTable !== 'function') {
                console.error('jspdf-autotable 플러그인이 로드되지 않았거나 autoTable 메소드가 doc 객체에 없습니다.');
                alert('PDF 테이블 생성 플러그인이 로드되지 않았습니다. (autoTable 메소드 부재)');
                isPdfExporting = false;
                return;
            }
            
            doc.setFontSize(14);
            doc.text('장비별 사용 통계', 15, 200);
            doc.autoTable({
                startY: 205,
                head: [['장비명', '사용 일수', '미사용 일수', '세부 내역']],
                body: equipmentTableData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246], textColor: 255, font: 'NanumGothic', fontStyle: 'bold' },
                bodyStyles: { font: 'NanumGothic' }, 
                styles: { fontSize: 9, cellPadding: 2, font: 'NanumGothic' }, 
                columnStyles: {
                    0: { cellWidth: 30 }, 1: { cellWidth: 20 },
                    2: { cellWidth: 20 }, 3: { cellWidth: 'auto' }
                }
            });
            
            const finalY = (doc.lastAutoTable.finalY || 205) + 10;
            let userTableY = finalY;
            if (finalY > 270) { 
                doc.addPage();
                doc.setFont('NanumGothic'); 
                userTableY = 20; 
            }
            
            const userTableData = [];
            for (const [userName, stats] of Object.entries(data.user_usage)) {
                let details = Object.entries(stats.equipment).map(([equipmentName, days]) => `${equipmentName}: ${days}일`).join(', ');
                userTableData.push([ userName, stats.used_days + '일', details ]);
            }
            
            doc.setFontSize(14);
            doc.text('사용자별 사용 통계', 15, userTableY - 5);
            doc.autoTable({
                startY: userTableY,
                head: [['사용자명', '총 사용 일수', '세부 내역']],
                body: userTableData,
                theme: 'grid',
                headStyles: { fillColor: [75, 85, 99], textColor: 255, font: 'NanumGothic', fontStyle: 'bold' },
                bodyStyles: { font: 'NanumGothic' }, 
                styles: { fontSize: 9, cellPadding: 2, font: 'NanumGothic' }, 
                columnStyles: {
                    0: { cellWidth: 30 }, 1: { cellWidth: 20 },
                    2: { cellWidth: 'auto' }
                }
            });
            
            console.log('PDF 저장 중...');
            doc.save(`장비예약통계_${periodStart}_${periodEnd}.pdf`);
            console.log('PDF 생성 완료');
    
        } catch (err) {
            console.error('PDF 생성 중 오류 발생:', err);
            alert('PDF 생성 중 오류가 발생했습니다: ' + err.message);
        } finally {
            isPdfExporting = false;
        }
    }
    
    $('.quick-select-btn[data-days="30"]').trigger('click');
});