import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TaskBoard from '@/modules/tasks/TaskBoard';

export default function TasksPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'BUSINESS', 'AGRONOMY', 'HARDWARE', 'ACCOUNTS', 'EMPLOYEE']}>
      <DashboardLayout>
        <div className="p-4 space-y-6 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Board</h1>
          <TaskBoard />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
