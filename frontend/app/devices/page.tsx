import DashboardLayout from '@/components/layout/DashboardLayout';
import DeviceList from '@/modules/devices/DeviceList';

export default function DevicesPage() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
        <DeviceList />
      </div>
    </DashboardLayout>
  );
}
