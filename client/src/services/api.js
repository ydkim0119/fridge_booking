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

// 응답 인터셉터: 에러 처리 및 토큰 만료 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 토큰 만료 (401) 처리
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API 서비스 객체
const apiService = {
  // 인증 관련 API
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getCurrentUser: () => api.get('/auth/me'),
  },
  
  // 사용자 관련 API
  users: {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    update: (id, userData) => api.put(`/users/${id}`, userData),
    delete: (id) => api.delete(`/users/${id}`),
    updateProfile: (userData) => api.put('/users/profile', userData),
  },
  
  // 장비 관련 API
  equipment: {
    getAll: () => api.get('/equipment'),
    getById: (id) => api.get(`/equipment/${id}`),
    create: (equipmentData) => api.post('/equipment', equipmentData),
    update: (id, equipmentData) => api.put(`/equipment/${id}`, equipmentData),
    delete: (id) => api.delete(`/equipment/${id}`),
  },
  
  // 예약 관련 API
  reservations: {
    getAll: () => api.get('/reservations'),
    getAllByUser: (userId) => api.get(`/reservations/user/${userId}`),
    getAllByEquipment: (equipmentId) => api.get(`/reservations/equipment/${equipmentId}`),
    getById: (id) => api.get(`/reservations/${id}`),
    create: (reservationData) => api.post('/reservations', reservationData),
    update: (id, reservationData) => api.put(`/reservations/${id}`, reservationData),
    delete: (id) => api.delete(`/reservations/${id}`),
    // 필터링 기능 추가
    getFiltered: (filters) => api.get('/reservations/filter', { params: filters }),
  },
  
  // 통계 관련 API
  stats: {
    getEquipmentUsage: () => api.get('/stats/equipment-usage'),
    getUserBookings: () => api.get('/stats/user-bookings'),
    getTimeSlotPopularity: () => api.get('/stats/timeslot-popularity'),
  },
};

export default apiService;