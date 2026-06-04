'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/services/api/axios';
import { useAuthStore } from '@/store/auth/useAuthStore';
import {
  Users,
  Cpu,
  CheckSquare,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Package,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const defaultAlertData = [
  { msg: 'No alerts yet', time: '', level: 'Low' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>({});
  const [alerts, setAlerts] = useState(defaultAlertData);
  const [deviceStatus, setDeviceStatus] = useState<{ name: string; value: number }[]>([]);
  const [taskStatus, setTaskStatus] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Fetch stats first (works for all authenticated users)
        const statsRes = await api.get('/dashboard/stats');
        const dashboardStats = statsRes.data;
        setStats(dashboardStats);

        setDeviceStatus(
          Object.entries(dashboardStats.device_status_breakdown || {}).map(([name, value]) => ({
            name,
            value: Number(value) || 0,
          }))
        );

        setTaskStatus(
          Object.entries(dashboardStats.task_status_breakdown || {}).map(([name, value]) => ({
            name,
            value: Number(value) || 0,
          }))
        );

        // Then fetch alerts (may fail for users without proper permissions)
        try {
          const alertsRes = await api.get('/dashboard/alerts');
          const alertPayload = alertsRes.data?.alerts ?? alertsRes.data;
          setAlerts(Array.isArray(alertPayload) && alertPayload.length ? alertPayload : defaultAlertData);
        } catch (alertsError) {
          console.warn('Could not load alerts (permission denied or no alerts):', alertsError);
          // Keep default alerts if fetching fails due to permissions or other issues
          setAlerts(defaultAlertData);
        }
      } catch (error) {
        console.error('Dashboard load failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const metrics = useMemo(() => {
    const list = [
      {
        name: 'Total Clients',
        value: (stats.total_clients || 0).toLocaleString(),
        icon: Users,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        roles: ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS']
      },
      {
        name: 'Active Leads',
        value: (stats.active_leads || 0).toLocaleString(),
        icon: TrendingUp,
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        roles: ['ADMIN', 'MANAGER', 'BUSINESS']
      },
      {
        name: 'Active Devices',
        value: (stats.active_devices || 0).toLocaleString(),
        icon: Cpu,
        color: 'text-purple-600',
        bg: 'bg-purple-100',
        roles: ['ADMIN', 'MANAGER', 'AGRONOMY', 'HARDWARE']
      },
      {
        name: 'Pending Tasks',
        value: (stats.pending_tasks || 0).toLocaleString(),
        icon: CheckSquare,
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        roles: ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS']
      },
      {
        name: 'Inventory Items',
        value: (stats.inventory_items || 0).toLocaleString(),
        icon: Package,
        color: 'text-indigo-600',
        bg: 'bg-indigo-100',
        roles: ['ADMIN', 'MANAGER', 'HARDWARE']
      },
      {
        name: 'Monthly Revenue',
        value: `$${(stats.monthly_revenue || 0).toLocaleString()}`,
        icon: DollarSign,
        color: 'text-green-600',
        bg: 'bg-green-100',
        roles: ['ADMIN', 'MANAGER', 'ACCOUNTS']
      },
      {
        name: 'Overdue Invoices',
        value: (stats.overdue_invoices || 0).toLocaleString(),
        icon: AlertCircle,
        color: 'text-red-600',
        bg: 'bg-red-100',
        roles: ['ADMIN', 'MANAGER', 'ACCOUNTS']
      },
    ];
    const filtered = list.filter(m => !m.roles || (user && m.roles.includes(user.role)));
    const isAdmin = user && ['ADMIN', 'MANAGER'].includes(user.role);
    return isAdmin ? filtered : filtered.slice(0, 4);
  }, [stats, user]);

  const deviceChartData = deviceStatus.length ? deviceStatus : [{ name: 'None', value: 0 }];
  const taskChartData = taskStatus.length ? taskStatus : [{ name: 'None', value: 0 }];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Operations Overview</h1>
          <p className="text-gray-500">Welcome back. Here is what&apos;s happening today.</p>
        </header>

        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Loading dashboard metrics...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric) => (
                <div key={metric.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                  <div className={`${metric.bg} p-3 rounded-lg`}>
                    <metric.icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{metric.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 flex items-center text-black">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-500" /> Device Status Breakdown
                </h3>
                <div className="h-80 text-black">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deviceChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 flex items-center text-black">
                  <CheckSquare className="w-5 h-5 mr-2 text-green-500" /> Task Status Snapshot
                </h3>
                <div className="h-80 text-gray-900">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={taskChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center text-gray-900">
                  <AlertCircle className="w-5 h-5 mr-2 text-red-500" /> Critical Alerts
                </h3>
              </div>
              <div className="space-y-4">
                {alerts.map((alert, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-700">{alert.msg}</p>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-slate-400">{alert.time}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          alert.level === 'High'
                            ? 'bg-red-100 text-red-700'
                            : alert.level === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {alert.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
