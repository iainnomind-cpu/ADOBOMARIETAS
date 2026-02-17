import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus } from 'lucide-react';
import { supabase, Product } from '../../lib/supabase';

interface CartItem {
    product: Product;
    quantity: number;
}

export default function ProductCatalog() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (100 * item.quantity), 0); // Placeholder price
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleCheckout = () => {
        alert('Funcionalidad de Checkout en desarrollo. Se integrará con Pedidos de Venta.');
        // TODO: Implement actual order creation linked to logged-in client
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center sticky top-0 z-10">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setShowCart(!showCart)}
                    className="relative bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <ShoppingCart className="w-6 h-6" />
                    {cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                            {cartItemCount}
                        </span>
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-hidden flex relative">
                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Cargando catálogo...</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                                    <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                                        {/* Placeholder for Product Image */}
                                        <span className="text-4xl">📦</span>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description || 'Sin descripción'}</p>
                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="font-bold text-lg text-blue-600">$100.00</span> {/* Placeholder Price */}
                                            <button
                                                onClick={() => addToCart(product)}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Shopping Cart Sidebar */}
                {showCart && (
                    <div className="w-96 bg-white border-l border-gray-200 shadow-xl flex flex-col absolute top-0 right-0 bottom-0 z-20">
                        <div className="p-4 border-b border-gray-200 font-bold text-gray-900 flex justify-between items-center">
                            <span>Carrito de Compras</span>
                            <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-xl">×</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Su carrito está vacío</div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.product.id} className="flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">📦</div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                                            <p className="text-blue-600 font-bold text-sm">$100.00</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(item.product.id, -1)}
                                                className="w-6 h-6 rounded bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.product.id, 1)}
                                                className="w-6 h-6 rounded bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">Total Estimado</span>
                                <span className="text-xl font-bold text-gray-900">${cartTotal.toLocaleString()}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Pedido
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
