'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api/axios';

const roles = ['ADMIN','EMPLOYEE','MANAGER','BUSINESS','AGRONOMY','HARDWARE','ACCOUNTS'] as const;

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Enter your full name'),
  role: z.enum(roles),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'EMPLOYEE'
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/auth/register', data);
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-center text-gray-900">Create an Account</h2>
      <p className="text-center text-gray-600">Register to access the Crop2X CRM dashboard.</p>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-100 border border-red-200 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            {...register('full_name')}
            type="text"
            className="w-full text-black px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-5 outline-none"
            placeholder="John Doe"
          />
          {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select {...register('role')} className="w-full text-black px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none">
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full text-black px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="admin@crop2x.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            {...register('password')}
            type="password"
            className="w-full text-black px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="••••••••"
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Registering...' : 'Create Account'}
        </button>
      </form>

      <p className="text-sm text-center text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
