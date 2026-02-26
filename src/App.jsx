import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, 
  HardHat, 
  ShieldCheck, 
  FolderLock, 
  LineChart, 
  LogOut 
} from 'lucide-react';

// ============================================================================
// 1. CONEXÃO COM O MOTOR (SUPABASE)
// Lendo de variáveis de ambiente para segurança absoluta.
// ============================================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// 2. COMPONENTES DAS ABAS (Módulos Vazios - Serão construídos nas próximas etapas)
// ============================================================================

function AbaContratos() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Gestão de Obras e Contratos</h2>
      <p className="text-slate-500 mb-8">Cadastro de Inquilinos, Obras, Contratos, Aditivos e Regras Financeiras.</p>
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
        <Building2 size={48} className="mb-4 text-slate-300" />
        <p>Módulo em construção (Etapa 2).</p>
      </div>
    </div>
  );
}

function AbaEngenharia() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Aprovações Físicas (Medições/Pedidos)</h2>
      <p className="text-slate-500 mb-8">Liberação de teto financeiro baseado no avanço real da obra.</p>
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
        <HardHat size={48} className="mb-4 text-slate-300" />
        <p>Módulo em construção (Etapa 3).</p>
      </div>
    </div>
  );
}

function AbaAlfandega() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Alfândega (Notas Fiscais)</h2>
      <p className="text-slate-500 mb-8">Retenção, auditoria em cascata e amortização de adiantamentos.</p>
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
        <ShieldCheck size={48} className="mb-4 text-slate-300" />
        <p>Módulo em construção (Etapa 4).</p>
      </div>
    </div>
  );
}

function AbaFechamento() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Fechamento e Lotes</h2>
      <p className="text-slate-500 mb-8">Agrupamento de NFs aprovadas e exportação de borderô contábil.</p>
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
        <FolderLock size={48} className="mb-4 text-slate-300" />
        <p>Módulo em construção (Etapa 5).</p>
      </div>
    </div>
  );
}

function AbaDiretoria() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Relatórios Gerenciais (LYO002)</h2>
      <p className="text-slate-500 mb-8">Visão executiva, Forecast de Custos e Projeção de Caixa.</p>
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
        <LineChart size={48} className="mb-4 text-slate-300" />
        <p>Módulo em construção (Etapa 5).</p>
      </div>
    </div>
  );
}

// ============================================================================
// 3. COMPONENTE PRINCIPAL (O Chassi de Roteamento)
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('contratos');
  const [isConnected, setIsConnected] = useState(false);

  // Teste de conexão silencioso no carregamento inicial
  useEffect(() => {
    async function checkConnection() {
      try {
        if (supabaseUrl && supabaseAnonKey) {
           // Faz um ping real na tabela empresas
           const { error } = await supabase.from('empresas').select('id').limit(1);
           if (!error) setIsConnected(true);
        }
      } catch (err) {
        console.error("Falha na conexão com Supabase", err);
      }
    }
    checkConnection();
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* MENU LATERAL (SIDEBAR) */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 shrink-0">
        {/* Cabeçalho do App */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
          <ShieldCheck className="text-emerald-500 mr-3" size={28} />
          <div>
            <h1 className="text-xl font-black text-white tracking-wide leading-none">CRIVO<span className="text-emerald-500">.app</span></h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Enterprise Edition</p>
          </div>
        </div>

        {/* Navegação Principal */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 mt-4">1. Estrutura</p>
          <MenuButton 
            id="contratos" icon={<Building2 size={18} />} label="Contratos & Obras" 
            active={activeTab === 'contratos'} onClick={() => setActiveTab('contratos')} 
          />
          
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 mt-6">2. Operação</p>
          <MenuButton 
            id="engenharia" icon={<HardHat size={18} />} label="Engenharia (Aprovações)" 
            active={activeTab === 'engenharia'} onClick={() => setActiveTab('engenharia')} 
          />
          <MenuButton 
            id="alfandega" icon={<ShieldCheck size={18} />} label="Alfândega (NFs)" 
            active={activeTab === 'alfandega'} onClick={() => setActiveTab('alfandega')} 
          />
          
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 mt-6">3. Executiva</p>
          <MenuButton 
            id="lotes" icon={<FolderLock size={18} />} label="Lotes de Pagamento" 
            active={activeTab === 'lotes'} onClick={() => setActiveTab('lotes')} 
          />
          <MenuButton 
            id="relatorios" icon={<LineChart size={18} />} label="Relatórios & Caixa" 
            active={activeTab === 'relatorios'} onClick={() => setActiveTab('relatorios')} 
          />
        </nav>

        {/* Rodapé do Menu (Status) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50">
            <div className="relative flex h-3 w-3">
              {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </div>
            <div className="text-xs">
              <p className="text-white font-medium">Motor de Banco de Dados</p>
              <p className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
                {isConnected ? 'Online & Blindado' : 'Aguardando .env'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL (PALCO) */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">
        {/* Topbar leve apenas para respiro visual */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="text-sm font-medium text-slate-500">
            Ambiente Seguro / AMS Automações
          </div>
          <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <LogOut size={16} /> Sair do Sistema
          </button>
        </header>

        {/* Renderização Dinâmica do Roteador */}
        <div className="flex-1 overflow-auto p-8 lg:p-12">
          {activeTab === 'contratos' && <AbaContratos />}
          {activeTab === 'engenharia' && <AbaEngenharia />}
          {activeTab === 'alfandega' && <AbaAlfandega />}
          {activeTab === 'lotes' && <AbaFechamento />}
          {activeTab === 'relatorios' && <AbaDiretoria />}
        </div>
      </main>

    </div>
  );
}

// Sub-componente de Botão do Menu
function MenuButton({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
      }`}
    >
      <span className={active ? 'text-emerald-400' : 'text-slate-500'}>{icon}</span>
      {label}
    </button>
  );
}