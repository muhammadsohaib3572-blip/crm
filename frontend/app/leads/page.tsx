import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadsKanban from '@/modules/leads/LeadsKanban';

export default function LeadsPage() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
        <LeadsKanban />
      </div>
    </DashboardLayout>
  );
}
