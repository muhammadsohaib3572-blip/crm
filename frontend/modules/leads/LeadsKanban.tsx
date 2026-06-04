'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';
import LeadFormModal from './LeadFormModal';
import { Plus } from 'lucide-react';

const stages = ['NEW_LEAD', 'CONTACTED', 'NEGOTIATION', 'CONVERTED', 'LOST'];

interface Lead {
  id: string;
  name: string;
  company_name: string;
  stage: string;
  follow_up_date: string | null;
}

export default function LeadsKanban() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      setLeads(res.data);
    } catch (error) {
      console.error('Failed to fetch leads', error);
    } finally {
      setIsLoading(false);
    }
  };

  const moveLead = async (id: string, newStage: string) => {
    try {
      await api.patch(`/leads/${id}`, { stage: newStage });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage: newStage } : l)));
    } catch (error) {
      console.error('Failed to update lead stage', error);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/leads/${leadId}`);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } catch (error) {
      console.error('Failed to delete lead', error);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading pipeline...</div>;

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Lead
        </button>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-6">
        {stages.map((stage) => (
          <div key={stage} className="flex-shrink-0 w-80 bg-slate-100/50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{stage.replace(/_/g, ' ')}</h3>
              <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                {leads.filter(l => l.stage === stage).length}
              </span>
            </div>
            
            <div className="space-y-3">
              {leads
                .filter((lead) => lead.stage === stage)
                .map((lead) => (
                  <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-blue-400 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">{lead.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{lead.company_name}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                      >
                        ✕
                      </button>
                    </div>

                    {lead.follow_up_date && (
                      <div className="mt-3 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-flex items-center">
                        <span className="mr-1">Follow-up:</span>
                        {new Date(lead.follow_up_date).toLocaleDateString()}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t pt-3 border-slate-50">
                      <div className="flex space-x-1">
                        {stages.map((s) => (
                          s !== stage && (
                            <button
                              key={s}
                              onClick={() => moveLead(lead.id, s)}
                              className="w-2.5 h-2.5 rounded-full bg-slate-200 hover:bg-blue-500 transition-colors"
                              title={`Move to ${s.replace(/_/g, ' ')}`}
                            ></button>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              
              {leads.filter(l => l.stage === stage).length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs italic border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  No leads in this stage
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
    </>
  );
}
