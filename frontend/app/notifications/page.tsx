import DashboardLayout from '@/components/layout/DashboardLayout';
import NotificationFeed from '@/modules/notifications/NotificationFeed';

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500">Stay on top of your alerts and system updates.</p>
          </div>
        </div>
        <NotificationFeed />
      </div>
    </DashboardLayout>
  );
}
