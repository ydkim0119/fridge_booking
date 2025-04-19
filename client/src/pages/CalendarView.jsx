import { useState, useEffect, useRef } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { toast } from 'react-hot-toast'

export default function CalendarView() {
  const [reservations, setReservations] = useState([])
  const [users, setUsers] = useState([])
  const [equipment, setEquipment] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [view, setView] = useState('dayGridMonth')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const calendarRef = useRef(null)

  // 모바일 화면 감지
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // 모바일에서 자동으로 주간 뷰로 전환 (일간 뷰에서 변경)
      if (mobile && view === 'dayGridMonth') {
        handleViewChange('dayGridWeek')
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [view])

  // 레이아웃에서 새 예약 이벤트 감지
  useEffect(() => {
    const handleCreateReservation = (event) => {
      if (event.detail) {
        // 이벤트 상세 정보가 있으면 시작일만 설정하고 종료일은 하루 뒤로 설정
        const startDate = event.detail.start ? new Date(event.detail.start) : new Date()
        const endDate = addDays(startDate, 1) // 하루 단위 예약
        
        setSelectedDate({
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          allDay: true
        })
        setSelectedReservation(null)
        setModalOpen(true)
      }
    }
    
    window.addEventListener('create-reservation', handleCreateReservation)
    return () => window.removeEventListener('create-reservation', handleCreateReservation)
  }, [])

  // 초기 데이터 로딩
  useEffect(() => {
    try {
      setLoading(true)
      // 더미 데이터로 초기화 (실제 환경에서는 API 호출로 변경)
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
      
      // 일 단위 예약으로 더미 데이터 변경
      const reservationsData = [
        {
          id: 1,
          title: '시료 냉동 보관',
          user: 1,
          equipment: 1,
          startDate: '2025-04-19',
          endDate: '2025-04-20', // 종료일은 그 다음날로 설정 (FullCalendar의 end는 exclusive)
          notes: '분자생물학 실험 시료'
        },
        {
          id: 2,
          title: '저온 실험',
          user: 2,
          equipment: 3,
          startDate: '2025-04-21',
          endDate: '2025-04-22',
          notes: '효소 활성도 실험'
        },
        {
          id: 3,
          title: '초저온 보존',
          user: 3,
          equipment: 5,
          startDate: '2025-04-23',
          endDate: '2025-04-24',
          notes: '세포 보존'
        }
      ]
      
      setUsers(usersData)
      setEquipment(equipmentData)
      setReservations(reservationsData)
    } catch (error) {
      console.error('데이터 로딩 에러:', error)
      toast.error('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  // 필터링된 예약 가져오기
  const getFilteredReservations = () => {
    // 더미 데이터 (실제로는 API 호출로 대체될 것)
    const allReservations = [
      {
        id: 1,
        title: '시료 냉동 보관',
        user: 1,
        equipment: 1,
        startDate: '2025-04-19',
        endDate: '2025-04-20',
        notes: '분자생물학 실험 시료'
      },
      {
        id: 2,
        title: '저온 실험',
        user: 2,
        equipment: 3,
        startDate: '2025-04-21',
        endDate: '2025-04-22',
        notes: '효소 활성도 실험'
      },
      {
        id: 3,
        title: '초저온 보존',
        user: 3,
        equipment: 5,
        startDate: '2025-04-23',
        endDate: '2025-04-24',
        notes: '세포 보존'
      }
    ];
    
    return allReservations.filter(reservation => {
      let matchesUser = true;
      let matchesEquipment = true;
      
      if (selectedUser) {
        matchesUser = reservation.user === parseInt(selectedUser);
      }
      
      if (selectedEquipment) {
        matchesEquipment = reservation.equipment === parseInt(selectedEquipment);
      }
      
      return matchesUser && matchesEquipment;
    });
  }

  // 필터 변경 시 예약 목록 업데이트
  useEffect(() => {
    try {
      const filtered = getFilteredReservations();
      setReservations(filtered);
    } catch (error) {
      console.error('필터링 에러:', error);
      toast.error('예약 필터링에 실패했습니다.');
    }
  }, [selectedUser, selectedEquipment])

  // 예약 생성 함수 (일 단위 예약으로 변경)
  const createReservation = async (formData) => {
    try {
      // API 없이 로컬 상태 업데이트
      const newReservation = {
        id: reservations.length > 0 ? Math.max(...reservations.map(r => r.id)) + 1 : 1,
        user: parseInt(formData.user),
        equipment: parseInt(formData.equipment),
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        notes: formData.notes
      };
      
      setReservations(prev => [...prev, newReservation]);
      toast.success('예약이 생성되었습니다.');
      return true;
    } catch (error) {
      console.error('예약 생성 에러:', error);
      toast.error('예약 생성에 실패했습니다.');
      return false;
    }
  }

  // 예약 수정 함수 (일 단위 예약으로 변경)
  const updateReservation = async (id, formData) => {
    try {
      // API 없이 로컬 상태 업데이트
      const updatedReservations = reservations.map(reservation => 
        reservation.id === id 
          ? {
              ...reservation,
              title: formData.title,
              user: parseInt(formData.user),
              equipment: parseInt(formData.equipment),
              startDate: formData.startDate,
              endDate: formData.endDate,
              notes: formData.notes
            }
          : reservation
      );
      
      setReservations(updatedReservations);
      toast.success('예약이 수정되었습니다.');
      return true;
    } catch (error) {
      console.error('예약 수정 에러:', error);
      toast.error('예약 수정에 실패했습니다.');
      return false;
    }
  }

  // 예약 삭제 함수
  const deleteReservation = async (id) => {
    try {
      // API 없이 로컬 상태 업데이트
      const filteredReservations = reservations.filter(reservation => reservation.id !== id);
      setReservations(filteredReservations);
      toast.success('예약이 삭제되었습니다.');
      return true;
    } catch (error) {
      console.error('예약 삭제 에러:', error);
      toast.error('예약 삭제에 실패했습니다.');
      return false;
    }
  }

  // 날짜 선택 핸들러 (일 단위 예약으로 변경)
  const handleDateSelect = (selectInfo) => {
    // 선택한 날짜의 시작과 끝 (하루 단위)
    const startDate = format(new Date(selectInfo.startStr), 'yyyy-MM-dd')
    const endDate = format(new Date(selectInfo.endStr), 'yyyy-MM-dd')
    
    setSelectedDate({
      start: startDate,
      end: endDate,
      allDay: true
    });
    
    setSelectedReservation(null);
    setModalOpen(true);
  }

  // 예약 클릭 핸들러
  const handleEventClick = (clickInfo) => {
    const eventId = parseInt(clickInfo.event.id);
    const reservation = reservations.find(res => res.id === eventId);
    
    if (reservation) {
      setSelectedReservation(reservation);
      setSelectedDate(null);
      setModalOpen(true);
    } else {
      toast.error('예약 정보를 찾을 수 없습니다.');
    }
  }
  
  // 캘린더에 표시할 이벤트 데이터 (일 단위 예약으로 변경)
  const events = reservations.map(reservation => {
    const equipmentItem = equipment.find(e => e.id === reservation.equipment) || {};
    const userItem = users.find(u => u.id === reservation.user) || { name: '사용자' };
    
    return {
      id: reservation.id.toString(),
      title: `${reservation.title} - ${equipmentItem.name || '장비'} (${userItem.name})`,
      start: reservation.startDate,
      end: reservation.endDate,
      backgroundColor: equipmentItem.color || '#3788d8',
      borderColor: equipmentItem.color || '#3788d8',
      allDay: true,
      extendedProps: {
        description: reservation.notes,
        equipment: reservation.equipment,
        user: reservation.user
      }
    };
  });

  // 뷰 변경 핸들러
  const handleViewChange = (viewType) => {
    try {
      setView(viewType);
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(viewType);
      }
    } catch (error) {
      console.error('뷰 변경 에러:', error);
      toast.error('캘린더 뷰 변경에 실패했습니다.');
    }
  }

  // 폼 제출 핸들러 (일 단위 예약으로 변경)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = {
        title: e.target.title.value,
        user: e.target.user.value,
        equipment: e.target.equipment.value,
        startDate: e.target.startDate.value,
        endDate: e.target.endDate.value,
        notes: e.target.description.value
      };
      
      let success = false;
      
      if (selectedReservation) {
        // 예약 수정
        success = await updateReservation(selectedReservation.id, formData);
      } else {
        // 새 예약 생성
        success = await createReservation(formData);
      }
      
      if (success) {
        setModalOpen(false);
      }
    } catch (error) {
      console.error('폼 제출 에러:', error);
      toast.error('예약 처리 중 오류가 발생했습니다.');
    }
  }

  // 예약 삭제 핸들러
  const handleDelete = async () => {
    if (!selectedReservation) return;
    
    try {
      const confirmed = window.confirm('정말로 이 예약을 삭제하시겠습니까?');
      if (!confirmed) return;
      
      const success = await deleteReservation(selectedReservation.id);
      if (success) {
        setModalOpen(false);
      }
    } catch (error) {
      console.error('삭제 에러:', error);
      toast.error('예약 삭제 중 오류가 발생했습니다.');
    }
  }

  // 필터 변경 핸들러
  const handleUserFilterChange = (e) => {
    setSelectedUser(e.target.value);
  }
  
  const handleEquipmentFilterChange = (e) => {
    setSelectedEquipment(e.target.value);
  }
  
  // 필터 초기화 핸들러
  const handleClearFilters = () => {
    setSelectedUser('');
    setSelectedEquipment('');
  }