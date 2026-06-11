'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';
import Link from 'next/link';
import DeviceFormModal from './DeviceFormModal';
import { useAuthStore } from '@/store/auth/useAuthStore';
import { toast } from '@/lib/toast';
import { formatApiError } from '@/lib/formatApiError';
import { Trash2, Edit, Plus } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  serial_number: string;
  status: 'UNDER_DEVELOPMENT' | 'QA_FOR_AGRONOMIST' | 'QA_PASSED_IN_INVENTORY' | 'INSTALLED' | 'BACK_AT_OFFICE';
  installation_location: string | null;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  UNDER_DEVELOPMENT: 'bg-yellow-100 text-yellow-800',
  QA_FOR_AGRONOMIST: 'bg-blue-100 text-blue-800',
  QA_PASSED_IN_INVENTORY: 'bg-green-100 text-green-800',
  INSTALLED: 'bg-purple-100 text-purple-800',
  BACK_AT_OFFICE: 'bg-red-100 text-red-800',
};

export default function DeviceList() {
  const { user } = useAuthStore();
  const canManage = user && ['ADMIN', 'MANAGER', 'HARDWARE'].includes(user.role);
  const canDelete = user && ['ADMIN', 'MANAGER'].includes(user.role);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices');
      setDevices(res.data);
    } catch (error) {
      toast.error(formatApiError(error, 'Failed to load devices'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    try {
      await api.delete(`/devices/${deviceId}`);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      toast.success('Device deleted successfully');
    } catch (error) {
      toast.error(formatApiError(error, 'Failed to delete device'));
    }
  };

  const handleEdit = (device: Device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading devices...</div>;

  return (
    <>
      {canManage && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-bold shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" /> Add New Device
          </button>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Device Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Serial Number</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {devices.map((device) => (
              <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{device.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{device.serial_number}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 inline-flex text-[10px] leading-5 font-black rounded-full uppercase ${statusColors[device.status] || 'bg-gray-100 text-gray-800'}`}>
                    {device.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{device.installation_location || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-bold">
                  {new Date(device.updated_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <Link href={`/devices/${device.id}`} className="text-blue-600 hover:text-blue-800 font-bold transition-colors">
                    View
                  </Link>
                  {canManage && (
                    <button
                      onClick={() => handleEdit(device)}
                      className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(device.id)}
                      className="text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {devices.length === 0 && (
          <div className="py-20 text-center bg-gray-50/50">
            <p className="text-gray-400 font-medium italic">No devices found in inventory.</p>
          </div>
        )}
      </div>

      <DeviceFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={fetchDevices}
        deviceId={selectedDevice?.id}
        initialData={selectedDevice ? {
          ...selectedDevice,
          installation_location: selectedDevice.installation_location ?? undefined
        } : undefined}
      />
    </>
  );
}
