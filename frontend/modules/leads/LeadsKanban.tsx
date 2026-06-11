'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';
import LeadFormModal from './LeadFormModal';
import { toast } from '@/lib/toast';
import { formatApiError } from '@/lib/formatApiError';
import { Plus, Calendar, Clock, MapPin, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/auth/useAuthStore';

// All 7 stages in order
const STAGES = [
  { key: 'NEW_LEAD',          label: 'New Lead',          color: 'bg-slate-200 text-slate-700' },
  { key: 'CONTACTED',         label: 'Contacted',         color: 'bg-blue-200 text-blue-800' },
  { key: 'MEETING_SCHEDULED', label: 'Meeting Scheduled', color: 'bg-yellow-200 text-yellow-800' },
  { key: 'PROPOSAL_SENT',     label: 'Proposal Sent',     color: 'bg-orange-200 text-orange-800' },
  { key: 'NEGOTIATION',       label: 'Negotiation',       color: 'bg-purple-200 text-purple-800' },
  { key: 'WON',               label: 'Won',               color: 'bg-green-200 text-green-800' },
  { key: 'LOST',              label: 'Lost',              color: 'bg-red-200 text-red-800' },
];

// Allowed next stages per stage
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW_LEAD:           ['CONTACTED', 'LOST'],
  CONTACTED:          ['MEETING_SCHEDULED', 'NEGOTIATION', 'LOST'],
  MEETING_SCHEDULED:  ['PROPOSAL_SENT', 'NEGOTIATION', 'LOST'],
  PROPOSAL_SENT:      ['NEGOTIATION', 'WON', 'LOST'],
  NEGOTIATION:        ['WON', 'LOST', 'PROPOSAL_SENT'],
  WON:                [],
  LOST:               ['NEW_LEAD'],
};

interface Activity {
  id: string;
  activity_type: 'FOLLOW_UP' | 'MEETING' | 'FARM_VISIT';
  scheduled_at: string | null;
  notes: string | null;
}

interface Lead {
  id: string;
  name: string;
  company_name: string;
  stage: string;
  follow_up_date: string | null;
  email: string | null;
  phone: string | null;
  quotation_amount: number | null;
  client_id: string | null;
  activities: Activity[];
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  FOLLOW_UP:  <Clock className="w-3 h-3" />,
  MEETING:    <Calendar className="w-3 h-3" />,
  FARM_VISIT: <MapPin className="w-3 h-3" />,
};

