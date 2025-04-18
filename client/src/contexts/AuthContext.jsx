import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 페이지 로드 시 토큰 확인
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // 토큰 디코딩
          const decoded = jwtDecode(token);
          
          // 토큰 만료 확인
          if (decoded.exp * 1000 < Date.now()) {
            console.log('토큰이 만료되었습니다');
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
          } else {
            try {
              // 사용자 정보 가져오기
              const response = await apiService.auth.getCurrentUser();
              setUser(response.data);
              setIsAuthenticated(true);
            } catch (error) {
              console.error('사용자 정보 가져오기 실패:', error);
              // 서버 연결 문제로 더미 데이터 사용
              handleDummyAuth(token, decoded);
            }
          }
        } catch (error) {
          console.error('인증 에러:', error);
          localStorage.removeItem('token');
        }
      }
      
      setIsLoading(false);
    };
    
    checkToken();
  }, []);

  // 더미 데이터를 사용하는 인증 처리 (서버 문제 시 폴백)
  const handleDummyAuth = (token, decoded) => {
    console.log('더미 인증 데이터 사용');
    // 서버 API가 실패하면 토큰에서 추출한 사용자 정보 사용
    const dummyUser = {
      _id: decoded.id || decoded._id,
      name: decoded.name || '사용자',
      role: decoded.role || 'user',
      email: decoded.email || 'user@example.com',
      department: decoded.department || '일반'  
    };
    
    setUser(dummyUser);
    setIsAuthenticated(true);
  };

  // 로그인 함수
  const login = async (email, password) => {
    try {
      const response = await apiService.auth.login({ email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      
      setUser(user);
      setIsAuthenticated(true);
      
      toast.success('로그인되었습니다!');
      return { success: true };
    } catch (error) {
      console.error('로그인 에러:', error);
      
      // 개발 모드에서 더미 데이터 사용 (DEV 환경에서만)
      if (import.meta.env.DEV) {
        const dummyUsers = [
          { _id: '1', email: 'admin@example.com', password: 'admin123', name: '관리자', role: 'admin', department: '관리부' },
          { _id: '2', email: 'user@example.com', password: 'user123', name: '일반 사용자', role: 'user', department: '연구부' }
        ];
        
        const dummyUser = dummyUsers.find(u => u.email === email && u.password === password);
        
        if (dummyUser) {
          console.log('개발 모드: 더미 로그인 성공');
          
          // 비밀번호 제거하고 토큰 발급
          const { password, ...userWithoutPassword } = dummyUser;
          const dummyToken = 'dummy_token_' + Math.random().toString(36).substring(2);
          
          localStorage.setItem('token', dummyToken);
          setUser(userWithoutPassword);
          setIsAuthenticated(true);
          
          toast.success('개발 모드: 더미 계정으로 로그인되었습니다!');
          return { success: true };
        }
      }
      
      toast.error(error.response?.data?.message || '로그인 중 오류가 발생했습니다.');
      return { 
        success: false, 
        message: error.response?.data?.message || '로그인 중 오류가 발생했습니다.' 
      };
    }
  };

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('로그아웃되었습니다.');
  };

  // 회원가입 함수
  const register = async (userData) => {
    try {
      const response = await apiService.auth.register(userData);
      toast.success('회원가입이 완료되었습니다!');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('회원가입 에러:', error);
      toast.error(error.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
      return { 
        success: false, 
        message: error.response?.data?.message || '회원가입 중 오류가 발생했습니다.' 
      };
    }
  };

  // 사용자 정보 업데이트 함수
  const updateProfile = async (userData) => {
    try {
      const response = await apiService.users.updateProfile(userData);
      // 현재 로그인한 사용자 정보 업데이트
      setUser(response.data);
      toast.success('프로필이 업데이트되었습니다!');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('프로필 업데이트 에러:', error);
      toast.error(error.response?.data?.message || '프로필 업데이트 중 오류가 발생했습니다.');
      return { 
        success: false, 
        message: error.response?.data?.message || '프로필 업데이트 중 오류가 발생했습니다.' 
      };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
