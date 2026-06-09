import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ActivityLogFeed from '@/modules/activityLogs/ActivityLogFeed';

export default function ActivityLogsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-500">Complete audit trail of all user actions.</p>
          <ActivityLogFeed />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
