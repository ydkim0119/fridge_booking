import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useAuth } from '../contexts/AuthContext'
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
  const { user } = useAuth()
  const calendarRef = useRef(null)

  // 초기 데이터 로딩
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 예약 데이터 가져오기
        const reservationsRes = await axios.get('/api/reservations')
        setReservations(reservationsRes.data)
        
        // 사용자 목록 가져오기
        const usersRes = await axios.get('/api/users')
        setUsers(usersRes.data)
        
        // 장비 목록 가져오기
        const equipmentRes = await axios.get('/api/equipment')
        setEquipment(equipmentRes.data)
      } catch (error) {
        console.error('데이터 로딩 에러:', error)
        toast.error('데이터를 불러오는데 실패했습니다.')
      }
    }
    
    fetchData()
  }, [])

  // 예약 생성 함수
  const createReservation = async (formData) => {
    try {
      const response = await axios.post('/api/reservations', formData)
      setReservations([...reservations, response.data])
      toast.success('예약이 생성되었습니다.')
      return true
    } catch (error) {
      console.error('예약 생성 에러:', error)
      toast.error(error.response?.data?.message || '예약 생성에 실패했습니다.')
      return false
    }
  }

  // 예약 수정 함수
  const updateReservation = async (id, formData) => {
    try {
      const response = await axios.put(`/api/reservations/${id}`, formData)
      setReservations(reservations.map(res => res.id === id ? response.data : res))
      toast.success('예약이 수정되었습니다.')
      return true
    } catch (error) {
      console.error('예약 수정 에러:', error)
      toast.error(error.response?.data?.message || '예약 수정에 실패했습니다.')
      return false
    }
  }

  // 예약 삭제 함수
  const deleteReservation = async (id) => {
    try {
      await axios.delete(`/api/reservations/${id}`)
      setReservations(reservations.filter(res => res.id !== id))
      toast.success('예약이 삭제되었습니다.')
      return true
    } catch (error) {
      console.error('예약 삭제 에러:', error)
      toast.error(error.response?.data?.message || '예약 삭제에 실패했습니다.')
      return false
    }
  }

  // 날짜 선택 핸들러
  const handleDateSelect = (selectInfo) => {
    setSelectedDate({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay
    })
    setSelectedReservation(null)
    setModalOpen(true)
  }

  // 예약 클릭 핸들러
  const handleEventClick = (clickInfo) => {
    const reservation = reservations.find(res => res.id === parseInt(clickInfo.event.id))
    setSelectedReservation(reservation)
    setSelectedDate(null)
    setModalOpen(true)
  }

  // 필터링된 예약 목록
  const filteredReservations = reservations.filter(res => {
    let match = true
    
    if (selectedUser && res.userId !== parseInt(selectedUser)) {
      match = false
    }
    
    if (selectedEquipment && res.equipmentId !== parseInt(selectedEquipment)) {
      match = false
    }
    
    return match
  })
  
  // 캘린더에 표시할 이벤트 데이터
  const events = filteredReservations.map(reservation => ({
    id: reservation.id.toString(),
    title: `${reservation.title} (${users.find(u => u.id === reservation.userId)?.name || '사용자'})`,
    start: reservation.startTime,
    end: reservation.endTime,
    backgroundColor: equipment.find(e => e.id === reservation.equipmentId)?.color || '#3788d8',
    borderColor: equipment.find(e => e.id === reservation.equipmentId)?.color || '#3788d8'
  }))

  // 뷰 변경 핸들러
  const handleViewChange = (view) => {
    setView(view)
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.changeView(view)
    }
  }

  // 폼 제출 핸들러
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    const formData = {
      title: e.target.title.value,
      description: e.target.description.value,
      equipmentId: parseInt(e.target.equipment.value),
      userId: user.id, // 현재 로그인한 사용자
      startTime: e.target.startTime.value,
      endTime: e.target.endTime.value,
    }
    
    let success = false
    
    if (selectedReservation) {
      // 예약 수정
      success = await updateReservation(selectedReservation.id, formData)
    } else {
      // 새 예약 생성
      success = await createReservation(formData)
    }
    
    if (success) {
      setModalOpen(false)
    }
  }

  // 예약 삭제 핸들러
  const handleDelete = async () => {
    if (!selectedReservation) return
    
    const confirmed = window.confirm('정말로 이 예약을 삭제하시겠습니까?')
    if (!confirmed) return
    
    const success = await deleteReservation(selectedReservation.id)
    if (success) {
      setModalOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">예약 캘린더</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 뷰 선택 */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewChange('dayGridMonth')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                view === 'dayGridMonth' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              월간
            </button>
            <button
              onClick={() => handleViewChange('timeGridWeek')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                view === 'timeGridWeek' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              주간
            </button>
            <button
              onClick={() => handleViewChange('timeGridDay')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                view === 'timeGridDay' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              일간
            </button>
          </div>
          
          {/* 필터 */}
          <div className="flex space-x-2">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">모든 사용자</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">모든 장비</option>
              {equipment.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* 캘린더 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={events}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          locale={koLocale}
          height="auto"
          select={handleDateSelect}
          eventClick={handleEventClick}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        설명
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        rows={3}
                        defaultValue={selectedReservation?.description || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="equipment" className="block text-sm font-medium text-gray-700">
                        장비
                      </label>
                      <select
                        name="equipment"
                        id="equipment"
                        required
                        defaultValue={selectedReservation?.equipmentId || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="" disabled>선택하세요</option>
                        {equipment.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
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
                            selectedReservation 
                              ? format(new Date(selectedReservation.startTime), "yyyy-MM-dd'T'HH:mm")
                              : selectedDate
                                ? format(new Date(selectedDate.start), "yyyy-MM-dd'T'HH:mm")
                                : ''
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                            selectedReservation 
                              ? format(new Date(selectedReservation.endTime), "yyyy-MM-dd'T'HH:mm")
                              : selectedDate
                                ? format(new Date(selectedDate.end), "yyyy-MM-dd'T'HH:mm")
                                : ''
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2"
                      >
                        {selectedReservation ? '저장' : '생성'}
                      </button>
                      
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
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
