import axiosInstance from '../config/axios';
import { SignInCredentials, SignUpCredentials } from '../types/auth';

export const authService = {
  signIn: async (credentials: SignInCredentials) => {
    const { data } = await axiosInstance.post('/auth/login', credentials);
    return data;
  },

  signUp: async (credentials: SignUpCredentials) => {
    const { data } = await axiosInstance.post('/auth/signup', credentials);
    return data;
  },
}; 