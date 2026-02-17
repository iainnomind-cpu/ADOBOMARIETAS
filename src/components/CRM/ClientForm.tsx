import { useState } from 'react';
import { X, Save, Building, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ClientFormProps {
    onClose: () => void;
    onSave: () => void;
}

export default function ClientForm({ onClose, onSave }: ClientFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        rfc: '',
        email: '',
        phone: '',
        client_type: 'retail',
        credit_limit: 0,
        payment_term_days: 0,
        // Address
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        zip_code: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Insert Client
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .insert([{
                    name: formData.name,
                    rfc: formData.rfc,
                    email: formData.email,
                    phone: formData.phone,
                    client_type: formData.client_type,
                    credit_limit: formData.credit_limit,
                    payment_term_days: formData.payment_term_days,
                    current_balance: 0,
                    is_active: true
                }])
                .select()
                .single();

            if (clientError) throw clientError;

            // 2. Insert Address if provided
            if (formData.address_line1) {
                const { error: addressError } = await supabase
                    .from('client_addresses')
                    .insert([{
                        client_id: client.id,
                        address_line1: formData.address_line1,
                        address_line2: formData.address_line2,
                        city: formData.city,
                        state: formData.state,
                        zip_code: formData.zip_code,
                        is_default: true
                    }]);

                if (addressError) throw addressError;
            }

            onSave();
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Error al guardar cliente. Verifique los datos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">Nuevo Cliente</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* General Info */}
                    <div>
                        <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                            <Building className="w-5 h-5 mr-2 text-blue-600" />
                            Información General
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Razón Social *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">RFC</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.rfc}
                                    onChange={e => setFormData({ ...formData, rfc: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.client_type}
                                    onChange={e => setFormData({ ...formData, client_type: e.target.value })}
                                >
                                    <option value="retail">Menudeo</option>
                                    <option value="wholesale">Mayoreo</option>
                                    <option value="distributor">Distribuidor</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6"></div>

                    {/* Credit Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Crédito ($)</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.credit_limit}
                                onChange={e => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Días de Crédito</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.payment_term_days}
                                onChange={e => setFormData({ ...formData, payment_term_days: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6"></div>

                    {/* Address */}
                    <div>
                        <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                            Dirección Principal
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Calle y Número</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.address_line1}
                                    onChange={e => setFormData({ ...formData, address_line1: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Colonia / Referencia</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.address_line2}
                                    onChange={e => setFormData({ ...formData, address_line2: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={formData.state}
                                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CP</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={formData.zip_code}
                                        onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 text-white bg-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Guardando...' : 'Guardar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
