// Custom hook for authentication logic
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { login, logout, clearAuthError } from '../store/slices/authSlice';
import { User } from '../types/index';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const loginUser = (email: string, password: string, remember: boolean) =>
    dispatch(login({ email, password, rememberMe: remember }));

  const logoutUser = () => dispatch(logout());

  const clearError = () => dispatch(clearAuthError());

  const isAuthenticated = auth.isAuthenticated;

  const currentUser: User | null = auth.user;

  const hasRole = (role: string): boolean =>
    currentUser?.roles.includes(role) || false;

  return {
    ...auth,
    loginUser,
    logoutUser,
    clearError,
    isAuthenticated,
    currentUser,
    hasRole,
  };
}
