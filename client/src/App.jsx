import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
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
    return <Navigate to="/login" />
  }
  
  return children
}

function AdminRoute({ children }) {
  const { user, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
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
        <Route path="admin" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
