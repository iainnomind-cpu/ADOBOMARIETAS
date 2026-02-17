import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Phone, Mail, Clock, CreditCard, ShoppingBag, FileText } from 'lucide-react';
import { supabase, Client, ClientAddress, SalesOrder } from '../../lib/supabase';

interface ClientDetailProps {
    clientId: string;
    onBack: () => void;
}

export default function ClientDetail({ clientId, onBack }: ClientDetailProps) {
    const [client, setClient] = useState<Client | null>(null);
    const [addresses, setAddresses] = useState<ClientAddress[]>([]);
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'documents'>('info');

    useEffect(() => {
        fetchClientDetails();
    }, [clientId]);

    const fetchClientDetails = async () => {
        try {
            // Fetch client info
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', clientId)
                .single();

            if (clientError) throw clientError;
            setClient(clientData);

            // Fetch addresses
            const { data: addressData, error: addressError } = await supabase
                .from('client_addresses')
                .select('*')
                .eq('client_id', clientId);

            if (addressError) throw addressError;
            setAddresses(addressData || []);

            // Fetch orders
            const { data: orderData, error: orderError } = await supabase
                .from('sales_orders')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (orderError) throw orderError;
            setOrders(orderData || []);

        } catch (error) {
            console.error('Error fetching client details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !client) {
        return (
            <div className="p-8 flex justify-center text-gray-500">
                Cargando expediente...
            </div>
        );
    }

    return (
        <div className="p-6">
            <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a lista
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                            <p className="text-gray-500">{client.commercial_name || client.rfc}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${client.client_type === 'wholesale' ? 'bg-purple-100 text-purple-700' :
                            client.client_type === 'distributor' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                            }`}>
                            {client.client_type === 'wholesale' ? 'Mayorista' :
                                client.client_type === 'distributor' ? 'Distribuidor' : 'Menudeo'}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                        <div className="flex items-center text-gray-600">
                            <Mail className="w-5 h-5 mr-3 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Email</p>
                                <p className="text-sm font-medium">{client.email || 'No registrado'}</p>
                            </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <Phone className="w-5 h-5 mr-3 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Teléfono</p>
                                <p className="text-sm font-medium">{client.phone || 'No registrado'}</p>
                            </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <CreditCard className="w-5 h-5 mr-3 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Crédito</p>
                                <p className="text-sm font-medium">
                                    ${(client.current_balance || 0).toLocaleString()} / ${(client.credit_limit || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <Clock className="w-5 h-5 mr-3 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Días Crédito</p>
                                <p className="text-sm font-medium">{client.payment_term_days} días</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'info'
                            ? 'border-blue-600 text-blue-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Información General
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'orders'
                            ? 'border-blue-600 text-blue-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Historial de Pedidos
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'documents'
                            ? 'border-blue-600 text-blue-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Documentos
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Direcciones de Entrega</h3>
                            {addresses.length === 0 ? (
                                <p className="text-gray-500 italic">No hay direcciones registradas.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {addresses.map((addr) => (
                                        <div key={addr.id} className="border border-gray-200 rounded-lg p-4 relative">
                                            {addr.is_default && (
                                                <span className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                                    Principal
                                                </span>
                                            )}
                                            <div className="flex items-start">
                                                <MapPin className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{addr.address_line1}</p>
                                                    {addr.address_line2 && <p className="text-sm text-gray-600">{addr.address_line2}</p>}
                                                    <p className="text-sm text-gray-600">
                                                        {addr.city}, {addr.state} {addr.zip_code}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Últimos Pedidos</h3>
                            {orders.length === 0 ? (
                                <p className="text-gray-500 italic">No hay pedidos registrados.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 text-gray-600 font-medium text-xs uppercase">
                                            <tr>
                                                <th className="px-4 py-3">Pedido</th>
                                                <th className="px-4 py-3">Fecha</th>
                                                <th className="px-4 py-3">Total</th>
                                                <th className="px-4 py-3">Estado</th>
                                                <th className="px-4 py-3 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-sm">
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td className="px-4 py-3 font-medium">{order.order_number}</td>
                                                    <td className="px-4 py-3">{new Date(order.order_date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 font-medium">${(order.total_amount || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                                                            Ver
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="text-center py-8">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No hay documentos cargados (Contratos, Constancias fiscales, etc.)</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
