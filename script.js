document.addEventListener('DOMContentLoaded', function() {
    // --- 전역 변수 및 설정 ---
    const API_BASE_URL = 'http://localhost:5000/api';

    // 서버 연결 테스트
    fetch(API_BASE_URL + '/test')
        .then(response => {
            console.log('서버 테스트 응답:', response.status);
            if (response.ok) {
                return response.json();
            }
            throw new Error('서버 연결 오류: ' + response.status);
        })
        .then(data => {
            console.log('서버 연결 성공:', data);
        })
        .catch(error => {
            console.error('서버 연결 테스트 실패:', error);
            alert('서버에 연결할 수 없습니다. 개발자 도구의 콘솔을 확인해주세요.');
        });

    const calendarEl = document.getElementById('calendar');
    const reservationModal = document.getElementById('reservation-modal');
    const modalForm = document.getElementById('reservation-form');
    const closeModalBtn = reservationModal.querySelector('.close-btn');
    const deleteReservationBtn = document.getElementById('delete-reservation-btn');

    // 필터 및 관리 요소
    const equipmentFilter = document.getElementById('equipment-filter');
    const userFilter = document.getElementById('user-filter');
    const resetFilterBtn = document.getElementById('reset-filter-btn');
    const equipmentListUl = document.getElementById('equipment-list');
    const newEquipmentNameInput = document.getElementById('new-equipment-name');
    const newEquipmentDescInput = document.getElementById('new-equipment-desc');
    const addEquipmentBtn = document.getElementById('add-equipment-btn');
    const userListUl = document.getElementById('user-list');
    const newUserNameInput = document.getElementById('new-user-name');
    const addUserBtn = document.getElementById('add-user-btn');

    // 모달 내 요소
    const modalTitle = document.getElementById('modal-title');
    const reservationIdInput = document.getElementById('reservation-id');
    const modalUserSelect = document.getElementById('modal-user');
    const modalEquipmentSelect = document.getElementById('modal-equipment');
    const modalStartDateInput = document.getElementById('modal-start-date');
    const modalEndDateInput = document.getElementById('modal-end-date');
    const modalPurposeInput = document.getElementById('modal-purpose');
    const modalErrorP = document.getElementById('modal-error');

    // --- Flatpickr 인스턴스 생성 (Date range) ---
    let startDatePicker, endDatePicker;

    // Helper function to apply common Flatpickr options
    const getFlatpickrOptions = (inputElement, isStartDate = true) => ({
        dateFormat: "Y-m-d",
        locale: "ko",
        wrap: false, // Assuming no wrap element
        onChange: function(selectedDates, dateStr, instance) {
            const otherPicker = isStartDate ? endDatePicker : startDatePicker;
            if (selectedDates[0]) {
                if (isStartDate) {
                    otherPicker.set('minDate', selectedDates[0]);
                    // If end date is before new start date, clear end date
                    if (otherPicker.selectedDates[0] && otherPicker.selectedDates[0] < selectedDates[0]) {
                        otherPicker.clear();
                    }
                } else {
                    // Optional: If end date is set, constrain start date maxDate
                    // startDatePicker.set('maxDate', selectedDates[0]);
                }
            } else {
                // If date is cleared, remove constraint from the other picker
                 if (isStartDate) {
                    otherPicker.set('minDate', null);
                 } else {
                    // startDatePicker.set('maxDate', null);
                 }
            }
        }
    });

    startDatePicker = flatpickr(modalStartDateInput, getFlatpickrOptions(modalStartDateInput, true));
    endDatePicker = flatpickr(modalEndDateInput, getFlatpickrOptions(modalEndDateInput, false));

    // --- API 호출 함수 ---
    async function fetchData(url) {
        try {
            console.log('API 요청:', url);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('API 응답:', data);
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("데이터를 가져오는 중 오류가 발생했습니다.");
            return null;
        }
    }

    async function postData(url, data) {
        try {
            console.log('POST 요청:', url, data);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const responseData = await response.json();
            console.log('POST 응답:', responseData);
            if (!response.ok) {
                throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
            }
            return responseData;
        } catch (error) {
            console.error("Error posting data:", error);
            modalErrorP.textContent = `오류: ${error.message}`;
            return null;
        }
    }

    async function putData(url, data) {
        try {
            console.log('PUT 요청:', url, data);
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const responseData = await response.json();
            console.log('PUT 응답:', responseData);
            if (!response.ok) {
                throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
            }
            return responseData;
        } catch (error) {
            console.error("Error updating data:", error);
            modalErrorP.textContent = `오류: ${error.message}`;
            return null;
        }
    }

    async function deleteData(url) {
        try {
            console.log('DELETE 요청:', url);
            const response = await fetch(url, { method: 'DELETE' });
            const responseData = await response.json();
            console.log('DELETE 응답:', responseData);
            if (!response.ok) {
                throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
            }
            return responseData;
        } catch (error) {
            console.error("Error deleting data:", error);
            alert(`삭제 중 오류 발생: ${error.message}`);
            return null;
        }
    }

    // --- 데이터 로딩 및 UI 업데이트 함수 ---
    async function loadAndPopulateSelect(url, selectElement, valueField = 'id', textField = 'name', addDefaultOption = true, selectedValue = null) {
        const data = await fetchData(url);
        if (data) {
            selectElement.innerHTML = ''; // Clear existing options
            if (addDefaultOption) {
                const defaultOptionText = selectElement === equipmentFilter ? '-- 전체 장비 --' :
                                         selectElement === userFilter ? '-- 전체 사용자 --' :
                                         selectElement === modalEquipmentSelect ? '-- 장비 선택 --' :
                                         selectElement === modalUserSelect ? '-- 사용자 선택 --' : '';
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = defaultOptionText;
                selectElement.appendChild(defaultOption);
            }
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item[valueField];
                option.textContent = item[textField];
                selectElement.appendChild(option);
            });
            if (selectedValue !== null) {
                selectElement.value = selectedValue;
            }
        }
    }

    async function loadAndPopulateList(url, listElement, deleteUrlPrefix) {
        const data = await fetchData(url);
        if (data) {
            listElement.innerHTML = ''; // Clear list
            data.forEach(item => {
                const li = document.createElement('li');
                // Tailwind classes for list item
                li.className = 'flex justify-between items-center px-3 py-2 border-b border-dashed border-gray-200 last:border-b-0 text-sm';

                const itemNameSpan = document.createElement('span');
                itemNameSpan.textContent = item.name + (item.description ? ` (${item.description})` : '');
                li.appendChild(itemNameSpan);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '삭제';
                // Tailwind classes for delete button
                deleteBtn.className = 'delete-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded ml-3 transition duration-150 ease-in-out';
                deleteBtn.dataset.id = item.id;

                deleteBtn.addEventListener('click', async (e) => {
                    const idToDelete = e.target.dataset.id;
                    const itemName = item.name;
                    if (confirm(`'${itemName}' 항목을 삭제하시겠습니까? 연관된 예약도 모두 삭제됩니다.`)) {
                        const result = await deleteData(`${deleteUrlPrefix}/${idToDelete}`);
                        if (result) {
                            loadInitialData(); // Reload lists and dropdowns
                            calendar.refetchEvents(); // Refresh calendar
                        }
                    }
                });
                li.appendChild(deleteBtn);
                listElement.appendChild(li);
            });
        }
    }

    // --- 모달 관련 함수 ---
    async function openModal(title = '새 예약 추가', event = null) { // Pass event data
        modalTitle.textContent = title;
        modalForm.reset(); // Reset form
        startDatePicker.clear();
        endDatePicker.clear();
        endDatePicker.set('minDate', null);
        reservationIdInput.value = '';
        deleteReservationBtn.style.display = 'none';
        modalErrorP.textContent = '';

        // Load users and equipment, setting selected value if editing
        const userIdToSelect = event?.extendedProps?.user_id || null;
        const equipmentIdToSelect = event?.extendedProps?.equipment_id || null;

        await loadAndPopulateSelect(`${API_BASE_URL}/users`, modalUserSelect, 'id', 'name', true, userIdToSelect);
        await loadAndPopulateSelect(`${API_BASE_URL}/equipment`, modalEquipmentSelect, 'id', 'name', true, equipmentIdToSelect);

        // Show modal using Tailwind classes
        reservationModal.classList.remove('hidden');
        reservationModal.classList.add('flex'); // Use flex for centering defined in HTML
    }

    function closeModal() {
        // Hide modal using Tailwind classes
        reservationModal.classList.add('hidden');
        reservationModal.classList.remove('flex');
    }

    function openModalForNew(start, end) {
        openModal('새 예약 추가').then(() => { // Ensure dropdowns are loaded before setting dates
            const startDate = new Date(start);
            startDatePicker.setDate(startDate, false); // Don't trigger onChange

            let endDate = end ? new Date(end.getTime() - 1) : start; // FC end is exclusive, make it inclusive for picker/logic
            if (end && start.getTime() === end.getTime() - (24*60*60*1000)) { // Check if it's a single day click/select
                 endDate = start; // If single day, end date is same as start date
            } else if (endDate < startDate) {
                 endDate = startDate;
            }

            endDatePicker.setDate(endDate, false); // Don't trigger onChange
            endDatePicker.set('minDate', startDate); // Set minDate constraint
        });
    }

    async function openModalForEdit(event) {
        await openModal('예약 수정/삭제', event); // Pass event to populate form correctly

        reservationIdInput.value = event.id;

        // API returns inclusive dates (YYYY-MM-DD)
        const startDate = event.extendedProps.start_date;
        const endDate = event.extendedProps.end_date; // Inclusive end date

        if (startDate) {
            startDatePicker.setDate(startDate, false); // Set date without triggering onChange
            if (endDate) {
                endDatePicker.setDate(endDate, false); // Set date without triggering onChange
                endDatePicker.set('minDate', startDate); // Set minDate constraint
            }
        }

        modalPurposeInput.value = event.extendedProps.purpose || '';
        deleteReservationBtn.style.display = 'inline-block'; // Show delete button
        deleteReservationBtn.dataset.id = event.id;
    }

    // --- 이벤트 핸들러 ---
    equipmentFilter.addEventListener('change', () => calendar.refetchEvents());
    userFilter.addEventListener('change', () => calendar.refetchEvents());
    resetFilterBtn.addEventListener('click', () => {
        equipmentFilter.value = '';
        userFilter.value = '';
        calendar.refetchEvents();
    });

    addEquipmentBtn.addEventListener('click', async () => {
        console.log('장비 추가 버튼 클릭');
        const name = newEquipmentNameInput.value.trim();
        const description = newEquipmentDescInput.value.trim();
        if (!name) {
            alert('장비 이름을 입력해주세요.');
            return;
        }
        const result = await postData(`${API_BASE_URL}/equipment`, { name, description });
        if (result) {
            newEquipmentNameInput.value = '';
            newEquipmentDescInput.value = '';
            // Reload relevant lists and dropdowns
            loadAndPopulateList(`${API_BASE_URL}/equipment`, equipmentListUl, `${API_BASE_URL}/equipment`);
            loadAndPopulateSelect(`${API_BASE_URL}/equipment`, equipmentFilter);
            loadAndPopulateSelect(`${API_BASE_URL}/equipment`, modalEquipmentSelect);
        }
    });

    addUserBtn.addEventListener('click', async () => {
        console.log('사용자 추가 버튼 클릭');
        const name = newUserNameInput.value.trim();
        if (!name) {
            alert('사용자 이름을 입력해주세요.');
            return;
        }
        const result = await postData(`${API_BASE_URL}/users`, { name });
        if (result) {
            newUserNameInput.value = '';
             // Reload relevant lists and dropdowns
            loadAndPopulateList(`${API_BASE_URL}/users`, userListUl, `${API_BASE_URL}/users`);
            loadAndPopulateSelect(`${API_BASE_URL}/users`, userFilter);
            loadAndPopulateSelect(`${API_BASE_URL}/users`, modalUserSelect);
        }
    });

    // Modal close handlers
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target == reservationModal) {
            closeModal();
        }
    });

    // Reservation form submission
    modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        modalErrorP.textContent = '';

        const reservationId = reservationIdInput.value;
        const userId = modalUserSelect.value;
        const equipmentId = modalEquipmentSelect.value;
        const startDateStr = modalStartDateInput.value; // YYYY-MM-DD from flatpickr
        const endDateStr = modalEndDateInput.value;     // YYYY-MM-DD from flatpickr
        const purpose = modalPurposeInput.value.trim();

        if (!userId || !equipmentId || !startDateStr || !endDateStr) {
            modalErrorP.textContent = '사용자, 장비, 시작 날짜, 종료 날짜는 필수입니다.';
            return;
        }

        // Use the date strings directly from flatpickr as they are already YYYY-MM-DD
        if (new Date(startDateStr) > new Date(endDateStr)) {
             modalErrorP.textContent = '시작 날짜는 종료 날짜보다 빠르거나 같아야 합니다.';
             return;
        }

        const reservationData = {
            user_id: parseInt(userId),
            equipment_id: parseInt(equipmentId),
            start_date: startDateStr, // Send as YYYY-MM-DD string
            end_date: endDateStr,     // Send as YYYY-MM-DD string (inclusive)
            purpose: purpose
        };
        console.log('Saving reservation data:', reservationData);

        let result;
        if (reservationId) {
            result = await putData(`${API_BASE_URL}/reservations/${reservationId}`, reservationData);
        } else {
            result = await postData(`${API_BASE_URL}/reservations`, reservationData);
        }

        if (result) {
            closeModal();
            calendar.refetchEvents();
        }
        // Error message handled within postData/putData
    });

    // Delete reservation button (inside modal)
    deleteReservationBtn.addEventListener('click', async (e) => {
        const reservationId = e.target.dataset.id;
        if (!reservationId) return;

        if (confirm('이 예약을 삭제하시겠습니까?')) {
            const result = await deleteData(`${API_BASE_URL}/reservations/${reservationId}`);
            if (result) {
                closeModal();
                calendar.refetchEvents();
            }
        }
    });

     // Helper function to format date as YYYY-MM-DD (needed for FullCalendar end date adjustment)
     const formatYmdLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // --- FullCalendar Instantiation ---
    let calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        locale: 'ko',
        eventDisplay: 'block',
        events: function(fetchInfo, successCallback, failureCallback) {
            const params = new URLSearchParams();
            const eqId = equipmentFilter.value;
            const userId = userFilter.value;
            if (eqId) params.append('equipment_id', eqId);
            if (userId) params.append('user_id', userId);

            // Add date range from FullCalendar's view (start inclusive, end exclusive)
            params.append('start', fetchInfo.startStr.substring(0, 10));
            params.append('end', fetchInfo.endStr.substring(0, 10));

            let url = `${API_BASE_URL}/reservations?${params.toString()}`;

            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    const events = data.map(item => {
                        // API provides inclusive start_date and end_date (YYYY-MM-DD)
                        // FullCalendar's 'end' date is exclusive. Add 1 day to the inclusive end date.
                        const endDateForCalendar = new Date(item.end_date);
                        endDateForCalendar.setDate(endDateForCalendar.getDate() + 1);

                        return {
                            id: item.id,
                            title: `${item.equipment_name} - ${item.user_name}`,
                            start: item.start_date, // Use YYYY-MM-DD directly from API
                            end: formatYmdLocal(endDateForCalendar), // Format the adjusted date
                            allDay: true,
                            // Store original data and IDs in extendedProps
                            extendedProps: {
                                user_id: item.user_id,
                                user_name: item.user_name,
                                equipment_id: item.equipment_id,
                                equipment_name: item.equipment_name,
                                start_date: item.start_date, // Store original inclusive start
                                end_date: item.end_date,     // Store original inclusive end
                                purpose: item.purpose
                            },
                            // Apply color based on equipment ID here
                            backgroundColor: getEquipmentColor(item.equipment_id).bg,
                            borderColor: getEquipmentColor(item.equipment_id).border
                        };
                    });
                    successCallback(events);
                })
                .catch(error => {
                    console.error("Error fetching events:", error);
                    failureCallback(error);
                });
        },
        eventDidMount: function(info) {
            // Add tooltip using title attribute (simple tooltip)
             const tooltipText = `
                장비: ${info.event.extendedProps.equipment_name || ''}
                사용자: ${info.event.extendedProps.user_name || ''}
                ${info.event.extendedProps.purpose ? `목적: ${info.event.extendedProps.purpose}` : ''}
            `.trim().replace(/\n\s+/g, '\n'); // Clean up whitespace for multiline title
             info.el.title = tooltipText;
        },
        selectable: true,
        select: function(info) {
            // info.start and info.end are Date objects
            openModalForNew(info.start, info.end); // Pass dates to modal function
        },
        dateClick: function(info) {
             // info.date is a Date object
            openModalForNew(info.date, null); // Single day click
        },
        eventClick: function(info) {
            openModalForEdit(info.event);
        },
    });

    // Function to get color based on equipment ID
    function getEquipmentColor(equipmentId) {
        const colors = [
            { bg: '#4285F4', border: '#2A56C6' }, // Blue
            { bg: '#EA4335', border: '#B31412' }, // Red
            { bg: '#FBBC05', border: '#EA8F00' }, // Yellow
            { bg: '#34A853', border: '#176639' }, // Green
            { bg: '#9C27B0', border: '#6A1B9A' }, // Purple
            { bg: '#00BCD4', border: '#0097A7' }, // Cyan
            { bg: '#FF9800', border: '#EF6C00' }, // Orange
            { bg: '#795548', border: '#4E342E' }  // Brown
        ];
        // Use modulo operator to cycle through colors if more equipment than colors
        const colorIndex = equipmentId ? (parseInt(equipmentId) - 1) % colors.length : 0;
        return colors[colorIndex] || colors[0]; // Default to first color if ID is invalid
    }


    calendar.render(); // Render the calendar

    // --- Initial Data Load ---
    function loadInitialData() {
        console.log('초기 데이터 로드 중...');
        loadAndPopulateSelect(`${API_BASE_URL}/equipment`, equipmentFilter);
        loadAndPopulateSelect(`${API_BASE_URL}/users`, userFilter);
        loadAndPopulateList(`${API_BASE_URL}/equipment`, equipmentListUl, `${API_BASE_URL}/equipment`);
        loadAndPopulateList(`${API_BASE_URL}/users`, userListUl, `${API_BASE_URL}/users`);
    }

    loadInitialData();
    // --- 관리 섹션 토글 기능 (모바일 전용) ---
    // 이 기능은 모바일 뷰 (lg 미만)에서만 시각적으로 의미가 있습니다.
    // 데스크탑에서는 lg:block 클래스 때문에 hidden이 적용되어도 내용이 보입니다.
    const toggleButtons = document.querySelectorAll('.toggle-management-btn');

    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const targetContent = document.querySelector(targetId); // #equipment-content 또는 #user-content
            const iconPlus = button.querySelector('.toggle-icon-plus');
            const iconMinus = button.querySelector('.toggle-icon-minus');

            if (targetContent) {
                // 단순히 hidden 클래스를 토글합니다.
                targetContent.classList.toggle('hidden');

                // 아이콘 표시를 업데이트합니다.
                const isHidden = targetContent.classList.contains('hidden');
                iconPlus.classList.toggle('hidden', !isHidden); // 내용이 보이면(+) 숨김
                iconMinus.classList.toggle('hidden', isHidden); // 내용이 숨겨지면(-) 숨김
            }
        });

        // 초기 아이콘 상태 설정 (페이지 로드 시)
        // lg 미만일 때만 초기 상태가 hidden이면 + 아이콘 표시
        const targetId = button.getAttribute('data-target');
        const targetContent = document.querySelector(targetId);
        const iconPlus = button.querySelector('.toggle-icon-plus');
        const iconMinus = button.querySelector('.toggle-icon-minus');
         if (targetContent && targetContent.classList.contains('hidden') && window.innerWidth < 1024) {
             iconPlus.classList.remove('hidden');
             iconMinus.classList.add('hidden');
         } else if (targetContent && !targetContent.classList.contains('hidden') && window.innerWidth < 1024) {
             iconPlus.classList.add('hidden');
             iconMinus.classList.remove('hidden');
         }
         // lg 이상에서는 버튼 자체가 숨겨지므로 아이콘 상태는 중요하지 않음 (기본 + 로 둬도 무방)
    });

});