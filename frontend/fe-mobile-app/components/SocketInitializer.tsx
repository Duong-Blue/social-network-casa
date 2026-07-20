import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import socketService from '@/utils/helpers/socket_helper';
import { getMeThunk } from '@/features/auth/thunk/auth.thunk';

export default function SocketInitializer() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Khởi tạo dispatch cho socket service để nó có thể update Redux
    socketService.initialize(dispatch);
  }, [dispatch]);

  useEffect(() => {
    // Nếu đã đăng nhập (có token) nhưng chưa có thông tin user thì gọi getMe
    if (isAuthenticated && token && !user) {
      dispatch(getMeThunk());
    }
  }, [isAuthenticated, token, user, dispatch]);

  useEffect(() => {
    if (isAuthenticated && user && token) {
      console.log('🔌 Initializing socket connection for user:', user.userId);
      socketService.connect(user.userId, token);
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated, user?.userId, token]);

  return null;
}
