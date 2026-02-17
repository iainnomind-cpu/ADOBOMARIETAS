import { Package, Warehouse, Factory, LogOut, Users, ShoppingCart, BarChart3, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

export default function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const { profile, signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'production', label: 'Producción (MRP/MES)', icon: Factory },
    { id: 'inventory', label: 'Inventarios (WMS)', icon: Warehouse },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'crm', label: 'CRM / Clientes', icon: Users },
    { id: 'sales', label: 'Ventas y Rutas', icon: ShoppingCart },
    { id: 'quotes', label: 'Cotizaciones y Facturas', icon: FileText },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold">Adobo Marietas</h1>
        <p className="text-sm text-gray-400 mt-1">Sistema ERP</p>
      </div>

      <nav className="flex-1 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg mb-1 transition-colors ${isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="mb-3">
          <p className="text-sm font-medium">{profile?.full_name}</p>
          <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
