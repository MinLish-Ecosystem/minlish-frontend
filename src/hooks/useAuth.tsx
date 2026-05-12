import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setCredentials, logout as logoutAction, updateUser as updateAction } from '../store/slices/authSlice';

export const useAuth = () => {
  const { user, loading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const login = useCallback((data: any) => {
    dispatch(setCredentials(data));
  }, [dispatch]);

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  const updateUser = useCallback((data: any) => {
    dispatch(updateAction(data));
  }, [dispatch]);

  return { user, login, logout, loading, updateUser };
};
