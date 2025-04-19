import { useState, useEffect, useRef } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { toast } from 'react-hot-toast'
import apiService from '../services/api'

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
      
      // 모바일에서 자동으로 주간 뷰로 전환 (일간 뷰에서 변경)
      if (mobile && view === 'dayGridMonth') {
        handleViewChange('dayGridWeek')
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [view])

  // 레이아웃에서 새 예약 이벤트 감지
  useEffect(() => {
    const handleCreateReservation = (event) => {
      if (event.detail) {
        // 이벤트 상세 정보가 있으면 시작일만 설정하고 종료일은 하루 뒤로 설정
        const startDate = event.detail.start ? new Date(event.detail.start) : new Date()
        const endDate = addDays(startDate, 1) // 하루 단위 예약
        
        setSelectedDate({
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          allDay: true
        })
        setSelectedReservation(null)
        setModalOpen(true)
      }
    }
    
    window.addEventListener('create-reservation', handleCreateReservation)
    return () => window.removeEventListener('create-reservation', handleCreateReservation)
  }, [])

  // 초기 데이터 로딩
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // API를 통해 사용자 데이터 가져오기
        const usersResponse = await apiService.users.getAll()
        setUsers(usersResponse.data || [])
        
        // API를 통해 장비 데이터 가져오기
        const equipmentResponse = await apiService.equipment.getAll()
        setEquipment(equipmentResponse.data || [])
        
        // API를 통해 예약 데이터 가져오기
        const reservationsResponse = await apiService.reservations.getAll()
        setReservations(reservationsResponse.data || [])
        
      } catch (error) {
        console.error('데이터 로딩 에러:', error)
        toast.error('데이터를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // 필터링된 예약 가져오기
  const getFilteredReservations = async () => {
    try {
      setLoading(true)
      
      const filters = {}
      if (selectedUser) {
        filters.userId = selectedUser
      }
      
      if (selectedEquipment) {
        filters.equipmentId = selectedEquipment
      }
      
      // API 호출로 필터링된 예약 가져오기
      const response = await apiService.reservations.getFiltered(filters)
      return response.data || []
    } catch (error) {
      console.error('필터링 에러:', error)
      toast.error('예약 필터링에 실패했습니다.')
      return []
    } finally {
      setLoading(false)
    }
  }

  // 필터 변경 시 예약 목록 업데이트
  useEffect(() => {
    const updateReservations = async () => {
      const filtered = await getFilteredReservations()
      setReservations(filtered)
    }
    
    updateReservations()
  }, [selectedUser, selectedEquipment])

  // 예약 생성 함수 (일 단위 예약으로 변경)
  const createReservation = async (formData) => {
    try {
      setLoading(true)
      
      // API를 통해 예약 생성
      const response = await apiService.reservations.create({
        title: formData.title,
        user: formData.user,
        equipment: formData.equipment,
        startDate: formData.startDate,
        endDate: formData.endDate,
        notes: formData.notes
      })
      
      // 새 예약 추가 
      setReservations(prev => [...prev, response.data])
      
      toast.success('예약이 생성되었습니다.')
      return true
    } catch (error) {
      console.error('예약 생성 에러:', error)
      toast.error('예약 생성에 실패했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 예약 수정 함수 (일 단위 예약으로 변경)
  const updateReservation = async (id, formData) => {
    try {
      setLoading(true)
      
      // API를 통해 예약 수정
      const response = await apiService.reservations.update(id, {
        title: formData.title,
        user: formData.user,
        equipment: formData.equipment,
        startDate: formData.startDate,
        endDate: formData.endDate,
        notes: formData.notes
      })
      
      // 수정된 예약으로 상태 업데이트
      setReservations(prevReservations => 
        prevReservations.map(reservation => 
          (reservation._id === id || reservation.id === id) 
            ? response.data 
            : reservation
        )
      )
      
      toast.success('예약이 수정되었습니다.')
      return true
    } catch (error) {
      console.error('예약 수정 에러:', error)
      toast.error('예약 수정에 실패했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 예약 삭제 함수
  const deleteReservation = async (id) => {
    try {
      setLoading(true)
      
      // API를 통해 예약 삭제
      await apiService.reservations.delete(id)
      
      // 삭제된 예약 제외하고 상태 업데이트
      setReservations(prevReservations => 
        prevReservations.filter(reservation => reservation._id !== id && reservation.id !== id)
      )
      
      toast.success('예약이 삭제되었습니다.')
      return true
    } catch (error) {
      console.error('예약 삭제 에러:', error)
      toast.error('예약 삭제에 실패했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 날짜 선택 핸들러 (일 단위 예약으로 변경)
  const handleDateSelect = (selectInfo) => {
    // 선택한 날짜의 시작과 끝 (하루 단위)
    const startDate = format(new Date(selectInfo.startStr), 'yyyy-MM-dd')
    const endDate = format(new Date(selectInfo.endStr), 'yyyy-MM-dd')
    
    setSelectedDate({
      start: startDate,
      end: endDate,
      allDay: true
    });
    
    setSelectedReservation(null);
    setModalOpen(true);
  }

  // 예약 클릭 핸들러
  const handleEventClick = (clickInfo) => {
    const eventId = clickInfo.event.id;
    const reservation = reservations.find(res => 
      (res._id === eventId || res.id === eventId)
    );
    
    if (reservation) {
      setSelectedReservation(reservation);
      setSelectedDate(null);
      setModalOpen(true);
    } else {
      toast.error('예약 정보를 찾을 수 없습니다.');
    }
  }
  
  // 캘린더에 표시할 이벤트 데이터 (일 단위 예약으로 변경)
  const events = reservations.map(reservation => {
    const equipmentItem = equipment.find(e => 
      (e._id === reservation.equipment || e.id === reservation.equipment)
    ) || {};
    
    const userItem = users.find(u => 
      (u._id === reservation.user || u.id === reservation.user)
    ) || { name: '사용자' };
    
    return {
      id: reservation._id || reservation.id,
      title: `${reservation.title} - ${equipmentItem.name || '장비'} (${userItem.name})`,
      start: reservation.startDate,
      end: reservation.endDate,
      backgroundColor: equipmentItem.color || '#3788d8',
      borderColor: equipmentItem.color || '#3788d8',
      allDay: true,
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

  // 폼 제출 핸들러 (일 단위 예약으로 변경)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = {
        title: e.target.title.value,
        user: e.target.user.value,
        equipment: e.target.equipment.value,
        startDate: e.target.startDate.value,
        endDate: e.target.endDate.value,
        notes: e.target.description.value
      };
      
      let success = false;
      
      if (selectedReservation) {
        // 예약 수정
        const reservationId = selectedReservation._id || selectedReservation.id;
        success = await updateReservation(reservationId, formData);
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
      
      const reservationId = selectedReservation._id || selectedReservation.id;
      const success = await deleteReservation(reservationId);
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
              onClick={() => handleViewChange('dayGridWeek')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                view === 'dayGridWeek' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              주간
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
                <option key={userItem._id || userItem.id} value={userItem._id || userItem.id}>
                  {userItem.name}
                </option>
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
                <option key={item._id || item.id} value={item._id || item.id}>
                  {item.name}
                </option>
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
          initialView={isMobile ? "dayGridWeek" : "dayGridMonth"}
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
          expandRows={!isMobile}
          stickyHeaderDates={true}
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
                          <option key={item._id || item.id} value={item._id || item.id}>
                            {item.name}
                          </option>
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
                          <option key={item._id || item.id} value={item._id || item.id}>
                            {item.name}
                          </option>
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
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                          시작 날짜
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          id="startDate"
                          required
                          defaultValue={
                            selectedReservation?.startDate || 
                            (selectedDate ? selectedDate.start : '')
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                          종료 날짜
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          id="endDate"
                          required
                          defaultValue={
                            selectedReservation?.endDate || 
                            (selectedDate ? selectedDate.end : '')
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