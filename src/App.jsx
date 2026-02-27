import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { 
  Building2, 
  HardHat, 
  ShieldCheck, 
  FolderLock, 
  LineChart, 
  LogOut,
  Plus,
  ArrowRight,
  Database,
  ShoppingCart,
  Ruler,
  FileText,
  AlertOctagon,
  CheckSquare,
  Download,
  FileSpreadsheet,
  Pencil,
  X,
  ListTree,
  Search
} from 'lucide-react';

// ============================================================================
// 1. CONEXÃO COM O MOTOR (SUPABASE) - PRODUÇÃO PURA
// ============================================================================
const getEnv = (key) => {
  try {
    return typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://mock.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

// ============================================================================
// 2. ABA 1: GESTÃO ESTRUTURAL (ORÇAMENTO PMG + CONTRATOS)
// ============================================================================
function AbaContratos() {
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [contratos, setContratos] = useState([]);
  
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [selectedObraId, setSelectedObraId] = useState('');

  const [formEmpresa, setFormEmpresa] = useState({ razao_social: '', cnpj: '' });
  const [formObra, setFormObra] = useState({ codigo_obra: '', nome_obra: '' });
  const [formOrcamento, setFormOrcamento] = useState({ codigo_centro_custo: '', descricao_servico: '', valor_aprovado_teto: '' });
  
  const initialContratoState = {
    id: null,
    orcamento_pmg_id: '',
    codigo_contrato: '', razao_social: '', cnpj_fornecedor: '', 
    data_inicio: '', data_fechamento: '', valor_inicial: '', valor_adiantamento_concedido: ''
  };
  const [formContrato, setFormContrato] = useState(initialContratoState);
  const [isEditingContrato, setIsEditingContrato] = useState(false);
  const [buscaContrato, setBuscaContrato] = useState('');

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(selectedEmpresaId); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { 
    if (selectedObraId) { loadOrcamentos(selectedObraId); loadContratos(selectedObraId); } 
    else { setOrcamentos([]); setContratos([]); } 
  }, [selectedObraId]);

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras(empId) { const { data } = await supabase.from('obras').select('*').eq('empresa_id', empId).order('nome_obra'); setObras(data || []); }
  async function loadOrcamentos(obrId) { const { data } = await supabase.from('orcamento_pmg').select('*').eq('obra_id', obrId).order('codigo_centro_custo'); setOrcamentos(data || []); }
  async function loadContratos(obrId) { const { data } = await supabase.from('contratos').select('*, orcamento_pmg(codigo_centro_custo, descricao_servico)').eq('obra_id', obrId).order('codigo_contrato'); setContratos(data || []); }

  const handleAddEmpresa = async (e) => { e.preventDefault(); const { error } = await supabase.from('empresas').insert([formEmpresa]); if (error) alert('Erro: ' + error.message); else { setFormEmpresa({ razao_social: '', cnpj: '' }); loadEmpresas(); } };
  const handleAddObra = async (e) => { e.preventDefault(); const { error } = await supabase.from('obras').insert([{ ...formObra, empresa_id: selectedEmpresaId }]); if (error) alert('Erro: ' + error.message); else { setFormObra({ codigo_obra: '', nome_obra: '' }); loadObras(selectedEmpresaId); } };
  
  const handleAddOrcamento = async (e) => {
    e.preventDefault();
    const payload = { ...formOrcamento, obra_id: selectedObraId, valor_aprovado_teto: parseFloat(formOrcamento.valor_aprovado_teto) };
    const { error } = await supabase.from('orcamento_pmg').insert([payload]);
    if (error) alert('Erro ao inserir Linha PMG: ' + error.message); else { setFormOrcamento({ codigo_centro_custo: '', descricao_servico: '', valor_aprovado_teto: '' }); loadOrcamentos(selectedObraId); }
  };

  const handleEditContratoClick = (c) => {
    setFormContrato({
      id: c.id,
      orcamento_pmg_id: c.orcamento_pmg_id || '',
      codigo_contrato: c.codigo_contrato || '',
      razao_social: c.razao_social || '',
      cnpj_fornecedor: c.cnpj_fornecedor || '',
      data_inicio: c.data_inicio || '',
      data_fechamento: c.data_fechamento || '',
      valor_inicial: c.valor_inicial || '',
      valor_adiantamento_concedido: c.valor_adiantamento_concedido || ''
    });
    setIsEditingContrato(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => { setFormContrato(initialContratoState); setIsEditingContrato(false); };

  const handleAddOrUpdateContrato = async (e) => {
    e.preventDefault();
    const orcSelected = orcamentos.find(o => o.id === formContrato.orcamento_pmg_id);
    if (!orcSelected) return alert("Selecione a Linha de Orçamento PMG (Centro de Custo).");

    const payload = {
      obra_id: selectedObraId,
      orcamento_pmg_id: formContrato.orcamento_pmg_id,
      codigo_contrato: formContrato.codigo_contrato,
      razao_social: formContrato.razao_social,
      cnpj_fornecedor: formContrato.cnpj_fornecedor,
      centro_custo_raiz: orcSelected.codigo_centro_custo, 
      descricao_servico: orcSelected.descricao_servico,
      data_inicio: formContrato.data_inicio || null,
      data_fechamento: formContrato.data_fechamento || null,
      valor_inicial: parseFloat(formContrato.valor_inicial || 0),
      valor_adiantamento_concedido: parseFloat(formContrato.valor_adiantamento_concedido || 0)
    };

    if (isEditingContrato) {
      const { error } = await supabase.from('contratos').update(payload).eq('id', formContrato.id);
      if (error) alert('Erro ao atualizar (Verifique Teto PMG): ' + error.message); else { handleCancelEdit(); loadContratos(selectedObraId); }
    } else {
      const { error } = await supabase.from('contratos').insert([payload]);
      if (error) alert('Erro ao registar (Verifique Teto PMG): ' + error.message); else { handleCancelEdit(); loadContratos(selectedObraId); }
    }
  };

  const linhaPmgSelecionada = orcamentos.find(o => o.id === formContrato.orcamento_pmg_id);
  const tetoAprovado = linhaPmgSelecionada ? parseFloat(linhaPmgSelecionada.valor_aprovado_teto) : 0;
  const somaOutrosContratos = contratos.filter(c => c.orcamento_pmg_id === formContrato.orcamento_pmg_id && c.id !== formContrato.id).reduce((acc, c) => acc + Number(c.valor_inicial), 0);
  const valorDigitado = parseFloat(formContrato.valor_inicial || 0);
  const saveGerado = tetoAprovado - somaOutrosContratos - valorDigitado;

  const contratosFiltrados = contratos.filter(c => 
    (c.razao_social && c.razao_social.toLowerCase().includes(buscaContrato.toLowerCase())) ||
    (c.codigo_contrato && c.codigo_contrato.toLowerCase().includes(buscaContrato.toLowerCase())) ||
    (c.centro_custo_raiz && c.centro_custo_raiz.toLowerCase().includes(buscaContrato.toLowerCase()))
  );

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-6 pb-20">
      <header className="mb-4">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">EAP e Contratação</h2>
        <p className="text-slate-500">Definição do Orçamento Base (PMG) e vínculo com fornecedores.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-4 flex items-center gap-2"><Building2 size={16}/> 1. Investidor</h3>
          <select className="w-full mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}>
            <option value="">-- Selecionar Investidor --</option>
            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razao_social}</option>)}
          </select>
          <form onSubmit={handleAddEmpresa} className="flex gap-2 pt-4 border-t border-slate-100">
            <input required placeholder="Nome do Grupo" className="flex-1 p-2 border border-slate-200 rounded-lg text-xs" value={formEmpresa.razao_social} onChange={e => setFormEmpresa({...formEmpresa, razao_social: e.target.value})} />
            <input required placeholder="CNPJ" className="w-32 p-2 border border-slate-200 rounded-lg text-xs" value={formEmpresa.cnpj} onChange={e => setFormEmpresa({...formEmpresa, cnpj: e.target.value})} />
            <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-800 transition-colors">Criar</button>
          </form>
        </div>
        
        <div className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition-all ${!selectedEmpresaId ? 'opacity-30 pointer-events-none' : ''}`}>
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-4 flex items-center gap-2"><HardHat size={16}/> 2. Empreendimento (Obra)</h3>
          <select className="w-full mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}>
            <option value="">-- Selecionar Obra --</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra} - {o.nome_obra}</option>)}
          </select>
          <form onSubmit={handleAddObra} className="flex gap-2 pt-4 border-t border-slate-100">
            <input required placeholder="Cód. Obra" className="w-24 p-2 border border-slate-200 rounded-lg text-xs" value={formObra.codigo_obra} onChange={e => setFormObra({...formObra, codigo_obra: e.target.value})} />
            <input required placeholder="Nome do Projeto" className="flex-1 p-2 border border-slate-200 rounded-lg text-xs" value={formObra.nome_obra} onChange={e => setFormObra({...formObra, nome_obra: e.target.value})} />
            <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-800 transition-colors">Criar</button>
          </form>
        </div>
      </div>

      <div className={`grid grid-cols-1 xl:grid-cols-12 gap-6 transition-all duration-500 ${!selectedObraId ? 'opacity-30 pointer-events-none grayscale blur-[2px]' : ''}`}>
        
        <div className="xl:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-2"><ListTree size={16} className="text-blue-600"/> 3. Linha Base PMG (EAP)</h3>
          
          <div className="flex-1 space-y-2 mb-6 min-h-[250px] max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
            {orcamentos.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl p-6">
                <p className="text-sm font-bold text-center">Estrutura EAP Vazia.</p>
                <p className="text-xs text-center mt-1">Insira as rubricas do orçamento aprovado abaixo.</p>
              </div>
            )}
            {orcamentos.map(orc => (
              <div key={orc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center hover:border-blue-300 transition-colors group">
                <div className="truncate pr-2">
                  <span className="text-[10px] font-black text-white bg-slate-800 px-2 py-0.5 rounded-md">{orc.codigo_centro_custo}</span>
                  <p className="text-[11px] text-slate-700 font-bold truncate mt-1.5">{orc.descricao_servico}</p>
                </div>
                <div className="text-right shrink-0">
                   <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Teto Aprovado</p>
                   <p className="text-sm font-black text-blue-700">{formatMoney(orc.valor_aprovado_teto)}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddOrcamento} className="space-y-3 pt-5 border-t border-slate-100 mt-auto">
            <div className="grid grid-cols-3 gap-2">
               <div className="col-span-1"><input required placeholder="Cód (Ex: 01.01)" className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-400 outline-none" value={formOrcamento.codigo_centro_custo} onChange={e => setFormOrcamento({...formOrcamento, codigo_centro_custo: e.target.value})} /></div>
               <div className="col-span-2"><input required placeholder="Descrição (Ex: Fundação)" className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:border-blue-400 outline-none" value={formOrcamento.descricao_servico} onChange={e => setFormOrcamento({...formOrcamento, descricao_servico: e.target.value})} /></div>
            </div>
            <div>
              <span className="text-[9px] font-black text-blue-600 uppercase ml-1 block mb-1">Valor Aprovado (Capex)</span>
              <input required type="number" step="0.01" placeholder="R$ 0,00" className="w-full p-3 border border-blue-200 bg-blue-50/50 rounded-lg text-sm font-black text-blue-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={formOrcamento.valor_aprovado_teto} onChange={e => setFormOrcamento({...formOrcamento, valor_aprovado_teto: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 flex items-center justify-center gap-2 transition-shadow hover:shadow-lg hover:shadow-blue-600/20"><Plus size={16}/> Adicionar Linha PMG</button>
          </form>
        </div>

        <div className="xl:col-span-7 bg-white p-6 rounded-2xl shadow-xl border-t-4 border-t-emerald-500 border-x border-b border-slate-200 h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><FolderLock size={16} className="text-emerald-600"/> 4. Formulário de Contrato</h3>
          </div>

          <form onSubmit={handleAddOrUpdateContrato} className="relative flex flex-col h-[calc(100%-2rem)]">
            {isEditingContrato && (
              <div className="absolute -top-12 right-0 bg-amber-400 text-amber-900 text-[10px] font-black uppercase px-4 py-2 rounded-full flex items-center gap-2 shadow-md animate-bounce">
                Editando Contrato <button type="button" onClick={handleCancelEdit} className="hover:bg-amber-500 p-1 rounded-full"><X size={14}/></button>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Cód. Contrato</label><input required placeholder="Ex: CT-001" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-semibold focus:border-emerald-400 outline-none" value={formContrato.codigo_contrato} onChange={e => setFormContrato({...formContrato, codigo_contrato: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">CNPJ Fornecedor</label><input required placeholder="Apenas números" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 outline-none" value={formContrato.cnpj_fornecedor} onChange={e => setFormContrato({...formContrato, cnpj_fornecedor: e.target.value})} /></div>
            </div>

            <div className="mb-4">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Razão Social do Fornecedor</label>
              <input required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 outline-none" value={formContrato.razao_social} onChange={e => setFormContrato({...formContrato, razao_social: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Data de Início</label><input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-emerald-400 outline-none" value={formContrato.data_inicio} onChange={e => setFormContrato({...formContrato, data_inicio: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Data de Fechamento (Prevista)</label><input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-emerald-400 outline-none" value={formContrato.data_fechamento} onChange={e => setFormContrato({...formContrato, data_fechamento: e.target.value})} /></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <label className="text-[10px] font-black text-emerald-600 uppercase ml-1 block mb-1">Valor Negociado (Teto Global)</label>
                <input required type="number" step="0.01" placeholder="R$ 0,00" className="w-full p-3 border border-emerald-300 rounded-lg text-base font-black text-emerald-900 bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={formContrato.valor_inicial} onChange={e => setFormContrato({...formContrato, valor_inicial: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-amber-500 uppercase ml-1 block mb-1">Adiantamento de Caixa (Sinal)</label>
                <input type="number" step="0.01" placeholder="R$ 0,00" className="w-full p-3 border border-amber-200 rounded-lg text-base font-black text-amber-800 bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400" value={formContrato.valor_adiantamento_concedido} onChange={e => setFormContrato({...formContrato, valor_adiantamento_concedido: e.target.value})} />
              </div>
            </div>

            <div className="mt-auto">
              <div className="mb-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                 <label className="text-[11px] font-black text-blue-800 uppercase mb-2 block flex items-center gap-2"><ListTree size={14}/> Vincular à Linha do PMG (Centro de Custo)</label>
                 <select required className="w-full p-3 bg-white border border-blue-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer" value={formContrato.orcamento_pmg_id} onChange={e => setFormContrato({...formContrato, orcamento_pmg_id: e.target.value})}>
                   <option value="">-- Selecione onde alocar este custo financeiro --</option>
                   {orcamentos.map(orc => <option key={orc.id} value={orc.id}>{orc.codigo_centro_custo} - {orc.descricao_servico} (Teto PMG: {formatMoney(orc.valor_aprovado_teto)})</option>)}
                 </select>
              </div>

              {formContrato.orcamento_pmg_id && (
                <div className={`p-4 rounded-xl border mb-6 flex justify-between items-center transition-all shadow-inner ${saveGerado >= 0 ? 'bg-emerald-100 border-emerald-300' : 'bg-rose-100 border-rose-300'}`}>
                  <div>
                     <p className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${saveGerado >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                       {saveGerado >= 0 ? '✓ ECONOMIA / SAVE GERADO' : <><AlertOctagon size={14}/> ESTOURO DE BUDGET PMG</>}
                     </p>
                     <p className="text-[10px] text-slate-600 font-bold mt-1">
                       Budget da Linha: {formatMoney(tetoAprovado)} <br/>
                       Outros Contratos Ativos: {formatMoney(somaOutrosContratos)}
                     </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-black block ${saveGerado >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatMoney(saveGerado)}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${saveGerado >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {saveGerado >= 0 ? 'Saldo Positivo' : 'Déficit'}
                    </span>
                  </div>
                </div>
              )}

              <button type="submit" disabled={saveGerado < 0 && !isEditingContrato} className={`w-full text-white p-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 ${saveGerado < 0 && !isEditingContrato ? 'bg-slate-200 cursor-not-allowed text-slate-400' : (isEditingContrato ? 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30')}`}>
                {isEditingContrato ? 'Gravar Alterações do Contrato' : 'Aprovar e Gravar Contrato'} <ArrowRight size={18}/>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-500 ${!selectedObraId ? 'opacity-30 pointer-events-none grayscale blur-[2px]' : ''}`}>
        <div className="p-6 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-slate-800 rounded-lg"><Database size={20} className="text-blue-400"/></div>
            <div>
              <h3 className="font-black text-lg">Banco de Contratos</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{contratosFiltrados.length} Registos Encontrados</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400"/>
            </div>
            <input 
              type="text" 
              placeholder="Buscar por Fornecedor, Código ou PMG..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border-none rounded-xl text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              value={buscaContrato}
              onChange={(e) => setBuscaContrato(e.target.value)}
            />
            {buscaContrato && (
              <button onClick={() => setBuscaContrato('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white">
                <X size={16}/>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6">Cód. Contrato</th>
                <th className="p-4">Fornecedor</th>
                <th className="p-4">Linha PMG (Centro Custo)</th>
                <th className="p-4 text-center">Início / Fim</th>
                <th className="p-4 text-right">Valor Teto (R$)</th>
                <th className="p-4 text-center pr-6">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contratosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">
                    <Database size={48} className="mx-auto mb-4 opacity-20"/>
                    <p className="text-base font-bold text-slate-500">Nenhum contrato encontrado.</p>
                    {buscaContrato && <p className="text-xs mt-1">Limpe a busca para ver todos os registos.</p>}
                  </td>
                </tr>
              ) : (
                contratosFiltrados.map(c => (
                  <tr key={c.id} className={`transition-colors hover:bg-slate-50 ${formContrato.id === c.id ? 'bg-amber-50/50' : ''}`}>
                    <td className="p-4 pl-6 font-black text-slate-900">{c.codigo_contrato}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800 truncate max-w-[200px]" title={c.razao_social}>{c.razao_social}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">CNPJ: {c.cnpj_fornecedor}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        {c.centro_custo_raiz}
                      </span>
                    </td>
                    <td className="p-4 text-center text-xs text-slate-500 font-bold">
                      {formatDate(c.data_inicio)} <ArrowRight size={10} className="inline mx-1 opacity-50"/> {formatDate(c.data_fechamento)}
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-black text-slate-900">{formatMoney(c.valor_inicial)}</p>
                      {c.valor_adiantamento_concedido > 0 && (
                        <p className="text-[9px] text-amber-600 font-bold uppercase mt-0.5">Adiant: {formatMoney(c.valor_adiantamento_concedido)}</p>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <button 
                        onClick={() => handleEditContratoClick(c)} 
                        className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${formContrato.id === c.id ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'}`}
                        title="Editar Contrato"
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AbaEngenharia() {
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [selectedObraId, setSelectedObraId] = useState('');
  const [selectedContratoId, setSelectedContratoId] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [medicoes, setMedicoes] = useState([]);
  const [formPedido, setFormPedido] = useState({ codigo_pedido: '', cnpj_terceiro: '', razao_social_terceiro: '', valor_total_aprovado: '' });
  const [formMedicao, setFormMedicao] = useState({ codigo_medicao: '', data_lancamento: '', valor_bruto_medido: '', desconto_fundo_canteiro: '', descontos_diversos: '' });

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { if (selectedObraId) loadContratos(); else { setContratos([]); setSelectedContratoId(''); } }, [selectedObraId]);
  useEffect(() => { if (selectedContratoId) { loadPedidos(); loadMedicoes(); } else { setPedidos([]); setMedicoes([]); } }, [selectedContratoId]);

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras() { const { data } = await supabase.from('obras').select('*').eq('empresa_id', selectedEmpresaId).order('nome_obra'); setObras(data || []); }
  async function loadContratos() { const { data } = await supabase.from('contratos').select('*').eq('obra_id', selectedObraId).order('codigo_contrato'); setContratos(data || []); }
  async function loadPedidos() { const { data } = await supabase.from('pedidos_compra').select('*').eq('contrato_id', selectedContratoId).order('created_at', { ascending: false }); setPedidos(data || []); }
  async function loadMedicoes() { const { data } = await supabase.from('medicoes').select('*').eq('contrato_id', selectedContratoId).order('created_at', { ascending: false }); setMedicoes(data || []); }

  const handleAddPedido = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('pedidos_compra').insert([{ ...formPedido, contrato_id: selectedContratoId, valor_total_aprovado: parseFloat(formPedido.valor_total_aprovado) }]);
    if (error) alert('Erro: ' + error.message); else { setFormPedido({ codigo_pedido: '', cnpj_terceiro: '', razao_social_terceiro: '', valor_total_aprovado: '' }); loadPedidos(); }
  };
  const handleAddMedicao = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('medicoes').insert([{ ...formMedicao, contrato_id: selectedContratoId, valor_bruto_medido: parseFloat(formMedicao.valor_bruto_medido), desconto_fundo_canteiro: parseFloat(formMedicao.desconto_fundo_canteiro || 0), descontos_diversos: parseFloat(formMedicao.descontos_diversos || 0) }]);
    if (error) alert('Erro: ' + error.message); else { setFormMedicao({ codigo_medicao: '', data_lancamento: '', valor_bruto_medido: '', desconto_fundo_canteiro: '', descontos_diversos: '' }); loadMedicoes(); }
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-8">
      <header><h2 className="text-3xl font-black text-slate-900 tracking-tight">Engenharia e Aprovações</h2><p className="text-slate-500">Registro de Avanço Físico (Medições) e Aprovação de Materiais.</p></header>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">1. Investidor</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}><option value="">-- Empresa --</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}</select></div>
        <div className="flex-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">2. Obra</label><select disabled={!selectedEmpresaId} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}><option value="">-- Obra --</option>{obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra}</option>)}</select></div>
        <div className="flex-1"><label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 block">3. Contrato Alvo</label><select disabled={!selectedObraId} className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl font-black text-emerald-800" value={selectedContratoId} onChange={e => setSelectedContratoId(e.target.value)}><option value="">-- Contrato --</option>{contratos.map(c => <option key={c.id} value={c.id}>{c.codigo_contrato}</option>)}</select></div>
      </div>
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${!selectedContratoId ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
        <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-t-blue-500 border-x border-b border-slate-200">
          <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 rounded-xl text-blue-600"><ShoppingCart size={24}/></div><h3 className="font-black text-slate-800 text-lg">Pedidos de Compra</h3></div>
          <form onSubmit={handleAddPedido} className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="grid grid-cols-2 gap-3"><input required placeholder="Cód. (PC-001)" className="p-2.5 border border-slate-200 rounded-lg text-sm" value={formPedido.codigo_pedido} onChange={e => setFormPedido({...formPedido, codigo_pedido: e.target.value})} /><input required type="number" step="0.01" placeholder="Valor (R$)" className="p-2.5 border border-slate-200 rounded-lg text-sm font-bold" value={formPedido.valor_total_aprovado} onChange={e => setFormPedido({...formPedido, valor_total_aprovado: e.target.value})} /></div>
            <input required placeholder="Fornecedor Material" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formPedido.razao_social_terceiro} onChange={e => setFormPedido({...formPedido, razao_social_terceiro: e.target.value})} />
            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl text-sm font-black hover:bg-blue-700">Aprovar Pedido</button>
          </form>
          <div className="space-y-3 max-h-60 overflow-y-auto">{pedidos.map(p => (<div key={p.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center"><span className="text-sm font-black">{p.codigo_pedido}</span><span className="text-sm font-black text-blue-600">{formatMoney(p.valor_total_aprovado)}</span></div>))}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-t-emerald-500 border-x border-b border-slate-200">
          <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><Ruler size={24}/></div><h3 className="font-black text-slate-800 text-lg">Boletins de Medição</h3></div>
          <form onSubmit={handleAddMedicao} className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="grid grid-cols-2 gap-3"><input required placeholder="Cód. (BM-01)" className="p-2.5 border border-slate-200 rounded-lg text-sm" value={formMedicao.codigo_medicao} onChange={e => setFormMedicao({...formMedicao, codigo_medicao: e.target.value})} /><input required type="date" className="p-2.5 border border-slate-200 rounded-lg text-sm" value={formMedicao.data_lancamento} onChange={e => setFormMedicao({...formMedicao, data_lancamento: e.target.value})} /></div>
            <input required type="number" step="0.01" placeholder="Valor Bruto (R$)" className="w-full p-3 border border-emerald-200 bg-emerald-50/50 rounded-lg text-sm font-black" value={formMedicao.valor_bruto_medido} onChange={e => setFormMedicao({...formMedicao, valor_bruto_medido: e.target.value})} />
            <button type="submit" className="w-full bg-emerald-600 text-white p-3 rounded-xl text-sm font-black hover:bg-emerald-700">Aprovar Medição</button>
          </form>
          <div className="space-y-3 max-h-60 overflow-y-auto">{medicoes.map(m => (<div key={m.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center"><span className="text-sm font-black">{m.codigo_medicao}</span><span className="text-sm font-black text-emerald-600">{formatMoney(m.valor_bruto_medido)}</span></div>))}</div>
        </div>
      </div>
    </div>
  );
}

function AbaAlfandega() {
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [selectedObraId, setSelectedObraId] = useState('');
  const [selectedContratoId, setSelectedContratoId] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [medicoes, setMedicoes] = useState([]);
  const [notasFiscais, setNotasFiscais] = useState([]);
  const [tipoDocumento, setTipoDocumento] = useState('Serviço'); 
  const [formNF, setFormNF] = useState({ numero_documento: '', data_emissao: '', data_vencimento: '', valor_bruto: '', pedido_id: '', medicao_id: '' });

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { if (selectedObraId) loadContratos(); else { setContratos([]); setSelectedContratoId(''); } }, [selectedObraId]);
  useEffect(() => { if (selectedContratoId) { loadTetoFisico(); loadNotasFiscais(); } else { setPedidos([]); setMedicoes([]); setNotasFiscais([]); } }, [selectedContratoId]);

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras() { const { data } = await supabase.from('obras').select('*').eq('empresa_id', selectedEmpresaId).order('nome_obra'); setObras(data || []); }
  async function loadContratos() { const { data } = await supabase.from('contratos').select('*').eq('obra_id', selectedObraId).order('codigo_contrato'); setContratos(data || []); }
  async function loadTetoFisico() { const { data: pData } = await supabase.from('pedidos_compra').select('*').eq('contrato_id', selectedContratoId); const { data: mData } = await supabase.from('medicoes').select('*').eq('contrato_id', selectedContratoId); setPedidos(pData || []); setMedicoes(mData || []); }
  async function loadNotasFiscais() { const { data } = await supabase.from('documentos_fiscais').select('*, pedidos_compra(codigo_pedido), medicoes(codigo_medicao)').eq('contrato_id', selectedContratoId).order('created_at', { ascending: false }); setNotasFiscais(data || []); }

  const handleSubmitNF = async (e) => {
    e.preventDefault();
    const payload = {
      contrato_id: selectedContratoId, tipo_documento: tipoDocumento, numero_documento: formNF.numero_documento,
      data_emissao: formNF.data_emissao, data_vencimento: formNF.data_vencimento, valor_bruto: parseFloat(formNF.valor_bruto),
      pedido_id: tipoDocumento === 'Material' ? formNF.pedido_id : null, medicao_id: tipoDocumento === 'Serviço' ? formNF.medicao_id : null
    };
    const { error } = await supabase.from('documentos_fiscais').insert([payload]);
    if (error) alert(`[BLOQUEIO DA ALFÂNDEGA]\n\n${error.message}`); else { alert("Sucesso!"); setFormNF({ numero_documento: '', data_emissao: '', data_vencimento: '', valor_bruto: '', pedido_id: '', medicao_id: '' }); loadNotasFiscais(); }
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-8">
      <header><h2 className="text-3xl font-black text-slate-900 tracking-tight">Alfândega de Faturas</h2></header>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex gap-4">
        <select className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}><option value="">1. Empresa</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}</select>
        <select disabled={!selectedEmpresaId} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}><option value="">2. Obra</option>{obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra}</option>)}</select>
        <select disabled={!selectedObraId} className="flex-1 p-3 bg-rose-50 border border-rose-200 rounded-xl font-black text-rose-800" value={selectedContratoId} onChange={e => setSelectedContratoId(e.target.value)}><option value="">3. Contrato</option>{contratos.map(c => <option key={c.id} value={c.id}>{c.codigo_contrato}</option>)}</select>
      </div>
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${!selectedContratoId ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
        <div className="bg-white p-6 rounded-2xl shadow-xl border-t-4 border-t-rose-600 border-x border-b border-slate-200">
          <form onSubmit={handleSubmitNF} className="space-y-4">
            <div className="flex gap-2 mb-4">{['Serviço', 'Material'].map(tipo => (<button key={tipo} type="button" onClick={() => setTipoDocumento(tipo)} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${tipoDocumento === tipo ? 'bg-rose-600 text-white' : 'bg-white'}`}>{tipo}</button>))}</div>
            {tipoDocumento === 'Serviço' && (<select required className="w-full p-2.5 border rounded-lg text-sm" value={formNF.medicao_id} onChange={e => setFormNF({...formNF, medicao_id: e.target.value})}><option value="">Selecione a Medição</option>{medicoes.map(m => <option key={m.id} value={m.id}>{m.codigo_medicao} (Teto: {formatMoney(m.valor_bruto_medido)})</option>)}</select>)}
            {tipoDocumento === 'Material' && (<select required className="w-full p-2.5 border rounded-lg text-sm" value={formNF.pedido_id} onChange={e => setFormNF({...formNF, pedido_id: e.target.value})}><option value="">Selecione o Pedido</option>{pedidos.map(p => <option key={p.id} value={p.id}>{p.codigo_pedido} (Teto: {formatMoney(p.valor_total_aprovado)})</option>)}</select>)}
            <div className="grid grid-cols-2 gap-3"><input required placeholder="Nº Fatura" className="w-full p-2.5 border rounded-lg text-sm" value={formNF.numero_documento} onChange={e => setFormNF({...formNF, numero_documento: e.target.value})} /><input required type="number" step="0.01" placeholder="Valor Bruto (R$)" className="w-full p-2.5 border rounded-lg text-sm font-black text-rose-900 bg-rose-50" value={formNF.valor_bruto} onChange={e => setFormNF({...formNF, valor_bruto: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3"><input required type="date" className="w-full p-2.5 border rounded-lg text-sm" value={formNF.data_emissao} onChange={e => setFormNF({...formNF, data_emissao: e.target.value})} /><input required type="date" className="w-full p-2.5 border rounded-lg text-sm" value={formNF.data_vencimento} onChange={e => setFormNF({...formNF, data_vencimento: e.target.value})} /></div>
            <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-xl text-sm font-black hover:bg-rose-700 mt-6">Submeter à Alfândega</button>
          </form>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2"><Database size={20} className="text-slate-400"/> Histórico de Retenção</h3>
           <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
             {notasFiscais.map(nf => (
                 <div key={nf.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                   <div><span className="font-black text-slate-800 text-lg">NF {nf.numero_documento}</span><p className="text-xs text-slate-500 font-bold">{nf.tipo_documento}</p></div>
                   <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase">Valor</p><p className="text-xl font-black text-slate-900">{formatMoney(nf.valor_bruto)}</p></div>
                 </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function AbaLotes() {
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [selectedObraId, setSelectedObraId] = useState('');
  const [notasPendentes, setNotasPendentes] = useState([]);
  const [lotesFechados, setLotesFechados] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { if (selectedObraId) { loadTabelas(); } else { setNotasPendentes([]); setLotesFechados([]); } }, [selectedObraId]);

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras() { const { data } = await supabase.from('obras').select('*').eq('empresa_id', selectedEmpresaId).order('nome_obra'); setObras(data || []); }
  
  async function loadTabelas() {
    const { data: notas } = await supabase.from('documentos_fiscais').select('*, contratos!inner(obra_id, razao_social, codigo_contrato, centro_custo_raiz, cnpj_fornecedor)').eq('contratos.obra_id', selectedObraId).eq('status_aprovacao', 'Pendente').is('lote_pagamento_id', null);
    setNotasPendentes(notas || []);
    const { data: lotes } = await supabase.from('lotes_pagamento').select('*, documentos_fiscais(*, contratos(razao_social, cnpj_fornecedor, centro_custo_raiz))').eq('obra_id', selectedObraId).order('data_geracao', { ascending: false });
    setLotesFechados(lotes || []);
  }

  const toggleNota = (id) => setSelecionadas(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);

  const handleGerarLote = async () => {
    if (selecionadas.length === 0) return;
    const codigoLote = `ROM-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: lote, error: loteError } = await supabase.from('lotes_pagamento').insert([{ obra_id: selectedObraId, codigo_lote: codigoLote }]).select().single();
    if (loteError) return alert('Erro: ' + loteError.message);
    const { error: updateError } = await supabase.from('documentos_fiscais').update({ lote_pagamento_id: lote.id, status_aprovacao: 'Aprovado' }).in('id', selecionadas);
    if (updateError) return alert('Erro: ' + updateError.message);
    alert('Lote gerado com sucesso!'); setSelecionadas([]); loadTabelas();
  };

  const handleExportarExcel = (lote) => {
    if (!lote.documentos_fiscais) return;
    const dadosExcel = lote.documentos_fiscais.map(nf => {
      const bruto = Number(nf.valor_bruto || 0); const impostos = Number(nf.impostos_destacados || 0); const retencao = Number(nf.valor_retencao_tecnica || 0); const adiantamento = Number(nf.valor_amortizado_adiantamento || 0); const juros = Number(nf.juros_multas || 0);
      return {
        'Nº ROMANEIO': lote.codigo_lote, 'DATA FECHAMENTO': formatDate(lote.data_geracao), 'RAZÃO SOCIAL FORNECEDOR': nf.contratos?.razao_social, 'CNPJ': nf.contratos?.cnpj_fornecedor, 'Nº NOTA FISCAL': nf.numero_documento, 'TIPO': nf.tipo_documento, 'CENTRO DE CUSTO': nf.contratos?.centro_custo_raiz, 'EMISSÃO': formatDate(nf.data_emissao), 'VENCIMENTO': formatDate(nf.data_vencimento), 'VALOR BRUTO (R$)': bruto, 'VALOR DE IMPOSTOS': impostos, 'VALOR DE RETENÇÃO': retencao, 'DESCONTO ADIANTAMENTO/SINAL': adiantamento, 'VALOR DE JUROS E MULTAS': juros, 'LÍQUIDO A PAGAR (R$)': bruto - impostos - retencao - adiantamento + juros, 'FORMA DE PAGAMENTO': '' 
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(dadosExcel); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Romaneio"); XLSX.writeFile(workbook, `${lote.codigo_lote}_Exportacao.xlsx`);
  };

  const valorTotalSelecionado = notasPendentes.filter(n => selecionadas.includes(n.id)).reduce((acc, n) => acc + Number(n.valor_bruto), 0);

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-8">
      <header><h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3"><FolderLock className="text-blue-600" size={32} /> Lotes & Romaneios</h2></header>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex gap-4">
        <select className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}><option value="">1. Empresa Investidora</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}</select>
        <select disabled={!selectedEmpresaId} className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-xl font-black text-blue-800" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}><option value="">2. Obra (Alvo do Fechamento)</option>{obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra}</option>)}</select>
      </div>
      <div className={`transition-all duration-500 ${!selectedObraId ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
           <div className="p-6 bg-slate-900 text-white flex justify-between items-center"><h3 className="font-black text-lg flex items-center gap-2"><CheckSquare size={20}/> Notas Pendentes</h3></div>
           <table className="w-full text-sm text-left"><thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase text-[10px]"><tr><th className="p-4 w-12">SEL</th><th className="p-4">Fornecedor</th><th className="p-4">Documento</th><th className="p-4 text-right">Valor Bruto (R$)</th></tr></thead>
             <tbody className="divide-y divide-slate-100">{notasPendentes.map(n => (<tr key={n.id} onClick={() => toggleNota(n.id)} className={`cursor-pointer ${selecionadas.includes(n.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}><td className="p-4"><input type="checkbox" checked={selecionadas.includes(n.id)} readOnly className="w-5 h-5"/></td><td className="p-4 font-black">{n.contratos.razao_social}</td><td className="p-4">NF {n.numero_documento}</td><td className="p-4 text-right font-black">{formatMoney(n.valor_bruto)}</td></tr>))}</tbody>
           </table>
           <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <div><p className="text-xs font-black uppercase text-slate-400">Soma</p><p className="text-3xl font-black text-blue-600">{formatMoney(valorTotalSelecionado)}</p></div>
              <button onClick={handleGerarLote} disabled={selecionadas.length===0} className={`px-8 py-4 rounded-xl font-black uppercase ${selecionadas.length > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>Fechar Lote</button>
           </div>
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2"><FileSpreadsheet className="text-emerald-600"/> Histórico</h3>
          <div className="grid grid-cols-1 gap-4">
            {lotesFechados.map(lote => {
               const somaLote = lote.documentos_fiscais.reduce((acc, n) => acc + Number(n.valor_bruto), 0);
               return (<div key={lote.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center"><div><h4 className="text-xl font-black text-slate-900">{lote.codigo_lote}</h4><p className="text-lg font-black text-emerald-600">{formatMoney(somaLote)}</p></div><button onClick={() => handleExportarExcel(lote)} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-4 rounded-xl font-black uppercase"><Download size={20} /> Baixar Padrão LYON</button></div>)
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. CHASSI PRINCIPAL (SIDEBAR + ROUTING)
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('contratos');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('empresas').select('id').limit(1);
        if (!error) setIsConnected(true);
      } catch (err) { console.error("Offline"); }
    }
    checkConnection();
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
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
          <MenuButton id="contratos" icon={<Building2 size={18} />} label="EAP & Contratos" active={activeTab === 'contratos'} onClick={() => setActiveTab('contratos')} />
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-8">Operação de Campo</p>
          <MenuButton id="engenharia" icon={<HardHat size={18} />} label="Engenharia (Medições)" active={activeTab === 'engenharia'} onClick={() => setActiveTab('engenharia')} />
          <MenuButton id="alfandega" icon={<ShieldCheck size={18} />} label="Alfândega (NFs)" active={activeTab === 'alfandega'} onClick={() => setActiveTab('alfandega')} />
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-8">Executiva</p>
          <MenuButton id="lotes" icon={<FolderLock size={18} />} label="Lotes de Pagamento" active={activeTab === 'lotes'} onClick={() => setActiveTab('lotes')} />
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <div className="relative flex h-2 w-2">
              {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </div>
            <div className="text-[10px] uppercase font-black tracking-tighter">
              <p className={isConnected ? 'text-emerald-400' : 'text-slate-400'}>{isConnected ? 'Motor Online & Blindado' : 'Aguardando Banco'}</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 z-10 shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Database size={14}/> Base de Dados / AMS Automações</div>
          <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-rose-600 transition-colors uppercase tracking-widest"><LogOut size={14} /> Logout</button>
        </header>
        <div className="flex-1 overflow-auto p-10 bg-slate-50/50">
          {activeTab === 'contratos' && <AbaContratos />}
          {activeTab === 'engenharia' && <AbaEngenharia />}
          {activeTab === 'alfandega' && <AbaAlfandega />}
          {activeTab === 'lotes' && <AbaLotes />}
        </div>
      </main>
    </div>
  );
}

function MenuButton({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all duration-300 ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:bg-slate-800 hover:text-white border border-transparent'}`}>
      {icon} {label}
    </button>
  );
}
