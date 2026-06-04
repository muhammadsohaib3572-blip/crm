'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api/axios';

const leadSchema = z.object({
  name: z.string().min(1, 'Lead name is required'),
  company_name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().optional().nullable(),
  stage: z.enum(['NEW_LEAD', 'CONTACTED', 'NEGOTIATION', 'CONVERTED', 'LOST']),
  follow_up_date: z.string().optional().nullable(),
  quotation_amount: z.coerce.number().optional().nullable(),
  proposal_link: z.string().url('Invalid URL').optional().or(z.literal('')).nullable(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadId?: string;
  initialData?: Partial<LeadFormData>;
}

export default function LeadFormModal({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  initialData,
}: LeadFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema) as any,
    defaultValues: { stage: 'NEW_LEAD', ...initialData },
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = { ...data };
      if (!payload.proposal_link) delete payload.proposal_link;
      
      if (leadId) {
        await api.patch(`/leads/${leadId}`, payload);
      } else {
        await api.post('/leads', payload);
      }
      onSuccess();
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save lead');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          {leadId ? 'Edit Lead' : 'Create Lead'}
        </h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 border border-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Lead Name *</label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g., Amit Patel"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name *</label>
              <input
                {...register('company_name')}
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g., Patel Agriculture"
              />
              {errors.company_name && (
                <p className="mt-1 text-xs text-red-500">{errors.company_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  {...register('phone')}
                  className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Stage *</label>
                <select
                  {...register('stage')}
                  className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="NEW_LEAD">New Lead</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
                <input
                  {...register('follow_up_date')}
                  type="date"
                  className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Quotation Amount ($)</label>
              <input
                {...register('quotation_amount')}
                type="number"
                step="0.01"
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Proposal Link</label>
              <input
                {...register('proposal_link')}
                type="url"
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="https://..."
              />
              {errors.proposal_link && <p className="mt-1 text-xs text-red-500">{errors.proposal_link.message}</p>}
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
