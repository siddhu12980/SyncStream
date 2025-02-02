import { atom } from 'recoil';

interface User {
  email: string;
  username: string;
  id: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

// Get initial state from localStorage
const getInitialState = (): AuthState => {
  const savedAuth = localStorage.getItem('auth');
  if (savedAuth) {
    try {
      const parsedAuth = JSON.parse(savedAuth);
      return {
        user: parsedAuth.user,
        accessToken: parsedAuth.accessToken,
        refreshToken: parsedAuth.refreshToken,
        isAuthenticated: true,
      };
    } catch (error) {
      console.error('Error parsing auth from localStorage:', error);
      localStorage.removeItem('auth');
    }
  }
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  };
};

export const userState = atom<AuthState>({
  key: 'userState',
  default: getInitialState(),
  effects: [
    ({ onSet }) => {
      onSet((newValue) => {
        if (newValue.isAuthenticated) {
          localStorage.setItem('auth', JSON.stringify(newValue));
        } else {
          localStorage.removeItem('auth');
        }
      });
    },
  ],
}); 