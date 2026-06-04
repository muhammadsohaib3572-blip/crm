'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api/axios';

const issueSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  assigned_to_id: z.string().optional().nullable(),
});

type IssueFormData = z.infer<typeof issueSchema>;

interface ClientIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
}

interface User {
  id: string;
  full_name: string;
  role: string;
}

export default function ClientIssueModal({
  isOpen,
  onClose,
  onSuccess,
  clientId,
}: ClientIssueModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: { priority: 'MEDIUM' },
  });

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [hw, ag] = await Promise.all([
          api.get('/users/by-role/HARDWARE'),
          api.get('/users/by-role/AGRONOMY'),
        ]);
        setUsers([...hw.data, ...ag.data]);
      } catch (err) {
        console.error('Failed to fetch assignment resources', err);
      }
    };
    if (isOpen) fetchResources();
  }, [isOpen]);

  const onSubmit = async (data: IssueFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post(`/clients/${clientId}/issues`, data);
      onSuccess();
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to log issue');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Log Client Issue</h2>
        <p className="text-sm text-gray-500 mb-6">Create a complaint/issue and assign it to the hardware or agronomy team.</p>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 border border-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Issue Title *</label>
            <input
              {...register('title')}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., Sensor connectivity issue"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Detailed Description *</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Provide more context..."
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority *</label>
              <select
                {...register('priority')}
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assign To</label>
              <select
                {...register('assigned_to_id')}
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                ))}
              </select>
            </div>
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
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-bold"
            >
              {isLoading ? 'Logging...' : 'Log Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
