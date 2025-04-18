import { useState, useEffect, Fragment } from 'react'
import { toast } from 'react-hot-toast'
import { Dialog, Transition } from '@headlessui/react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function AdminPanel() {
  // 탭 관련 상태
  const [activeTab, setActiveTab] = useState('users')
  
  // 사용자 관련 상태
  const [users, setUsers] = useState([])
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    department: '',
  })
  
  // 장비 관련 상태
  const [equipment, setEquipment] = useState([])
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [equipmentFormData, setEquipmentFormData] = useState({
    name: '',
    description: '',
    location: '',
    color: '#3B82F6',
  })
  
  // 로딩 상태
  const [loading, setLoading] = useState(true)

  // 더미 데이터 로드
  useEffect(() => {
    // 더미 데이터로 초기화
    const usersData = [
      { id: 1, name: '김철수', email: 'user1@example.com', department: '화학과' },
      { id: 2, name: '박영희', email: 'user2@example.com', department: '생물학과' },
      { id: 3, name: '이지훈', email: 'user3@example.com', department: '물리학과' },
      { id: 4, name: '정민지', email: 'admin@example.com', department: '관리부서' },
    ]
    
    const equipmentData = [
      { id: 1, name: '냉동기 1', description: '일반용 냉동기', location: '1층 실험실', color: '#3B82F6' },
      { id: 2, name: '냉동기 2', description: '식품용 냉동기', location: '2층 실험실', color: '#10B981' },
      { id: 3, name: '냉동기 3', description: '시약용 냉동기', location: '2층 실험실', color: '#F59E0B' },
      { id: 4, name: '냉동기 4', description: '시료 보관용', location: '3층 실험실', color: '#EF4444' },
      { id: 5, name: '초저온냉동기', description: '-80℃ 보관용', location: '지하 1층', color: '#8B5CF6' },
    ]
    
    setUsers(usersData)
    setEquipment(equipmentData)
    setLoading(false)
  }, [])

  // 사용자 관련 함수
  const handleUserFormChange = (e) => {
    const { name, value } = e.target
    setUserFormData(prev => ({ ...prev, [name]: value }))
  }

  const openUserModal = (user = null) => {
    if (user) {
      setSelectedUser(user)
      setUserFormData({
        name: user.name,
        email: user.email,
        department: user.department,
      })
    } else {
      setSelectedUser(null)
      setUserFormData({
        name: '',
        email: '',
        department: '',
      })
    }
    setUserModalOpen(true)
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedUser) {
      // 사용자 수정
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...userFormData } 
          : user
      )
      setUsers(updatedUsers)
      toast.success('사용자 정보가 수정되었습니다.')
    } else {
      // 새 사용자 추가
      const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        ...userFormData
      }
      setUsers([...users, newUser])
      toast.success('새 사용자가 생성되었습니다.')
    }
    
    setUserModalOpen(false)
  }

  const handleDeleteUser = async (id) => {
    const confirmed = window.confirm('정말로 이 사용자를 삭제하시겠습니까?')
    if (confirmed) {
      setUsers(users.filter(user => user.id !== id))
      toast.success('사용자가 삭제되었습니다.')
    }
  }

  // 장비 관련 함수
  const handleEquipmentFormChange = (e) => {
    const { name, value } = e.target
    setEquipmentFormData(prev => ({ ...prev, [name]: value }))
  }

  const openEquipmentModal = (equip = null) => {
    if (equip) {
      setSelectedEquipment(equip)
      setEquipmentFormData({
        name: equip.name,
        description: equip.description,
        location: equip.location,
        color: equip.color,
      })
    } else {
      setSelectedEquipment(null)
      setEquipmentFormData({
        name: '',
        description: '',
        location: '',
        color: '#3B82F6',
      })
    }
    setEquipmentModalOpen(true)
  }

  const handleEquipmentSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedEquipment) {
      // 장비 수정
      const updatedEquipment = equipment.map(eq => 
        eq.id === selectedEquipment.id 
          ? { ...eq, ...equipmentFormData } 
          : eq
      )
      setEquipment(updatedEquipment)
      toast.success('장비 정보가 수정되었습니다.')
    } else {
      // 새 장비 추가
      const newEquipment = {
        id: equipment.length > 0 ? Math.max(...equipment.map(e => e.id)) + 1 : 1,
        ...equipmentFormData
      }
      setEquipment([...equipment, newEquipment])
      toast.success('새 장비가 생성되었습니다.')
    }
    
    setEquipmentModalOpen(false)
  }

  const handleDeleteEquipment = async (id) => {
    const confirmed = window.confirm('정말로 이 장비를 삭제하시겠습니까?')
    if (confirmed) {
      setEquipment(equipment.filter(equip => equip.id !== id))
      toast.success('장비가 삭제되었습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>데이터 로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">장비 및 사용자 관리</h1>
      
      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            사용자 관리
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'equipment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            장비 관리
          </button>
        </nav>
      </div>
      
      {/* 사용자 관리 탭 */}
      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">사용자 목록</h2>
            <button
              type="button"
              onClick={() => openUserModal()}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
              새 사용자
            </button>
          </div>
          <div className="border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부서/학과</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openUserModal(user)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <PencilIcon className="h-5 w-5" aria-hidden="true" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                        <span className="sr-only">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 장비 관리 탭 */}
      {activeTab === 'equipment' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">장비 목록</h2>
            <button
              type="button"
              onClick={() => openEquipmentModal()}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
              새 장비
            </button>
          </div>
          <div className="border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">장비명</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">위치</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">색상</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipment.map((equip) => (
                  <tr key={equip.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{equip.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{equip.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{equip.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div
                          className="h-4 w-4 rounded-full mr-2"
                          style={{ backgroundColor: equip.color }}
                        ></div>
                        {equip.color}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEquipmentModal(equip)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <PencilIcon className="h-5 w-5" aria-hidden="true" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEquipment(equip.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                        <span className="sr-only">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 사용자 모달 */}
      <Transition.Root show={userModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setUserModalOpen}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        {selectedUser ? '사용자 수정' : '새 사용자 생성'}
                      </Dialog.Title>
                    </div>
                  </div>
                  
                  <form onSubmit={handleUserSubmit} className="mt-5 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
                      <input 
                        type="text" 
                        name="name" 
                        id="name" 
                        required 
                        value={userFormData.name} 
                        onChange={handleUserFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
                      <input 
                        type="email" 
                        name="email" 
                        id="email" 
                        required
                        value={userFormData.email} 
                        onChange={handleUserFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700">부서/학과</label>
                      <input 
                        type="text" 
                        name="department" 
                        id="department" 
                        required 
                        value={userFormData.department} 
                        onChange={handleUserFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                      />
                    </div>
                    
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                      <button 
                        type="submit" 
                        className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2"
                      >
                        {selectedUser ? '저장' : '생성'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setUserModalOpen(false)}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                      >
                        취소
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      
      {/* 장비 모달 */}
      <Transition.Root show={equipmentModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setEquipmentModalOpen}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        {selectedEquipment ? '장비 수정' : '새 장비 생성'}
                      </Dialog.Title>
                    </div>
                  </div>
                  
                  <form onSubmit={handleEquipmentSubmit} className="mt-5 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">장비명</label>
                      <input 
                        type="text" 
                        name="name" 
                        id="name" 
                        required 
                        value={equipmentFormData.name} 
                        onChange={handleEquipmentFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">설명</label>
                      <input 
                        type="text" 
                        name="description" 
                        id="description" 
                        value={equipmentFormData.description} 
                        onChange={handleEquipmentFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                      />
                    </div>
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">위치</label>
                      <input 
                        type="text" 
                        name="location" 
                        id="location" 
                        value={equipmentFormData.location} 
                        onChange={handleEquipmentFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                      />
                    </div>
                    <div>
                      <label htmlFor="color" className="block text-sm font-medium text-gray-700">색상</label>
                      <div className="flex items-center mt-1">
                        <input 
                          type="color" 
                          name="color" 
                          id="color" 
                          value={equipmentFormData.color} 
                          onChange={handleEquipmentFormChange}
                          className="h-8 w-8 rounded-md border-gray-300 shadow-sm" 
                        />
                        <input 
                          type="text" 
                          name="color" 
                          value={equipmentFormData.color} 
                          onChange={handleEquipmentFormChange}
                          className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                        />
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                      <button 
                        type="submit" 
                        className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2"
                      >
                        {selectedEquipment ? '저장' : '생성'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEquipmentModalOpen(false)}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                      >
                        취소
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  )
}