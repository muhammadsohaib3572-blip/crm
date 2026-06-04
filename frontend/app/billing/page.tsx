import DashboardLayout from '@/components/layout/DashboardLayout';
import BillingLedger from '@/modules/billing/BillingLedger';

export default function BillingPage() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Accounts</h1>
        </div>
        <BillingLedger />
      </div>
    </DashboardLayout>
  );
}
