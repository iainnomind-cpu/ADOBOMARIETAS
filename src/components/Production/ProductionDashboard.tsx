import { useState } from 'react';
import BOMManagement from './BOMManagement';
import ProductionOrders from './ProductionOrders';

export default function ProductionDashboard() {
  const [activeTab, setActiveTab] = useState<'bom' | 'orders'>('orders');

  return (
    <div className="flex-1 bg-gray-50">
      <div className="border-b bg-white">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Producción</h2>
          <p className="text-sm text-gray-600 mt-1">
            Control de órdenes de fabricación y listas de materiales
          </p>
        </div>

        <div className="px-6 flex space-x-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Órdenes de Producción
          </button>
          <button
            onClick={() => setActiveTab('bom')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'bom'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Listas de Materiales (BOM)
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'orders' && <ProductionOrders />}
        {activeTab === 'bom' && <BOMManagement />}
      </div>
    </div>
  );
}
