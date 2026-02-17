import { useState, useEffect } from 'react';
import {
    DollarSign,
    PieChart,
    TrendingUp,
    Download,
    FileText,
    AlertTriangle,
    Package,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingCart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';


export default function MainDashboard() {
    const [loading, setLoading] = useState(true);


    // KPI Data (Mock for now, would fetch from DB)
    const financialKPIs = [
        { label: 'Ventas del Mes', value: '$145,200', change: '+12%', trend: 'up', icon: TrendingUp, color: 'blue' },
        { label: 'Cuentas por Cobrar', value: '$23,500', change: '-5%', trend: 'down', icon: DollarSign, color: 'orange' },
        { label: 'Margen Bruto', value: '42%', change: '+2%', trend: 'up', icon: PieChart, color: 'green' },
    ];

    const operationalKPIs = [
        { label: 'Pedidos Activos', value: '12', subtext: '4 por entregar hoy', icon: ShoppingCart, color: 'indigo' },
        { label: 'Bajo Stock', value: '5', subtext: 'SKUs críticos', icon: AlertTriangle, color: 'red' },
        { label: 'Producción', value: '3', subtext: 'Órdenes en proceso', icon: Activity, color: 'purple' },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
                    <p className="text-gray-600">Visión general del negocio en tiempo real</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm font-medium">
                        <Download className="w-4 h-4" />
                        Exportar Reporte
                    </button>

                </div>
            </div>

            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {financialKPIs.map((kpi, index) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium ${kpi.trend === 'up' && kpi.color !== 'orange' ? 'text-green-600' :
                                    kpi.trend === 'down' && kpi.color === 'orange' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {kpi.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    {kpi.change}
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mt-4">{kpi.value}</h3>
                            <p className="text-gray-500 text-sm mt-1">{kpi.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Operational Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {operationalKPIs.map((kpi, index) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                            <div className={`p-3 rounded-full bg-${kpi.color}-50 text-${kpi.color}-600`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{kpi.value}</h3>
                                <p className="text-sm font-medium text-gray-900">{kpi.label}</p>
                                <p className="text-xs text-gray-500">{kpi.subtext}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Product Profitability */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Rentabilidad por Producto</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Ver todos</button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Adobo Marietas 260g</p>
                                    <p className="text-xs text-gray-500">Retail</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-600 text-lg">47%</p>
                                <p className="text-xs text-gray-500">Margen</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Adobo Marietas 460g</p>
                                    <p className="text-xs text-gray-500">Wholesale</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-600 text-lg">50%</p>
                                <p className="text-xs text-gray-500">Margen</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accounts Receivable */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Cuentas por Cobrar</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Ver todo</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left rounded-l-lg">Cliente</th>
                                    <th className="px-4 py-3 text-right">Monto</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-gray-900">Supermercados El Sol</p>
                                        <p className="text-xs text-gray-500">Factura #1023</p>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900">$12,450</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Vence Hoy
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-gray-900">Abarrotes Don Pepe</p>
                                        <p className="text-xs text-gray-500">Factura #1024</p>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900">$3,200</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            5 días
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>


        </div>
    );
}
