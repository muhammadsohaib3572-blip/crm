'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api/axios';
import { useAuthStore } from '@/store/auth/useAuthStore';
import { Plus, Download, CreditCard, Filter, X } from 'lucide-react';

interface Invoice {
  id: string;
  client_id: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
  file_path: string | null;
}

interface Client {
  id: string;
  name: string;
  company_name: string;
}

// ── Schemas ──────────────────────────────────────────────
const invoiceSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']),
  due_date: z.string().min(1, 'Due date is required'),
});

const paymentSchema = z.object({
  invoice_id: z.string().min(1, 'Invoice is required'),
  client_id: z.string().min(1),
  amount: z.coerce.number().positive('Amount must be positive'),
  payment_date: z.string().min(1, 'Payment date is required'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;

const STATUS_COLORS: Record<string, string> = {
  PAID:      'bg-green-100 text-green-700',
  OVERDUE:   'bg-red-100 text-red-700',
  SENT:      'bg-blue-100 text-blue-700',
  DRAFT:     'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-orange-100 text-orange-700',
};

// ── New Invoice Modal ─────────────────────────────────────
function NewInvoiceModal({
  isOpen, onClose, onSuccess, clients,
}: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void; clients: Client[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      status: 'DRAFT',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: InvoiceFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/billing/invoices', data);
      onSuccess();
      reset();
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail || 'Failed to create invoice');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">New Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client *</label>
            <select {...register('client_id')} className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company_name}</option>)}
            </select>
            {errors.client_id && <p className="mt-1 text-xs text-red-500">{errors.client_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount *</label>
              <input type="number" step="0.01" {...register('amount')} className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select {...register('status')} className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date *</label>
            <input type="date" {...register('due_date')} className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.due_date && <p className="mt-1 text-xs text-red-500">{errors.due_date.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-bold">
              {isLoading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Record Payment Modal ──────────────────────────────────
function RecordPaymentModal({
  isOpen, onClose, onSuccess, invoice,
}: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void; invoice: Invoice | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: { payment_date: new Date().toISOString().split('T')[0] },
  });

  useEffect(() => {
    if (invoice) {
      reset({
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        amount: Number(invoice.amount),
        payment_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [invoice, reset]);

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/billing/payments', data);
      onSuccess();
      reset();
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : detail || 'Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-gray-700 font-medium">Invoice: <span className="font-bold text-gray-900">INV-{invoice.id.slice(0, 8).toUpperCase()}</span></p>
          <p className="text-sm text-gray-700 font-medium">Total Amount: <span className="font-bold text-gray-900">${Number(invoice.amount).toLocaleString()}</span></p>
        </div>

        {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('invoice_id')} />
          <input type="hidden" {...register('client_id')} />

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Amount *</label>
            <input type="number" step="0.01" {...register('amount')} className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Date *</label>
            <input type="date" {...register('payment_date')} className="w-full px-4 py-2 mt-1 border rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.payment_date && <p className="mt-1 text-xs text-red-500">{errors.payment_date.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-bold">
              {isLoading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main BillingLedger Component ─────────────────────────
export default function BillingLedger() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const canManageBilling = user && ['ADMIN', 'MANAGER', 'ACCOUNTS'].includes(user.role);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/billing/invoices');
      setInvoices(res.data);
    } catch (error) {
      console.error('Failed to fetch invoices', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // Fetch clients for the New Invoice modal
    api.get('/clients').then(res => setClients(res.data)).catch(() => {});
  }, []);

  const handleDownload = (invoice: Invoice) => {
    if (invoice.file_path) {
      window.open(invoice.file_path.replace(/\\/g, '/'), '_blank');
    } else {
      alert('No PDF attached to this invoice.');
    }
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const filteredInvoices = statusFilter === 'ALL'
    ? invoices
    : invoices.filter(inv => inv.status === statusFilter);

  const statuses = ['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

  if (isLoading) return <div className="p-8 text-center text-gray-700">Loading billing records...</div>;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex flex-wrap gap-3 justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Invoice Ledger</h2>
            <p className="text-sm text-gray-700 mt-0.5">{filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} {statusFilter !== 'ALL' ? `— ${statusFilter}` : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filter {statusFilter !== 'ALL' && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{statusFilter}</span>}
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {statuses.map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 ${statusFilter === s ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                    >
                      {s === 'ALL' ? 'All Invoices' : s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* New Invoice Button */}
            {canManageBilling && (
              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold text-sm transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Invoice
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(invoice.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">INV-{invoice.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${Number(invoice.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[invoice.status] || 'bg-gray-100 text-gray-700'}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(invoice.due_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3">
                      {/* Download PDF */}
                      <button
                        onClick={() => handleDownload(invoice)}
                        title={invoice.file_path ? 'Download PDF' : 'No PDF attached'}
                        className={`flex items-center gap-1 text-xs font-bold transition-colors ${invoice.file_path ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`}
                        disabled={!invoice.file_path}
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>

                      {/* Record Payment */}
                      {canManageBilling && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleRecordPayment(invoice)}
                          className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-800 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-700 font-medium">
                    {statusFilter !== 'ALL' ? `No ${statusFilter} invoices found.` : 'No invoice records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <NewInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSuccess={fetchInvoices}
        clients={clients}
      />
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setSelectedInvoice(null); }}
        onSuccess={fetchInvoices}
        invoice={selectedInvoice}
      />
    </>
  );
}
