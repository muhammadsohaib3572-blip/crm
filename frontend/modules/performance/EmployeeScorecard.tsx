'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';
import { Award, CheckCircle2, ListChecks, User } from 'lucide-react';

interface PerformanceStat {
  full_name: string;
  role: string;
  total: number;
  completed: number;
  score: number;
}

export default function EmployeeScorecard() {
  const [stats, setStats] = useState<PerformanceStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/tasks/performance');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch performance stats', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading performance data...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-100 p-2 rounded-lg">
                  <User className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{stat.full_name}</h3>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">{stat.role}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-gray-900">{Math.round(stat.score)}%</div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Efficiency</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center text-slate-500 mb-1">
                  <ListChecks className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">Assigned</span>
                </div>
                <div className="text-xl font-bold text-slate-900">{stat.total}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center text-green-600 mb-1">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">Completed</span>
                </div>
                <div className="text-xl font-bold text-green-700">{stat.completed}</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    stat.score >= 80 ? 'bg-green-500' : stat.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${stat.score}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {stat.score >= 90 && (
            <div className="bg-yellow-50 px-6 py-2 border-t border-yellow-100 flex items-center">
              <Award className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-xs font-bold text-yellow-700 uppercase tracking-tighter">Top Performer</span>
            </div>
          )}
        </div>
      ))}

      {stats.length === 0 && (
        <div className="col-span-full py-20 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">No task performance data available yet.</p>
        </div>
      )}
    </div>
  );
}
