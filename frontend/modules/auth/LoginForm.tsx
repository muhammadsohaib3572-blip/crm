'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import api from '@/services/api/axios';
import { useAuthStore } from '@/store/auth/useAuthStore';

const loginSchema = z.object({
  username: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = new URLSearchParams();
      payload.append('username', data.username);
      payload.append('password', data.password);

      const loginRes = await api.post('/auth/login', payload.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const token = loginRes.data.access_token;
      const refreshToken = loginRes.data.refresh_token;

      // Set tokens in localStorage before calling /auth/me so interceptor can pick them up
      localStorage.setItem('access_token', token);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

      const userRes = await api.get('/auth/me');
      setAuth(userRes.data, token, refreshToken);

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-center text-gray-900">Crop2X CRM</h2>
      <p className="text-center text-gray-600">Sign in to your account</p>
      
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-100 border border-red-200 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            {...register('username')}
            type="email"
            className="w-full text-black px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="admin@crop2x.com"
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            {...register('password')}
            type="password"
            className="w-full text-black px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
