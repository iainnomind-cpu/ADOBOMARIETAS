import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase, BOMHeader, Product, BOMLine } from '../../lib/supabase';

interface BOMFormProps {
  bom: BOMHeader | null;
  onClose: () => void;
}

interface BOMLineForm {
  id?: string;
  product_id: string;
  quantity: number;
  unit_of_measure: string;
  notes: string;
}

export default function BOMForm({ bom, onClose }: BOMFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState(bom?.name || '');
  const [productId, setProductId] = useState(bom?.product_id || '');
  const [batchSize, setBatchSize] = useState(bom?.batch_size || 0);
  const [isActive, setIsActive] = useState(bom?.is_active ?? true);
  const [lines, setLines] = useState<BOMLineForm[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    if (bom) {
      loadBOMLines();
    }
  }, [bom]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');
    setProducts(data || []);
  };

  const loadBOMLines = async () => {
    if (!bom) return;

    const { data } = await supabase
      .from('bom_lines')
      .select('*')
      .eq('bom_id', bom.id);

    if (data) {
      setLines(data.map(line => ({
        id: line.id,
        product_id: line.product_id,
        quantity: line.quantity,
        unit_of_measure: line.unit_of_measure,
        notes: line.notes || '',
      })));
    }
  };

  const addLine = () => {
    setLines([...lines, {
      product_id: '',
      quantity: 0,
      unit_of_measure: 'kg',
      notes: '',
    }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof BOMLineForm, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let bomId = bom?.id;

      if (bom) {
        const { error } = await supabase
          .from('bom_headers')
          .update({
            name,
            product_id: productId,
            batch_size: batchSize,
            is_active: isActive,
          })
          .eq('id', bom.id);

        if (error) throw error;

        await supabase.from('bom_lines').delete().eq('bom_id', bom.id);
      } else {
        const { data, error } = await supabase
          .from('bom_headers')
          .insert({
            name,
            product_id: productId,
            batch_size: batchSize,
            is_active: isActive,
            version: 1,
          })
          .select()
          .single();

        if (error) throw error;
        bomId = data.id;
      }

      if (lines.length > 0) {
        const { error: linesError } = await supabase
          .from('bom_lines')
          .insert(
            lines.map(line => ({
              bom_id: bomId,
              product_id: line.product_id,
              quantity: line.quantity,
              unit_of_measure: line.unit_of_measure,
              notes: line.notes,
            }))
          );

        if (linesError) throw linesError;
      }

      onClose();
    } catch (error) {
      console.error('Error saving BOM:', error);
      alert('Error al guardar la lista de materiales');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">
            {bom ? 'Editar Lista de Materiales' : 'Nueva Lista de Materiales'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Receta
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Adobo 260g"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto Final
              </label>
              <select
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar producto</option>
                {products.filter(p => p.type === 'finished_product').map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamaño de Lote
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={batchSize}
                onChange={(e) => setBatchSize(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Activo</span>
              </label>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Ingredientes / Materiales
              </label>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, index) => (
                <div key={index} className="flex space-x-2 items-start">
                  <select
                    required
                    value={line.product_id}
                    onChange={(e) => updateLine(index, 'product_id', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar material</option>
                    {products.filter(p => p.type !== 'finished_product').map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value))}
                    placeholder="Cantidad"
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    required
                    value={line.unit_of_measure}
                    onChange={(e) => updateLine(index, 'unit_of_measure', e.target.value)}
                    placeholder="Unidad"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
