import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ComponentsList from '@/modules/components/ComponentsList';

export default function ComponentsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'HARDWARE']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900">Components & Procurement</h1>
          <ComponentsList />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
