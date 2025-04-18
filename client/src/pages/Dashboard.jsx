import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarDaysIcon, ClockIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const [upcomingReservations, setUpcomingReservations] = useState([])
  const [myReservations, setMyReservations] = useState([])
  const [equipment, setEquipment] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // 예약 데이터 가져오기
        const reservationsRes = await axios.get('/api/reservations')
        
        // 장비 목록 가져오기
        const equipmentRes = await axios.get('/api/equipment')
        setEquipment(equipmentRes.data)
        
        // 사용자 목록 가져오기
        const usersRes = await axios.get('/api/users')
        setUsers(usersRes.data)
        
        // 현재 시간 이후의 예약들 필터링
        const now = new Date()
        const upcoming = reservationsRes.data
          .filter(res => new Date(res.startTime) > now)
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
          .slice(0, 5)
        
        setUpcomingReservations(upcoming)
        
        // 내 예약들 필터링
        const my = reservationsRes.data
          .filter(res => res.userId === user.id)
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        
        setMyReservations(my)
      } catch (error) {
        console.error('데이터 로딩 에러:', error)
        toast.error('데이터를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user.id])

  // 예약 취소 함수
  const handleCancelReservation = async (id) => {
    try {
      const confirmed = window.confirm('정말로 이 예약을 취소하시겠습니까?')
      if (!confirmed) return
      
      await axios.delete(`/api/reservations/${id}`)
      
      // 예약 목록 업데이트
      setUpcomingReservations(upcomingReservations.filter(res => res.id !== id))
      setMyReservations(myReservations.filter(res => res.id !== id))
      
      toast.success('예약이 취소되었습니다.')
    } catch (error) {
      console.error('예약 취소 에러:', error)
      toast.error('예약 취소에 실패했습니다.')
    }
  }

  // 장비 이름 가져오기
  const getEquipmentName = (equipmentId) => {
    const item = equipment.find(e => e.id === equipmentId)
    return item ? item.name : '알 수 없음'
  }

  // 사용자 이름 가져오기
  const getUserName = (userId) => {
    const userItem = users.find(u => u.id === userId)
    return userItem ? userItem.name : '알 수 없음'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">대시보드</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>로딩 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 예정된 예약 */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-blue-50">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-500" />
                예정된 예약
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                다가오는 5개의 예약입니다.
              </p>
            </div>
            <div className="border-t border-gray-200">
              {upcomingReservations.length === 0 ? (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  예정된 예약이 없습니다.
                </div>
              ) : (
                <ul role="list" className="divide-y divide-gray-200">
                  {upcomingReservations.map((reservation) => (
                    <li key={reservation.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {reservation.title}
                          </p>
                          <p className="mt-1 flex text-sm text-gray-500">
                            <span className="truncate">{getEquipmentName(reservation.equipmentId)}</span>
                            <span className="ml-1 text-gray-400">|</span>
                            <span className="ml-1 truncate">{getUserName(reservation.userId)}</span>
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex flex-col items-end text-sm">
                          <p className="text-gray-500">
                            {format(new Date(reservation.startTime), 'M월 d일 (E) HH:mm', { locale: ko })}
                          </p>
                          <p className="mt-1 text-gray-500">
                            {format(new Date(reservation.endTime), 'HH:mm', { locale: ko })}까지
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="px-4 py-3 bg-gray-50 text-right">
                <Link
                  to="/calendar"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  모든 예약 보기
                </Link>
              </div>
            </div>
          </div>
          
          {/* 내 예약 */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-green-50">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <UserCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                내 예약
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                내가 신청한 예약입니다.
              </p>
            </div>
            <div className="border-t border-gray-200">
              {myReservations.length === 0 ? (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  예약한 내역이 없습니다.
                </div>
              ) : (
                <ul role="list" className="divide-y divide-gray-200">
                  {myReservations.map((reservation) => (
                    <li key={reservation.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-green-600 truncate">
                            {reservation.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {getEquipmentName(reservation.equipmentId)}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {format(new Date(reservation.startTime), 'M월 d일 (E) HH:mm', { locale: ko })}
                          </p>
                          <button
                            onClick={() => handleCancelReservation(reservation.id)}
                            className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 hover:bg-red-200"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="px-4 py-3 bg-gray-50 text-right">
                <Link
                  to="/calendar"
                  className="text-sm font-medium text-green-600 hover:text-green-500"
                >
                  새 예약 등록하기
                </Link>
              </div>
            </div>
          </div>
          
          {/* 빠른 액세스 버튼 */}
          <div className="md:col-span-2 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Link
                to="/calendar"
                className="block bg-blue-50 hover:bg-blue-100 p-6 rounded-lg text-center"
              >
                <CalendarDaysIcon className="h-8 w-8 text-blue-600 mx-auto" />
                <span className="mt-2 block text-sm font-medium text-gray-900">캘린더 보기</span>
              </Link>
              
              <Link
                to="/stats"
                className="block bg-purple-50 hover:bg-purple-100 p-6 rounded-lg text-center"
              >
                <ClockIcon className="h-8 w-8 text-purple-600 mx-auto" />
                <span className="mt-2 block text-sm font-medium text-gray-900">사용 통계</span>
              </Link>
              
              <Link
                to="/profile"
                className="block bg-green-50 hover:bg-green-100 p-6 rounded-lg text-center"
              >
                <UserCircleIcon className="h-8 w-8 text-green-600 mx-auto" />
                <span className="mt-2 block text-sm font-medium text-gray-900">내 프로필</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
