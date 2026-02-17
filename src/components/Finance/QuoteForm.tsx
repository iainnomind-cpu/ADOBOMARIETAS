import { useState, useEffect } from 'react';
import { X, Trash2, Search } from 'lucide-react';
import { supabase, Client, Product } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface QuoteFormProps {
    onClose: () => void;
    onSave: () => void;
}

export default function QuoteForm({ onClose, onSave }: QuoteFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        client_id: '',
        items: [] as Array<{ product: Product; quantity: number }>
    });

    useEffect(() => {
        fetchClients();
        fetchProducts();
    }, []);

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('*').eq('is_active', true).order('name');
        setClients(data || []);
    };

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').eq('is_active', true).order('name');
        setProducts(data || []);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );



    const addItem = (product: Product) => {
        const existing = formData.items.find(i => i.product.id === product.id);
        if (existing) {
            setFormData({
                ...formData,
                items: formData.items.map(i =>
                    i.product.id === product.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                )
            });
        } else {
            setFormData({
                ...formData,
                items: [...formData.items, { product, quantity: 1 }]
            });
        }
    };

    const updateQuantity = (index: number, delta: number) => {
        const newItems = [...formData.items];
        const item = newItems[index];
        const newQuantity = Math.max(1, item.quantity + delta);

        newItems[index] = { ...item, quantity: newQuantity };
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + ((item.product.sales_price || 0) * item.quantity), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create Quote (Sales Order with status = 'quote')
            const totalAmount = calculateTotal();
            const orderNumber = `COT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

            const { data: orderData, error: orderError } = await supabase
                .from('sales_orders')
                .insert([{
                    order_number: orderNumber,
                    client_id: formData.client_id,
                    status: 'quote',
                    total_amount: totalAmount,
                    created_by: user?.id,
                    order_date: new Date().toISOString()
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // Create Order Lines
            const orderLines = formData.items.map(item => ({
                sales_order_id: orderData.id,
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.product.sales_price || 0,
                total_price: (item.product.sales_price || 0) * item.quantity
            }));

            const { error: linesError } = await supabase
                .from('sales_order_lines')
                .insert(orderLines);

            if (linesError) throw linesError;

            onSave();
        } catch (error) {
            console.error('Error creating quote:', error);
            alert('Error al crear la cotización');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Nueva Cotización</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Left: Product Selection */}
                    <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
                        <div className="mb-4 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => addItem(product)}
                                    className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all text-sm"
                                >
                                    <h4 className="font-bold text-gray-900">{product.name}</h4>
                                    <p className="text-gray-500 text-xs mb-2">SKU: {product.sku}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-green-600">${product.sales_price || 0}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${product.current_stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            Stock: {product.current_stock}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="w-1/2 p-6 overflow-y-auto flex flex-col">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.client_id}
                                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                            >
                                <option value="">Seleccionar Cliente</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 mb-6">
                            <h3 className="font-medium text-gray-900 mb-4">Partidas</h3>
                            {formData.items.length === 0 ? (
                                <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                    Agrega productos del panel izquierdo
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                                                <p className="text-sm text-gray-500">${item.product.sales_price} x {item.quantity}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(index, -1)}
                                                        className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(index, 1)}
                                                        className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 pt-6 mt-auto">
                            <div className="flex justify-between items-center text-xl font-bold mb-6">
                                <span>Total</span>
                                <span>${calculateTotal().toLocaleString()}</span>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !formData.client_id || formData.items.length === 0}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Guardando...' : 'Crear Cotización'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
