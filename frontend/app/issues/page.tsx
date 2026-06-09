import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import IssuesList from '@/modules/issues/IssuesList';

export default function IssuesPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'BUSINESS']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900">Issues & Support Tickets</h1>
          <IssuesList />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
