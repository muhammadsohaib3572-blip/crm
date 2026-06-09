'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="lg:hidden flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm sticky top-0 z-30">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="inline-flex items-center rounded-md border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-700">Crop2X CRM</span>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className={`inline-flex items-center rounded-md border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-screen">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
