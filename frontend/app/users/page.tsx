import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserManagement from '@/modules/users/UserManagement';

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <UserManagement />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
