import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Map, Truck, User, Edit, Trash2, X, Save } from 'lucide-react';
import { supabase, SalesRoute, Profile } from '../../lib/supabase';

interface RouteManagerProps {
    onBack: () => void;
}

export default function RouteManager({ onBack }: RouteManagerProps) {
    const [routes, setRoutes] = useState<SalesRoute[]>([]);
    const [drivers, setDrivers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRoute, setEditingRoute] = useState<SalesRoute | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        assigned_vehicle: '',
        assigned_driver_id: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: routesData } = await supabase.from('sales_routes').select('*').order('name');
            const { data: profilesData } = await supabase.from('profiles').select('*').order('full_name');

            setRoutes(routesData || []);
            setDrivers(profilesData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (route: SalesRoute) => {
        setEditingRoute(route);
        setFormData({
            name: route.name,
            code: route.code || '',
            assigned_vehicle: route.assigned_vehicle || '',
            assigned_driver_id: route.assigned_driver_id || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Está seguro de eliminar esta ruta?')) return;
        try {
            const { error } = await supabase.from('sales_routes').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting route:', error);
            alert('Error al eliminar ruta. Puede que tenga pedidos asociados.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                assigned_vehicle: formData.assigned_vehicle,
                assigned_driver_id: formData.assigned_driver_id || null, // Handle empty string as null
                is_active: true
            };

            if (editingRoute) {
                const { error } = await supabase
                    .from('sales_routes')
                    .update(payload)
                    .eq('id', editingRoute.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('sales_routes')
                    .insert([payload]);
                if (error) throw error;
            }

            setShowForm(false);
            setEditingRoute(null);
            setFormData({ name: '', code: '', assigned_vehicle: '', assigned_driver_id: '' });
            fetchData();
        } catch (error) {
            console.error('Error saving route:', error);
            alert('Error al guardar la ruta.');
        }
    };

    const getDriverName = (id?: string) => {
        if (!id) return 'Sin asignar';
        const driver = drivers.find(d => d.id === id);
        return driver ? driver.full_name : 'Usuario desconocido';
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Rutas</h1>
                    <p className="text-gray-600">Configuración de zonas de reparto, vehículos y choferes</p>
                </div>
                <button
                    onClick={() => {
                        setEditingRoute(null);
                        setFormData({ name: '', code: '', assigned_vehicle: '', assigned_driver_id: '' });
                        setShowForm(true);
                    }}
                    className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Ruta
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Cargando rutas...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map(route => (
                        <div key={route.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <Map className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(route)}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(route.id)}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{route.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{route.code || 'Sin código'}</p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Truck className="w-4 h-4" />
                                    <span>{route.assigned_vehicle || 'Vehículo no asignado'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <User className="w-4 h-4" />
                                    <span>{getDriverName(route.assigned_driver_id)}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${route.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {route.is_active ? 'Activa' : 'Inactiva'}
                                </span>
                            </div>
                        </div>
                    ))}

                    {routes.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                            <p className="text-gray-500">No hay rutas configuradas</p>
                        </div>
                    )}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingRoute ? 'Editar Ruta' : 'Nueva Ruta'}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Ruta *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej. Ruta Norte, Ruta Centro"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="Ej. R-001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo Asignado</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.assigned_vehicle}
                                    onChange={e => setFormData({ ...formData, assigned_vehicle: e.target.value })}
                                    placeholder="Ej. Nissan NP300 - PLACA-123"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chofer / Vendedor</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.assigned_driver_id}
                                    onChange={e => setFormData({ ...formData, assigned_driver_id: e.target.value })}
                                >
                                    <option value="">Seleccione un usuario...</option>
                                    {drivers.map(driver => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.full_name} ({driver.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
