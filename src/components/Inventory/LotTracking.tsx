import { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { supabase, InventoryLot, Product } from '../../lib/supabase';

export default function LotTracking() {
  const [lots, setLots] = useState<(InventoryLot & { product: Product })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLots();
  }, []);

  const loadLots = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_lots')
        .select(`
          *,
          product:products(*)
        `)
        .order('production_date', { ascending: false });

      if (error) throw error;
      setLots(data || []);
    } catch (error) {
      console.error('Error loading lots:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysToExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    const daysToExpiry = getDaysToExpiry(expiryDate);
    if (daysToExpiry === null) return { text: 'N/A', color: 'bg-gray-100 text-gray-800' };
    if (daysToExpiry < 0) return { text: 'Vencido', color: 'bg-red-100 text-red-800' };
    if (daysToExpiry <= 7) return { text: 'Próximo a vencer', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Vigente', color: 'bg-green-100 text-green-800' };
  };

  const getExpiredLots = () => {
    return lots.filter(lot => {
      const days = getDaysToExpiry(lot.expiry_date);
      return days !== null && days <= 7;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  const expiredLots = getExpiredLots();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Trazabilidad de Lotes</h3>
          <p className="text-sm text-gray-600">Control de caducidad y producción</p>
        </div>
      </div>

      {expiredLots.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                Alertas de Caducidad
              </h4>
              <p className="text-sm text-red-700 mt-1">
                {expiredLots.length} lote(s) vencido(s) o próximo(s) a vencer
              </p>
            </div>
          </div>
        </div>
      )}

      {lots.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay lotes registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número de Lote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Producción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Caducidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad Inicial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lots.map((lot) => {
                const expiryStatus = getExpiryStatus(lot.expiry_date);
                const daysToExpiry = getDaysToExpiry(lot.expiry_date);

                return (
                  <tr key={lot.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lot.lot_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lot.product.name}</div>
                      <div className="text-xs text-gray-500">{lot.product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(lot.production_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {lot.expiry_date ? new Date(lot.expiry_date).toLocaleDateString() : 'N/A'}
                      </div>
                      {daysToExpiry !== null && daysToExpiry > 0 && (
                        <div className="text-xs text-gray-400">
                          {daysToExpiry} día(s) restantes
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {lot.initial_quantity} {lot.product.unit_of_measure}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${expiryStatus.color}`}>
                        {expiryStatus.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
