import DashboardLayout from '@/components/layout/DashboardLayout';
import UserManagement from '@/modules/users/UserManagement';

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <UserManagement />
      </div>
    </DashboardLayout>
  );
}
