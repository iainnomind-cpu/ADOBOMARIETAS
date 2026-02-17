import { useState, useEffect } from 'react';
import { Plus, Truck, ShoppingCart, Calendar } from 'lucide-react';
import { supabase, SalesOrder } from '../../lib/supabase';
import SalesOrderForm from './SalesOrderForm';
import RouteManager from './RouteManager';

export default function SalesDashboard() {
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewOrder, setShowNewOrder] = useState(false);
    const [showRoutes, setShowRoutes] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('sales_orders')
                .select(`
          *,
          client:clients(name)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOrderSaved = () => {
        setShowNewOrder(false);
        fetchOrders();
    };

    if (showRoutes) {
        return <RouteManager onBack={() => setShowRoutes(false)} />;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ventas Omnicanal</h1>
                    <p className="text-gray-600">Gestión de pedidos, rutas de preventa y portal B2B</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowRoutes(true)}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                        <Truck className="w-4 h-4" />
                        Gestionar Rutas
                    </button>
                    <button
                        onClick={() => setShowNewOrder(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Pedido
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Pedidos Hoy</p>
                            <h3 className="text-2xl font-bold text-gray-900">12</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg text-green-600">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Rutas Activas</p>
                            <h3 className="text-2xl font-bold text-gray-900">3</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Por Entregar</p>
                            <h3 className="text-2xl font-bold text-gray-900">8</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Pedidos Recientes</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                            <tr>
                                <th className="px-6 py-3">Pedido</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Total</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Cargando pedidos...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No hay pedidos recientes
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {order.order_number}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {order.client?.name || 'Cliente desconocido'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(order.order_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            ${(order.total_amount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {order.status === 'draft' ? 'Borrador' :
                                                    order.status === 'confirmed' ? 'Confirmado' :
                                                        order.status === 'delivered' ? 'Entregado' : order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                Ver detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showNewOrder && (
                <SalesOrderForm
                    onClose={() => setShowNewOrder(false)}
                    onSave={handleOrderSaved}
                />
            )}
        </div>
    );
}
