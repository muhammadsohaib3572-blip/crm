'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api/axios';

const serviceTags = [
  'AquaSave Pro',
  'Mobile Device',
  'Soil Sampling',
  'Ag5X',
  'Advisory',
  'Drone Survey',
  'Drone Spray'
];

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  company_name: z.string().min(1, 'Company name is required'),
  farm_size: z.coerce.number().optional().nullable(),
  address: z.string().optional().nullable(),
  contact_info: z.string().optional().nullable(),
  onboarding_date: z.string().optional().nullable(),
  crop_cycle_end_date: z.string().optional().nullable(),
  services: z.array(z.string()).default([]),
  farm_location: z.string().optional().nullable(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId?: string;
  initialData?: Partial<ClientFormData>;
}

export default function ClientFormModal({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  initialData,
}: ClientFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      services: [],
      ...initialData,
    },
  });

  const selectedServices = watch('services') || [];

  const toggleService = (service: string) => {
    const current = [...selectedServices];
    if (current.includes(service)) {
      setValue('services', current.filter(s => s !== service));
    } else {
      setValue('services', [...current, service]);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (clientId) {
        await api.patch(`/clients/${clientId}`, data);
      } else {
        await api.post('/clients', data);
      }
      onSuccess();
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save client');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full shadow-xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          {clientId ? 'Edit Client Profile' : 'Register New Client'}
        </h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 border border-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Name *</label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Rajesh Kumar"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Company / Farm Name *</label>
              <input
                {...register('company_name')}
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Kumar Agriculture"
              />
              {errors.company_name && (
                <p className="mt-1 text-xs text-red-500">{errors.company_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Farm Size (acres)</label>
              <input
                {...register('farm_size')}
                type="number"
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Info</label>
              <input
                {...register('contact_info')}
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Onboarding Date</label>
              <input
                {...register('onboarding_date')}
                type="date"
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Crop Cycle End Date</label>
              <input
                {...register('crop_cycle_end_date')}
                type="date"
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subscribed Services</label>
            <div className="flex flex-wrap gap-2">
              {serviceTags.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    selectedServices.includes(service)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Farm Location / Coordinates</label>
            <textarea
              {...register('farm_location')}
              rows={2}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Google Maps link or lat/long"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-bold shadow-lg shadow-blue-200"
            >
              {isLoading ? 'Saving...' : clientId ? 'Update Client' : 'Register Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
