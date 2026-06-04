'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api/axios';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS']),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().nullable(),
  is_active: z.boolean().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
  initialData?: Partial<UserFormData>;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  initialData,
}: UserFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { is_active: true, ...(initialData || {}) },
  });

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = { ...data };
      if (!payload.password) {
        delete payload.password;
      }

      if (userId) {
        await api.patch(`/users/${userId}`, payload);
      } else {
        if (!payload.password) {
          setError('Password is required for new users');
          setIsLoading(false);
          return;
        }
        await api.post('/users', payload);
      }
      onSuccess();
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save user');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl overflow-y-auto max-h-screen">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          {userId ? 'Edit User' : 'Create User'}
        </h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 border border-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="user@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input
              {...register('full_name')}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="John Doe"
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role *</label>
            <select
              {...register('role')}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
              <option value="BUSINESS">Business</option>
              <option value="AGRONOMY">Agronomy</option>
              <option value="HARDWARE">Hardware</option>
              <option value="ACCOUNTS">Accounts</option>
            </select>
          </div>

          {!userId && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                {...register('password')}
                type="password"
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
          )}

          <div className="flex items-center">
            <input
              {...register('is_active')}
              type="checkbox"
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            />
            <label className="ml-2 block text-sm text-gray-700">Active</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
