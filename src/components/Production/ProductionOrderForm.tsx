import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase, BOMHeader, Product, Warehouse } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ProductionOrderFormProps {
  onClose: () => void;
}

export default function ProductionOrderForm({ onClose }: ProductionOrderFormProps) {
  const [boms, setBOMs] = useState<(BOMHeader & { product: Product })[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [bomId, setBomId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [plannedQuantity, setPlannedQuantity] = useState(0);
  const [producedQuantity, setProducedQuantity] = useState(0);
  const [wasteQuantity, setWasteQuantity] = useState(0);
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: bomsData } = await supabase
      .from('bom_headers')
      .select('*, product:products(*)')
      .eq('is_active', true);

    const { data: warehousesData } = await supabase
      .from('warehouses')
      .select('*')
      .eq('is_active', true);

    setBOMs(bomsData || []);
    setWarehouses(warehousesData || []);
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `OP-${year}${month}${day}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedBOM = boms.find(b => b.id === bomId);
      if (!selectedBOM) throw new Error('BOM no encontrado');

      const orderNumber = generateOrderNumber();

      const { error } = await supabase.from('production_orders').insert({
        order_number: orderNumber,
        bom_id: bomId,
        product_id: selectedBOM.product_id,
        warehouse_id: warehouseId,
        planned_quantity: plannedQuantity,
        produced_quantity: producedQuantity,
        waste_quantity: wasteQuantity,
        status: 'scheduled',
        scheduled_start: scheduledStart || null,
        scheduled_end: scheduledEnd || null,
        created_by: user?.id,
      });

      if (error) throw error;
      onClose();
    } catch (error) {
      console.error('Error creating production order:', error);
      alert('Error al crear la orden de producción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">Nueva Orden de Producción</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lista de Materiales (BOM)
              </label>
              <select
                required
                value={bomId}
                onChange={(e) => setBomId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar BOM</option>
                {boms.map(bom => (
                  <option key={bom.id} value={bom.id}>
                    {bom.name} - {bom.product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Almacén
              </label>
              <select
                required
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar almacén</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Planeada
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Producida
              </label>
              <input
                type="number"
                step="0.01"
                value={producedQuantity}
                onChange={(e) => setProducedQuantity(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Merma
              </label>
              <input
                type="number"
                step="0.01"
                value={wasteQuantity}
                onChange={(e) => setWasteQuantity(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inicio Programado
              </label>
              <input
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fin Programado
              </label>
              <input
                type="datetime-local"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
