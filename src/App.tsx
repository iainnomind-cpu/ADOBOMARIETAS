import { useState } from 'react';
import {
  Menu
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Sidebar from './components/Layout/Sidebar';
import ClientList from './components/CRM/ClientList';
import SalesDashboard from './components/Sales/SalesDashboard';
import MainDashboard from './components/Dashboard/MainDashboard';
import B2BDashboard from './components/B2B/B2BDashboard';
import ProductionDashboard from './components/Production/ProductionDashboard';
import InventoryDashboard from './components/Inventory/InventoryDashboard';
import ProductManagement from './components/Products/ProductManagement';
import QuotesInvoices from './components/Finance/QuotesInvoices';

// Modules
const MODULES = {
  DASHBOARD: 'dashboard',
  INVENTORY: 'inventory',
  PRODUCTION: 'production',
  PRODUCTS: 'products',
  CRM: 'crm',
  SALES: 'sales',
  QUOTES: 'quotes'
} as const;

type Module = typeof MODULES[keyof typeof MODULES];

function App() {
  const { user, profile, loading } = useAuth();
  const [activeModule, setActiveModule] = useState<Module>(MODULES.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // B2B Portal Redirect
  if (profile?.role === 'b2b_client') {
    return <B2BDashboard />;
  }

  const handleModuleChange = (module: string) => {
    setActiveModule(module as Module);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar activeModule={activeModule} onModuleChange={handleModuleChange} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-gray-900">AdoboSystem</span>
          <div className="w-8" /> {/* Spacer for centering */}
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto">
          {activeModule === MODULES.DASHBOARD && <MainDashboard />}
          {activeModule === MODULES.SALES && <SalesDashboard />}
          {activeModule === MODULES.CRM && <ClientList />}
          {activeModule === MODULES.INVENTORY && <InventoryDashboard />}
          {activeModule === MODULES.PRODUCTION && <ProductionDashboard />}
          {activeModule === MODULES.PRODUCTS && <ProductManagement />}
          {activeModule === MODULES.QUOTES && <QuotesInvoices />}
        </div>
      </main>
    </div>
  );
}

export default App;
