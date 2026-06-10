import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NotificationFeed from '@/modules/notifications/NotificationFeed';

export default function NotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS', 'EMPLOYEE']}>
    <DashboardLayout>
      <div className="p-4 space-y-6 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500">Stay on top of your alerts and system updates.</p>
          </div>
        </div>
        <NotificationFeed />
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
