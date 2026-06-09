'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth/useAuthStore';
import api from '@/services/api/axios';
import { usePathname, useRouter } from 'next/navigation';
import { hasRouteAccess } from '@/lib/rbac';
import './globals.css';

const PUBLIC_PATHS = ['/', '/login', '/register', '/unauthorized'];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const setAuth   = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);
  const isLoading  = useAuthStore((s) => s.isLoading);
  const user       = useAuthStore((s) => s.user);
  const pathname   = usePathname();
  const router     = useRouter();

  // Rehydrate auth from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setAuth(res.data, token, refreshToken ?? undefined);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [setAuth, setLoading]);

  // Route guard: runs whenever pathname or auth state changes
  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_PATHS.includes(pathname);

    if (!user) {
      if (!isPublic && pathname !== '/login') router.replace('/login');
      return;
    }

    // Authenticated — check role access
    if (!isPublic && !hasRouteAccess(pathname, user.role)) {
      router.replace('/unauthorized');
    }
  }, [isLoading, user, pathname, router]);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
