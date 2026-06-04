'use client';

import { useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api/axios';

const procureSchema = z.object({
  item_id: z.string().uuid(),
  vendor_details: z.string().optional().nullable(),
  order_date: z.string().min(1, 'Order date is required'),
  batch_quantity: z.preprocess((val) => typeof val === 'string' && val !== '' ? parseInt(val) : val, z.number().min(1, 'Quantity must be at least 1')),
  total_cost: z.preprocess((val) => typeof val === 'string' && val !== '' ? parseFloat(val) : val, z.number().min(0, 'Total cost must be positive')),
});

type ProcureFormData = z.infer<typeof procureSchema>;

interface ProcureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemId: string;
  itemName: string;
}

export default function ProcureModal({
  isOpen,
  onClose,
  onSuccess,
  itemId,
  itemName,
}: ProcureModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProcureFormData>({
    resolver: zodResolver(procureSchema) as Resolver<ProcureFormData, any>,
    defaultValues: { 
      item_id: itemId, 
      order_date: new Date().toISOString().split('T')[0],
      batch_quantity: 1,
      total_cost: 0
    },
  });

  const onSubmit = async (data: ProcureFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/inventory/procure', data);
      onSuccess();
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record procurement');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold mb-1 text-gray-900">Record Procurement</h2>
        <p className="text-sm text-gray-500 mb-6 font-medium">Item: {itemName}</p>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 border border-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Order Date *</label>
              <input
                {...register('order_date')}
                type="date"
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {errors.order_date && <p className="mt-1 text-xs text-red-500">{errors.order_date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity *</label>
              <input
                {...register('batch_quantity')}
                type="number"
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {errors.batch_quantity && <p className="mt-1 text-xs text-red-500">{errors.batch_quantity.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Total Cost ($) *</label>
            <input
              {...register('total_cost')}
              type="number"
              step="0.01"
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {errors.total_cost && <p className="mt-1 text-xs text-red-500">{errors.total_cost.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Vendor Details</label>
            <textarea
              {...register('vendor_details')}
              rows={2}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Name, contact, location..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-bold"
            >
              {isLoading ? 'Processing...' : 'Record Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
