import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, 
  HardHat, 
  ShieldCheck, 
  FolderLock, 
  LineChart, 
  LogOut,
  Plus,
  ArrowRight,
  Database
} from 'lucide-react';

// ============================================================================
// 1. CONEXÃO COM O MOTOR (SUPABASE)
// ============================================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// 2. COMPONENTE DA ABA: GESTÃO DE CONTRATOS (ETAPA 2 CONSOLIDADA)
// ============================================================================

function AbaContratos() {
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [contratos, setContratos] = useState([]);
  
  // Seleção Hierárquica (Garante a Cascata)
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [selectedObraId, setSelectedObraId] = useState('');

  // Formulários de Inserção
  const [formEmpresa, setFormEmpresa] = useState({ razao_social: '', cnpj: '' });
  const [formObra, setFormObra] = useState({ codigo_obra: '', nome_obra: '' });
  const [formContrato, setFormContrato] = useState({
    codigo_contrato: '', razao_social: '', cnpj_fornecedor: '', centro_custo_raiz: '', valor_inicial: '', valor_adiantamento_concedido: ''
  });

  // Carregamento de Dados Iniciais
  useEffect(() => { 
    loadEmpresas(); 
  }, []);
  
  // Reatividade: Ao mudar a Empresa, carrega as Obras vinculadas
  useEffect(() => {
    if (selectedEmpresaId) {
      loadObras(selectedEmpresaId);
    } else { 
      setObras([]); 
      setSelectedObraId(''); 
    }
  }, [selectedEmpresaId]);

  // Reatividade: Ao mudar a Obra, carrega os Contratos vinculados
  useEffect(() => {
    if (selectedObraId) {
      loadContratos(selectedObraId);
    } else {
      setContratos([]);
    }
  }, [selectedObraId]);

  // Consultas ao Supabase
  async function loadEmpresas() {
    const { data } = await supabase.from('empresas').select('*').order('razao_social');
    if (data) setEmpresas(data);
  }

  async function loadObras(empId) {
    const { data } = await supabase.from('obras').select('*').eq('empresa_id', empId).order('nome_obra');
    if (data) setObras(data);
  }

  async function loadContratos(obrId) {
    const { data } = await supabase.from('contratos').select('*').eq('obra_id', obrId).order('codigo_contrato');
    if (data) setContratos(data);
  }

  // Ações de Escrita (CRUD)
  const handleAddEmpresa = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('empresas').insert([formEmpresa]);
    if (error) alert('Erro ao registar Empresa: ' + error.message);
    else { 
      setFormEmpresa({ razao_social: '', cnpj: '' }); 
      loadEmpresas(); 
    }
  };

  const handleAddObra = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('obras').insert([{ ...formObra, empresa_id: selectedEmpresaId }]);
    if (error) alert('Erro ao registar Obra: ' + error.message);
    else { 
      setFormObra({ codigo_obra: '', nome_obra: '' }); 
      loadObras(selectedEmpresaId); 
    }
  };

  const handleAddContrato = async (e) => {
    e.preventDefault();
    const payload = {
      ...formContrato,
      obra_id: selectedObraId,
      valor_inicial: parseFloat(formContrato.valor_inicial),
      valor_adiantamento_concedido: parseFloat(formContrato.valor_adiantamento_concedido || 0)
    };
    const { error } = await supabase.from('contratos').insert([payload]);
    if (error) alert('Erro de Integridade ao registar Contrato: ' + error.message);
    else { 
      setFormContrato({ codigo_contrato: '', razao_social: '', cnpj_fornecedor: '', centro_custo_raiz: '', valor_inicial: '', valor_adiantamento_concedido: '' }); 
      loadContratos(selectedObraId); 
    }
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestão Estrutural</h2>
        <p className="text-slate-500">Configuração de Inquilinos, Empreendimentos e Contratos Base.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUNA 1: EMPRESA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 ring-1 ring-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Building2 size={20}/></div>
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">1. Empresa Investidora</h3>
          </div>
          
          <select 
            className="w-full mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
            value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}
          >
            <option value="">-- Selecionar Empresa --</option>
            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razao_social}</option>)}
          </select>

          <form onSubmit={handleAddEmpresa} className="space-y-3 pt-6 border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nova Empresa</span>
            <input required placeholder="Nome do Grupo/Investidor" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 outline-none" value={formEmpresa.razao_social} onChange={e => setFormEmpresa({...formEmpresa, razao_social: e.target.value})} />
            <input required placeholder="CNPJ (Apenas números)" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 outline-none" value={formEmpresa.cnpj} onChange={e => setFormEmpresa({...formEmpresa, cnpj: e.target.value})} />
            <button type="submit" className="w-full bg-slate-900 text-white p-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex justify-center items-center gap-2">
              <Plus size={14}/> Registar Empresa
            </button>
          </form>
        </div>

        {/* COLUNA 2: OBRA (Bloqueada se Empresa não selecionada) */}
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 ${!selectedEmpresaId ? 'opacity-30 grayscale pointer-events-none scale-95' : 'ring-1 ring-slate-100'}`}>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><HardHat size={20}/></div>
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">2. Empreendimento</h3>
          </div>

          <select 
            className="w-full mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
            value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}
          >
            <option value="">-- Selecionar Obra --</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra} - {o.nome_obra}</option>)}
          </select>

          <form onSubmit={handleAddObra} className="space-y-3 pt-6 border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nova Obra</span>
            <input required placeholder="Cód. Obra (Ex: OB-202)" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 outline-none" value={formObra.codigo_obra} onChange={e => setFormObra({...formObra, codigo_obra: e.target.value})} />
            <input required placeholder="Nome do Projeto" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-slate-400 outline-none" value={formObra.nome_obra} onChange={e => setFormObra({...formObra, nome_obra: e.target.value})} />
            <button type="submit" className="w-full bg-slate-900 text-white p-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex justify-center items-center gap-2">
              <Plus size={14}/> Registar Obra
            </button>
          </form>
        </div>

        {/* COLUNA 3: CONTRATOS (Bloqueada se Obra não selecionada) */}
        <div className={`bg-white p-6 rounded-2xl shadow-xl border-2 border-emerald-500 transition-all duration-300 ${!selectedObraId ? 'opacity-30 grayscale pointer-events-none scale-95 border-slate-200 shadow-none' : ''}`}>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><FolderLock size={20}/></div>
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">3. Contratos Vinculados</h3>
          </div>

          {/* Lista de Contratos Registados */}
          <div className="space-y-3 mb-8 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {contratos.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-xs text-slate-400">Nenhum contrato ativo para esta obra.</p>
              </div>
            ) : (
              contratos.map(c => (
                <div key={c.id} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex justify-between items-center hover:bg-emerald-50 transition-colors">
                  <div className="overflow-hidden pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-emerald-900">{c.codigo_contrato}</span>
                      <span className="text-[9px] px-2 py-0.5 bg-white border border-emerald-200 rounded-full font-bold text-emerald-700">{c.centro_custo_raiz}</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 font-bold truncate">{c.razao_social}</p>
                  </div>
                  <div className="text-right shrink-0">
                     <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Teto Inicial</p>
                     <p className="text-[11px] font-black text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.valor_inicial)}
                     </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Formulário de Novo Contrato */}
          <form onSubmit={handleAddContrato} className="space-y-3 pt-6 border-t border-emerald-100">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Adicionar Contrato</span>
            
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="Cód. Contrato" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 outline-none" value={formContrato.codigo_contrato} onChange={e => setFormContrato({...formContrato, codigo_contrato: e.target.value})} />
              <input required placeholder="Centro Custo" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 outline-none" value={formContrato.centro_custo_raiz} onChange={e => setFormContrato({...formContrato, centro_custo_raiz: e.target.value})} />
            </div>
            
            <input required placeholder="Razão Social Fornecedor" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 outline-none" value={formContrato.razao_social} onChange={e => setFormContrato({...formContrato, razao_social: e.target.value})} />
            <input required placeholder="CNPJ Fornecedor" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 outline-none" value={formContrato.cnpj_fornecedor} onChange={e => setFormContrato({...formContrato, cnpj_fornecedor: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Valor Teto (R$)</span>
                <input required type="number" step="0.01" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-black focus:border-emerald-400 outline-none" value={formContrato.valor_inicial} onChange={e => setFormContrato({...formContrato, valor_inicial: e.target.value})} />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-amber-500 uppercase ml-1">Adiantamento (R$)</span>
                <input type="number" step="0.01" className="w-full p-2 border border-amber-200 bg-amber-50 rounded-lg text-sm font-black text-amber-700 focus:border-amber-400 outline-none" value={formContrato.valor_adiantamento_concedido} onChange={e => setFormContrato({...formContrato, valor_adiantamento_concedido: e.target.value})} />
              </div>
            </div>
            
            <button type="submit" className="w-full bg-emerald-600 text-white p-3 rounded-xl text-sm font-black hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex justify-center items-center gap-2 mt-4">
              Gravar Contrato <ArrowRight size={16}/>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// 3. ABAS PLACEHOLDERS (CONSTRUÇÃO FUTURA)
// ============================================================================

function AbaPlaceholder({ label, stage }) {
  return (
    <div className="animate-in fade-in duration-500 text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
      <h2 className="text-2xl font-bold text-slate-400">{label}</h2>
      <p className="text-slate-300 text-sm mt-2 uppercase tracking-widest font-black">Em construção (Etapa {stage})</p>
    </div>
  );
}

// ============================================================================
// 4. CHASSI PRINCIPAL (SIDEBAR + ROUTING)
// ============================================================================

export default function App() {
  const [activeTab, setActiveTab] = useState('contratos');
  const [isConnected, setIsConnected] = useState(false);

  // Verificação no Banco de Dados para Status Online
  useEffect(() => {
    async function checkConnection() {
      try {
        if (supabaseUrl && supabaseAnonKey) {
           const { error } = await supabase.from('empresas').select('id').limit(1);
           if (!error) setIsConnected(true);
        }
      } catch (err) { 
        console.error("Database status: Offline"); 
      }
    }
    checkConnection();
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* SIDEBAR CORPORATIVO */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
          <ShieldCheck className="text-emerald-500 mr-3" size={28} />
          <div>
            <h1 className="text-xl font-black text-white tracking-wide leading-none uppercase">Crivo<span className="text-emerald-500 lowercase">.app</span></h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Gerenciadora PMG</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-4">Estrutura</p>
          <MenuButton id="contratos" icon={<Building2 size={18} />} label="Contratos & Obras" active={activeTab === 'contratos'} onClick={() => setActiveTab('contratos')} />
          
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-8">Operação de Campo</p>
          <MenuButton id="engenharia" icon={<HardHat size={18} />} label="Engenharia (Medições)" active={activeTab === 'engenharia'} onClick={() => setActiveTab('engenharia')} />
          <MenuButton id="alfandega" icon={<ShieldCheck size={18} />} label="Alfândega (NFs)" active={activeTab === 'alfandega'} onClick={() => setActiveTab('alfandega')} />
          
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-8">Executiva</p>
          <MenuButton id="lotes" icon={<FolderLock size={18} />} label="Lotes de Pagamento" active={activeTab === 'lotes'} onClick={() => setActiveTab('lotes')} />
          <MenuButton id="relatorios" icon={<LineChart size={18} />} label="Relatórios & Caixa" active={activeTab === 'relatorios'} onClick={() => setActiveTab('relatorios')} />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <div className="relative flex h-2 w-2">
              {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </div>
            <div className="text-[10px] uppercase font-black tracking-tighter">
              <p className={isConnected ? 'text-emerald-400' : 'text-slate-400'}>
                {isConnected ? 'Motor Online & Blindado' : 'Aguardando Banco'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 z-10 shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Database size={14}/> Base de Dados / AMS Automações
          </div>
          <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-rose-600 transition-colors uppercase tracking-widest">
            Logout <LogOut size={14} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-10 bg-slate-50/50">
          {activeTab === 'contratos' && <AbaContratos />}
          {activeTab === 'engenharia' && <AbaPlaceholder label="Engenharia (Medições Físicas)" stage="3" />}
          {activeTab === 'alfandega' && <AbaPlaceholder label="Alfândega e Auditoria de Notas" stage="4" />}
          {activeTab === 'lotes' && <AbaPlaceholder label="Agrupamento e Lotes de Pagamento" stage="5" />}
          {activeTab === 'relatorios' && <AbaPlaceholder label="Relatórios LYO002 e Previsão de Caixa" stage="5" />}
        </div>
      </main>

    </div>
  );
}

// ============================================================================
// COMPONENTE AUXILIAR (BOTOES DO MENU)
// ============================================================================
function MenuButton({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all duration-300 ${
        active 
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
          : 'text-slate-500 hover:bg-slate-800 hover:text-white border border-transparent'
      }`}
    >
      {icon} {label}
    </button>
  );
}