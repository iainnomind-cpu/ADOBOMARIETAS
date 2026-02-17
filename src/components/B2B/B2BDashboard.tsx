import { useState } from 'react';
import { ShoppingBag, FileText, User } from 'lucide-react';
import ProductCatalog from './ProductCatalog';

export default function B2BDashboard() {
    const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'account'>('catalog');

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Top Navigation */}
            <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        AM
                    </div>
                    <span className="font-bold text-xl text-gray-900 tracking-tight">Portal Clientes</span>
                </div>

                <nav className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'catalog' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" />
                            Catálogo
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Mis Pedidos
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Mi Cuenta
                        </div>
                    </button>
                </nav>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative">
                {activeTab === 'catalog' && <ProductCatalog />}

                {activeTab === 'orders' && (
                    <div className="p-8 flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-gray-900">Historial de Pedidos</h3>
                            <p>Próximamente disponible</p>
                        </div>
                    </div>
                )}

                {activeTab === 'account' && (
                    <div className="p-8 flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-gray-900">Configuración de Cuenta</h3>
                            <p>Próximamente disponible</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
