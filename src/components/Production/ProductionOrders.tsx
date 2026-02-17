import { useState, useEffect } from 'react';
import { Plus, Play, CheckCircle, XCircle } from 'lucide-react';
import { supabase, ProductionOrder, Product, Warehouse, BOMHeader } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ProductionOrderForm from './ProductionOrderForm';

export default function ProductionOrders() {
  const [orders, setOrders] = useState<(ProductionOrder & { product: Product; warehouse: Warehouse })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('production_orders')
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const updates: Record<string, unknown> = { status };

      if (status === 'in_progress') {
        updates.actual_start = new Date().toISOString();
      } else if (status === 'completed') {
        updates.actual_end = new Date().toISOString();
      }

      const { error } = await supabase
        .from('production_orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      if (status === 'in_progress') {
        await consumeMaterials(orderId);
      } else if (status === 'completed') {
        await generateOutput(orderId);
      }

      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error al actualizar el estado de la orden');
    }
  };

  const consumeMaterials = async (orderId: string) => {
    try {
      const { data: order } = await supabase
        .from('production_orders')
        .select('*, bom:bom_headers(*, lines:bom_lines(*))')
        .eq('id', orderId)
        .single();

      if (!order || !order.bom) return;

      const bom = order.bom as unknown as BOMHeader & { lines: Array<{ product_id: string; quantity: number }> };

      for (const line of bom.lines) {
        const quantityNeeded = (line.quantity * order.planned_quantity) / bom.batch_size;

        await supabase.from('inventory_movements').insert({
          movement_type: 'production_consume',
          warehouse_id: order.warehouse_id,
          product_id: line.product_id,
          quantity: -quantityNeeded,
          reference_type: 'production_order',
          reference_id: orderId,
          created_by: user?.id,
        });

        const { data: stock } = await supabase
          .from('inventory_stock')
          .select('*')
          .eq('warehouse_id', order.warehouse_id)
          .eq('product_id', line.product_id)
          .is('lot_id', null)
          .maybeSingle();

        if (stock) {
          await supabase
            .from('inventory_stock')
            .update({ quantity: stock.quantity - quantityNeeded })
            .eq('id', stock.id);
        }
      }
    } catch (error) {
      console.error('Error consuming materials:', error);
    }
  };

  const generateOutput = async (orderId: string) => {
    try {
      const { data: order } = await supabase
        .from('production_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!order) return;

      const lotNumber = `LOT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${orderId.slice(0, 8)}`;

      const { data: lot } = await supabase
        .from('inventory_lots')
        .insert({
          lot_number: lotNumber,
          product_id: order.product_id,
          production_date: new Date().toISOString().split('T')[0],
          initial_quantity: order.produced_quantity,
        })
        .select()
        .single();

      if (lot) {
        await supabase.from('inventory_movements').insert({
          movement_type: 'production_output',
          warehouse_id: order.warehouse_id,
          product_id: order.product_id,
          lot_id: lot.id,
          quantity: order.produced_quantity,
          reference_type: 'production_order',
          reference_id: orderId,
          created_by: user?.id,
        });

        const { data: stock } = await supabase
          .from('inventory_stock')
          .select('*')
          .eq('warehouse_id', order.warehouse_id)
          .eq('product_id', order.product_id)
          .eq('lot_id', lot.id)
          .maybeSingle();

        if (stock) {
          await supabase
            .from('inventory_stock')
            .update({ quantity: stock.quantity + order.produced_quantity })
            .eq('id', stock.id);
        } else {
          await supabase.from('inventory_stock').insert({
            warehouse_id: order.warehouse_id,
            product_id: order.product_id,
            lot_id: lot.id,
            quantity: order.produced_quantity,
          });
        }
      }
    } catch (error) {
      console.error('Error generating output:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const labels = {
      draft: 'Borrador',
      scheduled: 'Programada',
      in_progress: 'En Proceso',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };

    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Órdenes de Producción</h3>
          <p className="text-sm text-gray-600">Control del ciclo productivo</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Orden</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No hay órdenes de producción</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Crear la primera orden
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Almacén
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.warehouse.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.produced_quantity} / {order.planned_quantity}
                    </div>
                    {order.waste_quantity > 0 && (
                      <div className="text-xs text-red-600">
                        Merma: {order.waste_quantity}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {order.status === 'scheduled' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'in_progress')}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        title="Iniciar producción"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {order.status === 'in_progress' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="text-green-600 hover:text-green-900 mr-2"
                        title="Completar"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {(order.status === 'draft' || order.status === 'scheduled') && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="text-red-600 hover:text-red-900"
                        title="Cancelar"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ProductionOrderForm
          onClose={() => {
            setShowForm(false);
            loadOrders();
          }}
        />
      )}
    </div>
  );
}
