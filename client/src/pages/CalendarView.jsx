import { useState, useEffect, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { toast } from 'react-hot-toast'

export default function CalendarView() {
  const [reservations, setReservations] = useState([])
  const [users, setUsers] = useState([])
  const [equipment, setEquipment] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [view, setView] = useState('dayGridMonth')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const calendarRef = useRef(null)

  // 모바일 화면 감지
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // 모바일에서 자동으로 일간 뷰로 전환
      if (mobile && view === 'dayGridMonth') {
        handleViewChange('timeGridDay')
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [view])

  // 초기 데이터 로딩
  useEffect(() => {
    try {
      setLoading(true)
      // 더미 데이터로 초기화 (실제 환경에서는 API 호출로 변경)
      const usersData = [
        { id: 1, name: '김철수', email: 'user1@example.com', department: '화학과' },
        { id: 2, name: '박영희', email: 'user2@example.com', department: '생물학과' },
        { id: 3, name: '이지훈', email: 'user3@example.com', department: '물리학과' },
        { id: 4, name: '정민지', email: 'admin@example.com', department: '관리부서' },
      ]
      
      const equipmentData = [
        { id: 1, name: '냉동기 1', description: '일반용 냉동기', location: '1층 실험실', color: '#3B82F6' },
        { id: 2, name: '냉동기 2', description: '식품용 냉동기', location: '2층 실험실', color: '#10B981' },
        { id: 3, name: '냉동기 3', description: '시약용 냉동기', location: '2층 실험실', color: '#F59E0B' },
        { id: 4, name: '냉동기 4', description: '시료 보관용', location: '3층 실험실', color: '#EF4444' },
        { id: 5, name: '초저온냉동기', description: '-80℃ 보관용', location: '지하 1층', color: '#8B5CF6' },
      ]
      
      const reservationsData = [
        {
          id: 1,
          title: '시료 냉동 보관',
          user: 1,
          equipment: 1,
          startTime: '2025-04-19T09:00:00',
          endTime: '2025-04-19T11:00:00',
          notes: '분자생물학 실험 시료'
        },
        {
          id: 2,
          title: '저온 실험',
          user: 2,
          equipment: 3,
          startTime: '2025-04-19T13:00:00',
          endTime: '2025-04-19T15:00:00',
          notes: '효소 활성도 실험'
        },
        {
          id: 3,
          title: '초저온 보존',
          user: 3,
          equipment: 5,
          startTime: '2025-04-20T10:00:00',
          endTime: '2025-04-20T12:00:00',
          notes: '세포 보존'
        }
      ]
      
      setUsers(usersData)
      setEquipment(equipmentData)
      setReservations(reservationsData)
    } catch (error) {
      console.error('데이터 로딩 에러:', error)
      toast.error('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  // 필터링된 예약 가져오기
  const getFilteredReservations = () => {
    // 더미 데이터 (실제로는 API 호출로 대체될 것)
    const allReservations = [
      {
        id: 1,
        title: '시료 냉동 보관',
        user: 1,
        equipment: 1,
        startTime: '2025-04-19T09:00:00',
        endTime: '2025-04-19T11:00:00',
        notes: '분자생물학 실험 시료'
      },
      {
        id: 2,
        title: '저온 실험',
        user: 2,
        equipment: 3,
        startTime: '2025-04-19T13:00:00',
        endTime: '2025-04-19T15:00:00',
        notes: '효소 활성도 실험'
      },
      {
        id: 3,
        title: '초저온 보존',
        user: 3,
        equipment: 5,
        startTime: '2025-04-20T10:00:00',
        endTime: '2025-04-20T12:00:00',
        notes: '세포 보존'
      }
    ];
    
    return allReservations.filter(reservation => {
      let matchesUser = true;
      let matchesEquipment = true;
      
      if (selectedUser) {
        matchesUser = reservation.user === parseInt(selectedUser);
      }
      
      if (selectedEquipment) {
        matchesEquipment = reservation.equipment === parseInt(selectedEquipment);
      }
      
      return matchesUser && matchesEquipment;
    });
  }

  // 필터 변경 시 예약 목록 업데이트
  useEffect(() => {
    try {
      const filtered = getFilteredReservations();
      setReservations(filtered);
    } catch (error) {
      console.error('필터링 에러:', error);
      toast.error('예약 필터링에 실패했습니다.');
    }
  }, [selectedUser, selectedEquipment])

  // 예약 생성 함수
  const createReservation = async (formData) => {
    try {
      // API 없이 로컬 상태 업데이트
      const newReservation = {
        id: reservations.length > 0 ? Math.max(...reservations.map(r => r.id)) + 1 : 1,
        user: parseInt(formData.user),
        equipment: parseInt(formData.equipment),
        title: formData.title,
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes
      };
      
      setReservations(prev => [...prev, newReservation]);
      toast.success('예약이 생성되었습니다.');
      return true;
    } catch (error) {
      console.error('예약 생성 에러:', error);
      toast.error('예약 생성에 실패했습니다.');
      return false;
    }
  }

  // 예약 수정 함수
  const updateReservation = async (id, formData) => {
    try {
      // API 없이 로컬 상태 업데이트
      const updatedReservations = reservations.map(reservation => 
        reservation.id === id 
          ? {
              ...reservation,
              title: formData.title,
              user: parseInt(formData.user),
              equipment: parseInt(formData.equipment),
              startTime: formData.startTime,
              endTime: formData.endTime,
              notes: formData.notes
            }
          : reservation
      );
      
      setReservations(updatedReservations);
      toast.success('예약이 수정되었습니다.');
      return true;
    } catch (error) {
      console.error('예약 수정 에러:', error);
      toast.error('예약 수정에 실패했습니다.');
      return false;
    }
  }

  // 예약 삭제 함수
  const deleteReservation = async (id) => {
    try {
      // API 없이 로컬 상태 업데이트
      const filteredReservations = reservations.filter(reservation => reservation.id !== id);
      setReservations(filteredReservations);
      toast.success('예약이 삭제되었습니다.');
      return true;
    } catch (error) {
      console.error('예약 삭제 에러:', error);
      toast.error('예약 삭제에 실패했습니다.');
      return false;
    }
  }

  // 날짜 선택 핸들러
  const handleDateSelect = (selectInfo) => {
    const now = new Date();
    const startDate = new Date(selectInfo.start);
    const endDate = new Date(selectInfo.end);
    
    // 시간 설정 (기본값: 현재 시간 ~ 1시간 후)
    if (selectInfo.allDay) {
      startDate.setHours(now.getHours());
      startDate.setMinutes(0);
      endDate.setTime(startDate.getTime() + 60 * 60 * 1000); // 1시간 후
    }
    
    setSelectedDate({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      allDay: selectInfo.allDay
    });
    
    setSelectedReservation(null);
    setModalOpen(true);
  }

  // 예약 클릭 핸들러
  const handleEventClick = (clickInfo) => {
    const eventId = parseInt(clickInfo.event.id);
    const reservation = reservations.find(res => res.id === eventId);
    
    if (reservation) {
      setSelectedReservation(reservation);
      setSelectedDate(null);
      setModalOpen(true);
    } else {
      toast.error('예약 정보를 찾을 수 없습니다.');
    }
  }
  
  // 캘린더에 표시할 이벤트 데이터
  const events = reservations.map(reservation => {
    const equipmentItem = equipment.find(e => e.id === reservation.equipment) || {};
    const userItem = users.find(u => u.id === reservation.user) || { name: '사용자' };
    
    return {
      id: reservation.id.toString(),
      title: `${reservation.title} - ${equipmentItem.name || '장비'} (${userItem.name})`,
      start: reservation.startTime,
      end: reservation.endTime,
      backgroundColor: equipmentItem.color || '#3788d8',
      borderColor: equipmentItem.color || '#3788d8',
      extendedProps: {
        description: reservation.notes,
        equipment: reservation.equipment,
        user: reservation.user
      }
    };
  });

  // 뷰 변경 핸들러
  const handleViewChange = (viewType) => {
    try {
      setView(viewType);
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(viewType);
      }
    } catch (error) {
      console.error('뷰 변경 에러:', error);
      toast.error('캘린더 뷰 변경에 실패했습니다.');
    }
  }

  // 폼 제출 핸들러
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = {
        title: e.target.title.value,
        user: e.target.user.value,
        equipment: e.target.equipment.value,
        startTime: e.target.startTime.value,
        endTime: e.target.endTime.value,
        notes: e.target.description.value
      };
      
      let success = false;
      
      if (selectedReservation) {
        // 예약 수정
        success = await updateReservation(selectedReservation.id, formData);
      } else {
        // 새 예약 생성
        success = await createReservation(formData);
      }
      
      if (success) {
        setModalOpen(false);
      }
    } catch (error) {
      console.error('폼 제출 에러:', error);
      toast.error('예약 처리 중 오류가 발생했습니다.');
    }
  }

  // 예약 삭제 핸들러
  const handleDelete = async () => {
    if (!selectedReservation) return;
    
    try {
      const confirmed = window.confirm('정말로 이 예약을 삭제하시겠습니까?');
      if (!confirmed) return;
      
      const success = await deleteReservation(selectedReservation.id);
      if (success) {
        setModalOpen(false);
      }
    } catch (error) {
      console.error('삭제 에러:', error);
      toast.error('예약 삭제 중 오류가 발생했습니다.');
    }
  }

  // 필터 변경 핸들러
  const handleUserFilterChange = (e) => {
    setSelectedUser(e.target.value);
  }
  
  const handleEquipmentFilterChange = (e) => {
    setSelectedEquipment(e.target.value);
  }
  
  // 필터 초기화 핸들러
  const handleClearFilters = () => {
    setSelectedUser('');
    setSelectedEquipment('');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">예약 캘린더</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 뷰 선택 */}
          <div className="flex space-x-2 overflow-x-auto">
            {!isMobile && (
              <button
                type="button"
                onClick={() => handleViewChange('dayGridMonth')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  view === 'dayGridMonth' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                월간
              </button>
            )}
            <button
              type="button"
              onClick={() => handleViewChange('timeGridWeek')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                view === 'timeGridWeek' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              주간
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('timeGridDay')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                view === 'timeGridDay' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              일간
            </button>
          </div>
        </div>
      </div>
      
      {/* 필터 컨트롤 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <h2 className="text-lg font-medium">필터</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="userFilter" className="block text-sm font-medium text-gray-700 mb-1">
              사용자
            </label>
            <select
              id="userFilter"
              value={selectedUser}
              onChange={handleUserFilterChange}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            >
              <option value="">모든 사용자</option>
              {users.map(userItem => (
                <option key={userItem.id} value={userItem.id}>{userItem.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="equipmentFilter" className="block text-sm font-medium text-gray-700 mb-1">
              장비
            </label>
            <select
              id="equipmentFilter"
              value={selectedEquipment}
              onChange={handleEquipmentFilterChange}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            >
              <option value="">모든 장비</option>
              {equipment.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md w-full sm:w-auto"
            >
              필터 초기화
            </button>
          </div>
        </div>
      </div>
      
      {/* 로딩 인디케이터 */}
      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* 캘린더 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? "timeGridDay" : "dayGridMonth"}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={events}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={isMobile ? 2 : true}
          weekends={true}
          locale={koLocale}
          height="auto"
          select={handleDateSelect}
          eventClick={handleEventClick}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          expandRows={!isMobile}
          stickyHeaderDates={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
        />
      </div>
      
      {/* 예약 생성/수정 모달 */}
      <Transition.Root show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        {selectedReservation ? '예약 수정' : '새 예약 생성'}
                      </Dialog.Title>
                    </div>
                  </div>
                  
                  <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
                    {/* 제목 필드 */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        제목
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        defaultValue={selectedReservation?.title || ''}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        placeholder="예약 제목"
                      />
                    </div>
                    
                    {/* 사용자 선택 필드 추가 */}
                    <div>
                      <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                        사용자
                      </label>
                      <select
                        name="user"
                        id="user"
                        required
                        defaultValue={selectedReservation?.user || ''}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                      >
                        <option value="" disabled>선택하세요</option>
                        {users.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                  
                    <div>
                      <label htmlFor="equipment" className="block text-sm font-medium text-gray-700">
                        장비
                      </label>
                      <select
                        name="equipment"
                        id="equipment"
                        required
                        defaultValue={selectedReservation?.equipment || ''}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                      >
                        <option value="" disabled>선택하세요</option>
                        {equipment.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        설명
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        rows={3}
                        defaultValue={selectedReservation?.notes || ''}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                      />
                    </div>
                    
                    <div className={isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                      <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                          시작 시간
                        </label>
                        <input
                          type="datetime-local"
                          name="startTime"
                          id="startTime"
                          required
                          defaultValue={
                            selectedReservation && selectedReservation.startTime
                              ? format(new Date(selectedReservation.startTime), "yyyy-MM-dd'T'HH:mm")
                              : selectedDate
                                ? format(new Date(selectedDate.start), "yyyy-MM-dd'T'HH:mm")
                                : ''
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                          종료 시간
                        </label>
                        <input
                          type="datetime-local"
                          name="endTime"
                          id="endTime"
                          required
                          defaultValue={
                            selectedReservation && selectedReservation.endTime
                              ? format(new Date(selectedReservation.endTime), "yyyy-MM-dd'T'HH:mm")
                              : selectedDate
                                ? format(new Date(selectedDate.end), "yyyy-MM-dd'T'HH:mm")
                                : ''
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        />
                      </div>
                    </div>
                    
                    <div className={isMobile ? "flex flex-col space-y-3 mt-6" : "mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3"}>
                      <button
                        type="submit"
                        className={`inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${!isMobile && 'sm:col-start-2'}`}
                      >
                        {selectedReservation ? '저장' : '생성'}
                      </button>
                      
                      <button
                        type="button"
                        className={`mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${!isMobile && 'sm:col-start-1 sm:mt-0'}`}
                        onClick={() => setModalOpen(false)}
                      >
                        취소
                      </button>
                    </div>
                    
                    {selectedReservation && (
                      <div className="mt-3 flex justify-center">
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="text-sm text-red-600 hover:text-red-500"
                        >
                          예약 삭제
                        </button>
                      </div>
                    )}
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  )
}