import { useState, useEffect } from 'react';
import { X, Printer, Share2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReceiptViewProps {
    document: any;
    onClose: () => void;
}

export default function ReceiptView({ document, onClose }: ReceiptViewProps) {
    const [lines, setLines] = useState<any[]>([]);
    const [client, setClient] = useState<any>(null);

    useEffect(() => {
        if (document) {
            fetchDetails();
        }
    }, [document]);

    const fetchDetails = async () => {
        // Fetch Lines
        const { data: linesData } = await supabase
            .from('sales_order_lines')
            .select('*, products(name, sku)')
            .eq('sales_order_id', document.id);
        setLines(linesData || []);

        // Fetch Client Addresses (optional, for full details)
        if (document.clients) {
            const { data: addressData } = await supabase
                .from('client_addresses')
                .select('*')
                .eq('client_id', document.clients.id || document.client_id) // Handle join structure
                .eq('is_default', true)
                .single();
            setClient({ ...document.clients, address: addressData });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:p-0 print:bg-white inset-0">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl h-[90vh] overflow-hidden flex flex-col print:shadow-none print:h-auto print:w-full print:max-w-none print:rounded-none">

                {/* Actions Toolbar - Hidden in Print */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 print:hidden">
                    <h2 className="text-lg font-bold text-gray-900">Vista Previa</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm">
                            <Printer className="w-4 h-4" />
                            Imprimir
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div className="flex-1 overflow-y-auto p-8 print:p-8 bg-white" id="printable-area">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 border-b pb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Adobo Marietas</h1>
                            <p className="text-sm text-gray-500 mt-2">
                                Calle Principal 123<br />
                                Colonia Centro, CP 45000<br />
                                Guadalajara, Jalisco<br />
                                RFC: ADO909090ABC
                            </p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-gray-700 mb-2">
                                {document.status === 'quote' ? 'COTIZACIÓN' : 'RECIBO DE VENTA'}
                            </h2>
                            <p className="text-gray-600 font-medium">Folio: {document.order_number}</p>
                            <p className="text-sm text-gray-500">Fecha: {new Date(document.order_date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Cliente</h3>
                        <div className="bg-gray-50 p-4 rounded-lg print:bg-transparent print:p-0 print:border print:border-gray-200">
                            <p className="font-bold text-gray-900 text-lg">{document.clients?.name}</p>
                            <p className="text-gray-600">{document.clients?.rfc}</p>
                            {/* Address would appear here if loaded */}
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead className="border-b border-gray-200">
                            <tr>
                                <th className="text-left py-3 px-2 font-bold text-gray-700 text-sm">Producto</th>
                                <th className="text-right py-3 px-2 font-bold text-gray-700 text-sm">Cant.</th>
                                <th className="text-right py-3 px-2 font-bold text-gray-700 text-sm">Precio Unit.</th>
                                <th className="text-right py-3 px-2 font-bold text-gray-700 text-sm">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {lines.map((line, index) => (
                                <tr key={index}>
                                    <td className="py-3 px-2 text-sm">
                                        <p className="font-medium text-gray-900">{line.products?.name}</p>
                                        <p className="text-xs text-gray-500">{line.products?.sku}</p>
                                    </td>
                                    <td className="py-3 px-2 text-right text-sm text-gray-700">{line.quantity}</td>
                                    <td className="py-3 px-2 text-right text-sm text-gray-700">${(line.unit_price || 0).toLocaleString()}</td>
                                    <td className="py-3 px-2 text-right text-sm font-medium text-gray-900">${(line.total_price || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal:</span>
                                <span>${(document.total_amount / 1.16).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>IVA (16%):</span>
                                <span>${(document.total_amount - (document.total_amount / 1.16)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-300 pt-3">
                                <span>Total:</span>
                                <span>${(document.total_amount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
                        <p className="mb-2 font-medium">Gracias por su preferencia</p>
                        <p>Este documento es una representación impresa de un pedido digital. No es un comprobante fiscal válido a menos que se estipule lo contrario.</p>
                    </div>

                </div>
            </div>
        </div>
    );
}
