import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import BillingLedger from '@/modules/billing/BillingLedger';

export default function BillingPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'ACCOUNTS']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Billing & Accounts</h1>
          </div>
          <BillingLedger />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
