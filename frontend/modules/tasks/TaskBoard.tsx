'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';
import TaskFormModal from './TaskFormModal';
import { Plus } from 'lucide-react';

const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: { full_name: string };
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/tasks/${id}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    } catch (error) {
      console.error('Failed to update task status', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading tasks...</div>;

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-bold shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Task
        </button>
      </div>

      <div className="flex space-x-6 overflow-x-auto pb-6">
        {statuses.map((status) => (
          <div key={status} className="flex-shrink-0 w-80 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">{status.replace(/_/g, ' ')}</h3>
              <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                {tasks.filter((t) => t.status === status).length}
              </span>
            </div>
            <div className="space-y-4">
              {tasks
                .filter((task) => task.status === status)
                .map((task) => (
                  <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        task.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 
                        task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {task.priority}
                      </span>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">{task.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{task.description || 'No description provided.'}</p>
                    <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-medium">Assigned: <strong className="text-slate-600">{task.assigned_to.full_name}</strong></span>
                      <select 
                        value={task.status} 
                        onChange={(e) => updateStatus(task.id, e.target.value)}
                        className="text-[10px] border border-slate-200 rounded bg-slate-50 outline-none p-0.5 font-bold text-slate-600"
                      >
                        {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              
              {tasks.filter(t => t.status === status).length === 0 && (
                <div className="py-10 text-center text-slate-400 text-xs italic border-2 border-dashed border-slate-100 rounded-lg bg-white/50">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasks}
      />
    </>
  );
}
