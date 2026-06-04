import DashboardLayout from '@/components/layout/DashboardLayout';
import InventoryList from '@/modules/inventory/InventoryList';

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <InventoryList />
      </div>
    </DashboardLayout>
  );
}
