'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';
import { useAuthStore } from '@/store/auth/useAuthStore';
import { FileText, Plus, Calendar, Tag } from 'lucide-react';

interface FieldReport {
  id: string;
  title: string;
  report_type: 'WEEKLY' | 'BI_WEEKLY' | 'FIELD_OPERATION' | 'QA';
  summary: string | null;
  notes: string | null;
  report_date: string;
  client_id: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  company_name: string;
}

const TYPE_COLORS: Record<string, string> = {
  WEEKLY:          'bg-blue-100 text-blue-700',
  BI_WEEKLY:       'bg-purple-100 text-purple-700',
  FIELD_OPERATION: 'bg-green-100 text-green-700',
  QA:              'bg-orange-100 text-orange-700',
};

function CreateReportModal({
  isOpen, onClose, onSuccess, clients,
}: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void; clients: Client[];
}) {
  const [form, setForm] = useState({
    client_id: '', report_type: 'WEEKLY', title: '', summary: '', notes: '',
    report_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.title) { setError('Client and title are required'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/reports', form);
      onSuccess(); onClose();
      setForm({ client_id: '', report_type: 'WEEKLY', title: '', summary: '', notes: '',
        report_date: new Date().toISOString().split('T')[0] });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create report');
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">New Field Report</h2>
        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
              <select value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="WEEKLY">Weekly</option>
                <option value="BI_WEEKLY">Bi-Weekly</option>
                <option value="FIELD_OPERATION">Field Operation</option>
                <option value="QA">QA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Date *</label>
              <input type="date" value={form.report_date} onChange={e => setForm(f => ({ ...f, report_date: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Report title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
            <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              rows={2} className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Brief summary..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Detailed notes..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FieldReportsList() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const canCreate = user && ['ADMIN', 'MANAGER', 'AGRONOMY'].includes(user.role);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data);
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchReports();
    api.get('/clients').then(r => setClients(r.data)).catch(() => {});
  }, []);

  const filtered = typeFilter === 'ALL' ? reports : reports.filter(r => r.report_type === typeFilter);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading reports...</div>;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'WEEKLY', 'BI_WEEKLY', 'FIELD_OPERATION', 'QA'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
                typeFilter === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}>
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        {canCreate && (
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-sm text-sm">
            <Plus className="w-4 h-4 mr-2" /> New Report
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filtered.map(report => (
          <div key={report.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{report.title}</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${TYPE_COLORS[report.report_type]}`}>
                      {report.report_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {report.summary && <p className="text-sm text-gray-600">{report.summary}</p>}
                  {report.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{report.notes}</p>}
                </div>
              </div>
              <div className="text-right text-xs text-gray-500 flex-shrink-0 ml-4">
                <div className="flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3" />
                  {new Date(report.report_date).toLocaleDateString()}
                </div>
                <div className="text-gray-400 mt-1">
                  Added {new Date(report.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-20 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No field reports found.</p>
          </div>
        )}
      </div>

      <CreateReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchReports}
        clients={clients}
      />
    </>
  );
}
