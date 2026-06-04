'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeScorecard from '@/modules/performance/EmployeeScorecard';

export default function PerformancePage() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Employee Performance Scorecard</h1>
        <p className="text-gray-500 text-sm">Tracking task completion efficiency across all departments.</p>
        <EmployeeScorecard />
      </div>
    </DashboardLayout>
  );
}
