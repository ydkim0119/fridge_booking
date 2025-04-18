import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts'

export default function StatsDashboard() {
  const [stats, setStats] = useState({
    equipmentUsage: [],
    userUsage: [],
    timeDistribution: [],
    weekdayUsage: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('month') // 'week', 'month', 'year'

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']
  
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/stats?timeRange=${timeRange}`)
        setStats(response.data)
      } catch (error) {
        console.error('통계 데이터 로딩 에러:', error)
        toast.error('통계 데이터를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [timeRange])

  // 테스트용 더미 데이터
  useEffect(() => {
    // 실제 API가 구현되기 전에 더미 데이터로 시각화
    const equipmentUsageData = [
      { name: '냉장고 1', usage: 24 },
      { name: '냉장고 2', usage: 18 },
      { name: '냉장고 3', usage: 32 },
      { name: '냉장고 4', usage: 15 },
      { name: '초저온냉장고', usage: 9 },
    ]
    
    const userUsageData = [
      { name: '김철수', usage: 12 },
      { name: '박영희', usage: 8 },
      { name: '이지훈', usage: 15 },
      { name: '정민지', usage: 7 },
      { name: '기타', usage: 10 },
    ]
    
    const timeDistributionData = [
      { name: '8-10시', usage: 15 },
      { name: '10-12시', usage: 22 },
      { name: '12-14시', usage: 18 },
      { name: '14-16시', usage: 25 },
      { name: '16-18시', usage: 20 },
      { name: '18-20시', usage: 12 },
    ]
    
    const weekdayUsageData = [
      { name: '일', usage: 8 },
      { name: '월', usage: 22 },
      { name: '화', usage: 25 },
      { name: '수', usage: 27 },
      { name: '목', usage: 20 },
      { name: '금', usage: 18 },
      { name: '토', usage: 10 },
    ]
    
    setStats({
      equipmentUsage: equipmentUsageData,
      userUsage: userUsageData,
      timeDistribution: timeDistributionData,
      weekdayUsage: weekdayUsageData
    })
    setLoading(false)
  }, [timeRange])

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>통계 데이터 로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">장비 사용 통계</h1>
        
        <div>
          <select
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="week">최근 1주</option>
            <option value="month">최근 1개월</option>
            <option value="year">최근 1년</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 장비별 사용량 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">장비별 사용량</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.equipmentUsage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" name="사용 횟수" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 사용자별 사용량 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">사용자별 사용량</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.userUsage}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="usage"
                >
                  {stats.userUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 시간대별 사용량 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">시간대별 사용량</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" name="사용 횟수" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 요일별 사용량 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">요일별 사용량</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weekdayUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" name="사용 횟수" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-600">
        <p>
          * 이 통계는 시스템에 기록된 예약 데이터를 기반으로 생성되었습니다.
        </p>
        <p>
          * 실제 사용 시간과 예약 시간이 다를 수 있습니다.
        </p>
      </div>
    </div>
  )
}
