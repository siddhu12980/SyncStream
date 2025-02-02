import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSetRecoilState } from 'recoil';
import { userState } from '../store/userStore';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useSignIn = (onSuccess?: () => void) => {
  const setUserState = useSetRecoilState(userState);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.signIn,
    onSuccess: (data) => {
      setUserState({
        user: data.user,
        accessToken: data['access-token'],
        refreshToken: data['refresh-token'],
        isAuthenticated: true,
      });
      toast.success('Signed in successfully!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
      navigate('/dashboard');
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed');
    },
  });
};

export const useSignUp = (onSuccess?: () => void) => {
  return useMutation({
    mutationFn: authService.signUp,
    onSuccess: () => {
      toast.success('Account created successfully! Please sign in.');
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed');
    },
  });
}; 