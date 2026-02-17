import { useState } from 'react';
import StockView from './StockView';
import WarehouseManagement from './WarehouseManagement';
import LotTracking from './LotTracking';
import InventoryMovements from './InventoryMovements';

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<'stock' | 'warehouses' | 'lots' | 'movements'>('stock');

  return (
    <div className="flex-1 bg-gray-50">
      <div className="border-b bg-white">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Inventarios</h2>
          <p className="text-sm text-gray-600 mt-1">
            Control multialmacén y trazabilidad de lotes
          </p>
        </div>

        <div className="px-6 flex space-x-1">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'stock'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Existencias
          </button>
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'warehouses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Almacenes
          </button>
          <button
            onClick={() => setActiveTab('lots')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'lots'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Lotes
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'movements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Movimientos
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'stock' && <StockView />}
        {activeTab === 'warehouses' && <WarehouseManagement />}
        {activeTab === 'lots' && <LotTracking />}
        {activeTab === 'movements' && <InventoryMovements />}
      </div>
    </div>
  );
}
