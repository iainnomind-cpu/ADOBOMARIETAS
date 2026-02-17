import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { supabase, Client, Product, Warehouse } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SalesOrderFormProps {
    onClose: () => void;
    onSave: () => void;
}

interface OrderLine {
    product_id: string;
    quantity: number;
    unit_price: number;
    product?: Product;
}

export default function SalesOrderForm({ onClose, onSave }: SalesOrderFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Catalogs
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    // Form State
    const [clientId, setClientId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [lines, setLines] = useState<OrderLine[]>([]);
    const [newLine, setNewLine] = useState<{ product_id: string, quantity: number }>({ product_id: '', quantity: 1 });

    useEffect(() => {
        fetchCatalogs();
    }, []);

    const fetchCatalogs = async () => {
        try {
            const { data: clientsData } = await supabase.from('clients').select('*').order('name');
            const { data: productsData } = await supabase.from('products').select('*').eq('is_active', true);
            const { data: warehousesData } = await supabase.from('warehouses').select('*').eq('is_active', true);

            setClients(clientsData || []);
            setProducts(productsData || []);
            setWarehouses(warehousesData || []);

            if (warehousesData && warehousesData.length > 0) {
                setWarehouseId(warehousesData[0].id);
            }
        } catch (error) {
            console.error('Error fetching catalogs:', error);
        }
    };

    const addLine = () => {
        if (!newLine.product_id) return;

        // Find product to get price (mock price for now as it's not in Product interface strictly, assuming standard price or 0)
        // IMPORTANT: In a real app we'd have a Price List. Here we'll ask user or default to 0.
        const product = products.find(p => p.id === newLine.product_id);
        if (!product) return;

        // Check if already active
        const existingIndex = lines.findIndex(l => l.product_id === newLine.product_id);
        if (existingIndex >= 0) {
            const updatedLines = [...lines];
            updatedLines[existingIndex].quantity += newLine.quantity;
            setLines(updatedLines);
        } else {
            setLines([...lines, {
                product_id: newLine.product_id,
                quantity: newLine.quantity,
                unit_price: 0, // Default price, user can edit
                product
            }]);
        }

        setNewLine({ product_id: '', quantity: 1 });
    };

    const updateLinePrice = (index: number, price: number) => {
        const updatedLines = [...lines];
        updatedLines[index].unit_price = price;
        setLines(updatedLines);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return lines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || !warehouseId || lines.length === 0) {
            alert('Complete todos los campos requeridos y agregue productos.');
            return;
        }

        setLoading(true);
        try {
            const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
            const total = calculateTotal();

            // 1. Create Sales Order
            const { data: order, error: orderError } = await supabase
                .from('sales_orders')
                .insert([{
                    order_number: orderNumber,
                    client_id: clientId,
                    warehouse_id: warehouseId,
                    status: 'confirmed', // Auto-confirm for this demo to trigger inventory
                    order_date: new Date().toISOString(),
                    total_amount: total,
                    tax_amount: total * 0.16,
                    discount_amount: 0,
                    currency: 'MXN',
                    created_by: user?.id
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Lines
            const orderLines = lines.map(line => ({
                sales_order_id: order.id,
                product_id: line.product_id,
                quantity: line.quantity,
                unit_price: line.unit_price,
                total_price: line.quantity * line.unit_price,
                tax_rate: 0.16,
                discount_rate: 0
            }));

            const { error: linesError } = await supabase
                .from('sales_order_lines')
                .insert(orderLines);

            if (linesError) throw linesError;

            onSave();

        } catch (error) {
            console.error('Error creating order:', error);
            alert('Error al crear pedido.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">Nuevo Pedido de Venta</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                            <select
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={clientId}
                                onChange={e => setClientId(e.target.value)}
                            >
                                <option value="">Seleccione un cliente...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Almacén de Salida *</label>
                            <select
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={warehouseId}
                                onChange={e => setWarehouseId(e.target.value)}
                            >
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Agregar Productos
                        </h3>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">Producto</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    value={newLine.product_id}
                                    onChange={e => setNewLine({ ...newLine, product_id: e.target.value })}
                                >
                                    <option value="">Seleccione...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    value={newLine.quantity}
                                    onChange={e => setNewLine({ ...newLine, quantity: Number(e.target.value) })}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addLine}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Detalle del Pedido</h3>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 text-gray-600 font-medium">
                                    <tr>
                                        <th className="px-4 py-2">Producto</th>
                                        <th className="px-4 py-2 text-center">Cant.</th>
                                        <th className="px-4 py-2 text-right">Precio Unit. ($)</th>
                                        <th className="px-4 py-2 text-right">Total</th>
                                        <th className="px-4 py-2 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {lines.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">
                                                No hay productos en el pedido
                                            </td>
                                        </tr>
                                    ) : (
                                        lines.map((line, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2">
                                                    <div>{line.product?.name}</div>
                                                    <div className="text-xs text-gray-500">{line.product?.sku}</div>
                                                </td>
                                                <td className="px-4 py-2 text-center">{line.quantity}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-24 text-right border border-gray-300 rounded px-1 py-0.5 text-sm"
                                                        value={line.unit_price}
                                                        onChange={e => updateLinePrice(idx, Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium">
                                                    ${(line.quantity * line.unit_price).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLine(idx)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-gray-50 font-bold">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-2 text-right">Total:</td>
                                        <td className="px-4 py-2 text-right">${calculateTotal().toLocaleString()}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 text-white bg-green-600 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Procesando...' : 'Confirmar Pedido'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
