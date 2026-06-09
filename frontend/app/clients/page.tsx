import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ClientList from '@/modules/clients/ClientList';

export default function ClientsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'ACCOUNTS']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <ClientList />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
