'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api/axios';

const reportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  report_type: z.enum(['WEEKLY', 'BI_WEEKLY', 'FIELD_OPERATION', 'QA']),
  notes: z.string().optional().nullable(),
  report_date: z.string().min(1, 'Report date is required'),
  device_id: z.string().optional().nullable(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface FieldReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  devices: { id: string; name: string }[];
}

export default function FieldReportModal({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  devices,
}: FieldReportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      report_type: 'WEEKLY',
      report_date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/reports/', {
        ...data,
        client_id: clientId,
        device_id: data.device_id || null,
      });
      onSuccess();
      reset();
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // FastAPI 422 validation errors — extract messages
        setError(detail.map((d: any) => d.msg).join(', '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Failed to submit report. Please check all fields.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">New Field Report</h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 border border-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Report Title *</label>
            <input
              {...register('title')}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., Weekly Field Visit - May Week 4"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Report Type *</label>
              <select
                {...register('report_type')}
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="BI_WEEKLY">Bi-Weekly</option>
                <option value="FIELD_OPERATION">Field Operation</option>
                <option value="QA">QA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Linked Device</label>
              <select
                {...register('device_id')}
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">None</option>
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Report Date *</label>
            <input
              type="date"
              {...register('report_date')}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {errors.report_date && <p className="mt-1 text-xs text-red-500">{errors.report_date.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Field Notes & Observations</label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Describe crop status, device performance, etc."
            />
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-bold"
            >
              {isLoading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
