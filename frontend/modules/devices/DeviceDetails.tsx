'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';

interface HistoryEntry {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Device {
  id: string;
  name: string;
  serial_number: string;
  status: string;
  installation_location: string | null;
  notes: string | null;
  history: HistoryEntry[];
}

export default function DeviceDetails({ id }: { id: string }) {
  const [device, setDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const res = await api.get(`/devices/${id}`);
        setDevice(res.data);
      } catch (error) {
        console.error('Failed to fetch device details', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDevice();
  }, [id]);

  if (isLoading) return <div className="p-8 text-center text-gray-700">Loading device details...</div>;
  if (!device) return <div className="p-8 text-center text-gray-900 font-bold">Device not found.</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">Device Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-700 font-medium">Name</p>
            <p className="font-bold text-gray-900 mt-0.5">{device.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-700 font-medium">Serial Number</p>
            <p className="font-bold text-gray-900 mt-0.5">{device.serial_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-700 font-medium">Current Status</p>
            <p className="font-bold text-gray-900 mt-0.5">{device.status.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-700 font-medium">Location</p>
            <p className="font-bold text-gray-900 mt-0.5">{device.installation_location || 'N/A'}</p>
          </div>
        </div>
        {device.notes && (
          <div>
            <p className="text-sm text-gray-700 font-medium">Notes</p>
            <p className="text-sm text-gray-900 mt-0.5">{device.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">Lifecycle Timeline</h2>
        {device.history.length === 0 ? (
          <p className="text-sm text-gray-700 italic py-4 text-center">No history recorded yet.</p>
        ) : (
          <div className="relative border-l-2 border-gray-200 ml-4 space-y-6">
            {device.history.map((entry) => (
              <div key={entry.id} className="mb-8 ml-6">
                <span className="absolute flex items-center justify-center w-4 h-4 bg-blue-100 rounded-full -left-[9px] ring-4 ring-white">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">{entry.status.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-700 font-medium mt-0.5">{new Date(entry.created_at).toLocaleString()}</span>
                  {entry.notes && <p className="mt-1 text-sm text-gray-800 italic">"{entry.notes}"</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
