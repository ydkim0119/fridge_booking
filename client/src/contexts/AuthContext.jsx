import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

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
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
          } else {
            // API 호출 기본 헤더 설정
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // 사용자 정보 가져오기
            const response = await axios.get('/api/users/me');
            setUser(response.data);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('인증 에러:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      
      setIsLoading(false);
    };
    
    checkToken();
  }, []);

  // 로그인 함수
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '로그인 중 오류가 발생했습니다.' 
      };
    }
  };

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  // 회원가입 함수
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '회원가입 중 오류가 발생했습니다.' 
      };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
