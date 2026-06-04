'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api/axios';
import Link from 'next/link';
import ClientFormModal from './ClientFormModal';
import { Edit, Trash2, Plus } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company_name: string;
  onboarding_date: string | null;
}

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (error) {
      console.error('Failed to fetch clients', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await api.delete(`/clients/${clientId}`);
      setClients((prev) => prev.filter((c) => c.id !== clientId));
    } catch (error) {
      console.error('Failed to delete client', error);
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading clients...</div>;

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors font-bold shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
                <p className="text-gray-500 text-sm font-medium">{client.company_name}</p>
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(client)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                  title="Edit Client"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  title="Delete Client"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t pt-4 border-slate-50">
              <span className="text-[10px] font-bold text-slate-600 uppercase">Since {client.onboarding_date ? new Date(client.onboarding_date).getFullYear() : 'N/A'}</span>
              <Link 
                href={`/clients/${client.id}`} 
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                View Profile →
              </Link>
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-600 font-medium">No clients found. Click "Add New Client" to begin.</p>
          </div>
        )}
      </div>

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={fetchClients}
        clientId={selectedClient?.id}
        initialData={selectedClient ?? undefined}
      />
    </>
  );
}
