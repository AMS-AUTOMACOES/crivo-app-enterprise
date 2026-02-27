import React, { useState, useEffect } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';


// --- 2. DESCOMENTE ESTAS 4 LINHAS DE PRODUÇÃO NO STACKBLITZ ---
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// ============================================================================

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

// ============================================================================
// 2. ABA 1: GESTÃO DE CONTRATOS E OBRAS
// ============================================================================
function AbaContratos() {
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [selectedObraId, setSelectedObraId] = useState('');
  const [formEmpresa, setFormEmpresa] = useState({ razao_social: '', cnpj: '' });
  const [formObra, setFormObra] = useState({ codigo_obra: '', nome_obra: '' });
  const [formContrato, setFormContrato] = useState({ codigo_contrato: '', razao_social: '', cnpj_fornecedor: '', centro_custo_raiz: '', valor_inicial: '', valor_adiantamento_concedido: '' });

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(selectedEmpresaId); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { if (selectedObraId) loadContratos(selectedObraId); else setContratos([]); }, [selectedObraId]);

  async function loadEmpresas() { if(supabaseUrl==='mock')return; const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras(empId) { if(supabaseUrl==='mock')return; const { data } = await supabase.from('obras').select('*').eq('empresa_id', empId).order('nome_obra'); setObras(data || []); }
  async function loadContratos(obrId) { if(supabaseUrl==='mock')return; const { data } = await supabase.from('contratos').select('*').eq('obra_id', obrId).order('codigo_contrato'); setContratos(data || []); }

  const handleAddEmpresa = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('empresas').insert([formEmpresa]);
    if (error) alert('Erro ao registar: ' + error.message); else { setFormEmpresa({ razao_social: '', cnpj: '' }); loadEmpresas(); }
  };
  const handleAddObra = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('obras').insert([{ ...formObra, empresa_id: selectedEmpresaId }]);
    if (error) alert('Erro ao registar: ' + error.message); else { setFormObra({ codigo_obra: '', nome_obra: '' }); loadObras(selectedEmpresaId); }
  };
  const handleAddContrato = async (e) => {
    e.preventDefault();
    const payload = { ...formContrato, obra_id: selectedObraId, valor_inicial: parseFloat(formContrato.valor_inicial), valor_adiantamento_concedido: parseFloat(formContrato.valor_adiantamento_concedido || 0) };
    const { error } = await supabase.from('contratos').insert([payload]);
    if (error) alert('Erro: ' + error.message); else { setFormContrato({ codigo_contrato: '', razao_social: '', cnpj_fornecedor: '', centro_custo_raiz: '', valor_inicial: '', valor_adiantamento_concedido: '' }); loadContratos(selectedObraId); }
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-8">
      <header><h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestão Estrutural</h2><p className="text-slate-500">Configuração de Inquilinos, Empreendimentos e Contratos Base.</p></header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 ring-1 ring-slate-100">
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-2"><Building2 size={16}/> 1. Empresa Investidora</h3>
          <select className="w-full mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}><option value="">-- Selecionar Empresa --</option>{empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razao_social}</option>)}</select>
          <form onSubmit={handleAddEmpresa} className="space-y-3 pt-6 border-t border-slate-100"><input required placeholder="Nome do Grupo" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formEmpresa.razao_social} onChange={e => setFormEmpresa({...formEmpresa, razao_social: e.target.value})} /><input required placeholder="CNPJ" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formEmpresa.cnpj} onChange={e => setFormEmpresa({...formEmpresa, cnpj: e.target.value})} /><button type="submit" className="w-full bg-slate-900 text-white p-2.5 rounded-lg text-xs font-bold hover:bg-slate-800">Registrar Empresa</button></form>
        </div>
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 ${!selectedEmpresaId ? 'opacity-30 pointer-events-none' : ''}`}>
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-2"><HardHat size={16}/> 2. Empreendimento</h3>
          <select className="w-full mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}><option value="">-- Selecionar Obra --</option>{obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra} - {o.nome_obra}</option>)}</select>
          <form onSubmit={handleAddObra} className="space-y-3 pt-6 border-t border-slate-100"><input required placeholder="Cód. Obra" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formObra.codigo_obra} onChange={e => setFormObra({...formObra, codigo_obra: e.target.value})} /><input required placeholder="Nome do Projeto" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formObra.nome_obra} onChange={e => setFormObra({...formObra, nome_obra: e.target.value})} /><button type="submit" className="w-full bg-slate-900 text-white p-2.5 rounded-lg text-xs font-bold hover:bg-slate-800">Registrar Obra</button></form>
        </div>
        <div className={`bg-white p-6 rounded-2xl shadow-xl border-2 border-emerald-500 ${!selectedObraId ? 'opacity-30 pointer-events-none border-slate-200 shadow-none' : ''}`}>
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-2"><FolderLock size={16}/> 3. Contratos Vinculados</h3>
          <div className="space-y-3 mb-8 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {contratos.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nenhum contrato ativo.</p>}
            {contratos.map(c => (
              <div key={c.id} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex justify-between items-center">
                <div className="truncate pr-2"><span className="text-xs font-black text-emerald-900">{c.codigo_contrato}</span><p className="text-[10px] text-emerald-700 font-bold truncate">{c.razao_social}</p></div>
                <div className="text-right shrink-0"><p className="text-[9px] font-black text-slate-400 uppercase">Teto</p><p className="text-[11px] font-black text-slate-900">{formatMoney(c.valor_inicial)}</p></div>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddContrato} className="space-y-3 pt-6 border-t border-emerald-100">
            <div className="grid grid-cols-2 gap-2"><input required placeholder="Cód. Contrato" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formContrato.codigo_contrato} onChange={e => setFormContrato({...formContrato, codigo_contrato: e.target.value})} /><input required placeholder="Centro Custo" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formContrato.centro_custo_raiz} onChange={e => setFormContrato({...formContrato, centro_custo_raiz: e.target.value})} /></div>
            <input required placeholder="Razão Social Fornecedor" className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formContrato.razao_social} onChange={e => setFormContrato({...formContrato, razao_social: e.target.value})} />
            <div className="grid grid-cols-2 gap-2"><input required type="number" step="0.01" placeholder="Teto (R$)" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-black" value={formContrato.valor_inicial} onChange={e => setFormContrato({...formContrato, valor_inicial: e.target.value})} /><input type="number" step="0.01" placeholder="Adiant. (R$)" className="w-full p-2 border border-amber-200 bg-amber-50 rounded-lg text-sm font-black text-amber-700" value={formContrato.valor_adiantamento_concedido} onChange={e => setFormContrato({...formContrato, valor_adiantamento_concedido: e.target.value})} /></div>
            <button type="submit" className="w-full bg-emerald-600 text-white p-3 rounded-xl text-sm font-black hover:bg-emerald-700 mt-4">Gravar Contrato <ArrowRight size={16} className="inline ml-1"/></button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. ABA 2: ENGENHARIA (ETAPA 3)
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

  async function loadEmpresas() { if(supabaseUrl==='mock')return; const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras() { if(supabaseUrl==='mock')return; const { data } = await supabase.from('obras').select('*').eq('empresa_id', selectedEmpresaId).order('nome_obra'); setObras(data || []); }
  async function loadContratos() { if(supabaseUrl==='mock')return; const { data } = await supabase.from('contratos').select('*').eq('obra_id', selectedObraId).order('codigo_contrato'); setContratos(data || []); }
  async function loadPedidos() { if(supabaseUrl==='mock')return; const { data } = await supabase.from('pedidos_compra').select('*').eq('contrato_id', selectedContratoId).order('created_at', { ascending: false }); setPedidos(data || []); }
  async function loadMedicoes() { if(supabaseUrl==='mock')return; const { data } = await supabase.from('medicoes').select('*').eq('contrato_id', selectedContratoId).order('created_at', { ascending: false }); setMedicoes(data || []); }

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

// ============================================================================
// 4. ABA 3: ALFÂNDEGA (NOTAS FISCAIS)
// ============================================================================
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

  async function loadEmpresas() { if(supabaseUrl==='mock')return; const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras() { if(supabaseUrl==='mock')return; const { data } = await supabase.from('obras').select('*').eq('empresa_id', selectedEmpresaId).order('nome_obra'); setObras(data || []); }
  async function loadContratos() { if(supabaseUrl==='mock')return; const { data } = await supabase.from('contratos').select('*').eq('obra_id', selectedObraId).order('codigo_contrato'); setContratos(data || []); }
  
  async function loadTetoFisico() {
    if(supabaseUrl==='mock')return;
    const { data: pData } = await supabase.from('pedidos_compra').select('*').eq('contrato_id', selectedContratoId);
    const { data: mData } = await supabase.from('medicoes').select('*').eq('contrato_id', selectedContratoId);
    setPedidos(pData || []); setMedicoes(mData || []);
  }

  async function loadNotasFiscais() {
    if(supabaseUrl==='mock')return;
    const { data } = await supabase.from('documentos_fiscais').select('*, pedidos_compra(codigo_pedido), medicoes(codigo_medicao)').eq('contrato_id', selectedContratoId).order('created_at', { ascending: false });
    setNotasFiscais(data || []);
  }

  const handleSubmitNF = async (e) => {
    e.preventDefault();
    const payload = {
      contrato_id: selectedContratoId, tipo_documento: tipoDocumento, numero_documento: formNF.numero_documento,
      data_emissao: formNF.data_emissao, data_vencimento: formNF.data_vencimento, valor_bruto: parseFloat(formNF.valor_bruto),
      pedido_id: tipoDocumento === 'Material' ? formNF.pedido_id : null, medicao_id: tipoDocumento === 'Serviço' ? formNF.medicao_id : null
    };
    const { error } = await supabase.from('documentos_fiscais').insert([payload]);
    if (error) alert(`[BLOQUEIO DA ALFÂNDEGA]\n\n${error.message}`);
    else { alert("Sucesso!"); setFormNF({ numero_documento: '', data_emissao: '', data_vencimento: '', valor_bruto: '', pedido_id: '', medicao_id: '' }); loadNotasFiscais(); }
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
            <div className="flex gap-2 mb-4">
              {['Serviço', 'Material'].map(tipo => (<button key={tipo} type="button" onClick={() => setTipoDocumento(tipo)} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${tipoDocumento === tipo ? 'bg-rose-600 text-white' : 'bg-white'}`}>{tipo}</button>))}
            </div>
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
                   <div>
                     <span className="font-black text-slate-800 text-lg">NF {nf.numero_documento}</span>
                     <p className="text-xs text-slate-500 font-bold">{nf.tipo_documento} • {nf.status_aprovacao}</p>
                   </div>
                   <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Valor</p><p className="text-xl font-black text-slate-900">{formatMoney(nf.valor_bruto)}</p></div>
                 </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. ABA 4: ROMANEIOS E EXPORTAÇÃO (ETAPA 5)
