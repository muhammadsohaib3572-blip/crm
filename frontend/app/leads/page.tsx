import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LeadsKanban from '@/modules/leads/LeadsKanban';

export default function LeadsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'BUSINESS']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
          <LeadsKanban />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
