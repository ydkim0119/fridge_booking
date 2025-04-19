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
  const [isInitialized, setIsInitialized] = useState(false);

  // 페이지 로드 시 자동 로그인 - 한 번만 실행되도록 개선
  useEffect(() => {
    if (isInitialized) return;
    
    const autoLogin = async () => {
      try {
        setIsLoading(true);
        
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
        
        // 사용자 목록은 필요할 때 컴포넌트에서 직접 가져오도록 변경
        console.log('게스트 사용자로 자동 로그인됨');
      } catch (error) {
        console.error('로그인 초기화 에러:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    
    autoLogin();
  }, [isInitialized]);

  // 사용자 정보 업데이트 함수
  const updateProfile = async (userData) => {
    try {
      // API 호출
      const response = await apiService.users.updateProfile(userData);
      
      // 현재 로그인한 사용자 정보 업데이트
      setUser(prevUser => ({
        ...prevUser,
        ...response.data
      }));
      
      toast.success('프로필이 업데이트되었습니다!');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('프로필 업데이트 에러:', error);
      
      // 더미 데이터 모드에서는 성공으로 처리
      if (!error.response) {
        setUser(prevUser => ({
          ...prevUser,
          ...userData
        }));
        toast.success('프로필이 업데이트되었습니다! (오프라인 모드)');
        return { success: true, data: userData };
      }
      
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