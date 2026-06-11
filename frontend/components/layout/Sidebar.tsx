'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, TrendingUp, Cpu, CheckSquare,
  Package, CreditCard, Bell, Activity, LogOut, X,
  FileText, AlertCircle, UserCog, BarChart2, CircuitBoard,
} from 'lucide-react';
import api from '@/services/api/axios';
import { useAuthStore } from '@/store/auth/useAuthStore';
import { toast } from '@/lib/toast';
import { NAV_ITEMS } from '@/lib/rbac';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, TrendingUp, Cpu, CheckSquare,
  Package, CreditCard, Bell, Activity, FileText,
  AlertCircle, UserCog, BarChart2, CircuitBoard,
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Filter nav items strictly by role
  const visibleNav = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch {
      // ignore errors — clear local auth anyway
    } finally {
      clearAuth();
      toast.success('Signed out successfully');
      window.location.href = '/login';
    }
  };

  const roleLabel: Record<string, string> = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    BUSINESS: 'Business',
    AGRONOMY: 'Agronomy',
    HARDWARE: 'Hardware',
    ACCOUNTS: 'Accounts',
    EMPLOYEE: 'Employee',
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo / user info */}
      <div className="flex items-center justify-between border-b border-slate-800 p-5 lg:border-b-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-blue-400">Crop2X CRM</h1>
          {user && (
            <div className="mt-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">{user.full_name}</span>
              <span className="ml-2 px-1.5 py-0.5 bg-blue-900/60 rounded text-blue-300 text-[10px] font-bold uppercase">
                {roleLabel[user.role] ?? user.role}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex rounded-md border border-slate-700 p-2 text-slate-200 hover:bg-slate-800 lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {visibleNav.map((item) => {
          const Icon = ICON_MAP[item.iconName] ?? LayoutDashboard;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-800 p-4">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-slate-300 rounded-lg hover:bg-red-900/20 hover:text-red-400 transition-colors disabled:opacity-60"
        >
          <LogOut className="w-4 h-4 mr-3" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  );
}
