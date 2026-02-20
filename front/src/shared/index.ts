// shared barrel
export { api, ApiError } from './api/apiClient';
export { authStore } from './auth/authStore';
export { default as ProtectedRoute } from './auth/ProtectedRoute';
export { ThemeProvider, useTheme } from './context/ThemeContext';
export { ToastProvider, useToast } from './context/ToastContext';
