export type UserRole = 'ADMIN' | 'MANAGER' | 'BUSINESS' | 'AGRONOMY' | 'HARDWARE' | 'ACCOUNTS' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}
