import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Phone, Mail } from 'lucide-react';
import { supabase, Client } from '../../lib/supabase';
import ClientDetail from './ClientDetail';
import ClientForm from './ClientForm';

export default function ClientList() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('name');

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClientSaved = () => {
        setShowForm(false);
        fetchClients();
    };

    if (selectedClientId) {
        return (
            <ClientDetail
                clientId={selectedClientId}
                onBack={() => setSelectedClientId(null)}
            />
        );
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.rfc?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clientes (CRM)</h1>
                    <p className="text-gray-600">Gestión de expediente único y relaciones comerciales</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Cliente
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o RFC..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                            <tr>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Contacto</th>
                                <th className="px-6 py-3">Crédito</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Cargando clientes...
                                    </td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron clientes
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedClientId(client.id)}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{client.name}</div>
                                            <div className="text-sm text-gray-500">{client.rfc || 'Sin RFC'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.client_type === 'wholesale' ? 'bg-purple-100 text-purple-700' :
                                                client.client_type === 'distributor' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {client.client_type === 'wholesale' ? 'Mayoreo' :
                                                    client.client_type === 'distributor' ? 'Distribuidor' : 'Menudeo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3" />
                                                {client.phone || '-'}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Mail className="w-3 h-3" />
                                                {client.email || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                ${(client.current_balance || 0).toLocaleString()} / ${(client.credit_limit || 0).toLocaleString()}
                                            </div>
                                            <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full"
                                                    style={{ width: `${Math.min(((client.current_balance || 0) / (client.credit_limit || 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {client.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedClientId(client.id);
                                                }}
                                            >
                                                Ver expediente
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <ClientForm
                    onClose={() => setShowForm(false)}
                    onSave={handleClientSaved}
                />
            )}
        </div>
    );
}
