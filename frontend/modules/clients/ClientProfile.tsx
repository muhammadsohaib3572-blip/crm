'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';
import { useAuthStore } from '@/store/auth/useAuthStore';
import ClientIssueModal from './ClientIssueModal';
import FieldReportModal from './FieldReportModal';
import { Plus, Calendar, FileText, AlertCircle } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  serial_number: string;
  status: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
}

interface ClientIssue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

interface FieldReport {
  id: string;
  title: string;
  report_type: string;
  notes: string | null;
  created_at: string;
  file_path: string | null;
}

interface Client {
  id: string;
  name: string;
  company_name: string;
  farm_size: number | null;
  address: string | null;
  contact_info: string | null;
  onboarding_date: string | null;
  devices: Device[];
}

export default function ClientProfile({ id }: { id: string }) {
  const { user } = useAuthStore();
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [issues, setIssues] = useState<ClientIssue[]>([]);
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const fetchIssues = async () => {
    try {
      const res = await api.get(`/clients/${id}/issues`);
      setIssues(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch issues', error);
      setIssues([]);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports', { params: { client_id: id } });
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch reports', error);
      setReports([]);
    }
  };

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const [clientRes, invoicesRes, balanceRes, issuesRes, reportsRes] = await Promise.all([
          api.get(`/clients/${id}`),
          api.get('/billing/invoices', { params: { client_id: id } }),
          api.get(`/billing/clients/${id}/arrears`),
          api.get(`/clients/${id}/issues`),
          api.get('/reports', { params: { client_id: id } }),
        ]);

        setClient(clientRes.data);
        setInvoices(invoicesRes.data);
        setBalance(balanceRes.data.outstanding_balance ?? null);
        setIssues(issuesRes.data);
        setReports(reportsRes.data);
      } catch (error) {
        console.error('Failed to fetch client profile', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClientData();
  }, [id]);

  if (isLoading) return <div className="p-8 text-center text-gray-700">Loading profile data...</div>;
  if (!client) return <div className='p-8 text-center text-gray-900 font-bold'>Client not found.</div>;

  const canLogIssue = user && ['ADMIN', 'MANAGER', 'BUSINESS'].includes(user.role);
  const canUploadReport = user && ['ADMIN', 'MANAGER', 'AGRONOMY'].includes(user.role);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-t-4 border-blue-600">
          <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
          <p className="text-gray-700 font-medium">{client.company_name}</p>
          <div className="space-y-3 pt-4 border-t mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">Farm Size:</span>
              <span className="text-gray-900 font-bold">{client.farm_size || 'N/A'} acres</span>
            </div>
            <div className="flex flex-col text-sm">
              <span className="text-gray-700 font-medium">Address:</span>
              <span className="text-gray-900 mt-1">{client.address || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">Contact:</span>
              <span className="text-gray-900">{client.contact_info || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">Onboarded:</span>
              <span className="text-gray-900">{client.onboarding_date ? new Date(client.onboarding_date).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h3 className="text-lg font-bold text-gray-900">Historical Pain Points</h3>
            {canLogIssue && (
              <button 
                onClick={() => setIsIssueModalOpen(true)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Log new issue"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="space-y-4">
            {issues.length > 0 ? (
              issues.map(issue => (
                <div key={issue.id} className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      issue.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {issue.priority}
                    </span>
                    <span className="text-[10px] text-gray-600 font-bold uppercase">{new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{issue.title}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{issue.description}</p>
                  <div className="mt-2 text-right">
                    <span className="text-[10px] px-2 py-0.5 bg-white border border-red-200 rounded-full text-red-600 font-bold uppercase">{issue.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-700 italic">No historical issues recorded.</p>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Associated Hardware</h2>
          {client.devices && client.devices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {client.devices.map((device) => (
                <div key={device.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{device.name}</p>
                    <p className="text-[10px] text-gray-700 font-bold uppercase tracking-tighter">SN: {device.serial_number}</p>
                  </div>
                  <span className="px-2 py-1 text-[10px] font-black rounded-full bg-blue-100 text-blue-800 uppercase">
                    {device.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-700 py-4 italic text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">No hardware devices currently linked.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Financial Status</h2>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-sm text-gray-700 font-medium">Outstanding Balance</p>
              <p className={`text-4xl font-black mt-1 ${balance && balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {balance !== null ? `$${balance.toLocaleString()}` : '...'}
              </p>
              {balance && balance > 0 && (
                <div className="mt-4 flex items-center text-red-600 bg-red-50 p-2 rounded text-xs font-bold">
                  <AlertCircle className="w-4 h-4 mr-2" /> Arrears pending
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Recent Invoices</h2>
            <div className="space-y-3">
              {invoices.slice(0, 3).map((invoice) => (
                <div key={invoice.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded transition-colors border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-gray-900">INV-{invoice.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-600 font-bold uppercase">{new Date(invoice.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${Number(invoice.amount || 0).toFixed(2)}</p>
                    <span className={`text-[10px] font-bold uppercase ${invoice.status === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>{invoice.status}</span>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <p className="text-xs text-gray-600 italic">No invoices found.</p>}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Field Operations & Reports</h2>
            {canUploadReport && (
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-bold shadow-sm"
              >
                <Plus className="w-3 h-3 mr-1" /> New Report
              </button>
            )}
          </div>
          <div className="space-y-4">
            {reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.id} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-green-200 transition-colors">
                  <div className="bg-white p-2 rounded-lg shadow-sm text-green-600 border border-green-50">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">{report.title}</h4>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        report.report_type === 'WEEKLY' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {report.report_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1 leading-relaxed">{report.notes || 'No additional notes provided.'}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-2">
                      <span className="text-[10px] text-gray-700 font-bold uppercase flex items-center">
                        <Calendar className="w-3 h-3 mr-1" /> {new Date(report.created_at).toLocaleDateString()}
                      </span>
                      {report.file_path && (
                        <a 
                          href={report.file_path.replace(/\\/g, '/')} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-blue-600 font-bold hover:underline bg-white px-2 py-1 rounded border border-blue-50 shadow-sm"
                        >
                          View Report PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-gray-700 font-medium">No field reports logged for this client.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ClientIssueModal 
        isOpen={isIssueModalOpen} 
        onClose={() => setIsIssueModalOpen(false)} 
        onSuccess={fetchIssues}
        clientId={id}
      />

      <FieldReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        onSuccess={fetchReports}
        clientId={id}
        devices={client.devices.map(d => ({ id: d.id, name: d.name }))}
      />
    </div>
  );
}
