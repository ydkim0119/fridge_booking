import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Tab } from '@headlessui/react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function AdminPanel() {
  const [users, setUsers] = useState([])
  const [equipment, setEquipment] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // 장비 생성을 위한 폼 데이터
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    description: '',
    isAvailable: true
  })
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // 사용자 데이터 가져오기
        const usersRes = await axios.get('/api/users')
        setUsers(usersRes.data)
        
        // 장비 데이터 가져오기
        const equipmentRes = await axios.get('/api/equipment')
        setEquipment(equipmentRes.data)
        
        setIsLoading(false)
      } catch (error) {
        console.error('데이터 가져오기 오류:', error)
        toast.error('데이터를 불러오는 중 오류가 발생했습니다.')
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // 장비 폼 변경 핸들러
  const handleEquipmentFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setEquipmentForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // 장비 생성 함수
  const handleCreateEquipment = async (e) => {
    e.preventDefault()
    
    try {
      await axios.post('/api/equipment', equipmentForm)
      toast.success('장비가 생성되었습니다.')
      
      // 폼 초기화
      setEquipmentForm({
        name: '',
        description: '',
        isAvailable: true
      })
      
      // 데이터 새로고침
      const equipmentRes = await axios.get('/api/equipment')
      setEquipment(equipmentRes.data)
    } catch (error) {
      console.error('장비 생성 오류:', error)
      toast.error(error.response?.data?.message || '장비 생성 중 오류가 발생했습니다.')
    }
  }

  // 장비 상태 변경 함수
  const handleToggleEquipmentStatus = async (id, isAvailable) => {
    try {
      await axios.put(`/api/equipment/${id}`, { isAvailable: !isAvailable })
      
      // 데이터 새로고침
      const equipmentRes = await axios.get('/api/equipment')
      setEquipment(equipmentRes.data)
      
      toast.success('장비 상태가 변경되었습니다.')
    } catch (error) {
      console.error('장비 상태 변경 오류:', error)
      toast.error('장비 상태 변경 중 오류가 발생했습니다.')
    }
  }

  // 장비 삭제 함수
  const handleDeleteEquipment = async (id) => {
    if (!window.confirm('정말 이 장비를 삭제하시겠습니까? 관련 예약도 모두 삭제됩니다.')) return
    
    try {
      await axios.delete(`/api/equipment/${id}`)
      
      // 데이터 새로고침
      const equipmentRes = await axios.get('/api/equipment')
      setEquipment(equipmentRes.data)
      
      toast.success('장비가 삭제되었습니다.')
    } catch (error) {
      console.error('장비 삭제 오류:', error)
      toast.error('장비 삭제 중 오류가 발생했습니다.')
    }
  }

  // 사용자 역할 변경 함수 (admin/user)
  const handleToggleUserRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    
    try {
      await axios.put(`/api/users/${id}/role`, { role: newRole })
      
      // 데이터 새로고침
      const usersRes = await axios.get('/api/users')
      setUsers(usersRes.data)
      
      toast.success(`사용자 권한이 ${newRole === 'admin' ? '관리자로' : '일반 사용자로'} 변경되었습니다.`)
    } catch (error) {
      console.error('사용자 역할 변경 오류:', error)
      toast.error('사용자 역할 변경 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-blue-50">
          <h2 className="text-lg font-medium text-gray-900">
            관리자 패널
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            장비와 사용자를 관리합니다.
          </p>
        </div>
        
        <div className="border-t border-gray-200">
          <Tab.Group>
            <Tab.List className="flex border-b border-gray-200">
              <Tab
                className={({ selected }) =>
                  classNames(
                    'py-4 px-6 text-sm font-medium',
                    selected
                      ? 'border-blue-500 border-b-2 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )
                }
              >
                장비 관리
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'py-4 px-6 text-sm font-medium',
                    selected
                      ? 'border-blue-500 border-b-2 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )
                }
              >
                사용자 관리
              </Tab>
            </Tab.List>
            <Tab.Panels>
              {/* 장비 관리 패널 */}
              <Tab.Panel className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">새 장비 등록</h3>
                    <form onSubmit={handleCreateEquipment} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">장비명</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={equipmentForm.name}
                          onChange={handleEquipmentFormChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">장비 설명</label>
                        <textarea
                          id="description"
                          name="description"
                          rows="3"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={equipmentForm.description}
                          onChange={handleEquipmentFormChange}
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="isAvailable"
                          name="isAvailable"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={equipmentForm.isAvailable}
                          onChange={handleEquipmentFormChange}
                        />
                        <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700">사용 가능 상태</label>
                      </div>
                      
                      <div>
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          장비 등록
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">장비 목록</h3>
                    {isLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-gray-500">로딩 중...</p>
                      </div>
                    ) : equipment.length === 0 ? (
                      <div className="bg-gray-50 py-8 px-4 text-center rounded-lg">
                        <p className="text-gray-500">등록된 장비가 없습니다.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">장비명</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {equipment.map((item) => (
                              <tr key={item._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {item.isAvailable ? '사용 가능' : '사용 불가'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => handleToggleEquipmentStatus(item._id, item.isAvailable)}
                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                  >
                                    {item.isAvailable ? '비활성화' : '활성화'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEquipment(item._id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    삭제
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </Tab.Panel>
              
              {/* 사용자 관리 패널 */}
              <Tab.Panel className="p-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">사용자 목록</h3>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-gray-500">로딩 중...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="bg-gray-50 py-8 px-4 text-center rounded-lg">
                      <p className="text-gray-500">등록된 사용자가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아이디</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">권한</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((user) => (
                            <tr key={user._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {user.role === 'admin' ? '관리자' : '일반 사용자'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleToggleUserRole(user._id, user.role)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  {user.role === 'admin' ? '일반 사용자로 변경' : '관리자로 변경'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel