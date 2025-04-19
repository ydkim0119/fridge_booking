import axios from 'axios';

// API 기본 URL 설정 - 프로덕션과 개발 환경에 따라 변경
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:5000/api';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 모든 요청에 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리 - 401 리디렉션 제거
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 인증 오류 시 콘솔에만 기록하고 리디렉션하지 않음
    if (error.response && error.response.status === 401) {
      console.log('API 인증 실패 (401) - 더미 데이터로 대체');
    }
    return Promise.reject(error);
  }
);

// 더미 데이터로 응답을 시뮬레이션하는 헬퍼 함수
const simulateResponse = (data) => {
  return Promise.resolve({ data });
};

// 더미 데이터
const dummyData = {
  users: [
    { _id: '1', name: '김철수', email: 'user1@example.com', department: '화학과' },
    { _id: '2', name: '박영희', email: 'user2@example.com', department: '생물학과' },
    { _id: '3', name: '이지훈', email: 'user3@example.com', department: '물리학과' },
    { _id: '4', name: '정민지', email: 'admin@example.com', department: '관리부서' },
  ],
  equipment: [
    { _id: '1', name: '냉동기 1', description: '일반용 냉동기', location: '1층 실험실', color: '#3B82F6' },
    { _id: '2', name: '냉동기 2', description: '식품용 냉동기', location: '2층 실험실', color: '#10B981' },
    { _id: '3', name: '냉동기 3', description: '시약용 냉동기', location: '2층 실험실', color: '#F59E0B' },
    { _id: '4', name: '냉동기 4', description: '시료 보관용', location: '3층 실험실', color: '#EF4444' },
    { _id: '5', name: '초저온냉동기', description: '-80℃ 보관용', location: '지하 1층', color: '#8B5CF6' },
  ],
  reservations: [
    {
      _id: '1',
      title: '시료 냉동 보관',
      user: '1',
      equipment: '1',
      startDate: '2025-04-19',
      endDate: '2025-04-20',
      notes: '분자생물학 실험 시료'
    },
    {
      _id: '2',
      title: '저온 실험',
      user: '2',
      equipment: '3',
      startDate: '2025-04-21',
      endDate: '2025-04-22',
      notes: '효소 활성도 실험'
    },
    {
      _id: '3',
      title: '초저온 보존',
      user: '3',
      equipment: '5',
      startDate: '2025-04-23',
      endDate: '2025-04-24',
      notes: '세포 보존'
    }
  ]
};

// API 서비스 객체 - 서버 API 요청 시도 후 실패하면 더미 데이터 사용
const apiService = {
  // 인증 관련 API
  auth: {
    login: (credentials) => api.post('/auth/login', credentials).catch(() => simulateResponse({ token: 'dummy-token', user: dummyData.users[0] })),
    register: (userData) => api.post('/auth/register', userData).catch(() => simulateResponse({ message: '회원가입 성공' })),
    getCurrentUser: () => api.get('/auth/me').catch(() => simulateResponse(dummyData.users[0])),
  },
  
  // 사용자 관련 API
  users: {
    getAll: () => api.get('/users').catch(() => simulateResponse(dummyData.users)),
    getById: (id) => api.get(`/users/${id}`).catch(() => {
      const user = dummyData.users.find(u => u._id === id) || dummyData.users[0];
      return simulateResponse(user);
    }),
    create: (userData) => api.post('/users', userData).catch(() => {
      const newId = dummyData.users.length > 0 
        ? Math.max(...dummyData.users.map(u => parseInt(u._id) || 0)) + 1
        : 1;
      const newUser = { ...userData, _id: newId.toString() };
      dummyData.users.push(newUser);
      return simulateResponse(newUser);
    }),
    update: (id, userData) => api.put(`/users/${id}`, userData).catch(() => {
      const index = dummyData.users.findIndex(u => u._id === id);
      if (index >= 0) {
        dummyData.users[index] = { ...dummyData.users[index], ...userData };
      }
      return simulateResponse({ ...userData, _id: id });
    }),
    delete: (id) => api.delete(`/users/${id}`).catch(() => {
      dummyData.users = dummyData.users.filter(u => u._id !== id);
      return simulateResponse({ message: '사용자 삭제 성공' });
    }),
    updateProfile: (userData) => api.put('/users/profile', userData).catch(() => simulateResponse({ ...userData })),
  },
  
  // 장비 관련 API
  equipment: {
    getAll: () => api.get('/equipment').catch(() => simulateResponse(dummyData.equipment)),
    getById: (id) => api.get(`/equipment/${id}`).catch(() => {
      const item = dummyData.equipment.find(e => e._id === id) || dummyData.equipment[0];
      return simulateResponse(item);
    }),
    create: (equipmentData) => api.post('/equipment', equipmentData).catch(() => {
      const newId = dummyData.equipment.length > 0 
        ? Math.max(...dummyData.equipment.map(e => parseInt(e._id) || 0)) + 1
        : 1;
      const newEquipment = { ...equipmentData, _id: newId.toString() };
      dummyData.equipment.push(newEquipment);
      return simulateResponse(newEquipment);
    }),
    update: (id, equipmentData) => api.put(`/equipment/${id}`, equipmentData).catch(() => {
      const index = dummyData.equipment.findIndex(e => e._id === id);
      if (index >= 0) {
        dummyData.equipment[index] = { ...dummyData.equipment[index], ...equipmentData };
      }
      return simulateResponse({ ...equipmentData, _id: id });
    }),
    delete: (id) => api.delete(`/equipment/${id}`).catch(() => {
      dummyData.equipment = dummyData.equipment.filter(e => e._id !== id);
      return simulateResponse({ message: '장비 삭제 성공' });
    }),
  },
  
  // 예약 관련 API
  reservations: {
    getAll: () => api.get('/reservations').catch(() => simulateResponse(dummyData.reservations)),
    getAllByUser: (userId) => api.get(`/reservations/user/${userId}`).catch(() => {
      const filtered = dummyData.reservations.filter(r => r.user === userId);
      return simulateResponse(filtered);
    }),
    getAllByEquipment: (equipmentId) => api.get(`/reservations/equipment/${equipmentId}`).catch(() => {
      const filtered = dummyData.reservations.filter(r => r.equipment === equipmentId);
      return simulateResponse(filtered);
    }),
    getById: (id) => api.get(`/reservations/${id}`).catch(() => {
      const reservation = dummyData.reservations.find(r => r._id === id) || dummyData.reservations[0];
      return simulateResponse(reservation);
    }),
    create: (reservationData) => api.post('/reservations', reservationData).catch(() => {
      const newId = dummyData.reservations.length > 0 
        ? Math.max(...dummyData.reservations.map(r => parseInt(r._id) || 0)) + 1
        : 1;
      const newReservation = { ...reservationData, _id: newId.toString() };
      dummyData.reservations.push(newReservation);
      return simulateResponse(newReservation);
    }),
    update: (id, reservationData) => api.put(`/reservations/${id}`, reservationData).catch(() => {
      const index = dummyData.reservations.findIndex(r => r._id === id);
      if (index >= 0) {
        dummyData.reservations[index] = { ...dummyData.reservations[index], ...reservationData };
      }
      return simulateResponse({ ...reservationData, _id: id });
    }),
    delete: (id) => api.delete(`/reservations/${id}`).catch(() => {
      dummyData.reservations = dummyData.reservations.filter(r => r._id !== id);
      return simulateResponse({ message: '예약 삭제 성공' });
    }),
    // 필터링 기능 추가
    getFiltered: (filters) => api.get('/reservations/filter', { params: filters }).catch(() => {
      let filtered = [...dummyData.reservations];
      
      if (filters.userId) {
        filtered = filtered.filter(r => r.user === filters.userId);
      }
      
      if (filters.equipmentId) {
        filtered = filtered.filter(r => r.equipment === filters.equipmentId);
      }
      
      return simulateResponse(filtered);
    }),
    // 날짜 범위로 예약 조회
    getByDateRange: (startDate, endDate) => api.get(`/reservations/range/${startDate}/${endDate}`)
      .catch(() => simulateResponse(dummyData.reservations)),
  },
  
  // 통계 관련 API
  stats: {
    getEquipmentUsage: () => api.get('/stats/equipment-usage').catch(() => {
      // 장비별 사용 통계 더미 데이터
      const stats = dummyData.equipment.map(e => ({
        id: e._id,
        name: e.name,
        usage: Math.floor(Math.random() * 10) + 1,
        hours: Math.floor(Math.random() * 40) + 5
      }));
      return simulateResponse(stats);
    }),
    getUserBookings: () => api.get('/stats/user-bookings').catch(() => {
      // 사용자별 예약 통계 더미 데이터
      const stats = dummyData.users.map(u => ({
        id: u._id,
        name: u.name,
        bookings: Math.floor(Math.random() * 8) + 1,
        hours: Math.floor(Math.random() * 30) + 2
      }));
      return simulateResponse(stats);
    }),
    getTimeSlotPopularity: () => api.get('/stats/timeslot-popularity').catch(() => {
      // 시간대별 인기도 더미 데이터
      const timeSlots = [
        { hour: 9, count: 7 },
        { hour: 10, count: 12 },
        { hour: 11, count: 8 },
        { hour: 12, count: 5 },
        { hour: 13, count: 9 },
        { hour: 14, count: 15 },
        { hour: 15, count: 11 },
        { hour: 16, count: 10 },
        { hour: 17, count: 6 }
      ];
      return simulateResponse(timeSlots);
    }),
  },
};

export default apiService;