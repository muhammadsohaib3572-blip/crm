'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';
import Link from 'next/link';
import { Plus, Info } from 'lucide-react';
import { useAuthStore } from '@/store/auth/useAuthStore';
import InventoryItemModal from './InventoryItemModal';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  category: string | null;
  cost: number;
  vendor: string | null;
}

export default function InventoryList() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setItems(res.data);
    } catch (error) {
      console.error('Failed to fetch inventory', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading inventory stock...</div>;

  const canManageInventory = user && ['ADMIN', 'MANAGER', 'HARDWARE'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {canManageInventory && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Component
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  item.quantity < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {item.quantity < 10 ? 'LOW STOCK' : 'IN STOCK'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">SKU: {item.sku}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">{item.category || 'General'}</p>
                <Link href={`/inventory/${item.id}`} className="p-1 text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <Info className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t flex items-end justify-between">
              <div>
                <p className="text-2xl font-black text-gray-900">{item.quantity}</p>
                <p className="text-[10px] text-gray-400 uppercase">Available Units</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">${item.cost}</p>
                <p className="text-[10px] text-gray-400 uppercase">Unit Cost</p>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-400">No inventory items found. Add some components to get started.</p>
          </div>
        )}
      </div>

      <InventoryItemModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchInventory} 
      />
    </div>
  );
}
