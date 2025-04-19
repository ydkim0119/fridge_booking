import { Fragment, useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Dialog, Menu, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  UserCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  
  // 모바일 화면 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // 새 예약 만들기 핸들러
  const handleNewReservation = () => {
    navigate('/calendar')
    // 시간 지연을 두어 캘린더 페이지가 로드된 후 이벤트를 발생시킴
    setTimeout(() => {
      const now = new Date()
      const event = new CustomEvent('create-reservation', {
        detail: {
          start: now.toISOString(),
          end: new Date(now.getTime() + 60 * 60 * 1000).toISOString() // 1시간 후
        }
      })
      window.dispatchEvent(event)
    }, 100)
  }
  
  // 네비게이션 항목
  const navigation = [
    { 
      name: '대시보드', 
      href: '/dashboard', 
      icon: HomeIcon, 
      current: pathname === '/dashboard' || pathname === '/' 
    },
    { 
      name: '캘린더', 
      href: '/calendar', 
      icon: CalendarDaysIcon, 
      current: pathname === '/calendar' 
    },
    { 
      name: '통계', 
      href: '/stats', 
      icon: ChartBarIcon, 
      current: pathname === '/stats' 
    },
    // 모든 사용자에게 관리자 메뉴 표시
    { 
      name: '장비/사용자 관리', 
      href: '/admin', 
      icon: UsersIcon, 
      current: pathname === '/admin' 
    }
  ]

  return (
    <div className="h-full bg-gray-50">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button 
                      type="button" 
                      className="-m-2.5 p-2.5 bg-white rounded-full shadow-md" 
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">사이드바 닫기</span>
                      <XMarkIcon className="h-6 w-6 text-gray-700" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <h1 className="text-xl font-bold text-gray-900">SQuIRL 냉동기 예약</h1>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className={classNames(
                                  item.current
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50',
                                  'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                )}
                                onClick={() => setSidebarOpen(false)}
                              >
                                <item.icon
                                  className={classNames(
                                    item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                                    'h-6 w-6 shrink-0'
                                  )}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                      
                      {/* 빠른 예약 버튼 */}
                      <li className="mt-auto">
                        <button
                          type="button"
                          onClick={() => {
                            handleNewReservation()
                            setSidebarOpen(false)
                          }}
                          className="w-full flex items-center gap-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                        >
                          <PlusIcon className="h-5 w-5" aria-hidden="true" />
                          새 예약 만들기
                        </button>
                      </li>
                      
                      <li className="-mx-6 mt-2">
                        <Link
                          to="/profile"
                          className={classNames(
                            pathname === '/profile'
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50',
                            'flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6'
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                          <span aria-hidden="true">내 프로필</span>
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* 사이드바 (데스크톱) */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-gray-900">SQuIRL 냉동기 예약</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={classNames(
                          item.current
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              
              {/* 빠른 예약 버튼 */}
              <li className="mt-auto">
                <button
                  type="button"
                  onClick={handleNewReservation}
                  className="flex w-full items-center gap-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  <PlusIcon className="h-5 w-5" aria-hidden="true" />
                  새 예약 만들기
                </button>
              </li>
              
              <li className="-mx-6 mt-2">
                <Link
                  to="/profile"
                  className={classNames(
                    pathname === '/profile'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50',
                    'flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6'
                  )}
                >
                  <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                  <span aria-hidden="true">내 프로필</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* 모바일 헤더 */}
      <div className="sticky top-0 z-40 flex items-center gap-x-4 bg-white px-4 py-3 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">사이드바 열기</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">SQuIRL 냉동기 예약</div>
        
        {/* 빠른 예약 버튼 (모바일) */}
        <button
          type="button"
          onClick={handleNewReservation}
          className="rounded-full bg-blue-600 p-1.5 text-white shadow-sm hover:bg-blue-500"
        >
          <PlusIcon className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">새 예약 만들기</span>
        </button>
        
        <Menu as="div" className="relative">
          <Menu.Button className="-m-1.5 flex items-center p-1.5">
            <span className="sr-only">사용자 메뉴 열기</span>
            <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/profile"
                    className={classNames(
                      active ? 'bg-gray-50' : '',
                      'block px-3 py-1 text-sm leading-6 text-gray-900'
                    )}
                  >
                    내 프로필
                  </Link>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <main className="py-4 lg:py-8 lg:pl-72">
        <div className="px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}