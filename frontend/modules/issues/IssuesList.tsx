'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';
import { useAuthStore } from '@/store/auth/useAuthStore';
import { AlertCircle, Plus, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  client_id: string;
  assigned_to_id: string | null;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  company_name: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN:        'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED:    'bg-green-100 text-green-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW:    'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-orange-100 text-orange-700',
  HIGH:   'bg-red-100 text-red-700',
};

function CreateIssueModal({
  isOpen, onClose, onSuccess, clients,
}: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void; clients: Client[];
}) {
  const [statuses] = useState<string[]>(['OPEN', 'IN_PROGRESS', 'RESOLVED']);
  // Removed API call; using static status options
  const [form, setForm] = useState({ client_id: '', title: '', description: '', priority: 'MEDIUM', status: 'OPEN' });
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.title) { setError('Client and title are required'); return; }
    setLoading(true); setError('');
    try {
      await api.post(`/clients/${form.client_id}/issues`, {
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: form.status,
      });
      onSuccess(); onClose();
      setForm({ client_id: '', title: '', description: '', priority: 'MEDIUM', status: 'OPEN' });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create issue');
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Log New Issue</h2>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Issue title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Describe the issue..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
              {statuses.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50">
              {loading ? 'Creating...' : 'Log Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IssuesList() {
  const { user } = useAuthStore();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, Client>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const canCreate = user && ['ADMIN', 'MANAGER', 'BUSINESS'].includes(user.role);

  const fetchIssues = async () => {
    try {
      // Fetch all clients then get issues per client
      const clientsRes = await api.get('/clients');
      const allClients: Client[] = clientsRes.data;
      setClients(allClients);
      const map: Record<string, Client> = {};
      allClients.forEach(c => { map[c.id] = c; });
      setClientMap(map);

      const allIssues: Issue[] = [];
      await Promise.all(
        allClients.map(async (c) => {
          try {
            const res = await api.get(`/clients/${c.id}/issues`);
            allIssues.push(...res.data);
          } catch { /* skip clients with no issues */ }
        })
      );
      allIssues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setIssues(allIssues);
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchIssues(); }, []);




  const filtered = statusFilter === 'ALL' ? issues : issues.filter(i => i.status === statusFilter);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading issues...</div>;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
                statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        {canCreate && (
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-sm text-sm">
            <Plus className="w-4 h-4 mr-2" /> Log Issue
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Issue', 'Client', 'Priority', 'Status', 'Date', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.map(issue => (
              <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-bold text-gray-900 text-sm">{issue.title}</p>
                  {issue.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{issue.description}</p>
                  )}
                </td>
                <td className="px-5 py-4">
                  {clientMap[issue.client_id] ? (
                    <Link href={`/clients/${issue.client_id}`}
                      className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1">
                      {clientMap[issue.client_id].name}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${PRIORITY_COLORS[issue.priority]}`}>
                    {issue.priority}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[issue.status]}`}>
                    {issue.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">
                  {new Date(issue.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/clients/${issue.client_id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold">
                    View Client
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400 font-medium">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  No issues found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreateIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchIssues}
        clients={clients}
      />
    </>
  );
}
