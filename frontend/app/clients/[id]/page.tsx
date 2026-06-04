import DashboardLayout from '@/components/layout/DashboardLayout';
import ClientProfile from '@/modules/clients/ClientProfile';
import Link from 'next/link';

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/clients" className="text-blue-600 hover:underline">← Back to Clients</Link>
          <h1 className="text-3xl font-bold text-gray-900">Client Profile</h1>
        </div>
        <ClientProfile id={id} />
      </div>
    </DashboardLayout>
  );
}
