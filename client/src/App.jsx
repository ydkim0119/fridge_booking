import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Layout from './components/Layout'
import CalendarView from './pages/CalendarView'
import { AuthProvider } from './contexts/AuthContext'

// 레이지 로딩으로 필요한 컴포넌트만 로드
const Dashboard = lazy(() => import('./pages/Dashboard'))
const StatsDashboard = lazy(() => import('./pages/StatsDashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const NotFound = lazy(() => import('./pages/NotFound'))

// 로딩 상태를 표시하는 컴포넌트
const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 모든 인증 페이지는 메인으로 리디렉션 */}
        <Route path="/login" element={<Navigate to="/calendar" replace />} />
        <Route path="/register" element={<Navigate to="/calendar" replace />} />
        
        {/* 메인 레이아웃 - 보호 없이 바로 접근 가능 */}
        <Route path="/" element={<Layout />}>
          {/* 기본 경로를 캘린더로 설정 - 캘린더는 메인이므로 레이지 로딩 안함 */}
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="calendar" element={<CalendarView />} />
          
          {/* 기타 경로는 레이지 로딩 적용 */}
          <Route 
            path="dashboard" 
            element={
              <Suspense fallback={<Loading />}>
                <Dashboard />
              </Suspense>
            } 
          />
          <Route 
            path="stats" 
            element={
              <Suspense fallback={<Loading />}>
                <StatsDashboard />
              </Suspense>
            } 
          />
          <Route 
            path="profile" 
            element={
              <Suspense fallback={<Loading />}>
                <Profile />
              </Suspense>
            } 
          />
          {/* 모든 사용자가 관리 기능 접근 가능 */}
          <Route 
            path="admin" 
            element={
              <Suspense fallback={<Loading />}>
                <AdminPanel />
              </Suspense>
            } 
          />
        </Route>
        
        <Route 
          path="*" 
          element={
            <Suspense fallback={<Loading />}>
              <NotFound />
            </Suspense>
          } 
        />
      </Routes>
    </AuthProvider>
  )
}

export default App