// ============================================================================
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

  async function loadEmpresas() { if(supabaseUrl==='mock')return; const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras() { if(supabaseUrl==='mock')return; const { data } = await supabase.from('obras').select('*').eq('empresa_id', selectedEmpresaId).order('nome_obra'); setObras(data || []); }
  
  async function loadTabelas() {
    if(supabaseUrl==='mock')return;
    const { data: notas } = await supabase.from('documentos_fiscais')
      .select('*, contratos!inner(obra_id, razao_social, codigo_contrato, centro_custo_raiz, cnpj_fornecedor)')
      .eq('contratos.obra_id', selectedObraId).eq('status_aprovacao', 'Pendente').is('lote_pagamento_id', null);
    setNotasPendentes(notas || []);

    const { data: lotes } = await supabase.from('lotes_pagamento')
      .select('*, documentos_fiscais(*, contratos(razao_social, cnpj_fornecedor, centro_custo_raiz))')
      .eq('obra_id', selectedObraId).order('data_geracao', { ascending: false });
    setLotesFechados(lotes || []);
  }

  const toggleNota = (id) => setSelecionadas(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);

  const handleGerarLote = async () => {
    if (selecionadas.length === 0) return alert('Selecione pelo menos uma nota.');
    const codigoLote = `ROM-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const { data: lote, error: loteError } = await supabase.from('lotes_pagamento').insert([{ obra_id: selectedObraId, codigo_lote: codigoLote }]).select().single();
    if (loteError) return alert('Erro ao criar lote: ' + loteError.message);

    const { error: updateError } = await supabase.from('documentos_fiscais').update({ lote_pagamento_id: lote.id, status_aprovacao: 'Aprovado' }).in('id', selecionadas);
    if (updateError) return alert('Erro ao vincular notas: ' + updateError.message);

    alert('Lote gerado com sucesso!'); setSelecionadas([]); loadTabelas();
  };

  const handleExportarExcel = (lote) => {
    if (!lote.documentos_fiscais || lote.documentos_fiscais.length === 0) return alert('Lote vazio.');
    const dadosExcel = lote.documentos_fiscais.map(nf => {
      const liq = Number(nf.valor_bruto) - Number(nf.valor_retencao_tecnica || 0) - Number(nf.valor_amortizado_adiantamento || 0) - Number(nf.impostos_destacados || 0);
      return {
        'Nº ROMANEIO': lote.codigo_lote, 'DATA FECHAMENTO': formatDate(lote.data_geracao), 'RAZÃO SOCIAL FORNECEDOR': nf.contratos.razao_social,
        'CNPJ': nf.contratos.cnpj_fornecedor, 'Nº NOTA FISCAL': nf.numero_documento, 'TIPO': nf.tipo_documento,
        'CENTRO DE CUSTO': nf.contratos.centro_custo_raiz, 'EMISSÃO': formatDate(nf.data_emissao), 'VENCIMENTO': formatDate(nf.data_vencimento),
        'VALOR BRUTO (R$)': Number(nf.valor_bruto), 'LÍQUIDO A PAGAR (R$)': liq
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Romaneio LYON");
    XLSX.writeFile(workbook, `${lote.codigo_lote}_Exportacao_Financeiro.xlsx`);
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
           <div className="p-6 bg-slate-900 text-white flex justify-between items-center"><h3 className="font-black text-lg flex items-center gap-2"><CheckSquare size={20}/> Notas Pendentes</h3><span className="bg-slate-800 px-3 py-1 rounded-lg text-sm font-bold">{notasPendentes.length} Faturas na fila</span></div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase text-[10px]"><tr><th className="p-4 w-12 text-center">SEL</th><th className="p-4">Fornecedor</th><th className="p-4">Documento</th><th className="p-4 text-right">Valor Bruto (R$)</th></tr></thead>
               <tbody className="divide-y divide-slate-100">
                 {notasPendentes.map(n => (
                   <tr key={n.id} onClick={() => toggleNota(n.id)} className={`cursor-pointer ${selecionadas.includes(n.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                     <td className="p-4 text-center"><input type="checkbox" checked={selecionadas.includes(n.id)} readOnly className="w-5 h-5"/></td>
                     <td className="p-4"><p className="font-black text-slate-800">{n.contratos.razao_social}</p></td>
                     <td className="p-4"><p className="font-bold text-slate-700">NF {n.numero_documento}</p></td>
                     <td className="p-4 text-right font-black text-slate-900 text-lg">{formatMoney(n.valor_bruto)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <div><p className="text-xs font-black uppercase text-slate-400">Soma do Lote Selecionado</p><p className="text-3xl font-black text-blue-600">{formatMoney(valorTotalSelecionado)}</p></div>
              <button onClick={handleGerarLote} disabled={selecionadas.length === 0} className={`px-8 py-4 rounded-xl font-black uppercase tracking-wider flex items-center gap-2 ${selecionadas.length > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>Fechar Lote</button>
           </div>
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2"><FileSpreadsheet className="text-emerald-600"/> Lotes Exportáveis</h3>
          <div className="grid grid-cols-1 gap-4">
            {lotesFechados.map(lote => {
               const somaLote = lote.documentos_fiscais.reduce((acc, n) => acc + Number(n.valor_bruto), 0);
               return (
                 <div key={lote.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                   <div><h4 className="text-xl font-black text-slate-900">{lote.codigo_lote}</h4><p className="text-lg font-black text-emerald-600">{formatMoney(somaLote)}</p></div>
                   <button onClick={() => handleExportarExcel(lote)} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-4 rounded-xl font-black uppercase"><Download size={20} /> Baixar Padrão LYON</button>
                 </div>
               )
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
  const [activeTab, setActiveTab] = useState('lotes'); 
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    async function checkConnection() {
      try {
        if (supabaseUrl !== 'mock') {
           const { error } = await supabase.from('empresas').select('id').limit(1);
           if (!error) setIsConnected(true);
        }
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
          <MenuButton id="contratos" icon={<Building2 size={18} />} label="Contratos & Obras" active={activeTab === 'contratos'} onClick={() => setActiveTab('contratos')} />
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-8">Operação de Campo</p>
          <MenuButton id="engenharia" icon={<HardHat size={18} />} label="Engenharia (Medições)" active={activeTab === 'engenharia'} onClick={() => setActiveTab('engenharia')} />
          <MenuButton id="alfandega" icon={<ShieldCheck size={18} />} label="Alfândega (NFs)" active={activeTab === 'alfandega'} onClick={() => setActiveTab('alfandega')} />
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-8">Executiva</p>
          <MenuButton id="lotes" icon={<FolderLock size={18} />} label="Lotes de Pagamento" active={activeTab === 'lotes'} onClick={() => setActiveTab('lotes')} />
        </nav>
      </aside>
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 z-10 shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Database size={14}/> Base de Dados / AMS Automações</div>
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
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-800 hover:text-white border border-transparent'}`}>
      {icon} {label}
    </button>
  );
}