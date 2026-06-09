import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FieldReportsList from '@/modules/reports/FieldReportsList';

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'AGRONOMY']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900">Field Reports</h1>
          <FieldReportsList />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
