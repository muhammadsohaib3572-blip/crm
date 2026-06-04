import DashboardLayout from '@/components/layout/DashboardLayout';
import ClientList from '@/modules/clients/ClientList';

export default function ClientsPage() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <ClientList />
      </div>
    </DashboardLayout>
  );
}
