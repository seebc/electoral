
import React from 'react';
import { 
  Menu, 
  Search, 
  Bell
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  tabTitles: Record<string, string>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  casillasSinCobertura: number;
  currentUser: any;
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  tabTitles,
  searchTerm,
  setSearchTerm,
  casillasSinCobertura,
  currentUser,
  onOpenSidebar
}) => {
  return (
    <header className="h-16 bg-white border-b border-surface-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-surface-500 hover:bg-surface-50 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:flex flex-col">
          <span className="text-[10px] font-bold text-inst-600 uppercase tracking-widest leading-none mb-1">Sección Actual</span>
          <span className="font-semibold text-surface-800">{tabTitles[activeTab] || 'Dashboard'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input 
              type="text" 
              placeholder="BUSCAR REGISTROS..." 
              className="bg-surface-50 border border-surface-200 pl-10 pr-4 py-2 rounded-none w-64 text-sm focus:outline-none focus:ring-2 focus:ring-inst-500/20 focus:border-inst-500 transition-all placeholder:text-surface-400 uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
            />
        </div>

        <div className="h-6 w-px bg-surface-200 hidden md:block" />

        {/* Notifications */}
        <button className="btn-icon relative">
          <Bell className="w-5 h-5" />
          {casillasSinCobertura > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              !
            </span>
          )}
        </button>

        {/* System Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-success-50 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
          <span className="text-xs font-medium text-success-700">Operativo</span>
        </div>

        <div className="h-6 w-px bg-surface-200" />

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-inst-100 rounded-lg flex items-center justify-center text-sm font-bold text-inst-700">
            {currentUser?.usuario?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-surface-800 leading-none">{currentUser?.usuario || 'Invitado'}</p>
            <p className="text-[11px] text-surface-400 mt-0.5">{currentUser?.rol === 'ADMIN' ? 'Administrador' : 'Capturista'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