function ActivityModal({
  isOpen, onClose, lead, onSuccess,
}: {
  isOpen: boolean; onClose: () => void; lead: Lead | null; onSuccess: () => void;
}) {
  const [form, setForm] = useState({ activity_type: 'FOLLOW_UP', scheduled_at: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    setLoading(true); setError('');
    try {
      await api.post(`/leads/${lead.id}/activities`, {
        activity_type: form.activity_type,
        scheduled_at: form.scheduled_at || null,
        notes: form.notes || null,
      });
      onSuccess(); onClose();
      toast.success('Activity logged successfully');
      setForm({ activity_type: 'FOLLOW_UP', scheduled_at: '', notes: '' });
    } catch (err: unknown) {
      const message = formatApiError(err, 'Failed to log activity');
      toast.error(message);
      setError(message);
    } finally { setLoading(false); }
  };

  if (!isOpen || !lead) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Log Activity</h2>
        <p className="text-sm text-gray-500 mb-4">For: <strong>{lead.name}</strong></p>
        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select value={form.activity_type} onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="MEETING">Meeting</option>
              <option value="FARM_VISIT">Farm Visit</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Scheduled At</label>
            <input type="datetime-local" value={form.scheduled_at}
              onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold disabled:opacity-50">
              {loading ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeadsKanban() {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const canManage = user && ['ADMIN', 'MANAGER', 'BUSINESS'].includes(user.role);
  const canDelete = user && ['ADMIN', 'MANAGER'].includes(user.role);

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      setLeads(res.data);
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to load leads'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const moveLead = async (id: string, currentStage: string, newStage: string) => {
    const allowed = ALLOWED_TRANSITIONS[currentStage] ?? [];
    if (!allowed.includes(newStage)) {
      const message = `Cannot move from ${currentStage.replace(/_/g,' ')} to ${newStage.replace(/_/g,' ')}`;
      toast.warning(message);
      setMoveError(message);
      setTimeout(() => setMoveError(null), 3000);
      return;
    }
    try {
      await api.patch(`/leads/${id}`, { stage: newStage });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: newStage } : l));
      toast.success('Lead stage updated');
    } catch (err: unknown) {
      const message = formatApiError(err, 'Failed to update lead stage');
      toast.error(message);
      setMoveError(message);
      setTimeout(() => setMoveError(null), 4000);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await api.delete(`/leads/${leadId}`);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      toast.success('Lead deleted successfully');
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to delete lead'));
    }
  };

  const handleConvert = async (leadId: string) => {
    if (!confirm('Convert this lead to an active client?')) return;
    try {
      await api.post(`/leads/${leadId}/convert`);
      await fetchLeads();
      toast.success('Lead converted to client successfully');
    } catch (err: unknown) {
      const message = formatApiError(err, 'Failed to convert lead');
      toast.error(message);
      setMoveError(message);
      setTimeout(() => setMoveError(null), 4000);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading pipeline...</div>;

  return (
    <>
      {moveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          ⚠ {moveError}
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-3 text-sm text-gray-500">
          <span>{leads.filter(l => l.stage === 'WON').length} Won</span>
          <span>·</span>
          <span>{leads.filter(l => !['WON','LOST'].includes(l.stage)).length} Active</span>
        </div>
        {canManage && (
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm text-sm cursor-pointer">
            <Plus className="w-4 h-4 mr-2" /> Create Lead
          </button>
        )}
      </div>

      <div className="flex space-x-3 overflow-x-auto pb-6">
        {STAGES.map(({ key: stage, label, color }) => (
          <div key={stage} className="flex-shrink-0 w-72 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${color}`}>
                {label}
              </span>
              <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                {leads.filter(l => l.stage === stage).length}
              </span>
            </div>

            <div className="space-y-2.5">
              {leads.filter(l => l.stage === stage).map(lead => (
                <div key={lead.id} className="bg-white p-3.5 rounded-lg shadow-sm border border-slate-200 hover:border-blue-400 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm leading-tight">{lead.name}</p>
                      <p className="text-xs text-gray-500">{lead.company_name}</p>
                    </div>
                    {canDelete && (
                      <button onClick={() => handleDelete(lead.id)}
                        className="text-red-300 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0 cursor-pointer">
                        ✕
                      </button>
                    )}
                  </div>

                  {lead.quotation_amount && (
                    <p className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full inline-block mb-2">
                      ${Number(lead.quotation_amount).toLocaleString()}
                    </p>
                  )}

                  {lead.activities && lead.activities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {lead.activities.slice(0, 2).map(a => (
                        <span key={a.id} className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                          {ACTIVITY_ICONS[a.activity_type]}
                          {a.activity_type.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {lead.activities.length > 2 && (
                        <span className="text-[10px] text-gray-400">+{lead.activities.length - 2} more</span>
                      )}
                    </div>
                  )}

                  {stage === 'WON' && canManage && !lead.client_id && (
                    <button
                      onClick={() => handleConvert(lead.id)}
                      className="w-full mb-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Convert to Client
                    </button>
                  )}

                  <div className="border-t border-slate-50 pt-2.5 mt-2 flex items-center justify-between">
                    {/* Stage move buttons — only allowed transitions */}
                    {canManage && (
                      <div className="flex items-center gap-1">
                        {(ALLOWED_TRANSITIONS[stage] ?? []).slice(0, 3).map(s => (
                          <button key={s} title={`→ ${s.replace(/_/g,' ')}`}
                            onClick={() => moveLead(lead.id, stage, s)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-gray-500 text-[9px] font-bold rounded transition-colors uppercase cursor-pointer">
                            {s.replace(/_/g,' ').split(' ').map(w => w[0]).join('')}
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Log activity button */}
                    {canManage && (
                      <button
                        onClick={() => { setSelectedLead(lead); setIsActivityOpen(true); }}
                        className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Log activity"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {leads.filter(l => l.stage === stage).length === 0 && (
                <div className="py-6 text-center text-slate-300 text-xs italic border-2 border-dashed border-slate-200 rounded-lg">
                  Empty
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLeads}
      />
      <ActivityModal
        isOpen={isActivityOpen}
        onClose={() => { setIsActivityOpen(false); setSelectedLead(null); }}
        lead={selectedLead}
        onSuccess={fetchLeads}
      />
    </>
  );
}
