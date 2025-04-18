import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // 항상 인증된 상태로 설정
  const [isLoading, setIsLoading] = useState(true);

  // 페이지 로드 시 자동 로그인
  useEffect(() => {
    const autoLogin = async () => {
      // 기본 사용자 정보 설정
      const defaultUser = {
        _id: 'guest',
        name: '방문자',
        role: 'user',
        email: 'guest@example.com',
        department: '일반'  
      };
      
      setUser(defaultUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      
      // 더미 사용자 목록
      try {
        // 사용자 목록 가져오기 시도 (API 실패시 더미 데이터 사용)
        const response = await apiService.users.getAll();
        console.log('사용자 목록 로드 성공:', response.data);
      } catch (error) {
        console.log('API 연결 실패, 더미 데이터 사용');
      }
    };
    
    autoLogin();
  }, []);

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
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
