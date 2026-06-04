'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api/axios';

const deviceSchema = z.object({
  name: z.string().min(1, 'Device name is required'),
  serial_number: z.string().min(1, 'Serial number is required'),
  status: z.enum(['UNDER_DEVELOPMENT', 'QA_FOR_AGRONOMIST', 'QA_PASSED_IN_INVENTORY', 'INSTALLED', 'BACK_AT_OFFICE']).optional(),
  installation_location: z.string().nullable().optional(),
  notes: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deviceId?: string;
  initialData?: Partial<DeviceFormData>;
}

export default function DeviceFormModal({
  isOpen,
  onClose,
  onSuccess,
  deviceId,
  initialData,
}: DeviceFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: DeviceFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (deviceId) {
        await api.patch(`/devices/${deviceId}`, data);
      } else {
        await api.post('/devices', data);
      }
      onSuccess();
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save device');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          {deviceId ? 'Edit Device' : 'Create Device'}
        </h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 border border-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Device Name *</label>
            <input
              {...register('name')}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., Agri Sensor v1.0"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Serial Number *</label>
            <input
              {...register('serial_number')}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., SN-2024-001"
            />
            {errors.serial_number && (
              <p className="mt-1 text-xs text-red-500">{errors.serial_number.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              {...register('status')}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Select status...</option>
              <option value="UNDER_DEVELOPMENT">Under Development</option>
              <option value="QA_FOR_AGRONOMIST">QA for Agronomist</option>
              <option value="QA_PASSED_IN_INVENTORY">QA Passed in Inventory</option>
              <option value="INSTALLED">Installed</option>
              <option value="BACK_AT_OFFICE">Back at Office</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Installation Location</label>
            <input
              {...register('installation_location')}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., Farm A - Field 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              {...register('notes')}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              rows={3}
              placeholder="Additional notes..."
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
