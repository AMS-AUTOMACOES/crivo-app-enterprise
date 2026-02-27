import React, { useState, useEffect } from 'react';
// [IMPORTANTE] No StackBlitz, descomente a importação abaixo e apague a função mock:
// import { createClient } from '@supabase/supabase-js';
const createClient = () => ({ from: () => ({ select: () => ({ eq: () => ({ order: () => Promise.resolve({data:[]}) }), order: () => Promise.resolve({data:[]}) }), insert: () => Promise.resolve({error:null}) }) });

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
  CheckCircle2
} from 'lucide-react';

// ============================================================================
// 1. CONEXÃO COM O MOTOR (SUPABASE)
// ============================================================================
// [IMPORTANTE] No StackBlitz, descomente as variáveis reais e apague os mocks:
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseUrl = 'https://mock.supabase.co';
const supabaseAnonKey = 'mock-key';

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey
);

const formatMoney = (value) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value || 0);

// ============================================================================
// 2. ABA 1: GESTÃO DE CONTRATOS (ETAPA 2 CONSOLIDADA)
// ============================================================================
function AbaContratos() {
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [contratos, setContratos] = useState([]);
  
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [selectedObraId, setSelectedObraId] = useState('');

  const [formEmpresa, setFormEmpresa] = useState({ razao_social: '', cnpj: '' });
  const [formObra, setFormObra] = useState({ codigo_obra: '', nome_obra: '' });
  const [formContrato, setFormContrato] = useState({
    codigo_contrato: '', razao_social: '', cnpj_fornecedor: '', centro_custo_raiz: '', valor_inicial: '', valor_adiantamento_concedido: ''
  });

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(selectedEmpresaId); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { if (selectedObraId) loadContratos(selectedObraId); else setContratos([]); }, [selectedObraId]);

  async function loadEmpresas() {
    if (!supabaseUrl) return;
    const { data } = await supabase.from('empresas').select('*').order('razao_social');
    if (data) setEmpresas(data);
  }
  async function loadObras(empId) {
    if (!supabaseUrl) return;
    const { data } = await supabase.from('obras').select('*').eq('empresa_id', empId).order('nome_obra');
    if (data) setObras(data);
  }
  async function loadContratos(obrId) {
    if (!supabaseUrl) return;
    const { data } = await supabase.from('contratos').select('*').eq('obra_id', obrId).order('codigo_contrato');
    if (data) setContratos(data);
  }

  const handleAddEmpresa = async (e) => {
    e.preventDefault();
    if (!supabaseUrl) return alert("Modo de visualização ativo. Copie o código para o seu StackBlitz.");
    const { error } = await supabase.from('empresas').insert([formEmpresa]);
    if (error) alert('Erro ao registar Empresa: ' + error.message);
    else { setFormEmpresa({ razao_social: '', cnpj: '' }); loadEmpresas(); }
  };
  const handleAddObra = async (e) => {
    e.preventDefault();
    if (!supabaseUrl) return alert("Modo de visualização ativo.");
    const { error } = await supabase.from('obras').insert([{ ...formObra, empresa_id: selectedEmpresaId }]);
    if (error) alert('Erro ao registar Obra: ' + error.message);
    else { setFormObra({ codigo_obra: '', nome_obra: '' }); loadObras(selectedEmpresaId); }
  };
  const handleAddContrato = async (e) => {
    e.preventDefault();
    if (!supabaseUrl) return alert("Modo de visualização ativo.");
    const payload = {
      ...formContrato, obra_id: selectedObraId,
      valor_inicial: parseFloat(formContrato.valor_inicial),
      valor_adiantamento_concedido: parseFloat(formContrato.valor_adiantamento_concedido || 0)
    };
    const { error } = await supabase.from('contratos').insert([payload]);
    if (error) alert('Erro de Integridade: ' + error.message);
    else { setFormContrato({ codigo_contrato: '', razao_social: '', cnpj_fornecedor: '', centro_custo_raiz: '', valor_inicial: '', valor_adiantamento_concedido: '' }); loadContratos(selectedObraId); }
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
          <select className="w-full mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}>
            <option value="">-- Selecionar Empresa --</option>
            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razao_social}</option>)}
          </select>
          <form onSubmit={handleAddEmpresa} className="space-y-3 pt-6 border-t border-slate-100">
            <input required placeholder="Nome do Grupo/Investidor" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formEmpresa.razao_social} onChange={e => setFormEmpresa({...formEmpresa, razao_social: e.target.value})} />
            <input required placeholder="CNPJ" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formEmpresa.cnpj} onChange={e => setFormEmpresa({...formEmpresa, cnpj: e.target.value})} />
            <button type="submit" className="w-full bg-slate-900 text-white p-2.5 rounded-lg text-xs font-bold hover:bg-slate-800"><Plus size={14} className="inline mr-1"/> Registar Empresa</button>
          </form>
        </div>
        {/* COLUNA 2: OBRA */}
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 ${!selectedEmpresaId ? 'opacity-30 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><HardHat size={20}/></div>
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">2. Empreendimento</h3>
          </div>
          <select className="w-full mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}>
            <option value="">-- Selecionar Obra --</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra} - {o.nome_obra}</option>)}
          </select>
          <form onSubmit={handleAddObra} className="space-y-3 pt-6 border-t border-slate-100">
            <input required placeholder="Cód. Obra (Ex: OB-202)" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formObra.codigo_obra} onChange={e => setFormObra({...formObra, codigo_obra: e.target.value})} />
            <input required placeholder="Nome do Projeto" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formObra.nome_obra} onChange={e => setFormObra({...formObra, nome_obra: e.target.value})} />
            <button type="submit" className="w-full bg-slate-900 text-white p-2.5 rounded-lg text-xs font-bold hover:bg-slate-800"><Plus size={14} className="inline mr-1"/> Registar Obra</button>
          </form>
        </div>
        {/* COLUNA 3: CONTRATOS */}
        <div className={`bg-white p-6 rounded-2xl shadow-xl border-2 border-emerald-500 ${!selectedObraId ? 'opacity-30 pointer-events-none border-slate-200 shadow-none' : ''}`}>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><FolderLock size={20}/></div>
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">3. Contratos Vinculados</h3>
          </div>
          <div className="space-y-3 mb-8 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {contratos.map(c => (
              <div key={c.id} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-xs font-black text-emerald-900">{c.codigo_contrato}</span>
                  <p className="text-[10px] text-emerald-700 font-bold truncate">{c.razao_social}</p>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Teto</p>
                   <p className="text-[11px] font-black text-slate-900">{formatMoney(c.valor_inicial)}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddContrato} className="space-y-3 pt-6 border-t border-emerald-100">
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="Cód. Contrato" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formContrato.codigo_contrato} onChange={e => setFormContrato({...formContrato, codigo_contrato: e.target.value})} />
              <input required placeholder="Centro Custo" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formContrato.centro_custo_raiz} onChange={e => setFormContrato({...formContrato, centro_custo_raiz: e.target.value})} />
            </div>
            <input required placeholder="Razão Social Fornecedor" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formContrato.razao_social} onChange={e => setFormContrato({...formContrato, razao_social: e.target.value})} />
            <input required placeholder="CNPJ Fornecedor" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formContrato.cnpj_fornecedor} onChange={e => setFormContrato({...formContrato, cnpj_fornecedor: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-[9px] font-black text-slate-400 ml-1">Valor Teto</span><input required type="number" step="0.01" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-black" value={formContrato.valor_inicial} onChange={e => setFormContrato({...formContrato, valor_inicial: e.target.value})} /></div>
              <div><span className="text-[9px] font-black text-amber-500 ml-1">Adiantamento</span><input type="number" step="0.01" className="w-full p-2 border border-amber-200 bg-amber-50 rounded-lg text-sm font-black text-amber-700" value={formContrato.valor_adiantamento_concedido} onChange={e => setFormContrato({...formContrato, valor_adiantamento_concedido: e.target.value})} /></div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white p-3 rounded-xl text-sm font-black hover:bg-emerald-700 shadow-md mt-4">
              Gravar Contrato <ArrowRight size={16} className="inline ml-1"/>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. ABA 2: ENGENHARIA E OPERAÇÃO (ETAPA 3 CONSOLIDADA)
// ============================================================================
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
      <header><h2 className="text-3xl font-black text-slate-900 tracking-tight">Engenharia e Aprovações</h2><p className="text-slate-500">Registo de Avanço Físico (Medições) e Aprovação de Materiais.</p></header>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">1. Investidor</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}><option value="">-- Empresa --</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}</select></div>
        <div className="flex-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">2. Obra</label><select disabled={!selectedEmpresaId} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}><option value="">-- Obra --</option>{obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra}</option>)}</select></div>
        <div className="flex-1"><label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 block">3. Contrato Alvo</label><select disabled={!selectedObraId} className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl font-black text-emerald-800" value={selectedContratoId} onChange={e => setSelectedContratoId(e.target.value)}><option value="">-- Contrato --</option>{contratos.map(c => <option key={c.id} value={c.id}>{c.codigo_contrato}</option>)}</select></div>
      </div>
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${!selectedContratoId ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
        {/* PEDIDOS */}
        <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-t-blue-500 border-x border-b border-slate-200">
          <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 rounded-xl text-blue-600"><ShoppingCart size={24}/></div><div><h3 className="font-black text-slate-800 text-lg">Pedidos de Compra</h3></div></div>
          <form onSubmit={handleAddPedido} className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="grid grid-cols-2 gap-3"><input required placeholder="Cód. (PC-001)" className="p-2.5 border border-slate-200 rounded-lg text-sm" value={formPedido.codigo_pedido} onChange={e => setFormPedido({...formPedido, codigo_pedido: e.target.value})} /><input required type="number" step="0.01" placeholder="Valor (R$)" className="p-2.5 border border-slate-200 rounded-lg text-sm font-bold" value={formPedido.valor_total_aprovado} onChange={e => setFormPedido({...formPedido, valor_total_aprovado: e.target.value})} /></div>
            <input required placeholder="Fornecedor Material" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formPedido.razao_social_terceiro} onChange={e => setFormPedido({...formPedido, razao_social_terceiro: e.target.value})} />
            <input required placeholder="CNPJ" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formPedido.cnpj_terceiro} onChange={e => setFormPedido({...formPedido, cnpj_terceiro: e.target.value})} />
            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl text-sm font-black hover:bg-blue-700">Aprovar Pedido</button>
          </form>
          <div className="space-y-3 max-h-60 overflow-y-auto">{pedidos.map(p => (<div key={p.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center"><span className="text-sm font-black">{p.codigo_pedido}</span><span className="text-sm font-black text-blue-600">{formatMoney(p.valor_total_aprovado)}</span></div>))}</div>
        </div>
        {/* MEDIÇÕES */}
        <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-t-emerald-500 border-x border-b border-slate-200">
          <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><Ruler size={24}/></div><div><h3 className="font-black text-slate-800 text-lg">Boletins de Medição</h3></div></div>
          <form onSubmit={handleAddMedicao} className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="grid grid-cols-2 gap-3"><input required placeholder="Cód. (BM-01)" className="p-2.5 border border-slate-200 rounded-lg text-sm" value={formMedicao.codigo_medicao} onChange={e => setFormMedicao({...formMedicao, codigo_medicao: e.target.value})} /><input required type="date" className="p-2.5 border border-slate-200 rounded-lg text-sm" value={formMedicao.data_lancamento} onChange={e => setFormMedicao({...formMedicao, data_lancamento: e.target.value})} /></div>
            <input required type="number" step="0.01" placeholder="Valor Bruto (R$)" className="w-full p-3 border border-emerald-200 bg-emerald-50/50 rounded-lg text-sm font-black" value={formMedicao.valor_bruto_medido} onChange={e => setFormMedicao({...formMedicao, valor_bruto_medido: e.target.value})} />
            <div className="grid grid-cols-2 gap-3"><input type="number" step="0.01" placeholder="Desc. Canteiro" className="p-2.5 border border-slate-200 rounded-lg text-sm" value={formMedicao.desconto_fundo_canteiro} onChange={e => setFormMedicao({...formMedicao, desconto_fundo_canteiro: e.target.value})} /><input type="number" step="0.01" placeholder="Outros Desc." className="p-2.5 border border-slate-200 rounded-lg text-sm" value={formMedicao.descontos_diversos} onChange={e => setFormMedicao({...formMedicao, descontos_diversos: e.target.value})} /></div>
            <button type="submit" className="w-full bg-emerald-600 text-white p-3 rounded-xl text-sm font-black hover:bg-emerald-700">Aprovar Medição</button>
          </form>
          <div className="space-y-3 max-h-60 overflow-y-auto">{medicoes.map(m => (<div key={m.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center"><span className="text-sm font-black">{m.codigo_medicao}</span><span className="text-sm font-black text-emerald-600">{formatMoney(m.valor_bruto_medido)}</span></div>))}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. ABA 3: ALFÂNDEGA (NOTAS FISCAIS) - ETAPA 4
// ============================================================================
function AbaAlfandega() {
  // Cascata Estrutural
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [selectedObraId, setSelectedObraId] = useState('');
  const [selectedContratoId, setSelectedContratoId] = useState('');

  // Fontes de Limite Físico
  const [pedidos, setPedidos] = useState([]);
  const [medicoes, setMedicoes] = useState([]);
  const [notasFiscais, setNotasFiscais] = useState([]);

  // Estado do Formulário da NF
  const [tipoDocumento, setTipoDocumento] = useState('Serviço'); // Serviço | Material | Liberação Retenção
  const [formNF, setFormNF] = useState({
    numero_documento: '', data_emissao: '', data_vencimento: '',
    valor_bruto: '', impostos_destacados: '', valor_retencao_tecnica: '', valor_amortizado_adiantamento: '',
    pedido_id: '', medicao_id: ''
  });

  // Carregamentos Iniciais e Reativos
  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { if (selectedObraId) loadContratos(); else { setContratos([]); setSelectedContratoId(''); } }, [selectedObraId]);
  useEffect(() => { 
    if (selectedContratoId) { loadTetoFisico(); loadNotasFiscais(); } 
    else { setPedidos([]); setMedicoes([]); setNotasFiscais([]); } 
  }, [selectedContratoId]);

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras() { const { data } = await supabase.from('obras').select('*').eq('empresa_id', selectedEmpresaId).order('nome_obra'); setObras(data || []); }
  async function loadContratos() { const { data } = await supabase.from('contratos').select('*').eq('obra_id', selectedObraId).order('codigo_contrato'); setContratos(data || []); }
  
  async function loadTetoFisico() {
    const { data: pData } = await supabase.from('pedidos_compra').select('*').eq('contrato_id', selectedContratoId);
    const { data: mData } = await supabase.from('medicoes').select('*').eq('contrato_id', selectedContratoId);
    setPedidos(pData || []);
    setMedicoes(mData || []);
  }

  async function loadNotasFiscais() {
    const { data } = await supabase.from('documentos_fiscais')
      .select('*, pedidos_compra(codigo_pedido), medicoes(codigo_medicao)')
      .eq('contrato_id', selectedContratoId)
      .order('created_at', { ascending: false });
    setNotasFiscais(data || []);
  }

  const handleSubmitNF = async (e) => {
    e.preventDefault();
    if (!supabaseUrl) return alert("Ambiente visualização.");

    // Validações Manuais Básicas antes de bater na trava do banco
    if (tipoDocumento === 'Material' && !formNF.pedido_id) return alert("Obrigatório selecionar o Pedido de Compra que aprova este Material.");
    if (tipoDocumento === 'Serviço' && !formNF.medicao_id) return alert("Obrigatório selecionar o Boletim de Medição que aprova este Serviço.");

    const payload = {
      contrato_id: selectedContratoId,
      tipo_documento: tipoDocumento,
      numero_documento: formNF.numero_documento,
      data_emissao: formNF.data_emissao,
      data_vencimento: formNF.data_vencimento,
      valor_bruto: parseFloat(formNF.valor_bruto),
      impostos_destacados: parseFloat(formNF.impostos_destacados || 0),
      valor_retencao_tecnica: parseFloat(formNF.valor_retencao_tecnica || 0),
      valor_amortizado_adiantamento: parseFloat(formNF.valor_amortizado_adiantamento || 0),
      pedido_id: tipoDocumento === 'Material' ? formNF.pedido_id : null,
      medicao_id: tipoDocumento === 'Serviço' ? formNF.medicao_id : null
    };

    const { error } = await supabase.from('documentos_fiscais').insert([payload]);
    
    if (error) {
      alert(`[BLOQUEIO DA ALFÂNDEGA]\n\n${error.message}`);
    } else {
      alert("Sucesso! Nota Fiscal retida na Alfândega para pagamento.");
      setFormNF({ numero_documento: '', data_emissao: '', data_vencimento: '', valor_bruto: '', impostos_destacados: '', valor_retencao_tecnica: '', valor_amortizado_adiantamento: '', pedido_id: '', medicao_id: '' });
      loadNotasFiscais();
    }
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-rose-600" size={32} /> Alfândega de Faturas
          </h2>
          <p className="text-slate-500 mt-2">Validação e Retenção. <span className="font-bold text-rose-600">Nenhuma fatura passa sem lastro físico.</span></p>
        </div>
      </header>

      {/* FILTROS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">1. Investidor</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}><option value="">-- Empresa --</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}</select></div>
        <div className="flex-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">2. Obra</label><select disabled={!selectedEmpresaId} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}><option value="">-- Obra --</option>{obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra}</option>)}</select></div>
        <div className="flex-1"><label className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1 block">3. Contrato</label><select disabled={!selectedObraId} className="w-full p-3 bg-rose-50 border border-rose-200 rounded-xl font-black text-rose-800" value={selectedContratoId} onChange={e => setSelectedContratoId(e.target.value)}><option value="">-- Contrato --</option>{contratos.map(c => <option key={c.id} value={c.id}>{c.codigo_contrato}</option>)}</select></div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 transition-all duration-500 ${!selectedContratoId ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
        
        {/* INPUT DE NOTA FISCAL */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-xl border-t-4 border-t-rose-600 border-x border-b border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck size={100} /></div>
          <h3 className="font-black text-slate-900 text-lg mb-6 flex items-center gap-2"><FileText size={20} className="text-rose-600"/> Lançamento Seguro</h3>
          
          <form onSubmit={handleSubmitNF} className="space-y-4 relative z-10">
            {/* Seletor de Tipo e Origem de Lastro */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
               <label className="block text-xs font-bold text-slate-700 mb-2">Qual a natureza do pagamento?</label>
               <div className="flex gap-2 mb-4">
                  {['Serviço', 'Material', 'Liberação Retenção'].map(tipo => (
                    <button key={tipo} type="button" onClick={() => setTipoDocumento(tipo)} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${tipoDocumento === tipo ? 'bg-rose-600 text-white border-rose-700 shadow-inner' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}>{tipo}</button>
                  ))}
               </div>

               {/* Dinâmico conforme o Tipo */}
               {tipoDocumento === 'Serviço' && (
                 <div>
                    <label className="text-[10px] font-black text-emerald-600 uppercase mb-1 block">Vincular a qual Medição Aprovada?</label>
                    <select required className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-slate-800" value={formNF.medicao_id} onChange={e => setFormNF({...formNF, medicao_id: e.target.value})}>
                      <option value="">-- Selecione o Boletim (BM) --</option>
                      {medicoes.map(m => <option key={m.id} value={m.id}>{m.codigo_medicao} (Teto: {formatMoney(m.valor_bruto_medido)})</option>)}
                    </select>
                 </div>
               )}
               {tipoDocumento === 'Material' && (
                 <div>
                    <label className="text-[10px] font-black text-blue-600 uppercase mb-1 block">Vincular a qual Pedido de Compra?</label>
                    <select required className="w-full p-2.5 bg-white border border-blue-300 rounded-lg text-sm font-bold text-slate-800" value={formNF.pedido_id} onChange={e => setFormNF({...formNF, pedido_id: e.target.value})}>
                      <option value="">-- Selecione o Pedido (PC) --</option>
                      {pedidos.map(p => <option key={p.id} value={p.id}>{p.codigo_pedido} (Teto: {formatMoney(p.valor_total_aprovado)})</option>)}
                    </select>
                 </div>
               )}
            </div>

            {/* Dados Fiscais */}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nº Fatura</label><input required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold" value={formNF.numero_documento} onChange={e => setFormNF({...formNF, numero_documento: e.target.value})} /></div>
              <div><label className="text-[10px] font-bold text-rose-600 uppercase ml-1">Valor Bruto (R$)</label><input required type="number" step="0.01" className="w-full p-2.5 border border-rose-300 bg-rose-50/50 rounded-lg text-sm font-black text-rose-900" value={formNF.valor_bruto} onChange={e => setFormNF({...formNF, valor_bruto: e.target.value})} /></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Emissão</label><input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formNF.data_emissao} onChange={e => setFormNF({...formNF, data_emissao: e.target.value})} /></div>
              <div><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Vencimento</label><input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formNF.data_vencimento} onChange={e => setFormNF({...formNF, data_vencimento: e.target.value})} /></div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4 grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Retenção Técnica (R$)</label><input type="number" step="0.01" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formNF.valor_retencao_tecnica} onChange={e => setFormNF({...formNF, valor_retencao_tecnica: e.target.value})} /></div>
              <div><label className="text-[10px] font-bold text-amber-600 uppercase ml-1">Amortiza Adiantamento?</label><input type="number" step="0.01" placeholder="Valor (R$)" className="w-full p-2.5 border border-amber-200 bg-amber-50 rounded-lg text-sm font-bold text-amber-800" value={formNF.valor_amortizado_adiantamento} onChange={e => setFormNF({...formNF, valor_amortizado_adiantamento: e.target.value})} /></div>
            </div>

            <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-xl text-sm font-black hover:bg-rose-700 transition-all shadow-lg flex justify-center items-center gap-2 mt-6">
              Submeter à Alfândega <ShieldCheck size={18}/>
            </button>
          </form>
        </div>

        {/* LISTA DE NOTAS RETIDAS E HISTÓRICO */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2"><Database size={20} className="text-slate-400"/> Histórico de Processamento</h3>
           
           <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
             {notasFiscais.length === 0 ? (
               <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-xl">
                 <AlertOctagon size={48} className="mx-auto text-slate-200 mb-4"/>
                 <p className="text-sm font-bold text-slate-400">Nenhuma fatura lançada contra este contrato.</p>
               </div>
             ) : (
               notasFiscais.map(nf => (
                 <div key={nf.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-shadow relative overflow-hidden group">
                   <div className={`absolute top-0 left-0 w-1.5 h-full ${nf.status_aprovacao === 'Pendente' ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                   <div className="flex justify-between items-start ml-2">
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                         <span className="font-black text-slate-800 text-lg">NF {nf.numero_documento}</span>
                         <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${nf.status_aprovacao === 'Pendente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                           {nf.status_aprovacao}
                         </span>
                       </div>
                       <p className="text-xs text-slate-500 font-bold mb-2">
                         {nf.tipo_documento} • Lastro: {nf.tipo_documento === 'Serviço' ? nf.medicoes?.codigo_medicao : (nf.tipo_documento === 'Material' ? nf.pedidos_compra?.codigo_pedido : 'N/A')}
                       </p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Valor Faturado</p>
                        <p className="text-xl font-black text-slate-900">{formatMoney(nf.valor_bruto)}</p>
                     </div>
                   </div>
                   
                   {/* Rodapé de deduções da NF */}
                   {(nf.valor_retencao_tecnica > 0 || nf.valor_amortizado_adiantamento > 0) && (
                     <div className="mt-3 pt-3 border-t border-slate-200 ml-2 flex gap-4">
                       {nf.valor_retencao_tecnica > 0 && (
                         <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 border border-slate-200 rounded">Retido: {formatMoney(nf.valor_retencao_tecnica)}</span>
                       )}
                       {nf.valor_amortizado_adiantamento > 0 && (
                         <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 border border-amber-200 rounded">Amortizou: {formatMoney(nf.valor_amortizado_adiantamento)}</span>
                       )}
                     </div>
                   )}
                 </div>
               ))
             )}
           </div>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// 5. ABAS PLACEHOLDERS (CONSTRUÇÃO FUTURA)
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
// 6. CHASSI PRINCIPAL (SIDEBAR + ROUTING)
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('alfandega'); // Abriremos por padrão na Alfândega agora
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    async function checkConnection() {
      try {
        if (supabaseUrl && !supabaseUrl.includes('mock')) {
           const { error } = await supabase.from('empresas').select('id').limit(1);
           if (!error) setIsConnected(true);
        }
      } catch (err) { console.error("Database status: Offline"); }
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
              <p className={isConnected ? 'text-emerald-400' : 'text-slate-400'}>{isConnected ? 'Motor Online & Blindado' : 'Aguardando Banco'}</p>
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
          {activeTab === 'engenharia' && <AbaEngenharia />}
          {activeTab === 'alfandega' && <AbaAlfandega />}
          {activeTab === 'lotes' && <AbaPlaceholder label="Agrupamento e Lotes de Pagamento" stage="5" />}
          {activeTab === 'relatorios' && <AbaPlaceholder label="Relatórios LYO002 e Previsão de Caixa" stage="5" />}
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