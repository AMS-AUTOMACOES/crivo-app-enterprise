import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Anchor, 
  HardHat, 
  Layers, 
  LogOut,
  User
} from 'lucide-react';

export default function Layout({ children }) {
  // O useLocation permite-nos saber em qual URL estamos no momento
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FileText, label: 'Contratos', href: '/contratos' },
    { icon: Anchor, label: 'Alfândega', href: '/alfandega' },
    { icon: HardHat, label: 'Engenharia', href: '/engenharia' },
    { icon: Layers, label: 'Lotes e Romaneios', href: '/lotes' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Barra Lateral (Sidebar) */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <h1 className="text-white font-bold text-lg tracking-wider">CRIVO<span className="text-emerald-500">.ERP</span></h1>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            
            // Lógica dinâmica para pintar o botão de verde apenas se for a página atual
            const isActive = location.pathname.startsWith(item.href);
            
            return (
              <Link 
                key={index}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-medium">
            <LogOut size={18} />
            Terminar Sessão
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Cabeçalho Global (Header) */}
        <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-8 z-10">
          <div className="text-sm font-medium text-slate-500">
            Sistema de Gestão Integrada
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">Utilizador Padrão</p>
              <p className="text-xs text-slate-400">Administrador</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
              <User size={20} />
            </div>
          </div>
        </header>

        {/* Conteúdo Dinâmico da Página */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
      
    </div>
  );
}
