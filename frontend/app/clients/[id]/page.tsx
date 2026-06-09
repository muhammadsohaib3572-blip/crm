import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ClientProfile from '@/modules/clients/ClientProfile';
import Link from 'next/link';

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'ACCOUNTS']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <div className="flex items-center space-x-4">
            <Link href="/clients" className="text-blue-600 hover:underline">← Back to Clients</Link>
            <h1 className="text-3xl font-bold text-gray-900">Client Profile</h1>
          </div>
          <ClientProfile id={id} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
