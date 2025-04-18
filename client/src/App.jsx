import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CalendarView from './pages/CalendarView'
import StatsDashboard from './pages/StatsDashboard'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/dashboard" />
  }
  
  return children
}

function AdminRoute({ children }) {
  const { user, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>
  }
  
  // 관리자 여부 확인 제거 (누구나 관리자 기능 사용 가능)
  return children
}

function App() {
  return (
    <Routes>
      {/* 로그인, 회원가입 경로 제거하고 바로 대시보드로 리다이렉트 */}
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/register" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
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
