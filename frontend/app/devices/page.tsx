import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DeviceList from '@/modules/devices/DeviceList';

export default function DevicesPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'HARDWARE', 'AGRONOMY']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
          <DeviceList />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
