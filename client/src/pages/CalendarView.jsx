import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

function CalendarView() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [equipment, setEquipment] = useState([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('all')
  const [selectedUserId, setSelectedUserId] = useState('all')
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // 예약 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'view'
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [reservationForm, setReservationForm] = useState({
    equipmentId: '',
    startTime: '',
    endTime: '',
    purpose: ''
  })

  const calendarRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // 예약 데이터 가져오기
        const reservationsRes = await axios.get('/api/reservations')
        setReservations(reservationsRes.data)
        
        // 장비 데이터 가져오기
        const equipmentRes = await axios.get('/api/equipment')
        setEquipment(equipmentRes.data)
        
        // 사용자 데이터 가져오기 (관리자일 경우에만)
        if (user?.role === 'admin') {
          const usersRes = await axios.get('/api/users')
          setUsers(usersRes.data)
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('데이터 가져오기 오류:', error)
        setIsLoading(false)
        toast.error('데이터를 불러오는 중 오류가 발생했습니다.')
      }
    }
    
    fetchData()
  }, [user])

  // 예약 이벤트 필터링
  const filteredReservations = reservations.filter(reservation => {
    if (selectedEquipmentId !== 'all' && reservation.equipmentId !== selectedEquipmentId) {
      return false
    }
    if (selectedUserId !== 'all' && reservation.userId !== selectedUserId) {
      return false
    }
    return true
  })

  // FullCalendar에 표시할 이벤트 형식으로 변환
  const calendarEvents = filteredReservations.map(reservation => {
    // 장비 정보 찾기
    const equipmentItem = equipment.find(e => e._id === reservation.equipmentId)
    const equipmentName = equipmentItem ? equipmentItem.name : '장비 없음'
    
    return {
      id: reservation._id,
      title: `${equipmentName} - ${reservation.purpose}`,
      start: reservation.startTime,
      end: reservation.endTime,
      extendedProps: {
        ...reservation
      },
      backgroundColor: reservation.status === 'approved' ? '#4CAF50' :
                      reservation.status === 'pending' ? '#FFC107' : '#F44336',
      borderColor: reservation.status === 'approved' ? '#2E7D32' :
                   reservation.status === 'pending' ? '#FF8F00' : '#C62828'
    }
  })

  // 날짜 선택 시 예약 생성 모달 열기
  const handleDateSelect = (selectInfo) => {
    // 과거 날짜 선택 방지
    const now = new Date()
    if (selectInfo.start < now) {
      toast.error('과거 날짜는 선택할 수 없습니다.')
      return
    }
    
    setModalMode('create')
    setSelectedDate(selectInfo)
    
    // 기본 장비 선택
    if (equipment.length > 0) {
      setReservationForm({
        equipmentId: equipment[0]._id,
        startTime: selectInfo.startStr,
        endTime: selectInfo.endStr,
        purpose: ''
      })
    }
    
    setIsModalOpen(true)
  }

  // 이벤트 클릭 시 예약 상세 모달 열기
  const handleEventClick = (clickInfo) => {
    const reservation = clickInfo.event.extendedProps
    setSelectedReservation(reservation)
    setModalMode('view')
    setIsModalOpen(true)
  }

  // 예약 폼 변경 핸들러
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setReservationForm(prev => ({ ...prev, [name]: value }))
  }

  // 예약 생성 요청
  const handleCreateReservation = async () => {
    try {
      await axios.post('/api/reservations', reservationForm)
      toast.success('예약이 생성되었습니다.')
      
      // 데이터 새로고침
      const reservationsRes = await axios.get('/api/reservations')
      setReservations(reservationsRes.data)
      
      setIsModalOpen(false)
    } catch (error) {
      console.error('예약 생성 오류:', error)
      toast.error(error.response?.data?.message || '예약 생성 중 오류가 발생했습니다.')
    }
  }

  // 예약 삭제 요청
  const handleDeleteReservation = async () => {
    if (!selectedReservation) return
    
    try {
      await axios.delete(`/api/reservations/${selectedReservation._id}`)
      toast.success('예약이 삭제되었습니다.')
      
      // 데이터 새로고침
      const reservationsRes = await axios.get('/api/reservations')
      setReservations(reservationsRes.data)
      
      setIsModalOpen(false)
    } catch (error) {
      console.error('예약 삭제 오류:', error)
      toast.error(error.response?.data?.message || '예약 삭제 중 오류가 발생했습니다.')
    }
  }

  // 월/주 뷰 전환 핸들러
  const handleViewChange = (viewType) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.changeView(viewType)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
          <h1 className="text-xl font-bold text-gray-900">예약 캘린더</h1>
          
          <div className="flex flex-wrap gap-2">
            {/* 뷰 전환 버튼 */}
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => handleViewChange('dayGridMonth')}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500"
              >
                월간
              </button>
              <button
                type="button"
                onClick={() => handleViewChange('timeGridWeek')}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500"
              >
                주간
              </button>
            </div>
            
            {/* 장비 필터 */}
            <select
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
            >
              <option value="all">모든 장비</option>
              {equipment.map(item => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
            
            {/* 관리자일 경우 사용자 필터 표시 */}
            {user?.role === 'admin' && (
              <select
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="all">모든 사용자</option>
                {users.map(item => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : (
          <div className="bg-white p-1 rounded-lg">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: ''
              }}
              height="auto"
              events={calendarEvents}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              locale="ko"
              selectable={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              slotMinTime="08:00:00"
              slotMaxTime="21:00:00"
              allDaySlot={false}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
              }}
            />
          </div>
        )}
      </div>

      {/* 예약 모달 */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {modalMode === 'create' ? '새 예약 생성' : '예약 상세 정보'}
                  </Dialog.Title>

                  <div className="mt-4">
                    {modalMode === 'create' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">장비</label>
                          <select
                            name="equipmentId"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            value={reservationForm.equipmentId}
                            onChange={handleFormChange}
                            required
                          >
                            {equipment.map(item => (
                              <option key={item._id} value={item._id}>{item.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">시작 시간</label>
                          <input
                            type="datetime-local"
                            name="startTime"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={reservationForm.startTime.substring(0, 16)}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">종료 시간</label>
                          <input
                            type="datetime-local"
                            name="endTime"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={reservationForm.endTime.substring(0, 16)}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">사용 목적</label>
                          <textarea
                            name="purpose"
                            rows="3"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="사용 목적을 입력하세요"
                            value={reservationForm.purpose}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedReservation && (
                          <>
                            <div>
                              <h4 className="font-medium text-gray-500">장비</h4>
                              <p>
                                {equipment.find(e => e._id === selectedReservation.equipmentId)?.name || '삭제된 장비'}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-500">예약 시간</h4>
                              <p>
                                {new Date(selectedReservation.startTime).toLocaleString()} ~ {new Date(selectedReservation.endTime).toLocaleString()}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-500">사용 목적</h4>
                              <p>{selectedReservation.purpose}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-500">상태</h4>
                              <span className={
                                `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  selectedReservation.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  selectedReservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`
                              }>
                                {selectedReservation.status === 'approved' ? '승인됨' :
                                 selectedReservation.status === 'pending' ? '승인 대기중' :
                                 '거절됨'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => setIsModalOpen(false)}
                    >
                      {modalMode === 'create' ? '취소' : '닫기'}
                    </button>
                    
                    {modalMode === 'create' ? (
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={handleCreateReservation}
                      >
                        예약 생성
                      </button>
                    ) : (
                      // 자신의 예약이거나 관리자일 경우에만 삭제 버튼 표시
                      (user?._id === selectedReservation?.userId || user?.role === 'admin') && (
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          onClick={handleDeleteReservation}
                        >
                          예약 삭제
                        </button>
                      )
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

export default CalendarView
