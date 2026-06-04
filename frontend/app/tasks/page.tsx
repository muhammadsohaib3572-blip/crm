import DashboardLayout from '@/components/layout/DashboardLayout';
import TaskBoard from '@/modules/tasks/TaskBoard';

export default function TasksPage() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Task Board</h1>
        <TaskBoard />
      </div>
    </DashboardLayout>
  );
}
