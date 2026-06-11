'use client';

import { useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api/axios';
import { toast } from '@/lib/toast';
import { formatApiError } from '@/lib/formatApiError';

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().optional().nullable(),
  cost: z.coerce.number().min(0, 'Cost must be positive'),
  notes: z.string().optional().nullable(),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InventoryItemModal({
  isOpen,
  onClose,
  onSuccess,
}: InventoryItemModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema) as Resolver<ItemFormData, any>,
    defaultValues: {
      cost: 0
    },
  });

  const onSubmit = async (data: ItemFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/inventory', data);
      toast.success('Inventory item added successfully');
      onSuccess();
      reset();
      onClose();
    } catch (err: unknown) {
      const message = formatApiError(err, 'Failed to save inventory item');
      toast.error(message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Add New Component</h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 border border-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Component Name *</label>
            <input
              {...register('name')}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., Soil Moisture Sensor v2"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">SKU *</label>
            <input
              {...register('sku')}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., SEN-SM-002"
            />
            {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                {...register('category')}
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g., Sensors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Cost ($) *</label>
              <input
                {...register('cost')}
                type="number"
                step="0.01"
                className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {errors.cost && <p className="mt-1 text-xs text-red-500">{errors.cost.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Technical Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Specifications, links, etc."
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
              {isLoading ? 'Saving...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
