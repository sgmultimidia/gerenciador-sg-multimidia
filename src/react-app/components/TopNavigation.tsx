import { Menu, X, Search, Bell, Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';

interface TopNavigationProps {
  onSettingsClick?: () => void;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export default function TopNavigation({ onSettingsClick, currentPage = 'dashboard', onNavigate }: TopNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Início' },
    { id: 'clients', label: 'Clientes' },
    { id: 'quotes', label: 'Orçamentos' },
    { id: 'financial', label: 'Financeiro' },
    { id: 'projects', label: 'Projetos' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 z-50 h-14 md:h-16">
      <div className="max-w-[1920px] mx-auto h-full px-3 md:px-4 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 md:gap-3">
            <img 
              src="https://019b3337-8e60-7d99-90b6-518278a74e7c.mochausercontent.com/Logo-Branco-PNG.png" 
              alt="SG Multimídia"
              className="h-6 md:h-8 w-auto object-contain"
            />
            <div className="hidden sm:block w-px h-6 bg-slate-700"></div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${currentPage === item.id 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                `}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search */}
          <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-sm text-slate-400 hover:text-white transition-all border border-slate-700/50">
            <Search className="w-4 h-4" />
            <span className="hidden lg:inline">Buscar...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-xs bg-slate-700 rounded">⌘K</kbd>
          </button>

          {/* Notifications */}
          <button className="p-1.5 md:p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all relative">
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button 
            onClick={onSettingsClick}
            className="p-1.5 md:p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
            title="Gerenciar Serviços"
          >
            <SettingsIcon className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-slate-900/98 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl">
          <div className="px-3 py-2 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate?.(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  w-full px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-all duration-200
                  ${currentPage === item.id 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                `}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
