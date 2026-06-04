'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';
import { useAuthStore } from '@/store/auth/useAuthStore';
import { Package, Truck, Image as ImageIcon, Calendar, Plus } from 'lucide-react';
import ProcureModal from './ProcureModal';

interface Procurement {
  id: string;
  vendor_details: string | null;
  order_date: string;
  batch_quantity: number;
  total_cost: number;
  media_urls: string[] | null;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  category: string | null;
  vendor: string | null;
  cost: number;
  notes: string | null;
  procurements: Procurement[];
}

export default function InventoryItemDetails({ id }: { id: string }) {
  const { user } = useAuthStore();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcureModalOpen, setIsProcureModalOpen] = useState(false);

  const fetchItem = async () => {
    try {
      const res = await api.get(`/inventory/${id}`);
      setItem(res.data);
    } catch (error) {
      console.error('Failed to fetch inventory item', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading component details...</div>;
  if (!item) return <div className="p-8 text-center text-red-500 font-bold">Item not found.</div>;

  const canProcure = user && ['ADMIN', 'MANAGER', 'HARDWARE'].includes(user.role);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
              <p className="text-xs text-gray-700 font-bold uppercase tracking-widest">SKU: {item.sku}</p>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-700 font-medium">Available Units</span>
              <span className="text-sm font-bold text-gray-900">{item.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700 font-medium">Category</span>
              <span className="text-sm font-bold text-gray-900">{item.category || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700 font-medium">Last Vendor</span>
              <span className="text-sm font-bold text-gray-900">{item.vendor || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700 font-medium">Unit Cost</span>
              <span className="text-sm font-bold text-gray-900">${Number(item.cost).toFixed(2)}</span>
            </div>
          </div>
          
          {item.notes && (
            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-gray-700 font-bold uppercase mb-2">Technical Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed italic">"{item.notes}"</p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-blue-500" /> Procurement History
            </h3>
            {canProcure && (
              <button 
                onClick={() => setIsProcureModalOpen(true)}
                className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold"
              >
                <Plus className="w-3 h-3 mr-1" /> New Batch
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {item.procurements && item.procurements.length > 0 ? (
              item.procurements.map((proc) => (
                <div key={proc.id} className="border-l-2 border-slate-100 ml-4 pl-6 relative">
                  <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1 shadow-sm shadow-blue-200"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-bold text-gray-700 uppercase">{new Date(proc.order_date).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-gray-900">{proc.batch_quantity} Units Procured</h4>
                      <p className="text-sm text-gray-700 mt-1">{proc.vendor_details || 'Vendor details not logged'}</p>
                    </div>
                    <div className="text-right sm:bg-slate-50 p-2 rounded-lg border border-slate-100 min-w-[100px]">
                      <p className="text-sm font-bold text-blue-600">${Number(proc.total_cost).toFixed(2)}</p>
                      <p className="text-[10px] text-gray-700 font-bold uppercase">Total Cost</p>
                    </div>
                  </div>

                  {proc.media_urls && proc.media_urls.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {proc.media_urls.map((url, idx) => (
                        <div key={idx} className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200">
                          <img 
                            src={url.replace(/\\/g, '/')} 
                            alt={`Procurement ${idx}`} 
                            className="w-20 h-20 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-gray-700 font-medium">No procurement logs found for this item.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProcureModal 
        isOpen={isProcureModalOpen} 
        onClose={() => setIsProcureModalOpen(false)} 
        onSuccess={fetchItem} 
        itemId={item.id} 
        itemName={item.name} 
      />
    </div>
  );
}
