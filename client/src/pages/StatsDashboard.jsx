import { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useAuth } from '../contexts/AuthContext'

function StatsDashboard() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [equipmentStats, setEquipmentStats] = useState([])
  const [timeStats, setTimeStats] = useState([])
  const [statusStats, setStatusStats] = useState([])
  const [userStats, setUserStats] = useState([])
  const [timeRange, setTimeRange] = useState('month') // 'week', 'month', 'year'
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        
        // 장비별 통계
        const equipmentRes = await axios.get(`/api/stats/equipment?timeRange=${timeRange}`)
        setEquipmentStats(equipmentRes.data)
        
        // 시간별 통계
        const timeRes = await axios.get(`/api/stats/time?timeRange=${timeRange}`)
        setTimeStats(timeRes.data)
        
        // 상태별 통계
        const statusRes = await axios.get(`/api/stats/status?timeRange=${timeRange}`)
        setStatusStats(statusRes.data)
        
        // 사용자별 통계 (관리자만)
        if (user?.role === 'admin') {
          const userRes = await axios.get(`/api/stats/users?timeRange=${timeRange}`)
          setUserStats(userRes.data)
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('통계 데이터 로딩 오류:', error)
        setIsLoading(false)
      }
    }
    
    fetchStats()
  }, [timeRange, user])
  
  // 상태별 색상 함수
  const getStatusColor = (status) => {
    switch(status) {
      case '승인됨': return '#4CAF50'
      case '승인 대기중': return '#FFC107'
      case '취소됨': return '#9E9E9E'
      case '거절됨': return '#F44336'
      default: return '#2196F3'
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
          <h1 className="text-xl font-bold text-gray-900">통계 대시보드</h1>
          
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${timeRange === 'week' ? 'bg-blue-50 text-blue-700' : ''} rounded-l-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500`}
            >
              주간
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border-t border-b border-gray-300 ${timeRange === 'month' ? 'bg-blue-50 text-blue-700' : ''} hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500`}
            >
              월간
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${timeRange === 'year' ? 'bg-blue-50 text-blue-700' : ''} rounded-r-md hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-blue-500`}
            >
              연간
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 장비별 사용 통계 */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">장비별 예약 통계</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={equipmentStats}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}건`, '예약 수']} />
                    <Legend />
                    <Bar dataKey="count" name="예약 수" fill="#8884d8" />
                    <Bar dataKey="hours" name="총 사용 시간(시간)" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* 시간별 예약 통계 */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">시간별 예약 통계</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeStats}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}건`, '예약 수']} />
                    <Legend />
                    <Bar dataKey="count" name="예약 수" fill="#2196F3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* 예약 상태별 통계 */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">예약 상태별 통계</h2>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusStats}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                    >
                      {statusStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${value}건`, props.payload.status]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* 관리자만 볼 수 있는 사용자별 통계 */}
            {user?.role === 'admin' && userStats.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">사용자별 예약 통계 (상위 10명)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={userStats}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}건`, '예약 수']} />
                      <Legend />
                      <Bar dataKey="count" name="예약 수" fill="#FF5722" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatsDashboard