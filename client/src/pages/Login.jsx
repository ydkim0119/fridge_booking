import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()

  // 페이지 로드 시 자동으로 대시보드로 리디렉션
  useEffect(() => {
    toast.success('자동 로그인 되었습니다')
    navigate('/dashboard')
  }, [navigate])

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          SQuIRL 냉동기 예약 시스템
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          자동으로 로그인 중입니다...
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  )
}
