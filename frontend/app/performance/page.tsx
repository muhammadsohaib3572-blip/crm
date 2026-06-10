'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import EmployeeScorecard from '@/modules/performance/EmployeeScorecard';
import { useAuthStore } from '@/store/auth/useAuthStore';

export default function PerformancePage() {
  const { user } = useAuthStore();
  const isAdmin = user && ['ADMIN', 'MANAGER'].includes(user.role);

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS', 'EMPLOYEE']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'Employee Performance Scorecard' : 'My Performance'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isAdmin
              ? 'Tracking task completion efficiency across all departments.'
              : 'Your task completion stats and efficiency score.'}
          </p>
          <EmployeeScorecard />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
