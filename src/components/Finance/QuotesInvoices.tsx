import { useState, useEffect } from 'react';
import {
    Plus,
    Printer,
    ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import QuoteForm from './QuoteForm';
import ReceiptView from './ReceiptView';

export default function QuotesInvoices() {
    const [activeTab, setActiveTab] = useState<'quotes' | 'receipts'>('receipts');
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any>(null); // For viewing receipt

    useEffect(() => {
        fetchDocuments();
    }, [activeTab]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('sales_orders')
                .select(`
                    id, 
                    order_number, 
                    order_date, 
                    total_amount, 
                    status,
                    clients (name, rfc)
                `)
                .order('created_at', { ascending: false });

            if (activeTab === 'quotes') {
                query = query.eq('status', 'quote');
            } else {
                // Receipts/Invoices = Confirmed, Delivered, Invoiced
                query = query.in('status', ['confirmed', 'delivered', 'invoiced', 'shipped']);
            }

            const { data, error } = await query;
            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching docs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Facturación y Cotizaciones</h1>
                    <p className="text-gray-600">Gestiona cotizaciones provisionales y recibos de venta.</p>
                </div>
                {activeTab === 'quotes' && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Cotización
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('receipts')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'receipts'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Recibos / Facturas
                    </button>
                    <button
                        onClick={() => setActiveTab('quotes')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'quotes'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Cotizaciones
                    </button>
                </nav>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg shadowoverflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center">Cargando...</td>
                            </tr>
                        ) : documents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No hay documentos encontrados.</td>
                            </tr>
                        ) : (
                            documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {doc.order_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {doc.clients?.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(doc.order_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                        ${(doc.total_amount || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.status === 'quote' ? 'bg-gray-100 text-gray-800' :
                                            doc.status === 'invoiced' ? 'bg-green-100 text-green-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                            {doc.status === 'quote' ? 'Cotización' :
                                                doc.status === 'invoiced' ? 'Facturado' : 'Pedido/Remisión'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setSelectedDoc(doc)}
                                            className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 justify-end ml-auto"
                                        >
                                            <Printer className="w-4 h-4" />
                                            Imprimir
                                        </button>

                                        {activeTab === 'quotes' && (
                                            <button
                                                // Convert logic would go here
                                                className="text-green-600 hover:text-green-900 flex items-center gap-1 justify-end ml-auto mt-2"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                                Convertir
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {showForm && (
                <QuoteForm onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); fetchDocuments(); }} />
            )}

            {selectedDoc && (
                <ReceiptView
                    document={selectedDoc}
                    onClose={() => setSelectedDoc(null)}
                />
            )}
        </div>
    );
}
