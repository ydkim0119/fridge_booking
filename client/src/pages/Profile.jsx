import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user, logout } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [passwordMode, setPasswordMode] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
      }))
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (passwordMode) {
        // 비밀번호 변경 로직
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('새 비밀번호가 일치하지 않습니다.')
          setLoading(false)
          return
        }

        const passwordData = {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }

        await axios.put('/api/users/me/password', passwordData)
        toast.success('비밀번호가 변경되었습니다.')
        setPasswordMode(false)
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }))
      } else {
        // 프로필 정보 변경 로직
        const profileData = {
          name: formData.name,
          department: formData.department,
        }

        await axios.put('/api/users/me', profileData)
        toast.success('프로필이 업데이트되었습니다.')
      }
    } catch (error) {
      console.error('프로필 업데이트 에러:', error)
      toast.error(error.response?.data?.message || '프로필 업데이트에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">내 프로필</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-4 mb-6">
            <UserCircleIcon className="h-20 w-20 text-gray-400" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-medium text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-sm text-gray-500">{user?.department}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {passwordMode ? '비밀번호 변경' : '프로필 정보 수정'}
              </h3>
              <button
                type="button"
                onClick={() => setPasswordMode(!passwordMode)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {passwordMode ? '프로필 정보 수정' : '비밀번호 변경'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {passwordMode ? (
                <>
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      현재 비밀번호
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      새 비밀번호
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      새 비밀번호 확인
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      이름
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      이메일
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">이메일은 변경할 수 없습니다.</p>
                  </div>
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                      부서/학과
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  로그아웃
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {loading ? '처리 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
