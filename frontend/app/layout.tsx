'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth/useAuthStore';
import api from '@/services/api/axios';
import { usePathname, useRouter } from 'next/navigation';
import './globals.css';

const publicPaths = ['/', '/login', '/register'];


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const setLoading = useAuthStore((state) => state.setLoading);
  const isLoading = useAuthStore((state) => state.isLoading);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (token) {
        try {
          const res = await api.get('/auth/me');
          setAuth(res.data, token, refreshToken ?? undefined);
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [setAuth, setLoading]);

  useEffect(() => {
    if (!isLoading && !publicPaths.includes(pathname) && !localStorage.getItem('access_token')) {
      router.replace('/login');
    }
  }, [isLoading, pathname, router]);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
