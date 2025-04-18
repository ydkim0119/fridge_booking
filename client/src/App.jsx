import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CalendarView from './pages/CalendarView'
import StatsDashboard from './pages/StatsDashboard'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      {/* 모든 로그인/인증 경로 제거 및 메인으로 리다이렉트 */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      
      {/* 메인 레이아웃 - 보호 없이 바로 접근 가능 */}
      <Route path="/" element={<Layout />}>
        {/* 기본 경로를 캘린더로 설정 */}
        <Route index element={<CalendarView />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="stats" element={<StatsDashboard />} />
        <Route path="profile" element={<Profile />} />
        {/* 모든 사용자가 관리 기능 접근 가능 */}
        <Route path="admin" element={<AdminPanel />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
