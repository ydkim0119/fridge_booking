import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

function Profile() {
  const { user, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // 필드 변경시 해당 에러 삭제
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // 비밀번호 변경 여부 확인
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = '현재 비밀번호를 입력해주세요'
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = '새 비밀번호가 일치하지 않습니다'
      }
      
      if (formData.newPassword.length > 0 && formData.newPassword.length < 6) {
        newErrors.newPassword = '비밀번호는 최소 6자 이상이어야 합니다'
      }
    }
    
    if (!formData.email.includes('@')) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    // 비밀번호 변경 없을 경우 해당 필드 제외
    const updateData = {
      name: formData.name,
      email: formData.email,
      ...(formData.newPassword ? {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      } : {})
    }
    
    const success = await updateProfile(updateData)
    
    if (success) {
      // 비밀번호 필드 초기화
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    }
    
    setIsLoading(false)
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-blue-50">
        <h2 className="text-lg font-medium text-gray-900">
          내 프로필
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          개인 정보를 확인하고 변경할 수 있습니다.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">아이디</label>
          <div className="mt-1">
            <input
              id="username"
              type="text"
              className="bg-gray-100 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={user?.username || ''}
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">아이디는 변경할 수 없습니다.</p>
          </div>
        </div>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>
        </div>
        
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">비밀번호 변경</h3>
          <p className="mt-1 text-sm text-gray-500">비밀번호를 변경하려면 아래 필드를 입력하세요. 변경하지 않으려면 비워두세요.</p>
        </div>
        
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">현재 비밀번호</label>
          <div className="mt-1">
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.currentPassword}
              onChange={handleChange}
            />
            {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword}</p>}
          </div>
        </div>
        
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">새 비밀번호</label>
          <div className="mt-1">
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.newPassword}
              onChange={handleChange}
            />
            {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>}
          </div>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
          <div className="mt-1">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>
        </div>
        
        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {isLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Profile