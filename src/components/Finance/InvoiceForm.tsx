import { useState, useEffect } from 'react';
import { X, FileText, Check, Search } from 'lucide-react';
import { supabase, Client, SalesOrder } from '../../lib/supabase';

interface InvoiceFormProps {
    onClose: () => void;
    onSave: () => void;
}

export default function InvoiceForm({ onClose, onSave }: InvoiceFormProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState('');

    // Load Clients on mount
    useEffect(() => {
        fetchClients();
    }, []);

    // Load Orders when Client changes
    useEffect(() => {
        if (selectedClientId) {
            fetchOrders(selectedClientId);
        } else {
            setOrders([]);
        }
    }, [selectedClientId]);

    const fetchClients = async () => {
        try {
            const { data } = await supabase
                .from('clients')
                .select('*')
                .eq('is_active', true)
                .order('name');
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchOrders = async (clientId: string) => {
        try {
            // Fetch orders that are confirmed or delivered but NOT yet invoiced
            const { data } = await supabase
                .from('sales_orders')
                .select('*')
                .eq('client_id', clientId)
                .in('status', ['confirmed', 'delivered', 'shipped'])
                .order('created_at', { ascending: false });
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const handleGenerateInvoice = async () => {
        if (!selectedOrderId) return;
        setLoading(true);

        try {
            // 1. Update Order Status to 'invoiced'
            // In a real app, we would also generate a PDF and store the URL, 
            // and maybe create a record in a separate 'invoices' table linked to the Fiscal/SAT system.
            const { error } = await supabase
                .from('sales_orders')
                .update({
                    status: 'invoiced',
                    // delivery_date: new Date().toISOString() // Optional: marking invoice date if needed
                })
                .eq('id', selectedOrderId);

            if (error) throw error;

            // 2. Trigger AR update (handled by DB trigger usually, or we can manually ensure it's tracked)
            // For this MVP, the status change is enough to mark it as "Billed".

            setStep(3); // Success step
            setTimeout(() => {
                onSave();
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Error generating invoice:', error);
            alert('Error al generar factura');
        } finally {
            setLoading(false);
        }
    };

    const selectedOrder_obj = orders.find(o => o.id === selectedOrderId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Nueva Factura
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">1. Seleccionar Cliente</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                >
                                    <option value="">-- Buscar Cliente --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.rfc})</option>
                                    ))}
                                </select>
                            </div>

                            {selectedClientId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">2. Seleccionar Pedido a Facturar</label>
                                    {orders.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed">
                                            No hay pedidos pendientes de facturar para este cliente.
                                        </p>
                                    ) : (
                                        <div className="grid gap-3">
                                            {orders.map(order => (
                                                <div
                                                    key={order.id}
                                                    onClick={() => setSelectedOrderId(order.id)}
                                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedOrderId === order.id
                                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold text-gray-900">{order.order_number}</p>
                                                            <p className="text-xs text-gray-500">{new Date(order.order_date).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-gray-900">${(order.total_amount || 0).toLocaleString()}</p>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!selectedOrderId}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && selectedOrder_obj && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de Factura</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cliente:</span>
                                        <span className="font-medium">{clients.find(c => c.id === selectedClientId)?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">RFC:</span>
                                        <span className="font-medium">{clients.find(c => c.id === selectedClientId)?.rfc}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Pedido Base:</span>
                                        <span className="font-medium">{selectedOrder_obj.order_number}</span>
                                    </div>
                                    <hr className="border-gray-200 my-2" />
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span>${((selectedOrder_obj.total_amount || 0) / 1.16).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">IVA (16%):</span>
                                        <span>${((selectedOrder_obj.total_amount || 0) - ((selectedOrder_obj.total_amount || 0) / 1.16)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-blue-600 pt-2">
                                        <span>Total a Pagar:</span>
                                        <span>${(selectedOrder_obj.total_amount || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
                                >
                                    Atrás
                                </button>
                                <button
                                    onClick={handleGenerateInvoice}
                                    disabled={loading}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? 'Procesando...' : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Timbrar Factura
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">¡Factura Generada!</h3>
                            <p className="text-gray-500 mt-2">El pedido ha sido marcado como facturado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
