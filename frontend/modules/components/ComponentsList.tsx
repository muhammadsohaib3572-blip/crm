'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';
import { useAuthStore } from '@/store/auth/useAuthStore';
import { toast } from '@/lib/toast';
import { formatApiError } from '@/lib/formatApiError';
import { CircuitBoard, Plus, ChevronDown, ChevronUp, Package } from 'lucide-react';

interface ProcurementRecord {
  id: string;
  supplier: string | null;
  vendor: string | null;
  quantity: number;
  cost: number;
  purchase_date: string;
  image_url: string | null;
}

interface Component {
  id: string;
  name: string;
  type: string;
  stock_quantity: number;
  notes: string | null;
  procurements: ProcurementRecord[];
}

const TYPE_COLORS: Record<string, string> = {
  Sensors:         'bg-blue-100 text-blue-700',
  PCB:             'bg-purple-100 text-purple-700',
  Microcontrollers:'bg-indigo-100 text-indigo-700',
  Batteries:       'bg-yellow-100 text-yellow-700',
  Casings:         'bg-gray-100 text-gray-700',
  'Other Components': 'bg-green-100 text-green-700',
};

function CreateComponentModal({
  isOpen, onClose, onSuccess,
}: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [form, setForm] = useState({ name: '', type: 'Sensors', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.warning('Name is required');
      setError('Name is required');
      return;
    }
    setLoading(true); setError('');
    try {
      await api.post('/components', form);
      toast.success('Component created successfully');
      onSuccess(); onClose();
      setForm({ name: '', type: 'Sensors', notes: '' });
    } catch (err: unknown) {
      const message = formatApiError(err, 'Failed to create component');
      toast.error(message);
      setError(message);
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Add Component</h2>
        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Soil Moisture Sensor" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
              {['Sensors', 'PCB', 'Microcontrollers', 'Batteries', 'Casings', 'Other Components'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  const normalized = path.replace(/\\/g, '/');
  if (normalized.startsWith('http')) return normalized;
  return `${API_BASE}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
}

function ProcureModal({
  isOpen, onClose, onSuccess, component,
}: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void; component: Component | null;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ supplier: '', vendor: '', quantity: 1, cost: '', purchase_date: today });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!component) return;
    if (!form.cost || Number(form.cost) <= 0) {
      toast.warning('Cost must be greater than 0');
      setError('Cost must be greater than 0');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await api.post(`/components/${component.id}/procure`, {
        component_id: component.id,
        supplier: form.supplier || null,
        vendor: form.vendor || null,
        quantity: Number(form.quantity),
        cost: Number(form.cost),
        purchase_date: form.purchase_date,
      });
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        await api.post(
          `/components/${component.id}/procure/upload-image?procurement_id=${res.data.id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }
      onSuccess(); onClose();
      toast.success('Procurement recorded successfully');
      setForm({ supplier: '', vendor: '', quantity: 1, cost: '', purchase_date: today });
      setImageFile(null);
    } catch (err: unknown) {
      const message = formatApiError(err, 'Failed to record procurement');
      toast.error(message);
      setError(message);
    } finally { setLoading(false); }
  };

  if (!isOpen || !component) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Procure Stock</h2>
        <p className="text-sm text-gray-500 mb-6">For: <strong className="text-gray-800">{component.name}</strong></p>
        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input type="number" min={1} value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost *</label>
              <input type="number" step="0.01" min="0.01" value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Supplier name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <input type="text" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Vendor name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
            <input type="date" value={form.purchase_date}
              onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Component Photo (JPG/PNG)</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-700"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold disabled:opacity-50">
              {loading ? 'Recording...' : 'Record Procurement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ComponentsList() {
  const { user } = useAuthStore();
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProcureOpen, setIsProcureOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canManage = user && ['ADMIN', 'MANAGER', 'HARDWARE'].includes(user.role);

  const fetchComponents = async () => {
    try {
      const res = await api.get('/components');
      setComponents(res.data);
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to load components'));
    }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchComponents(); }, []);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading components...</div>;

  return (
    <>
      <div className="flex justify-end mb-4">
        {canManage && (
          <button onClick={() => setIsCreateOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm text-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Component
          </button>
        )}
      </div>

      <div className="space-y-3">
        {components.map(comp => (
          <div key={comp.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div
              className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedId(expandedId === comp.id ? null : comp.id)}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <CircuitBoard className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{comp.name}</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${TYPE_COLORS[comp.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {comp.type}
                    </span>
                  </div>
                  {comp.notes && <p className="text-xs text-gray-500 mt-0.5">{comp.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-black text-gray-900">{comp.stock_quantity}</p>
                  <p className="text-[10px] text-gray-400 uppercase">In Stock</p>
                </div>
                {canManage && (
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedComponent(comp); setIsProcureOpen(true); }}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    + Procure
                  </button>
                )}
                {expandedId === comp.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>

            {expandedId === comp.id && (
              <div className="border-t border-gray-100 p-5 bg-gray-50">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Procurement History
                </h4>
                {comp.procurements.length > 0 ? (
                  <div className="space-y-2">
                    {comp.procurements.map(p => (
                      <div key={p.id} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {p.image_url && (
                            <img
                              src={mediaUrl(p.image_url) || ''}
                              alt="Procurement"
                              className="w-12 h-12 rounded object-cover border border-gray-200"
                            />
                          )}
                          <div>
                            <p className="text-sm font-bold text-gray-900">{p.quantity} units @ ${Number(p.cost).toFixed(2)}/unit</p>
                            <p className="text-xs text-gray-500">
                              {p.supplier && `Supplier: ${p.supplier}`}
                              {p.supplier && p.vendor && ' · '}
                              {p.vendor && `Vendor: ${p.vendor}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {new Date(p.purchase_date).toLocaleDateString()}
                          <p className="font-bold text-gray-700">Total: ${(p.quantity * Number(p.cost)).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-4">No procurement records yet.</p>
                )}
              </div>
            )}
          </div>
        ))}

        {components.length === 0 && (
          <div className="py-20 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <CircuitBoard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No components added yet.</p>
          </div>
        )}
      </div>

      <CreateComponentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchComponents}
      />
      <ProcureModal
        isOpen={isProcureOpen}
        onClose={() => { setIsProcureOpen(false); setSelectedComponent(null); }}
        onSuccess={fetchComponents}
        component={selectedComponent}
      />
    </>
  );
}
