import DashboardLayout from '@/components/layout/DashboardLayout';
import InventoryItemDetails from '@/modules/inventory/InventoryItemDetails';
import Link from 'next/link';

export default async function InventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/inventory" className="text-blue-600 hover:underline">← Back to Inventory</Link>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Item Details</h1>
        </div>
        <InventoryItemDetails id={id} />
      </div>
    </DashboardLayout>
  );
}
