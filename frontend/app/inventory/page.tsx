import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import InventoryList from '@/modules/inventory/InventoryList';

export default function InventoryPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'HARDWARE']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <InventoryList />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
