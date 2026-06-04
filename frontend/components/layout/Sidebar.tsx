'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Cpu, 
  CheckSquare, 
  Package, 
  CreditCard, 
  Bell,
  Activity,
  Settings,
  LogOut
} from 'lucide-react';
import api from '@/services/api/axios';
import { useAuthStore } from '@/store/auth/useAuthStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS'] },
  { name: 'Clients', href: '/clients', icon: Users, roles: ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'ACCOUNTS'] },
  { name: 'Leads', href: '/leads', icon: UserPlus, roles: ['ADMIN', 'MANAGER', 'BUSINESS'] },
  { name: 'Devices', href: '/devices', icon: Cpu, roles: ['ADMIN', 'MANAGER', 'AGRONOMY', 'HARDWARE'] },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS'] },
  { name: 'Performance', href: '/performance', icon: Activity, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Inventory', href: '/inventory', icon: Package, roles: ['ADMIN', 'MANAGER', 'HARDWARE'] },
  { name: 'Billing', href: '/billing', icon: CreditCard, roles: ['ADMIN', 'MANAGER', 'ACCOUNTS'] },
  { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS'] },
  { name: 'Activity Logs', href: '/activity-logs', icon: Activity, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['ADMIN', 'MANAGER'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const filteredNavigation = navigation.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      clearAuth();
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex flex-col w-64 bg-slate-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-blue-400">Crop2X CRM</h1>
        {user && (
          <div className="mt-2 text-xs text-slate-400">
            {user.full_name} ({user.role})
          </div>
        )}
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-300 rounded-lg hover:bg-red-900/20 hover:text-red-400 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="w-5 h-5 mr-3" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}
