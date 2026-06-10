'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import api from '@/services/api/axios';
import { useAuthStore } from '@/store/auth/useAuthStore';
import {
  Users, Cpu, CheckSquare, DollarSign, TrendingUp,
  AlertCircle, Package, FileText, BarChart2, CircuitBoard,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];

function StatCard({ title, value, icon: Icon, color, bg }: {
  title: string; value: string | number; icon: React.ElementType;
  color: string; bg: string;
}) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`${bg} p-3 rounded-lg flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ── Department dashboards ─────────────────────────────────
function BusinessDashboard({ data }: { data: any }) {
  const byStage = Object.entries(data?.leads_by_stage ?? {}).map(([name, value]) => ({ name: name.replace(/_/g,' '), value: Number(value) }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Active Leads" value={data?.active_leads ?? 0} icon={TrendingUp} color="text-blue-600" bg="bg-blue-100" />
        <StatCard title="Conversion Rate" value={`${data?.conversion_rate ?? 0}%`} icon={BarChart2} color="text-green-600" bg="bg-green-100" />
        <StatCard title="Follow-ups Today" value={data?.followups_due_today ?? 0} icon={CheckSquare} color="text-purple-600" bg="bg-purple-100" />
        <StatCard title="Meetings This Week" value={data?.meetings_this_week ?? 0} icon={CheckSquare} color="text-indigo-600" bg="bg-indigo-100" />
        <StatCard title="Total Clients" value={data?.total_clients ?? 0} icon={Users} color="text-orange-600" bg="bg-orange-100" />
      </div>
      {byStage.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Leads by Stage</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byStage}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function AgronomyDashboard({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title="Reports This Week" value={data?.reports_this_week ?? 0} icon={FileText} color="text-green-600" bg="bg-green-100" />
      <StatCard title="QA Tasks Pending" value={data?.qa_tasks_pending ?? 0} icon={CheckSquare} color="text-yellow-600" bg="bg-yellow-100" />
      <StatCard title="Devices In QA" value={data?.devices_in_qa ?? 0} icon={Cpu} color="text-blue-600" bg="bg-blue-100" />
      <StatCard title="Total Clients" value={data?.total_clients ?? 0} icon={Users} color="text-purple-600" bg="bg-purple-100" />
    </div>
  );
}

function HardwareDashboard({ data }: { data: any }) {
  const breakdown = Object.entries(data?.device_status_breakdown ?? {}).map(([name, value]) => ({
    name: name.replace(/_/g,' '), value: Number(value),
  }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Under Development" value={data?.devices_under_development ?? 0} icon={Cpu} color="text-yellow-600" bg="bg-yellow-100" />
        <StatCard title="Installed" value={data?.devices_installed ?? 0} icon={Cpu} color="text-green-600" bg="bg-green-100" />
        <StatCard title="Low Stock Items" value={data?.low_stock_items ?? 0} icon={Package} color="text-red-600" bg="bg-red-100" />
        <StatCard title="Components" value={data?.total_components ?? 0} icon={CircuitBoard} color="text-indigo-600" bg="bg-indigo-100" />
      </div>
      {breakdown.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Device Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={breakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function AccountsDashboard({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title="Total Revenue" value={`$${Number(data?.total_revenue ?? 0).toLocaleString()}`} icon={DollarSign} color="text-green-600" bg="bg-green-100" />
      <StatCard title="Outstanding" value={`$${Number(data?.outstanding_balance ?? 0).toLocaleString()}`} icon={AlertCircle} color="text-orange-600" bg="bg-orange-100" />
      <StatCard title="Overdue Invoices" value={data?.overdue_invoices_count ?? 0} icon={ShieldAlert} color="text-red-600" bg="bg-red-100" />
      <StatCard title="Due Next 30 Days" value={data?.due_next_30_days ?? 0} icon={CheckSquare} color="text-blue-600" bg="bg-blue-100" />
    </div>
  );
}

function AdminDashboard({ data }: { data: any }) {
  const deviceBreakdown = Object.entries(data?.device_status_breakdown ?? {}).map(([name, value]) => ({ name: name.replace(/_/g,' '), value: Number(value) }));
  const taskBreakdown = Object.entries(data?.task_status_breakdown ?? {}).map(([name, value]) => ({ name: name.replace(/_/g,' '), value: Number(value) }));
  const usersData = Object.entries(data?.users_by_role ?? {}).map(([name, value]) => ({ name, value: Number(value) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={data?.business?.total_clients ?? 0} icon={Users} color="text-blue-600" bg="bg-blue-100" />
        <StatCard title="Active Leads" value={data?.business?.active_leads ?? 0} icon={TrendingUp} color="text-orange-600" bg="bg-orange-100" />
        <StatCard title="Total Revenue" value={`$${Number(data?.accounts?.total_revenue ?? 0).toLocaleString()}`} icon={DollarSign} color="text-green-600" bg="bg-green-100" />
        <StatCard title="Audit Today" value={data?.audit_entries_today ?? 0} icon={FileText} color="text-purple-600" bg="bg-purple-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {deviceBreakdown.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Device Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deviceBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {taskBreakdown.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Task Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {taskBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {usersData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Users by Role</h3>
          <div className="flex flex-wrap gap-3">
            {usersData.map(({ name, value }) => (
              <div key={name} className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <p className="text-xl font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 font-medium uppercase">{name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard Page ───────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, alertsRes] = await Promise.allSettled([
          api.get('/dashboard/stats'),
          api.get('/dashboard/alerts'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data?.alerts ?? []);
      } catch { /* ignore */ }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const roleTitle: Record<string, string> = {
    ADMIN: 'Admin Overview', MANAGER: 'Operations Overview',
    BUSINESS: 'Business Dashboard', AGRONOMY: 'Agronomy Dashboard',
    HARDWARE: 'Hardware Dashboard', ACCOUNTS: 'Accounts Dashboard',
    EMPLOYEE: 'My Dashboard',
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 space-y-8 sm:p-6 lg:p-8">
          <header>
            <h1 className="text-3xl font-bold text-gray-900">{roleTitle[user?.role ?? ''] ?? 'Dashboard'}</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.full_name}.</p>
          </header>

          {isLoading ? (
            <div className="py-20 text-center text-gray-400">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading dashboard...
            </div>
          ) : (
            <>
              {/* Role-specific dashboard */}
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && <AdminDashboard data={stats} />}
              {user?.role === 'BUSINESS' && <BusinessDashboard data={stats} />}
              {user?.role === 'AGRONOMY' && <AgronomyDashboard data={stats} />}
              {user?.role === 'HARDWARE' && <HardwareDashboard data={stats} />}
              {user?.role === 'ACCOUNTS' && <AccountsDashboard data={stats} />}

              {/* Alerts — shown if any */}
              {alerts.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" /> Critical Alerts
                  </h3>
                  <div className="space-y-2">
                    {alerts.map((alert, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-sm text-slate-700">{alert.message}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          alert.severity === 'high' ? 'bg-red-100 text-red-700' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
