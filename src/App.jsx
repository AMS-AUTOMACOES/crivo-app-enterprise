import React, { useState, useEffect } from 'react';

// ============================================================================
// ⚠️ INSTRUÇÕES PARA O GITHUB:


// 2. DESCOMENTE ESTAS 2 LINHAS DE PRODUÇÃO:
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
// ============================================================================

import { 
  Building2, HardHat, ShieldCheck, FolderLock, LineChart, LogOut,
  Plus, ArrowRight, Database, ShoppingCart, Ruler, FileText,
  AlertOctagon, CheckSquare, Download, FileSpreadsheet, Pencil, X, ListTree, Search, Menu, History, Trash2, CopyPlus,
  ChevronRight, ChevronDown, CornerDownRight, PieChart, TrendingUp, TrendingDown, DollarSign, Activity, Wallet, Percent, Users, ScanSearch, Eye, FileWarning, Globe, Layers, Lock
} from 'lucide-react';

// ============================================================================
// 1. CONEXÃO COM O MOTOR (SUPABASE)
// ============================================================================
const getEnv = (key) => {
  try { return typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : ''; } 
  catch (e) { return ''; }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://mock.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// UTILS DE FORMATAÇÃO E MÁSCARAS FINANCEIRAS
// ============================================================================
const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', { timeZone: 'UTC' });
};

const formatToCurrencyString = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  const isNegative = num < 0;
  let v = Math.abs(num).toFixed(2).replace('.', ',');
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return isNegative ? '-' + v : v;
};

const parseCurrency = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const isNegative = String(val).includes('-');
  const cleanVal = String(val).replace(/\./g, '').replace(',', '.').replace('-', '');
  const parsed = parseFloat(cleanVal);
  return isNegative ? -Math.abs(parsed) : Math.abs(parsed);
};

function CurrencyInput({ value, onChange, placeholder, className, required, disabled }) {
  const handleChange = (e) => {
    let val = e.target.value;
    const isNegative = val.startsWith('-');
    let v = val.replace(/\D/g, ''); 
    if (v === '') { onChange(''); return; }
    v = (parseInt(v, 10) / 100).toFixed(2).replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    if (isNegative) v = '-' + v;
    onChange(v);
  };
  return (
    <input type="text" value={value || ''} onChange={handleChange} placeholder={placeholder || "0,00"} className={className} required={required} disabled={disabled} />
  );
}

const getBaseCode = (code) => {
  if (!code) return '';
  const match = code.match(/^(.*)\.\d+$/);
  return match ? match[1] : code;
};

const getAllBaseCodes = (contratos) => contratos.map(c => c.codigo_contrato).sort((a,b) => b.length - a.length);
const findBaseCode = (code, allCodes) => {
  if (!code) return '';
  const parent = allCodes.find(base => code !== base && code.startsWith(base) && /^[\.\-A-Za-z_]/.test(code.substring(base.length)));
  return parent || code;
};

// ============================================================================
// MÓDULO 0: PORTA DE ENTRADA (LOGIN SCREEN)
// ============================================================================
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Acesso negado. Credenciais inválidas ou conta inexistente.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center items-center gap-3 mb-6">
          <ShieldCheck className="text-emerald-500" size={48} />
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">Crivo<span className="text-emerald-500 lowercase">.app</span></h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Enterprise Edition</p>
          </div>
        </div>
        <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-slate-900">
          Autenticação Obrigatória
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Acesso restrito a utilizadores provisionados.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in zoom-in-95 duration-700 delay-150">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm font-bold text-rose-700 flex items-center gap-2">
                <AlertOctagon size={16} className="shrink-0" />
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">E-mail Corporativo</label>
              <div className="mt-1">
                <input required type="email" placeholder="nome@construtora.com" className="block w-full appearance-none rounded-xl border border-slate-300 px-4 py-3 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm font-medium" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Senha de Acesso (Cofre)</label>
              <div className="mt-1">
                <input required type="password" placeholder="••••••••" className="block w-full appearance-none rounded-xl border border-slate-300 px-4 py-3 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm font-medium" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <div className="pt-2">
              <button disabled={loading} type="submit" className="flex w-full justify-center items-center gap-2 rounded-xl border border-transparent bg-slate-900 py-3.5 px-4 text-sm font-black uppercase tracking-wider text-white shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-70">
                {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <><Lock size={18} /> Aceder ao Sistema</>}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest flex items-center justify-center gap-1"><ShieldCheck size={12}/> Ambiente Blindado & Auditado</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 1. ABA DASHBOARD
// ============================================================================
function AbaDashboard() {
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [selectedObraId, setSelectedObraId] = useState('');
  
  const [dashboardData, setDashboardData] = useState({ orcamentos: [], contratosConsolidados: [], kpis: null });
  const [loading, setLoading] = useState(false);
  
  const [viewMode, setViewMode] = useState('eap');
  const [buscaDashboard, setBuscaDashboard] = useState('');
  const [expandedCCs, setExpandedCCs] = useState({});
  const [expandedContratos, setExpandedContratos] = useState({});
  
  const [xrayData, setXrayData] = useState(null); 
  const [globalXrayType, setGlobalXrayType] = useState(null); 

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(selectedEmpresaId); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { if (selectedObraId) buildDashboard(selectedObraId); else setDashboardData({ orcamentos: [], contratosConsolidados: [], kpis: null }); }, [selectedObraId]);

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras(empId) { const { data } = await supabase.from('obras').select('*').eq('empresa_id', empId).order('nome_obra'); setObras(data || []); }

  async function buildDashboard(obrId) {
    setLoading(true);
    try {
      const { data: orcData } = await supabase.from('orcamento_pmg').select('*').eq('obra_id', obrId).order('codigo_centro_custo');
      const { data: contData } = await supabase.from('contratos').select('*, aditivos_contrato(valor_acrescimo)').eq('obra_id', obrId).neq('status_vigencia', 'Cancelado');
      const { data: medData } = await supabase.from('medicoes').select('valor_bruto_medido, contratos!inner(id, obra_id)').eq('contratos.obra_id', obrId);

      const { data: nfData } = await supabase.from('documentos_fiscais')
        .select('valor_bruto, valor_retencao_tecnica, valor_amortizado_adiantamento, classificacao_faturamento, tipo_documento, natureza_operacao, status_documento, contratos!inner(id, obra_id, orcamento_pmg_id)')
        .eq('contratos.obra_id', obrId);

      if (!orcData) return;

      let qtdNFsAmortizadas = 0;
      let qtdNFsRetidas = 0;
      let qtdNFsDevolvidas = 0;

      const medAggByContract = {};
      (medData || []).forEach(m => {
        const cId = m.contratos.id;
        if (!medAggByContract[cId]) medAggByContract[cId] = 0;
        medAggByContract[cId] += Number(m.valor_bruto_medido);
      });

      const nfAggByContract = {};
      (nfData || []).forEach(nf => {
        if (['Cancelado', 'Substituido', 'Anulado'].includes(nf.status_documento)) return;

        const cId = nf.contratos.id;
        if (!nfAggByContract[cId]) {
          nfAggByContract[cId] = { fatDireto: 0, fatIndireto: 0, totalIncorrido: 0, retidoTotal: 0, retencaoDevolvida: 0, amortizadoAcumulado: 0, nfServico: 0, nfMaterial: 0, nfDebito: 0, nfDacte: 0, nfFatura: 0, nfAdiantamento: 0 };
        }
        
        const v = Number(nf.valor_bruto);
        const tipo = nf.tipo_documento;
        
        if (tipo === 'Liberação Retenção' || nf.natureza_operacao === 'Pagamento de Retenção') {
            nfAggByContract[cId].retencaoDevolvida += v;
            nfAggByContract[cId].retidoTotal += Number(nf.valor_retencao_tecnica || 0);
            nfAggByContract[cId].amortizadoAcumulado += Number(nf.valor_amortizado_adiantamento || 0);
            qtdNFsDevolvidas++;
            if (Number(nf.valor_retencao_tecnica) > 0) qtdNFsRetidas++;
            if (Number(nf.valor_amortizado_adiantamento) > 0) qtdNFsAmortizadas++;
        } else if (tipo === 'Recibo Adiantamento') {
            nfAggByContract[cId].nfAdiantamento += v;
            nfAggByContract[cId].retidoTotal += Number(nf.valor_retencao_tecnica || 0);
            nfAggByContract[cId].amortizadoAcumulado += Number(nf.valor_amortizado_adiantamento || 0);
            if (Number(nf.valor_retencao_tecnica) > 0) qtdNFsRetidas++;
            if (Number(nf.valor_amortizado_adiantamento) > 0) qtdNFsAmortizadas++;
        } else {
            nfAggByContract[cId].totalIncorrido += v;
            if (nf.classificacao_faturamento === 'Indireto') nfAggByContract[cId].fatIndireto += v; else nfAggByContract[cId].fatDireto += v; 
            
            if (tipo === 'Nota Fiscal' && nf.natureza_operacao === 'Serviço') nfAggByContract[cId].nfServico += v;
            else if (tipo === 'Nota Fiscal' && nf.natureza_operacao === 'Material') nfAggByContract[cId].nfMaterial += v;
            else if (tipo === 'Nota de Débito') nfAggByContract[cId].nfDebito += v;
            else if (tipo === 'DACTE') nfAggByContract[cId].nfDacte += v;
            else if (tipo === 'Fatura') nfAggByContract[cId].nfFatura += v;
            else nfAggByContract[cId].nfServico += v; 
            
            nfAggByContract[cId].retidoTotal += Number(nf.valor_retencao_tecnica || 0);
            nfAggByContract[cId].amortizadoAcumulado += Number(nf.valor_amortizado_adiantamento || 0);

            if (Number(nf.valor_retencao_tecnica) > 0) qtdNFsRetidas++;
            if (Number(nf.valor_amortizado_adiantamento) > 0) qtdNFsAmortizadas++;
        }
      });

      let globalCapex = 0; let globalContratado = 0; let globalIncorrido = 0;
      let globalSaldoAdiantamentoTotal = 0; let globalSaldoRetencaoTotal = 0;

      let globalTetoBase = 0; let globalAditivos = 0; let globalTotalRetido = 0; let globalTotalDevolvido = 0;
      let globalAdiantamentoConcedido = 0; let globalTotalAmortizado = 0;

      const linhasMatematicas = orcData.map(orc => {
        const capex = Number(orc.valor_aprovado_teto);
        globalCapex += capex;
        const contratosDaLinha = (contData || []).filter(c => c.orcamento_pmg_id === orc.id).map(c => {
           const aditivosVal = c.aditivos_contrato?.reduce((acc, a) => acc + Number(a.valor_acrescimo), 0) || 0;
           const tetoAtualizado = Number(c.valor_inicial) + aditivosVal;
           const agg = nfAggByContract[c.id] || { fatDireto: 0, fatIndireto: 0, totalIncorrido: 0, retidoTotal: 0, retencaoDevolvida: 0, amortizadoAcumulado: 0, nfServico: 0, nfMaterial: 0, nfDebito: 0, nfDacte: 0, nfFatura: 0, nfAdiantamento: 0 };
           const totalMedido = medAggByContract[c.id] || 0;
           
           const adiantamentoContrato = Number(c.valor_adiantamento_concedido) || 0;
           const adiantamentoTotal = Math.max(adiantamentoContrato, agg.nfAdiantamento);
           
           const saldoAdiantamento = adiantamentoTotal - agg.amortizadoAcumulado;
           const saldoRetencao = agg.retidoTotal - agg.retencaoDevolvida;

           globalSaldoAdiantamentoTotal += saldoAdiantamento;
           globalSaldoRetencaoTotal += saldoRetencao;

           return { ...c, tetoAtualizado, ...agg, totalMedido, adiantamentoTotal, saldoAdiantamento, saldoRetencao };
        });
        const contratadoLinha = contratosDaLinha.reduce((acc, c) => acc + c.tetoAtualizado, 0);
        globalContratado += contratadoLinha;
        const incorridoLinha = contratosDaLinha.reduce((acc, c) => acc + c.totalIncorrido, 0);
        globalIncorrido += incorridoLinha;
        const saveEap = capex - contratadoLinha;
        const percComprometido = capex > 0 ? (contratadoLinha / capex) * 100 : 0;
        return { ...orc, capex, contratadoLinha, saveEap, incorridoLinha, percComprometido, contratosDetalhes: contratosDaLinha };
      });

      const contratosAgg = {};
      const allCodes = getAllBaseCodes(contData || []);

      (contData || []).forEach(c => {
         const baseCode = findBaseCode(c.codigo_contrato, allCodes);
         if (!contratosAgg[baseCode]) {
             contratosAgg[baseCode] = { baseCode, fornecedor: c.razao_social, cnpj: c.cnpj_fornecedor, status_vigencia: c.status_vigencia, tetoGlobal: 0, fatDiretoGlobal: 0, fatIndiretoGlobal: 0, totalIncorridoGlobal: 0, retidoGlobal: 0, devolvidoGlobal: 0, saldoRetencaoGlobal: 0, adiantamentoConcedidoGlobal: 0, amortizadoGlobal: 0, saldoAdiantamentoGlobal: 0, totalMedidoGlobal: 0, nfServicoGlobal: 0, nfMaterialGlobal: 0, nfDebitoGlobal: 0, nfDacteGlobal: 0, nfFaturaGlobal: 0, nfAdiantamentoGlobal: 0, faccoes: [] };
         }
         const aditivosVal = c.aditivos_contrato?.reduce((acc, a) => acc + Number(a.valor_acrescimo), 0) || 0;
         const tetoAtualizado = Number(c.valor_inicial) + aditivosVal;
         const agg = nfAggByContract[c.id] || { fatDireto: 0, fatIndireto: 0, totalIncorrido: 0, retidoTotal: 0, retencaoDevolvida: 0, amortizadoAcumulado: 0, nfServico: 0, nfMaterial: 0, nfDebito: 0, nfDacte: 0, nfFatura: 0, nfAdiantamento: 0 };
         const totalMedido = medAggByContract[c.id] || 0;
         
         const adiantamentoContrato = Number(c.valor_adiantamento_concedido) || 0;
         const adiantamentoReal = Math.max(adiantamentoContrato, agg.nfAdiantamento);
         
         const saldoAdiantamento = adiantamentoReal - agg.amortizadoAcumulado;
         const saldoRetencao = agg.retidoTotal - agg.retencaoDevolvida;

         contratosAgg[baseCode].tetoGlobal += tetoAtualizado; contratosAgg[baseCode].totalIncorridoGlobal += agg.totalIncorrido; contratosAgg[baseCode].fatDiretoGlobal += agg.fatDireto; contratosAgg[baseCode].fatIndiretoGlobal += agg.fatIndireto; contratosAgg[baseCode].retidoGlobal += agg.retidoTotal; contratosAgg[baseCode].devolvidoGlobal += agg.retencaoDevolvida; contratosAgg[baseCode].saldoRetencaoGlobal += saldoRetencao; contratosAgg[baseCode].adiantamentoConcedidoGlobal += adiantamentoReal; contratosAgg[baseCode].amortizadoGlobal += agg.amortizadoAcumulado; contratosAgg[baseCode].saldoAdiantamentoGlobal += saldoAdiantamento; contratosAgg[baseCode].totalMedidoGlobal += totalMedido; contratosAgg[baseCode].nfServicoGlobal += agg.nfServico; contratosAgg[baseCode].nfMaterialGlobal += agg.nfMaterial; contratosAgg[baseCode].nfDebitoGlobal += agg.nfDebito; contratosAgg[baseCode].nfDacteGlobal += agg.nfDacte; contratosAgg[baseCode].nfFaturaGlobal += agg.nfFatura; contratosAgg[baseCode].nfAdiantamentoGlobal += agg.nfAdiantamento;
         const orcamentoCorrespondente = orcData.find(o => o.id === c.orcamento_pmg_id);
         contratosAgg[baseCode].faccoes.push({ ...c, tetoAtualizado, ...agg, totalMedido, codigo_centro_custo: orcamentoCorrespondente?.codigo_centro_custo || 'N/A', descricao_centro_custo: orcamentoCorrespondente?.descricao_servico || 'N/A', adiantamentoTotal: adiantamentoReal, saldoAdiantamento, saldoRetencao });
      });

      const globalSave = globalCapex - globalContratado;

      let qtdContratosComAdiant = 0;
      (contData || []).forEach(c => {
         const agg = nfAggByContract[c.id] || { nfAdiantamento: 0 };
         const adiantContrato = Number(c.valor_adiantamento_concedido) || 0;
         if (Math.max(adiantContrato, agg.nfAdiantamento) > 0) qtdContratosComAdiant++;
      });

      setDashboardData({ 
        orcamentos: linhasMatematicas, 
        contratosConsolidados: Object.values(contratosAgg), 
        kpis: { 
          globalCapex, globalContratado, globalSave, globalIncorrido, 
          globalSaldoAdiantamentoTotal, globalSaldoRetencaoTotal,
          globalTetoBase, globalAditivos, globalTotalRetido, globalTotalDevolvido, globalAdiantamentoConcedido, globalTotalAmortizado,
          qtdContratosAtivos: (contData || []).length,
          qtdAditivosLancados: (contData || []).reduce((acc, c) => acc + (c.aditivos_contrato?.length || 0), 0),
          qtdNFsAmortizadas, qtdNFsRetidas, qtdNFsDevolvidas, qtdContratosComAdiant
        } 
      });
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const toggleCC = (id) => setExpandedCCs(prev => ({...prev, [id]: !prev[id]}));
  const toggleContrato = (baseCode) => setExpandedContratos(prev => ({...prev, [baseCode]: !prev[baseCode]}));
  const term = buscaDashboard.toLowerCase();
  
  const orcamentosFiltrados = dashboardData.orcamentos.filter(orc => {
    if (!term) return true;
    const matchCC = orc.codigo_centro_custo.toLowerCase().includes(term) || orc.descricao_servico.toLowerCase().includes(term);
    const matchContract = orc.contratosDetalhes.some(c => c.codigo_contrato.toLowerCase().includes(term) || c.razao_social.toLowerCase().includes(term) || (c.cnpj_fornecedor && c.cnpj_fornecedor.includes(term)));
    if (matchContract && !expandedCCs[orc.id] && term.length > 2) setTimeout(() => setExpandedCCs(prev => ({...prev, [orc.id]: true})), 10);
    return matchCC || matchContract;
  });

  const consolidadosFiltrados = dashboardData.contratosConsolidados.filter(c => {
    if (!term) return true;
    const matchBase = c.baseCode.toLowerCase().includes(term) || c.fornecedor.toLowerCase().includes(term) || (c.cnpj && c.cnpj.includes(term));
    const matchPMGFacao = c.faccoes.some(f => f.codigo_centro_custo.toLowerCase().includes(term));
    if (matchPMGFacao && !expandedContratos[c.baseCode] && term.length > 2) setTimeout(() => setExpandedContratos(prev => ({...prev, [c.baseCode]: true})), 10);
    return matchBase || matchPMGFacao;
  });

  const openXRay = (e, item, isAgrupado = false) => { e.stopPropagation(); setXrayData({ item, isAgrupado }); };

  return (
    <div className="animate-in fade-in duration-700 w-full max-w-7xl mx-auto space-y-6 pb-20 px-2 sm:px-0">
      <header className="mb-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Painel Executivo PMG</h2>
        <p className="text-sm sm:text-base text-slate-500">Controlo de Capex, Comprometimento e Execução Financeira em tempo real.</p>
      </header>

      {/* FILTROS GLOBAIS DE DIRETORIA */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Building2 size={14}/> Empresa Investidora</label>
          <select className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}>
            <option value="">-- Filtro Global: Selecionar Investidor --</option>
            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razao_social}</option>)}
          </select>
        </div>
        <div className={`${!selectedEmpresaId ? 'opacity-30 pointer-events-none' : ''} transition-opacity`}>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><HardHat size={14}/> Empreendimento (Obra)</label>
          <select className="w-full p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs sm:text-sm font-black text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}>
            <option value="">-- Filtro Global: Selecionar Obra --</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra} - {o.nome_obra}</option>)}
          </select>
        </div>
      </div>

      {!selectedObraId ? (
        <div className="p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-white/50 mx-2 sm:mx-0">
          <PieChart size={40} className="mx-auto mb-4 opacity-20 sm:w-12 sm:h-12" />
          <h3 className="text-lg sm:text-xl font-black text-slate-600 mb-2">Aguardando Parâmetros</h3>
          <p className="text-xs sm:text-sm font-medium">Selecione uma Empresa e uma Obra no topo para carregar as matrizes de análise.</p>
        </div>
      ) : loading ? (
        <div className="p-12 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
      ) : dashboardData.kpis && (
        <>
          {/* MODAL RAIO-X FINANCEIRO GLOBAL (VOLUME VS VALOR) */}
          {globalXrayType && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
                  <h3 className="font-black flex items-center gap-2 text-sm sm:text-base">
                    <ScanSearch size={18} className="text-emerald-400"/> 
                    {globalXrayType === 'contratos' && 'Raio-X Global: Contratações'}
                    {globalXrayType === 'adiantamento' && 'Raio-X Global: Adiantamentos'}
                    {globalXrayType === 'retencao' && 'Raio-X Global: Retenções Cativas'}
                  </h3>
                  <button onClick={() => setGlobalXrayType(null)} className="text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-full transition-colors"><X size={18}/></button>
                </div>
                
                <div className="p-6 bg-slate-50">
                  {globalXrayType === 'contratos' && (
                    <div className="space-y-4">
                       <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Teto Base Original</p>
                            <p className="text-lg font-black text-slate-800">{formatMoney(dashboardData.kpis.globalTetoBase)}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{dashboardData.kpis.qtdContratosAtivos} Contratos</span>
                       </div>
                       <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Soma de Aditivos</p>
                            <p className="text-lg font-black text-slate-800">{formatMoney(dashboardData.kpis.globalAditivos)}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{dashboardData.kpis.qtdAditivosLancados} Lançamentos</span>
                       </div>
                       <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex justify-between items-center shadow-sm mt-2">
                          <div>
                            <p className="text-[10px] font-black text-amber-600 uppercase">Teto Global Consolidado</p>
                            <p className="text-xl font-black text-amber-800">{formatMoney(dashboardData.kpis.globalContratado)}</p>
                          </div>
                          <Layers className="text-amber-300" size={24}/>
                       </div>
                    </div>
                  )}

                  {globalXrayType === 'adiantamento' && (
                    <div className="space-y-4">
                       <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Total Concedido</p>
                            <p className="text-lg font-black text-slate-800">{formatMoney(dashboardData.kpis.globalAdiantamentoConcedido)}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{dashboardData.kpis.qtdContratosComAdiant} Contratos/Recibos</span>
                       </div>
                       <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Total Amortizado</p>
                            <p className="text-lg font-black text-slate-800">{formatMoney(dashboardData.kpis.globalTotalAmortizado)}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{dashboardData.kpis.qtdNFsAmortizadas} Descontos em NF</span>
                       </div>
                       <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex justify-between items-center shadow-sm mt-2">
                          <div>
                            <p className="text-[10px] font-black text-amber-600 uppercase">Saldo Ativo (A Amortizar)</p>
                            <p className="text-xl font-black text-amber-800">{formatMoney(dashboardData.kpis.globalSaldoAdiantamentoTotal)}</p>
                          </div>
                          <Wallet className="text-amber-300" size={24}/>
                       </div>
                    </div>
                  )}

                  {globalXrayType === 'retencao' && (
                    <div className="space-y-4">
                       <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Total Histórico Retido</p>
                            <p className="text-lg font-black text-slate-800">{formatMoney(dashboardData.kpis.globalTotalRetido)}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{dashboardData.kpis.qtdNFsRetidas} NFs c/ Retenção</span>
                       </div>
                       <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Total Já Devolvido</p>
                            <p className="text-lg font-black text-slate-800">{formatMoney(dashboardData.kpis.globalTotalDevolvido)}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{dashboardData.kpis.qtdNFsDevolvidas} NFs de Devolução</span>
                       </div>
                       <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 flex justify-between items-center shadow-sm mt-2">
                          <div>
                            <p className="text-[10px] font-black text-rose-600 uppercase">Saldo Cativo Atual (Garantia)</p>
                            <p className="text-xl font-black text-rose-800">{formatMoney(dashboardData.kpis.globalSaldoRetencaoTotal)}</p>
                          </div>
                          <FolderLock className="text-rose-300" size={24}/>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MODAL RAIO-X FINANCEIRO (INDIVIDUAL POR CONTRATO) */}
          {xrayData && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
                  <div>
                    <h3 className="font-black flex items-center gap-2 text-sm sm:text-base"><ScanSearch size={18} className="text-emerald-400"/> Raio-X Financeiro 360º (Auditoria)</h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      Ref: {xrayData.isAgrupado ? xrayData.item.baseCode + ' (Consolidado)' : xrayData.item.codigo_contrato} - {xrayData.isAgrupado ? xrayData.item.fornecedor : xrayData.item.razao_social}
                    </p>
                  </div>
                  <button onClick={() => setXrayData(null)} className="text-slate-400 hover:text-white p-1.5 sm:p-2 bg-slate-800 rounded-full transition-colors"><X size={18}/></button>
                </div>
                
                <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 space-y-4 sm:space-y-6">
                  <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200">
                     <h4 className="text-[10px] sm:text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3 mb-4"><LineChart size={16}/> Extrato de Execução e Faturamento</h4>
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="space-y-3 sm:space-y-4">
                           <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-1">Teto Global Aprovado</p>
                              <p className="text-xl sm:text-2xl font-black text-slate-900 break-words">{formatMoney(xrayData.isAgrupado ? xrayData.item.tetoGlobal : xrayData.item.tetoAtualizado)}</p>
                              <p className="text-[8px] sm:text-[9px] text-slate-400 mt-1 uppercase font-bold">Base + Aditivos + Rateios</p>
                           </div>
                           <div className="p-3 sm:p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                              <p className="text-[9px] sm:text-[10px] font-black text-blue-500 uppercase mb-1">Avanço Físico (Medido)</p>
                              <p className="text-lg sm:text-xl font-black text-blue-800 break-words">{formatMoney(xrayData.isAgrupado ? xrayData.item.totalMedidoGlobal : xrayData.item.totalMedido)}</p>
                              <p className="text-[8px] sm:text-[9px] text-blue-400 mt-1 uppercase font-bold">Baseado em Boletins Físicos</p>
                           </div>
                        </div>

                        <div className="lg:col-span-2 lg:border-l border-slate-100 lg:pl-6 pt-4 lg:pt-0 border-t lg:border-t-0">
                           <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-3">Detalhe de Notas Fiscais Retidas</p>
                           <div className="space-y-2 mb-4">
                             <div className="flex justify-between items-center text-xs sm:text-sm"><span className="text-slate-600">NFs de Serviço</span><span className="font-bold">{formatMoney(xrayData.isAgrupado ? xrayData.item.nfServicoGlobal : xrayData.item.nfServico)}</span></div>
                             <div className="flex justify-between items-center text-xs sm:text-sm"><span className="text-slate-600">NFs de Material</span><span className="font-bold">{formatMoney(xrayData.isAgrupado ? xrayData.item.nfMaterialGlobal : xrayData.item.nfMaterial)}</span></div>
                             <div className="flex justify-between items-center text-xs sm:text-sm"><span className="text-slate-600">Notas de Débito</span><span className="font-bold">{formatMoney(xrayData.isAgrupado ? xrayData.item.nfDebitoGlobal : xrayData.item.nfDebito)}</span></div>
                             <div className="flex justify-between items-center text-xs sm:text-sm"><span className="text-slate-600">DACTE (Frete)</span><span className="font-bold">{formatMoney(xrayData.isAgrupado ? xrayData.item.nfDacteGlobal : xrayData.item.nfDacte)}</span></div>
                             <div className="flex justify-between items-center text-xs sm:text-sm"><span className="text-slate-600">Faturas</span><span className="font-bold">{formatMoney(xrayData.isAgrupado ? xrayData.item.nfFaturaGlobal : xrayData.item.nfFatura)}</span></div>
                             <div className="flex justify-between items-center text-xs sm:text-sm pt-1 border-t border-slate-100 mt-1"><span className="text-slate-600">Recibos de Adiantamento</span><span className="font-bold text-amber-600">{formatMoney(xrayData.isAgrupado ? xrayData.item.nfAdiantamentoGlobal : xrayData.item.nfAdiantamento)}</span></div>
                           </div>
                           <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                             <p className="text-[10px] sm:text-xs font-black uppercase text-slate-800">Total Faturado</p>
                             <p className="text-lg sm:text-xl font-black text-emerald-600 break-words">{formatMoney(xrayData.isAgrupado ? xrayData.item.totalIncorridoGlobal : xrayData.item.totalIncorrido)}</p>
                           </div>
                           <div className="mt-2 bg-slate-100 rounded-full h-1.5 overflow-hidden flex shadow-inner">
                              {(() => {
                                 const teto = xrayData.isAgrupado ? xrayData.item.tetoGlobal : xrayData.item.tetoAtualizado;
                                 const faturado = xrayData.isAgrupado ? xrayData.item.totalIncorridoGlobal : xrayData.item.totalIncorrido;
                                 const perc = teto > 0 ? (faturado / teto) * 100 : 0;
                                 return <div className={`h-full transition-all ${perc > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(perc, 100)}%`}}></div>
                              })()}
                           </div>
                           <p className="text-[8px] sm:text-[9px] text-right mt-1 font-bold text-slate-400">
                             Saldo a Faturar: {formatMoney((xrayData.isAgrupado ? xrayData.item.tetoGlobal : xrayData.item.tetoAtualizado) - (xrayData.isAgrupado ? xrayData.item.totalIncorridoGlobal : xrayData.item.totalIncorrido))}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200">
                       <h4 className="text-[10px] sm:text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3 mb-4"><Wallet size={16}/> Extrato de Adiantamento</h4>
                       <div className="flex justify-between items-end mb-2">
                         <div><p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">Total Concedido</p><p className="text-base sm:text-lg font-black text-slate-800 break-words">{formatMoney(xrayData.isAgrupado ? xrayData.item.adiantamentoConcedidoGlobal : xrayData.item.adiantamentoTotal)}</p></div>
                         <div className="text-right"><p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">Amortizado nas NFs (-)</p><p className="text-base sm:text-lg font-black text-slate-500 break-words">{formatMoney(xrayData.isAgrupado ? xrayData.item.amortizadoGlobal : xrayData.item.amortizadoAcumulado)}</p></div>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-2.5 sm:h-3 overflow-hidden flex shadow-inner">
                          {(() => {
                             const concedido = xrayData.isAgrupado ? xrayData.item.adiantamentoConcedidoGlobal : xrayData.item.adiantamentoTotal;
                             const amortizado = xrayData.isAgrupado ? xrayData.item.amortizadoGlobal : xrayData.item.amortizadoAcumulado;
                             const perc = concedido > 0 ? (amortizado / concedido) * 100 : 0;
                             return <div className="bg-amber-400 h-full transition-all" style={{width: `${Math.min(perc, 100)}%`}}></div>
                          })()}
                       </div>
                       <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center"><p className="text-[10px] sm:text-xs font-bold text-slate-500">Saldo a Amortizar (=)</p><p className="text-lg sm:text-xl font-black text-amber-600 bg-amber-50 px-2 sm:px-3 py-1 rounded-lg border border-amber-100 break-words">{formatMoney(xrayData.isAgrupado ? xrayData.item.saldoAdiantamentoGlobal : xrayData.item.saldoAdiantamento)}</p></div>
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200">
                       <h4 className="text-[10px] sm:text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3 mb-4"><FolderLock size={16}/> Retenção Técnica (Garantia)</h4>
                       <div className="flex justify-between items-end mb-2">
                         <div><p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">Total Retido (Cativo)</p><p className="text-base sm:text-lg font-black text-slate-800 break-words">{formatMoney(xrayData.isAgrupado ? xrayData.item.retidoGlobal : xrayData.item.retidoTotal)}</p></div>
                         <div className="text-right"><p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">Liberado / Devolvido (-)</p><p className="text-base sm:text-lg font-black text-slate-500 break-words">{formatMoney(xrayData.isAgrupado ? xrayData.item.devolvidoGlobal : xrayData.item.retencaoDevolvida)}</p></div>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-2.5 sm:h-3 overflow-hidden flex shadow-inner">
                          {(() => {
                             const retido = xrayData.isAgrupado ? xrayData.item.retidoGlobal : xrayData.item.retidoTotal;
                             const devolvido = xrayData.isAgrupado ? xrayData.item.devolvidoGlobal : xrayData.item.retencaoDevolvida;
                             const perc = retido > 0 ? (devolvido / retido) * 100 : 0;
                             return <div className="bg-rose-400 h-full transition-all" style={{width: `${Math.min(perc, 100)}%`}}></div>
                          })()}
                       </div>
                       <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center"><p className="text-[10px] sm:text-xs font-bold text-slate-500">Saldo Cativo Atual (=)</p><p className="text-lg sm:text-xl font-black text-rose-600 bg-rose-50 px-2 sm:px-3 py-1 rounded-lg border border-rose-100 break-words">{formatMoney(xrayData.isAgrupado ? xrayData.item.saldoRetencaoGlobal : xrayData.item.saldoRetencao)}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6 CARDS DE KPI DE DIRETORIA RESTRUTURADOS PARA RESPONSIVIDADE COM LUPAS DE AUDITORIA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">Capex Aprovado <Database size={14}/></p>
              <h4 className="text-xl md:text-2xl font-black text-slate-900 leading-tight break-words">{formatMoney(dashboardData.kpis.globalCapex)}</h4>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between min-w-0">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teto Contratado</p>
                <div className="flex flex-col items-end gap-1.5">
                   <FolderLock className="text-slate-400" size={14}/>
                   <button onClick={() => setGlobalXrayType('contratos')} className="text-slate-300 hover:text-blue-500 transition-colors" title="Raio-X Global: Contratações"><ScanSearch size={14}/></button>
                </div>
              </div>
              <h4 className="text-xl md:text-2xl font-black text-amber-700 leading-tight break-words">{formatMoney(dashboardData.kpis.globalContratado)}</h4>
            </div>

            <div className={`p-5 rounded-2xl shadow-sm border flex flex-col justify-between min-w-0 ${dashboardData.kpis.globalSave >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center justify-between ${dashboardData.kpis.globalSave >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {dashboardData.kpis.globalSave >= 0 ? 'SAVE (Economia)' : 'Estouro Capex'}
                {dashboardData.kpis.globalSave >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
              </p>
              <h4 className={`text-xl md:text-2xl font-black leading-tight break-words ${dashboardData.kpis.globalSave >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatMoney(dashboardData.kpis.globalSave)}</h4>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-800 text-white relative overflow-hidden flex flex-col justify-between min-w-0">
              <div className="absolute -right-2 -bottom-2 opacity-10"><Activity size={64} /></div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center justify-between">Incorrido (NFs) <DollarSign size={14}/></p>
                <h4 className="text-xl md:text-2xl font-black leading-tight break-words">{formatMoney(dashboardData.kpis.globalIncorrido)}</h4>
              </div>
            </div>

            <div className="bg-amber-50 p-5 rounded-2xl shadow-sm border border-amber-200 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-start justify-between mb-2">
                   <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Saldo Adiant.</p>
                   <div className="flex flex-col items-end gap-1.5">
                     <Wallet className="text-amber-700" size={14}/>
                     <button onClick={() => setGlobalXrayType('adiantamento')} className="text-amber-400 hover:text-amber-700 transition-colors" title="Raio-X Global: Adiantamentos"><ScanSearch size={14}/></button>
                   </div>
                </div>
                <h4 className="text-xl md:text-2xl font-black text-amber-900 leading-tight break-words">{formatMoney(dashboardData.kpis.globalSaldoAdiantamentoTotal)}</h4>
              </div>
              <p className="text-[9px] font-bold text-amber-600 uppercase mt-2 tracking-wider">A Amortizar</p>
            </div>

            <div className="bg-rose-50 p-5 rounded-2xl shadow-sm border border-rose-200 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-start justify-between mb-2">
                   <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Retenção Cativa</p>
                   <div className="flex flex-col items-end gap-1.5">
                     <FolderLock className="text-rose-700" size={14}/>
                     <button onClick={() => setGlobalXrayType('retencao')} className="text-rose-400 hover:text-rose-700 transition-colors" title="Raio-X Global: Retenções"><ScanSearch size={14}/></button>
                   </div>
                </div>
                <h4 className="text-xl md:text-2xl font-black text-rose-900 leading-tight break-words">{formatMoney(dashboardData.kpis.globalSaldoRetencaoTotal)}</h4>
              </div>
              <p className="text-[9px] font-bold text-rose-600 uppercase mt-2 tracking-wider">Fundo de Garantia</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-6">
            <div className="p-4 sm:p-5 bg-slate-900 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex bg-slate-800 p-1 sm:p-1.5 rounded-xl border border-slate-700 w-full lg:w-auto">
                <button onClick={() => setViewMode('eap')} className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'eap' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}><ListTree size={14} className="sm:w-4 sm:h-4"/> Matriz EAP</button>
                <button onClick={() => setViewMode('fornecedor')} className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'fornecedor' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}><Users size={14} className="sm:w-4 sm:h-4"/> Fornecedor</button>
              </div>
              <div className="relative w-full lg:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={14} className="text-slate-400"/></div>
                <input type="text" placeholder="Buscar na matriz atual..." className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={buscaDashboard} onChange={e => setBuscaDashboard(e.target.value)} />
                {buscaDashboard && <button onClick={() => setBuscaDashboard('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"><X size={14}/></button>}
              </div>
            </div>
            
            {viewMode === 'eap' && (
              <div className="overflow-x-auto animate-in fade-in max-w-full">
                <table className="w-full text-sm text-left border-collapse min-w-[900px]">
                  <thead className="bg-slate-100 border-b-2 border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[9px]">
                    <tr><th className="p-3 sm:p-4 pl-4 sm:pl-6 whitespace-nowrap">Rubrica PMG (Nó Pai)</th><th className="p-3 sm:p-4 text-right whitespace-nowrap">Orçamento (Capex)</th><th className="p-3 sm:p-4 text-right whitespace-nowrap">Teto Contratado</th><th className="p-3 sm:p-4 w-32 sm:w-40 text-center whitespace-nowrap">Consumo (%)</th><th className="p-3 sm:p-4 text-right whitespace-nowrap">Save Gerado</th><th className="p-3 sm:p-4 text-right whitespace-nowrap">Fat. Incorrido</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orcamentosFiltrados.length === 0 ? (
                       <tr><td colSpan="6" className="p-12 text-center text-slate-400">Nenhum dado corresponde à sua busca.</td></tr>
                    ) : (
                      orcamentosFiltrados.map(linha => {
                        const isExpanded = expandedCCs[linha.id];
                        const hasContracts = linha.contratosDetalhes && linha.contratosDetalhes.length > 0;
                        return (
                          <React.Fragment key={linha.id}>
                            <tr className={`transition-colors cursor-pointer group ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`} onClick={() => hasContracts && toggleCC(linha.id)}>
                              <td className="p-3 sm:p-4 pl-3 sm:pl-4 flex items-center gap-2 min-w-[200px]">
                                <button className={`p-1 rounded-md transition-colors ${hasContracts ? 'text-slate-600 bg-slate-200 group-hover:bg-blue-200' : 'text-transparent cursor-default'}`}>{hasContracts ? (isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : <ChevronRight size={14}/>}</button>
                                <div><span className="inline-block px-1.5 py-0.5 bg-slate-800 text-white rounded text-[9px] sm:text-[10px] font-black mr-1.5">{linha.codigo_centro_custo}</span><span className="font-bold text-slate-800 text-[11px] sm:text-xs">{linha.descricao_servico}</span></div>
                              </td>
                              <td className="p-3 sm:p-4 text-right font-black text-slate-900 whitespace-nowrap">{formatMoney(linha.capex)}</td>
                              <td className="p-3 sm:p-4 text-right font-bold text-amber-700 whitespace-nowrap">{formatMoney(linha.contratadoLinha)}</td>
                              <td className="p-3 sm:p-4">
                                <div className="flex items-center gap-2 justify-end">
                                  <div className="flex-1 bg-slate-200 rounded-full h-1.5 sm:h-2 overflow-hidden max-w-[60px] sm:max-w-[80px]"><div className={`h-full rounded-full ${linha.percComprometido > 100 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{width: `${Math.min(linha.percComprometido, 100)}%`}}></div></div>
                                  <span className="text-[9px] sm:text-[10px] font-black text-slate-500 w-8">{linha.percComprometido.toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className={`p-3 sm:p-4 text-right font-black whitespace-nowrap ${linha.saveEap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatMoney(linha.saveEap)}</td>
                              <td className="p-3 sm:p-4 text-right font-black text-blue-700 whitespace-nowrap">{formatMoney(linha.incorridoLinha)}</td>
                            </tr>
                            {isExpanded && hasContracts && (
                              <tr className="bg-slate-50/80 border-none">
                                <td colSpan="6" className="p-0">
                                  <div className="pl-6 sm:pl-12 pr-3 sm:pr-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50/30 to-slate-50/30 border-l-2 sm:border-l-4 border-l-blue-400 shadow-inner overflow-x-auto">
                                    <table className="w-full text-left min-w-[700px]">
                                      <thead className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                        <tr><th className="pb-2 w-1/4 whitespace-nowrap">Contrato Parcial (Desta Linha)</th><th className="pb-2 text-right whitespace-nowrap">Teto (Base + Adt.)</th><th className="pb-2 text-right whitespace-nowrap">Saldo Adiantamento</th><th className="pb-2 text-right text-emerald-600 whitespace-nowrap">Fat. Direto (Inq.)</th><th className="pb-2 text-right text-amber-600 whitespace-nowrap">Fat. Indireto (Const.)</th><th className="pb-2 text-right text-rose-600 whitespace-nowrap">Saldo Retenção</th></tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100/50">
                                        {linha.contratosDetalhes.map(c => (
                                          <tr key={c.id} className="hover:bg-white transition-colors">
                                            <td className="py-2 sm:py-3">
                                              <div className="flex items-center gap-1.5 sm:gap-2"><CornerDownRight size={12} className="text-slate-300 shrink-0"/><div><div className="flex items-center gap-1.5 mb-0.5"><p className={`font-black text-[11px] ${c.status_vigencia === 'Encerrado' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{c.codigo_contrato}</p>{c.status_vigencia === 'Encerrado' && <span className="text-[8px] font-black bg-slate-800 text-white px-1.5 py-0.5 rounded">Encerrado</span>}</div><p className="text-[8px] sm:text-[9px] font-bold text-slate-500 truncate max-w-[150px] sm:max-w-[200px]" title={c.razao_social}>{c.razao_social}</p></div></div>
                                            </td>
                                            <td className="py-2 sm:py-3 text-right">
                                              <button onClick={(e) => openXRay(e, c, false)} className="inline-flex items-center justify-end gap-1 font-black text-slate-700 text-[10px] sm:text-[11px] hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded transition-colors group whitespace-nowrap">
                                                {formatMoney(c.tetoAtualizado)} <ScanSearch size={10} className="sm:w-3 sm:h-3 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                              </button>
                                            </td>
                                            <td className="py-2 sm:py-3 text-right">
                                              <button onClick={(e) => openXRay(e, c, false)} className="inline-flex flex-col items-end justify-end gap-0.5 font-bold text-slate-600 text-[10px] sm:text-[11px] hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded transition-colors group whitespace-nowrap">
                                                <span className="flex items-center gap-1">{formatMoney(c.saldoAdiantamento)} <ScanSearch size={10} className="sm:w-3 sm:h-3 opacity-0 group-hover:opacity-100 transition-opacity"/></span>
                                                {c.adiantamentoTotal > 0 && <span className="text-[7px] sm:text-[8px] text-slate-400 uppercase tracking-wider">de {formatMoney(c.adiantamentoTotal)}</span>}
                                              </button>
                                            </td>
                                            <td className="py-2 sm:py-3 text-right font-black text-emerald-700 text-[10px] sm:text-[11px] whitespace-nowrap">{formatMoney(c.fatDireto)}</td>
                                            <td className="py-2 sm:py-3 text-right font-black text-amber-700 text-[10px] sm:text-[11px] whitespace-nowrap">{formatMoney(c.fatIndireto)}</td>
                                            <td className="py-2 sm:py-3 text-right">
                                              <button onClick={(e) => openXRay(e, c, false)} className="inline-flex items-center justify-end gap-1 font-black text-rose-600 text-[10px] sm:text-[11px] hover:text-blue-600 bg-rose-50 hover:bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded transition-colors group whitespace-nowrap">
                                                {formatMoney(c.saldoRetencao)} <ScanSearch size={10} className="sm:w-3 sm:h-3 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'fornecedor' && (
              <div className="overflow-x-auto animate-in fade-in max-w-full">
                <table className="w-full text-sm text-left border-collapse min-w-[900px]">
                  <thead className="bg-indigo-50 border-b-2 border-indigo-100 text-indigo-800 font-black uppercase tracking-wider text-[9px]">
                    <tr><th className="p-3 sm:p-4 pl-4 sm:pl-6 whitespace-nowrap">Contrato Mestre (Fornecedor)</th><th className="p-3 sm:p-4 text-right whitespace-nowrap">Teto Global (Soma)</th><th className="p-3 sm:p-4 text-right whitespace-nowrap">Saldo Adiantamento</th><th className="p-3 sm:p-4 text-right text-emerald-700 whitespace-nowrap">Total Direto (Inq.)</th><th className="p-3 sm:p-4 text-right text-amber-700 whitespace-nowrap">Total Indireto (Const.)</th><th className="p-3 sm:p-4 text-right text-rose-700 whitespace-nowrap">Saldo Retenção</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consolidadosFiltrados.length === 0 ? (
                       <tr><td colSpan="6" className="p-12 text-center text-slate-400">Nenhum fornecedor encontrado.</td></tr>
                    ) : (
                      consolidadosFiltrados.map(agg => {
                        const isExpanded = expandedContratos[agg.baseCode];
                        return (
                          <React.Fragment key={agg.baseCode}>
                            <tr className={`transition-colors cursor-pointer group ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`} onClick={() => toggleContrato(agg.baseCode)}>
                              <td className="p-3 sm:p-4 pl-3 sm:pl-4 flex items-center gap-2 min-w-[200px]">
                                <button className={`p-1 rounded-md transition-colors text-slate-600 bg-slate-200 group-hover:bg-indigo-200`}>{isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</button>
                                <div>
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className={`font-black text-[11px] sm:text-xs block leading-tight ${agg.status_vigencia === 'Encerrado' ? 'text-slate-400 line-through' : 'text-indigo-900'}`}>{agg.baseCode}</span>
                                    {agg.status_vigencia === 'Encerrado' && <span className="text-[7px] sm:text-[8px] font-black bg-slate-800 text-white px-1.5 py-0.5 rounded">Encerrado</span>}
                                  </div>
                                  <span className="font-bold text-slate-600 text-[9px] sm:text-[10px] truncate max-w-[150px] sm:max-w-[200px] block mt-0.5">{agg.fornecedor}</span>
                                </div>
                              </td>
                              <td className="p-3 sm:p-4 text-right">
                                <button onClick={(e) => openXRay(e, agg, true)} className="inline-flex items-center justify-end gap-1 font-black text-slate-900 text-sm sm:text-base hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2 sm:px-2.5 py-1 rounded-lg transition-colors group whitespace-nowrap">
                                  {formatMoney(agg.tetoGlobal)} <ScanSearch size={12} className="sm:w-3.5 sm:h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                </button>
                              </td>
                              <td className="p-3 sm:p-4 text-right">
                                <button onClick={(e) => openXRay(e, agg, true)} className="inline-flex flex-col items-end justify-end gap-0.5 font-bold text-slate-600 text-[10px] sm:text-xs hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2 sm:px-2.5 py-1 rounded-lg transition-colors group whitespace-nowrap">
                                  <span className="flex items-center gap-1">{formatMoney(agg.saldoAdiantamentoGlobal)} <ScanSearch size={12} className="sm:w-3.5 sm:h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"/></span>
                                  {agg.adiantamentoConcedidoGlobal > 0 && <span className="text-[7px] sm:text-[8px] text-slate-400 uppercase tracking-wider">de {formatMoney(agg.adiantamentoConcedidoGlobal)}</span>}
                                </button>
                              </td>
                              <td className="p-3 sm:p-4 text-right font-black text-emerald-700 text-[11px] sm:text-sm whitespace-nowrap">{formatMoney(agg.fatDiretoGlobal)}</td>
                              <td className="p-3 sm:p-4 text-right font-black text-amber-700 text-[11px] sm:text-sm whitespace-nowrap">{formatMoney(agg.fatIndiretoGlobal)}</td>
                              <td className="p-3 sm:p-4 text-right">
                                <button onClick={(e) => openXRay(e, agg, true)} className="inline-flex items-center justify-end gap-1 font-black text-rose-600 text-[10px] sm:text-xs hover:text-blue-600 bg-rose-50 hover:bg-blue-50 px-2 sm:px-2.5 py-1 rounded-lg transition-colors group whitespace-nowrap">
                                  {formatMoney(agg.saldoRetencaoGlobal)} <ScanSearch size={12} className="sm:w-3.5 sm:h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/80 border-none">
                                <td colSpan="6" className="p-0">
                                  <div className="pl-6 sm:pl-12 pr-3 sm:pr-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-50/30 to-slate-50/30 border-l-2 sm:border-l-4 border-l-indigo-400 shadow-inner overflow-x-auto">
                                    <table className="w-full text-left min-w-[700px]">
                                      <thead className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                        <tr><th className="pb-2 w-1/3 whitespace-nowrap">Alocação / Rateio no PMG</th><th className="pb-2 text-right whitespace-nowrap">Fração do Teto</th><th className="pb-2 text-right whitespace-nowrap">Saldo Adiantamento</th><th className="pb-2 text-right text-emerald-600 whitespace-nowrap">Fat. Direto</th><th className="pb-2 text-right text-amber-600 whitespace-nowrap">Fat. Indireto</th><th className="pb-2 text-right text-rose-600 whitespace-nowrap">Saldo Retenção</th></tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100/50">
                                        {agg.faccoes.map(f => (
                                          <tr key={f.id} className="hover:bg-white transition-colors">
                                            <td className="py-2 sm:py-3">
                                              <div className="flex items-center gap-1.5 sm:gap-2"><CornerDownRight size={12} className="text-slate-300 shrink-0"/><div><span className="inline-block px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[8px] sm:text-[9px] font-black mr-1">{f.codigo_centro_custo}</span><span className="text-[9px] sm:text-[10px] font-bold text-slate-600">{f.descricao_centro_custo}</span>{f.codigo_contrato !== agg.baseCode && <span className="block text-[7px] sm:text-[8px] text-slate-400 uppercase mt-1">Ref. Fração: {f.codigo_contrato}</span>}</div></div>
                                            </td>
                                            <td className="py-2 sm:py-3 text-right">
                                              <button onClick={(e) => openXRay(e, f, false)} className="inline-flex items-center justify-end gap-1 font-black text-slate-700 text-[10px] sm:text-[11px] hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors group whitespace-nowrap">
                                                {formatMoney(f.tetoAtualizado)} <ScanSearch size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                                              </button>
                                            </td>
                                            <td className="py-2 sm:py-3 text-right">
                                              <button onClick={(e) => openXRay(e, f, false)} className="inline-flex flex-col items-end justify-end gap-0.5 font-bold text-slate-500 text-[10px] sm:text-[11px] hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors group whitespace-nowrap">
                                                <span className="flex items-center gap-1">{formatMoney(f.saldoAdiantamento)} <ScanSearch size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"/></span>
                                              </button>
                                            </td>
                                            <td className="py-2 sm:py-3 text-right font-black text-emerald-700 text-[10px] sm:text-[11px] whitespace-nowrap">{formatMoney(f.fatDireto)}</td>
                                            <td className="py-2 sm:py-3 text-right font-black text-amber-700 text-[10px] sm:text-[11px] whitespace-nowrap">{formatMoney(f.fatIndireto)}</td>
                                            <td className="py-2 sm:py-3 text-right">
                                              <button onClick={(e) => openXRay(e, f, false)} className="inline-flex items-center justify-end gap-1 font-bold text-rose-600 text-[10px] sm:text-[11px] hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors group whitespace-nowrap">
                                                {formatMoney(f.saldoRetencao)} <ScanSearch size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// 2. ABA 1: GESTÃO ESTRUTURAL E CRUDs OMITIDOS POR BREVIDADE
// ... (Tudo o resto do App.jsx mantém-se igual à versão anterior)
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
  
  const initialOrcamentoState = { id: null, codigo_centro_custo: '', descricao_servico: '', valor_aprovado_teto: '' };
  const [formOrcamento, setFormOrcamento] = useState(initialOrcamentoState);
  const [isEditingOrcamento, setIsEditingOrcamento] = useState(false);
  
  const initialContratoState = { id: null, orcamento_pmg_id: '', codigo_contrato: '', razao_social: '', cnpj_fornecedor: '', data_inicio: '', data_fechamento: '', valor_inicial: '', valor_adiantamento_concedido: '', status_vigencia: 'Ativo' };
  const [formContrato, setFormContrato] = useState(initialContratoState);
  const [isEditingContrato, setIsEditingContrato] = useState(false);
  
  const [showModalAditivo, setShowModalAditivo] = useState(false);
  const [selectedContratoForAditivo, setSelectedContratoForAditivo] = useState(null);
  const [formAditivo, setFormAditivo] = useState({ numero_aditivo: '', data_assinatura: '', valor_acrescimo: '', motivo_justificativa: '' });

  const [showModalRateio, setShowModalRateio] = useState(false);
  const [contratoBaseRateio, setContratoBaseRateio] = useState(null);
  const [formRateio, setFormRateio] = useState({ orcamento_pmg_id: '', valor_inicial: '', codigo_sugerido: '' });

  const [buscaContrato, setBuscaContrato] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(selectedEmpresaId); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { 
    if (selectedObraId) { loadOrcamentos(selectedObraId); loadContratos(selectedObraId); } 
    else { setOrcamentos([]); setContratos([]); } 
  }, [selectedObraId]);

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras(empId) { const { data } = await supabase.from('obras').select('*').eq('empresa_id', empId).order('nome_obra'); setObras(data || []); }
  async function loadOrcamentos(obrId) { const { data } = await supabase.from('orcamento_pmg').select('*').eq('obra_id', obrId).order('codigo_centro_custo'); setOrcamentos(data || []); }
  async function loadContratos(obrId) { 
    const { data } = await supabase.from('contratos')
      .select('*, orcamento_pmg(codigo_centro_custo, descricao_servico), aditivos_contrato(*)')
      .eq('obra_id', obrId)
      .order('codigo_contrato'); 
    setContratos(data || []); 
  }

  const handleAddEmpresa = async (e) => { e.preventDefault(); const { error } = await supabase.from('empresas').insert([formEmpresa]); if (error) alert('Erro: ' + error.message); else { setFormEmpresa({ razao_social: '', cnpj: '' }); loadEmpresas(); } };
  const handleAddObra = async (e) => { e.preventDefault(); const { error } = await supabase.from('obras').insert([{ ...formObra, empresa_id: selectedEmpresaId }]); if (error) alert('Erro: ' + error.message); else { setFormObra({ codigo_obra: '', nome_obra: '' }); loadObras(selectedEmpresaId); } };
  
  const handleAddOrUpdateOrcamento = async (e) => {
    e.preventDefault();
    const payload = { obra_id: selectedObraId, codigo_centro_custo: formOrcamento.codigo_centro_custo, descricao_servico: formOrcamento.descricao_servico, valor_aprovado_teto: parseCurrency(formOrcamento.valor_aprovado_teto) };
    if (isEditingOrcamento) {
      const { error } = await supabase.from('orcamento_pmg').update(payload).eq('id', formOrcamento.id);
      if (error) alert('Erro ao atualizar: ' + error.message); else { handleCancelEditOrcamento(); loadOrcamentos(selectedObraId); }
    } else {
      const { error } = await supabase.from('orcamento_pmg').insert([payload]);
      if (error) alert('Erro ao inserir: ' + error.message); else { handleCancelEditOrcamento(); loadOrcamentos(selectedObraId); }
    }
  };
  const handleEditOrcamentoClick = (orc) => { setFormOrcamento({ id: orc.id, codigo_centro_custo: orc.codigo_centro_custo, descricao_servico: orc.descricao_servico, valor_aprovado_teto: formatToCurrencyString(orc.valor_aprovado_teto) }); setIsEditingOrcamento(true); };
  const handleCancelEditOrcamento = () => { setFormOrcamento(initialOrcamentoState); setIsEditingOrcamento(false); };
  
  const handleDeleteOrcamento = async (id, codigo) => {
    if (!window.confirm(`AUDITORIA: Tem certeza que deseja excluir a linha do PMG "${codigo}"?\n\nO banco de dados bloqueará a exclusão caso existam contratos vinculados a esta rubrica.`)) return;
    const { error } = await supabase.from('orcamento_pmg').delete().eq('id', id);
    if (error) alert(`BLOQUEIO DE SEGURANÇA:\nNão é possível excluir esta linha do PMG pois existem contratos atrelados a ela.\nDetalhe: ${error.message}`);
    else loadOrcamentos(selectedObraId);
  };

  const handleAddOrUpdateContrato = async (e) => {
    e.preventDefault();
    const orcSelected = orcamentos.find(o => o.id === formContrato.orcamento_pmg_id);
    if (!orcSelected) return alert("Selecione a Linha de Orçamento PMG.");

    if (formContrato.status_vigencia === 'Encerrado' && isEditingContrato) {
        const { data: nfs } = await supabase.from('documentos_fiscais').select('valor_retencao_tecnica, valor_amortizado_adiantamento, tipo_documento, valor_bruto, status_documento').eq('contrato_id', formContrato.id);
        let totRet = 0; let totDev = 0; let totAmort = 0; let totAdiantRecebido = 0;
        
        nfs?.filter(n => !['Cancelado', 'Anulado', 'Substituido'].includes(n.status_documento)).forEach(n => {
            if(n.tipo_documento === 'Liberação Retenção') totDev += Number(n.valor_bruto);
            else if (n.tipo_documento === 'Recibo Adiantamento') totAdiantRecebido += Number(n.valor_bruto);
            else { totRet += Number(n.valor_retencao_tecnica); totAmort += Number(n.valor_amortizado_adiantamento); }
        });
        
        const adiantContrato = parseCurrency(formContrato.valor_adiantamento_concedido);
        const adiantTotalReal = Math.max(adiantContrato, totAdiantRecebido);

        if ((adiantTotalReal - totAmort) > 0) return alert("BLOQUEIO DE AUDITORIA:\nNão é possível encerrar este contrato. Existe saldo de Adiantamento não amortizado.");
        if ((totRet - totDev) > 0) return alert("BLOQUEIO DE AUDITORIA:\nNão é possível encerrar este contrato. Existe Retenção Cativa que ainda não foi devolvida.");
    }

    const payload = {
      obra_id: selectedObraId, orcamento_pmg_id: formContrato.orcamento_pmg_id, codigo_contrato: formContrato.codigo_contrato,
      razao_social: formContrato.razao_social, cnpj_fornecedor: formContrato.cnpj_fornecedor, centro_custo_raiz: orcSelected.codigo_centro_custo, 
      descricao_servico: orcSelected.descricao_servico, data_inicio: formContrato.data_inicio || null, data_fechamento: formContrato.data_fechamento || null,
      valor_inicial: parseCurrency(formContrato.valor_inicial), valor_adiantamento_concedido: parseCurrency(formContrato.valor_adiantamento_concedido),
      status_vigencia: formContrato.status_vigencia
    };

    if (isEditingContrato) {
      const { error } = await supabase.from('contratos').update(payload).eq('id', formContrato.id);
      if (error) alert('Erro ao atualizar (Pode violar UNIQUE ou Teto): ' + error.message); else { handleCancelEdit(); loadContratos(selectedObraId); }
    } else {
      const { error } = await supabase.from('contratos').insert([payload]);
      if (error) alert('Erro ao registar (Já existe este Código ou Estourou Teto): ' + error.message); else { handleCancelEdit(); loadContratos(selectedObraId); }
    }
  };

  const handleEditContratoClick = (c) => {
    setFormContrato({ id: c.id, orcamento_pmg_id: c.orcamento_pmg_id || '', codigo_contrato: c.codigo_contrato || '', razao_social: c.razao_social || '', cnpj_fornecedor: c.cnpj_fornecedor || '', data_inicio: c.data_inicio || '', data_fechamento: c.data_fechamento || '', valor_inicial: formatToCurrencyString(c.valor_inicial), valor_adiantamento_concedido: formatToCurrencyString(c.valor_adiantamento_concedido), status_vigencia: c.status_vigencia || 'Ativo' });
    setIsEditingContrato(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleCancelEdit = () => { setFormContrato(initialContratoState); setIsEditingContrato(false); };

  const handleDeleteContrato = async (id, codigo) => {
    if (!window.confirm(`ALERTA DE AUDITORIA:\nDeseja excluir permanentemente o contrato ${codigo}?\n\nSe existirem Notas Fiscais, Medições ou Pedidos atrelados, o sistema recusará a exclusão.`)) return;
    const { error } = await supabase.from('contratos').delete().eq('id', id);
    if (error) alert(`BLOQUEIO FINANCEIRO:\nO contrato não pode ser excluído pois possui histórico financeiro.\n\nDetalhe: ${error.message}`);
    else loadContratos(selectedObraId);
  };

  const handleOpenRateio = (c) => {
    const allCodes = getAllBaseCodes(contratos);
    const baseCode = findBaseCode(c.codigo_contrato, allCodes); 
    const relacionados = contratos.filter(ct => findBaseCode(ct.codigo_contrato, allCodes) === baseCode);
    const proximoSufixo = relacionados.length;
    const novoCodigo = `${baseCode}.${proximoSufixo}`;
    
    setContratoBaseRateio(c);
    setFormRateio({ orcamento_pmg_id: '', valor_inicial: '', codigo_sugerido: novoCodigo });
    setShowModalRateio(true);
  };

  const handleSaveRateio = async (e) => {
    e.preventDefault();
    const orcSelected = orcamentos.find(o => o.id === formRateio.orcamento_pmg_id);
    if (!orcSelected) return alert('Selecione a nova linha do PMG (Centro de Custo).');
    
    const payload = {
      obra_id: selectedObraId,
      orcamento_pmg_id: formRateio.orcamento_pmg_id,
      codigo_contrato: formRateio.codigo_sugerido,
      razao_social: contratoBaseRateio.razao_social,
      cnpj_fornecedor: contratoBaseRateio.cnpj_fornecedor,
      centro_custo_raiz: orcSelected.codigo_centro_custo,
      descricao_servico: orcSelected.descricao_servico,
      data_inicio: contratoBaseRateio.data_inicio, 
      data_fechamento: contratoBaseRateio.data_fechamento,
      valor_inicial: parseCurrency(formRateio.valor_inicial),
      valor_adiantamento_concedido: 0,
      status_vigencia: 'Ativo'
    };
    
    const { error } = await supabase.from('contratos').insert([payload]);
    if (error) alert('Erro ao registrar fração do contrato: ' + error.message);
    else { setShowModalRateio(false); loadContratos(selectedObraId); }
  };

  const handleSaveAditivo = async (e) => {
    e.preventDefault();
    if (!selectedContratoForAditivo) return;
    
    const payload = {
      contrato_id: selectedContratoForAditivo.id, numero_aditivo: formAditivo.numero_aditivo,
      data_assinatura: formAditivo.data_assinatura, valor_acrescimo: parseCurrency(formAditivo.valor_acrescimo),
      motivo_justificativa: formAditivo.motivo_justificativa
    };
    const { error } = await supabase.from('aditivos_contrato').insert([payload]);
    if (error) alert('Erro ao registrar Aditivo: ' + error.message);
    else { setShowModalAditivo(false); setFormAditivo({ numero_aditivo: '', data_assinatura: '', valor_acrescimo: '', motivo_justificativa: '' }); setSelectedContratoForAditivo(null); loadContratos(selectedObraId); }
  };

  const linhaPmgSelecionada = orcamentos.find(o => o.id === formContrato.orcamento_pmg_id);
  const tetoAprovado = linhaPmgSelecionada ? parseFloat(linhaPmgSelecionada.valor_aprovado_teto) : 0;
  const somaOutrosContratos = contratos.filter(c => c.orcamento_pmg_id === formContrato.orcamento_pmg_id && c.id !== formContrato.id).reduce((acc, c) => acc + Number(c.valor_inicial), 0);
  const valorDigitado = parseCurrency(formContrato.valor_inicial);
  const saveGerado = tetoAprovado - somaOutrosContratos - valorDigitado;

  const groupedContracts = {};
  const allCodes = getAllBaseCodes(contratos);

  contratos.forEach(c => {
    const baseCode = findBaseCode(c.codigo_contrato, allCodes);
    if (!groupedContracts[baseCode]) {
      groupedContracts[baseCode] = { root: null, rateios: [], totalUnified: 0 };
    }
    if (c.codigo_contrato === baseCode) {
      groupedContracts[baseCode].root = c;
    } else {
      groupedContracts[baseCode].rateios.push(c);
    }
    const aditivosTotal = c.aditivos_contrato?.reduce((acc, a) => acc + Number(a.valor_acrescimo), 0) || 0;
    groupedContracts[baseCode].totalUnified += Number(c.valor_inicial) + aditivosTotal;
  });

  const term = buscaContrato.toLowerCase();
  const groupsToRender = Object.entries(groupedContracts).filter(([baseCode, group]) => {
    if (!term) return true;
    const checkMatch = (c) => c && (
      (c.razao_social && c.razao_social.toLowerCase().includes(term)) ||
      (c.codigo_contrato && c.codigo_contrato.toLowerCase().includes(term)) ||
      (c.centro_custo_raiz && c.centro_custo_raiz.toLowerCase().includes(term))
    );
    return checkMatch(group.root) || group.rateios.some(checkMatch);
  });

  const toggleGroup = (baseCode) => setExpandedGroups(prev => ({...prev, [baseCode]: !prev[baseCode]}));

  return (
    <div className="animate-in fade-in duration-700 w-full max-w-7xl mx-auto space-y-6 pb-20 px-2 sm:px-0">
      
      {showModalAditivo && selectedContratoForAditivo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-800 flex items-center gap-2"><Plus size={16}/> Novo Aditivo Contratual</h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1">Ref: {selectedContratoForAditivo.codigo_contrato}</p>
              </div>
              <button onClick={() => setShowModalAditivo(false)} className="text-slate-400 hover:text-rose-500"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveAditivo} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Cód. Aditivo</label><input required placeholder="Ex: TA-01" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-400 outline-none" value={formAditivo.numero_aditivo} onChange={e => setFormAditivo({...formAditivo, numero_aditivo: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Assinatura</label><input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-blue-400 outline-none" value={formAditivo.data_assinatura} onChange={e => setFormAditivo({...formAditivo, data_assinatura: e.target.value})} /></div>
              </div>
              <div>
                <label className="text-[10px] font-black text-blue-600 uppercase ml-1 block mb-1">Valor do Acréscimo / Supressão</label>
                <CurrencyInput required placeholder="Aceita valores negativos (-)" className="w-full p-3 border border-blue-200 rounded-lg text-base font-black text-blue-900 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formAditivo.valor_acrescimo} onChange={val => setFormAditivo({...formAditivo, valor_acrescimo: val})} />
                <p className="text-[9px] text-slate-400 mt-1 ml-1">Use o sinal de menos (-) para registrar uma supressão.</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Motivo / Justificativa</label>
                <input required placeholder="Descreva brevemente..." className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-400 outline-none" value={formAditivo.motivo_justificativa} onChange={e => setFormAditivo({...formAditivo, motivo_justificativa: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white p-3.5 rounded-xl text-sm font-black mt-2 hover:bg-slate-800 transition-colors">Confirmar Aditivo no Banco</button>
            </form>
          </div>
        </div>
      )}

      {showModalRateio && contratoBaseRateio && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <div>
                <h3 className="font-black text-indigo-900 flex items-center gap-2"><CopyPlus size={16}/> Rateio de Contrato (Sub-Fração)</h3>
                <p className="text-[10px] text-indigo-700 font-bold mt-1">Fornecedor: {contratoBaseRateio.razao_social}</p>
              </div>
              <button onClick={() => setShowModalRateio(false)} className="text-indigo-400 hover:text-rose-500"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveRateio} className="p-6 space-y-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 mb-2">
                O sistema gerou automaticamente a sub-fração <strong className="text-slate-900">{formRateio.codigo_sugerido}</strong>. 
                Selecione abaixo o novo Centro de Custo para onde parte do valor deste fornecedor será direcionado.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Cód. Rateio</label><input required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-black bg-slate-100 outline-none cursor-not-allowed" value={formRateio.codigo_sugerido} readOnly /></div>
                <div><label className="text-[10px] font-black text-indigo-600 uppercase ml-1 block mb-1">Valor Desta Fração (R$)</label><CurrencyInput required className="w-full p-2.5 border border-indigo-300 rounded-lg text-sm font-black text-indigo-900 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formRateio.valor_inicial} onChange={val => setFormRateio({...formRateio, valor_inicial: val})} /></div>
              </div>

              <div>
                 <label className="text-[11px] font-black text-slate-700 uppercase mb-2 block flex items-center gap-2"><ListTree size={14}/> Nova Linha do PMG (Centro de Custo)</label>
                 <select required className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm cursor-pointer" value={formRateio.orcamento_pmg_id} onChange={e => setFormRateio({...formRateio, orcamento_pmg_id: e.target.value})}>
                   <option value="">-- Selecione onde alocar esta fatia --</option>
                   {orcamentos.map(orc => <option key={orc.id} value={orc.id}>{orc.codigo_centro_custo} - {orc.descricao_servico} (Teto: {formatMoney(orc.valor_aprovado_teto)})</option>)}
                 </select>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white p-3.5 rounded-xl text-sm font-black mt-4 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30">Confirmar Fração de Rateio</button>
            </form>
          </div>
        </div>
      )}

      <header className="mb-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">EAP e Contratação</h2>
        <p className="text-sm sm:text-base text-slate-500">Definição do Orçamento Base (PMG) e vínculo com fornecedores.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-4 flex items-center gap-2"><Building2 size={16}/> 1. Investidor</h3>
          <select className="w-full mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}>
            <option value="">-- Selecionar Investidor --</option>
            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razao_social}</option>)}
          </select>
          <form onSubmit={handleAddEmpresa} className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-100">
            <input required placeholder="Nome do Grupo" className="flex-1 p-2 border border-slate-200 rounded-lg text-xs" value={formEmpresa.razao_social} onChange={e => setFormEmpresa({...formEmpresa, razao_social: e.target.value})} />
            <input required placeholder="CNPJ" className="w-full sm:w-32 p-2 border border-slate-200 rounded-lg text-xs" value={formEmpresa.cnpj} onChange={e => setFormEmpresa({...formEmpresa, cnpj: e.target.value})} />
            <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-800 transition-colors">Criar</button>
          </form>
        </div>
        
        <div className={`bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 transition-all ${!selectedEmpresaId ? 'opacity-30 pointer-events-none' : ''}`}>
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-4 flex items-center gap-2"><HardHat size={16}/> 2. Empreendimento (Obra)</h3>
          <select className="w-full mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}>
            <option value="">-- Selecionar Obra --</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra} - {o.nome_obra}</option>)}
          </select>
          <form onSubmit={handleAddObra} className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-100">
            <input required placeholder="Cód. Obra" className="w-full sm:w-24 p-2 border border-slate-200 rounded-lg text-xs" value={formObra.codigo_obra} onChange={e => setFormObra({...formObra, codigo_obra: e.target.value})} />
            <input required placeholder="Nome do Projeto" className="flex-1 p-2 border border-slate-200 rounded-lg text-xs" value={formObra.nome_obra} onChange={e => setFormObra({...formObra, nome_obra: e.target.value})} />
            <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-800 transition-colors">Criar</button>
          </form>
        </div>
      </div>

      <div className={`grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 transition-all duration-500 ${!selectedObraId ? 'opacity-30 pointer-events-none grayscale blur-[2px]' : ''}`}>
        
        <div className="xl:col-span-5 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full relative">
          {isEditingOrcamento && (
             <div className="absolute -top-3 left-6 bg-amber-400 text-amber-900 text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                Editando EAP <button type="button" onClick={handleCancelEditOrcamento}><X size={12}/></button>
             </div>
          )}
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-4 sm:mb-6 flex items-center gap-2"><ListTree size={16} className="text-blue-600"/> 3. Linha Base PMG (EAP)</h3>
          
          <div className="flex-1 space-y-2 mb-6 min-h-[250px] max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
            {orcamentos.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl p-6">
                <p className="text-sm font-bold text-center">Estrutura EAP Vazia.</p>
                <p className="text-xs text-center mt-1">Insira as rubricas do orçamento aprovado abaixo.</p>
              </div>
            )}
            {orcamentos.map(orc => (
              <div key={orc.id} className={`p-3 border rounded-xl flex justify-between items-center transition-colors group ${formOrcamento.id === orc.id ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                <div className="truncate pr-2">
                  <span className="text-[10px] font-black text-white bg-slate-800 px-2 py-0.5 rounded-md">{orc.codigo_centro_custo}</span>
                  <p className="text-[11px] text-slate-700 font-bold truncate mt-1.5" title={orc.descricao_servico}>{orc.descricao_servico}</p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                   <div className="text-right mr-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Teto Aprovado</p>
                     <p className="text-xs sm:text-sm font-black text-blue-700">{formatMoney(orc.valor_aprovado_teto)}</p>
                   </div>
                   <button onClick={() => handleEditOrcamentoClick(orc)} className="p-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-amber-100 hover:text-amber-700 transition-colors" title="Editar Linha PMG">
                     <Pencil size={14} />
                   </button>
                   <button onClick={() => handleDeleteOrcamento(orc.id, orc.codigo_centro_custo)} className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-rose-100 hover:text-rose-600 hover:border-rose-200 transition-colors" title="Excluir Linha PMG">
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddOrUpdateOrcamento} className="space-y-3 pt-5 border-t border-slate-100 mt-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
               <div className="sm:col-span-1"><input required placeholder="Cód (Ex: 01.01)" className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-400 outline-none" value={formOrcamento.codigo_centro_custo} onChange={e => setFormOrcamento({...formOrcamento, codigo_centro_custo: e.target.value})} /></div>
               <div className="sm:col-span-2"><input required placeholder="Descrição (Ex: Fundação)" className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:border-blue-400 outline-none" value={formOrcamento.descricao_servico} onChange={e => setFormOrcamento({...formOrcamento, descricao_servico: e.target.value})} /></div>
            </div>
            <div>
              <span className="text-[9px] font-black text-blue-600 uppercase ml-1 block mb-1">Valor Aprovado (Capex)</span>
              <CurrencyInput required className="w-full p-3 border border-blue-200 bg-blue-50/50 rounded-lg text-sm font-black text-blue-900 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={formOrcamento.valor_aprovado_teto} onChange={val => setFormOrcamento({...formOrcamento, valor_aprovado_teto: val})} />
            </div>
            <button type="submit" className={`w-full text-white p-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isEditingOrcamento ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
               {isEditingOrcamento ? 'Atualizar Linha PMG' : <><Plus size={16}/> Adicionar Linha PMG</>}
            </button>
          </form>
        </div>

        <div className="xl:col-span-7 bg-white p-4 sm:p-6 rounded-2xl shadow-xl border-t-4 border-t-emerald-500 border-x border-b border-slate-200 h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><FolderLock size={16} className="text-emerald-600"/> 4. Formulário de Contrato</h3>
          </div>

          <form onSubmit={handleAddOrUpdateContrato} className="relative flex flex-col h-[calc(100%-2rem)]">
            {isEditingContrato && (
              <div className="absolute -top-12 right-0 bg-amber-400 text-amber-900 text-[10px] font-black uppercase px-4 py-2 rounded-full flex items-center gap-2 shadow-md animate-bounce">
                Editando Contrato <button type="button" onClick={handleCancelEdit} className="hover:bg-amber-500 p-1 rounded-full"><X size={14}/></button>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Cód. Contrato</label><input required placeholder="Ex: CT-001" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-semibold focus:border-emerald-400 outline-none" value={formContrato.codigo_contrato} onChange={e => setFormContrato({...formContrato, codigo_contrato: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">CNPJ Fornecedor</label><input required placeholder="Apenas números" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 outline-none" value={formContrato.cnpj_fornecedor} onChange={e => setFormContrato({...formContrato, cnpj_fornecedor: e.target.value})} /></div>
            </div>

            <div className="mb-4">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Razão Social do Fornecedor</label>
              <input required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 outline-none" value={formContrato.razao_social} onChange={e => setFormContrato({...formContrato, razao_social: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Data de Início</label><input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-emerald-400 outline-none" value={formContrato.data_inicio} onChange={e => setFormContrato({...formContrato, data_inicio: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Data de Fechamento</label><input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-emerald-400 outline-none" value={formContrato.data_fechamento} onChange={e => setFormContrato({...formContrato, data_fechamento: e.target.value})} /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <label className="text-[10px] font-black text-emerald-600 uppercase ml-1 block mb-1">Valor Negociado (Base)</label>
                <CurrencyInput required className="w-full p-3 border border-emerald-300 rounded-lg text-base font-black text-emerald-900 bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={formContrato.valor_inicial} onChange={val => setFormContrato({...formContrato, valor_inicial: val})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-amber-500 uppercase ml-1 block mb-1">Adiantamento de Caixa (Teto Opcional)</label>
                <CurrencyInput className="w-full p-3 border border-amber-200 rounded-lg text-base font-black text-amber-800 bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400" value={formContrato.valor_adiantamento_concedido} onChange={val => setFormContrato({...formContrato, valor_adiantamento_concedido: val})} />
              </div>
            </div>

            <div className="mt-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="sm:col-span-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                   <label className="text-[11px] font-black text-blue-800 uppercase mb-2 flex items-center gap-2"><ListTree size={14}/> Vincular à Linha do PMG</label>
                   <select required className="w-full p-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer" value={formContrato.orcamento_pmg_id} onChange={e => setFormContrato({...formContrato, orcamento_pmg_id: e.target.value})}>
                     <option value="">-- Selecione onde alocar este custo --</option>
                     {orcamentos.map(orc => <option key={orc.id} value={orc.id}>{orc.codigo_centro_custo} - {orc.descricao_servico} (Teto: {formatMoney(orc.valor_aprovado_teto)})</option>)}
                   </select>
                </div>
                <div className="sm:col-span-1 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                   <label className="text-[10px] font-black text-slate-500 uppercase mb-2 flex items-center gap-2">Status da Vigência</label>
                   <select className={`w-full p-2 bg-white border rounded-lg text-xs font-bold outline-none cursor-pointer ${formContrato.status_vigencia === 'Ativo' ? 'text-emerald-700 border-emerald-300' : (formContrato.status_vigencia === 'Encerrado' ? 'text-slate-500 border-slate-300 bg-slate-100' : 'text-amber-700 border-amber-300')}`} value={formContrato.status_vigencia} onChange={e => setFormContrato({...formContrato, status_vigencia: e.target.value})}>
                     <option value="Ativo">Ativo (Rodando)</option>
                     <option value="Suspenso">Suspenso</option>
                     <option value="Encerrado">Encerrado / Liquidado</option>
                   </select>
                </div>
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
                    <span className={`text-xl sm:text-2xl font-black block ${saveGerado >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatMoney(saveGerado)}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${saveGerado >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {saveGerado >= 0 ? 'Saldo Positivo' : 'Déficit'}
                    </span>
                  </div>
                </div>
              )}

              <button type="submit" className={`w-full text-white p-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 ${isEditingContrato ? 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30'}`}>
                {isEditingContrato ? 'Gravar Alterações do Contrato' : 'Aprovar e Gravar Contrato'} <ArrowRight size={18}/>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-500 ${!selectedObraId ? 'opacity-30 pointer-events-none grayscale blur-[2px]' : ''}`}>
        <div className="p-4 sm:p-6 bg-slate-900 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-slate-800 rounded-lg"><Database size={20} className="text-blue-400"/></div>
            <div>
              <h3 className="font-black text-base sm:text-lg">Árvore de Contratos & Aditivos</h3>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">{Object.keys(groupedContracts).length} Grupos Encontrados</p>
            </div>
          </div>
          
          <div className="relative w-full lg:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-slate-400"/></div>
            <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-3 bg-slate-800 border-none rounded-xl text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" value={buscaContrato} onChange={(e) => setBuscaContrato(e.target.value)} />
            {buscaContrato && <button onClick={() => setBuscaContrato('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"><X size={16}/></button>}
          </div>
        </div>

        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6 w-10"></th>
                <th className="p-4 whitespace-nowrap">Cód. Contrato</th>
                <th className="p-4 whitespace-nowrap">Fornecedor</th>
                <th className="p-4 whitespace-nowrap">Linha PMG (CC)</th>
                <th className="p-4 text-right whitespace-nowrap">Teto Unificado (R$)</th>
                <th className="p-4 text-center pr-6 whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupsToRender.length === 0 ? (
                <tr><td colSpan="6" className="p-12 text-center text-slate-400"><Database size={48} className="mx-auto mb-4 opacity-20"/><p className="text-base font-bold text-slate-500">Nenhum contrato encontrado.</p></td></tr>
              ) : (
                groupsToRender.map(([baseCode, group]) => {
                  const root = group.root || group.rateios[0];
                  if (!root) return null;
                  
                  const isExpanded = expandedGroups[baseCode];
                  const hasRateios = group.rateios.length > 0;
                  const rootHasAditivos = root.aditivos_contrato && root.aditivos_contrato.length > 0;
                  const someRateioHasAditivos = group.rateios.some(r => r.aditivos_contrato && r.aditivos_contrato.length > 0);
                  const hasChildren = hasRateios || rootHasAditivos || someRateioHasAditivos;

                  return (
                    <React.Fragment key={baseCode}>
                      {/* ROOT ROW */}
                      <tr className={`transition-colors hover:bg-slate-50 ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                        <td className="p-4 pl-6 text-center">
                          {hasChildren && (
                            <button onClick={() => toggleGroup(baseCode)} className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          )}
                        </td>
                        <td className="p-4 font-black text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={root.status_vigencia === 'Encerrado' ? 'text-slate-400 line-through' : ''}>{root.codigo_contrato}</span>
                            {root.status_vigencia === 'Encerrado' && <span className="text-[8px] font-black bg-slate-800 text-white px-1.5 py-0.5 rounded">Encerrado</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800 truncate max-w-[200px]" title={root.razao_social}>{root.razao_social}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">CNPJ: {root.cnpj_fornecedor}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                            {root.centro_custo_raiz}
                          </span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <p className="font-black text-slate-900 text-base" title="Soma da Base + Aditivos + Rateios">{formatMoney(group.totalUnified)}</p>
                          {hasChildren && <p className="text-[9px] text-blue-600 font-bold uppercase mt-0.5">Teto Global Consolidado</p>}
                          {!hasChildren && <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Base: {formatMoney(root.valor_inicial)}</p>}
                        </td>
                        <td className="p-4 pr-6 text-center space-x-1.5 whitespace-nowrap">
                          <button onClick={() => handleOpenRateio(root)} className="inline-flex items-center gap-1 px-2 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors text-[9px] font-black uppercase tracking-wider" title="Ratear (Clonar) para outro Centro de Custo">
                            <CopyPlus size={12}/> Rateio
                          </button>
                          <button onClick={() => { setSelectedContratoForAditivo(root); setShowModalAditivo(true); }} className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-[9px] font-black uppercase tracking-wider" title="Lançar Aditivo">
                            <Plus size={12}/> Aditivo
                          </button>
                          <button onClick={() => handleEditContratoClick(root)} className="inline-flex p-1.5 rounded-lg border bg-white border-slate-200 text-slate-500 hover:bg-amber-100 hover:text-amber-700 hover:border-amber-300" title="Editar Contrato">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteContrato(root.id, root.codigo_contrato)} className="inline-flex p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition-colors" title="Excluir Contrato">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                      
                      {/* CHILD ROWS (EXPANDED) */}
                      {isExpanded && (
                        <>
                          {rootHasAditivos && root.aditivos_contrato.map(aditivo => (
                            <tr key={aditivo.id} className="bg-slate-50 border-none">
                              <td></td>
                              <td className="p-2 pl-8 text-[11px] font-black text-slate-500 flex items-center gap-2 border-l-2 border-slate-300 ml-4 whitespace-nowrap"><CornerDownRight size={14} className="text-slate-400"/> {aditivo.numero_aditivo}</td>
                              <td className="p-2 text-[11px] text-slate-500 truncate" colSpan="2">{aditivo.motivo_justificativa} (Assinatura: {formatDate(aditivo.data_assinatura)})</td>
                              <td className={`p-2 text-right text-xs font-black pr-4 whitespace-nowrap ${aditivo.valor_acrescimo >= 0 ? 'text-slate-700' : 'text-rose-600'}`}>
                                {aditivo.valor_acrescimo > 0 ? '+' : ''}{formatMoney(aditivo.valor_acrescimo)}
                              </td>
                              <td></td>
                            </tr>
                          ))}

                          {hasRateios && group.rateios.map(r => (
                            <React.Fragment key={r.id}>
                              <tr className="bg-indigo-50/30 border-t border-slate-100/50">
                                <td></td>
                                <td className="p-3 pl-8 text-xs font-black text-indigo-900 flex items-center gap-2 border-l-2 border-indigo-300 ml-4 whitespace-nowrap"><CornerDownRight size={14} className="text-indigo-400"/> {r.codigo_contrato}</td>
                                <td className="p-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fração de Rateio</td>
                                <td className="p-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-700 whitespace-nowrap">{r.centro_custo_raiz}</span></td>
                                <td className="p-3 text-right">
                                  <p className="font-black text-indigo-900 text-sm whitespace-nowrap">{formatMoney(r.valor_inicial)}</p>
                                </td>
                                <td className="p-3 pr-6 text-center space-x-1.5 whitespace-nowrap">
                                  <button onClick={() => { setSelectedContratoForAditivo(r); setShowModalAditivo(true); }} className="inline-flex items-center gap-1 px-2 py-1 bg-white text-slate-600 border border-slate-200 rounded text-[9px] font-black uppercase hover:bg-slate-800 hover:text-white transition-colors" title="Aditivo no Rateio">
                                    <Plus size={10}/> Aditivo
                                  </button>
                                  <button onClick={() => handleEditContratoClick(r)} className="inline-flex p-1 rounded border bg-white border-slate-200 text-slate-500 hover:bg-amber-100 hover:text-amber-700" title="Editar Rateio">
                                    <Pencil size={12} />
                                  </button>
                                  <button onClick={() => handleDeleteContrato(r.id, r.codigo_contrato)} className="inline-flex p-1 bg-white border border-slate-200 rounded text-slate-400 hover:bg-rose-100 hover:text-rose-700" title="Excluir Rateio">
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                              {r.aditivos_contrato && r.aditivos_contrato.map(aditivo => (
                                <tr key={aditivo.id} className="bg-indigo-50/10 border-none">
                                  <td></td>
                                  <td className="p-2 pl-12 text-[10px] font-black text-slate-500 flex items-center gap-2 border-l-2 border-slate-200 ml-4 whitespace-nowrap"><History size={10} className="opacity-50"/> {aditivo.numero_aditivo}</td>
                                  <td className="p-2 text-[10px] text-slate-500 truncate" colSpan="2">{aditivo.motivo_justificativa}</td>
                                  <td className={`p-2 text-right text-xs font-black pr-4 whitespace-nowrap ${aditivo.valor_acrescimo >= 0 ? 'text-slate-700' : 'text-rose-600'}`}>
                                    {aditivo.valor_acrescimo > 0 ? '+' : ''}{formatMoney(aditivo.valor_acrescimo)}
                                  </td>
                                  <td></td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. ABA 2: ENGENHARIA E OPERAÇÕES
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
  
  // ESTADOS DO PEDIDO
  const [formPedido, setFormPedido] = useState({ id: null, codigo_pedido: '', cnpj_terceiro: '', razao_social_terceiro: '', valor_total_aprovado: '' });
  const [isEditingPedido, setIsEditingPedido] = useState(false);

  // ESTADOS DA MEDIÇÃO (ATUALIZADO COM NOVAS COLUNAS)
  const initialMedicaoState = { id: null, codigo_medicao: '', data_lancamento: '', valor_bruto_medido: '', desconto_fundo_canteiro: '', descontos_diversos: '', caucao: '', retencao: '', descontos_fd: '', adiantamento_sinal: '' };
  const [formMedicao, setFormMedicao] = useState(initialMedicaoState);
  const [isEditingMedicao, setIsEditingMedicao] = useState(false);

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { if (selectedObraId) loadContratos(); else { setContratos([]); setSelectedContratoId(''); } }, [selectedObraId]);
  useEffect(() => { if (selectedContratoId) { loadPedidos(); loadMedicoes(); } else { setPedidos([]); setMedicoes([]); } }, [selectedContratoId]);

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras() { const { data } = await supabase.from('obras').select('*').eq('empresa_id', selectedEmpresaId).order('nome_obra'); setObras(data || []); }
  async function loadContratos() { const { data } = await supabase.from('contratos').select('*').eq('obra_id', selectedObraId).order('codigo_contrato'); setContratos(data || []); }
  async function loadPedidos() { const { data } = await supabase.from('pedidos_compra').select('*').eq('contrato_id', selectedContratoId).order('created_at', { ascending: false }); setPedidos(data || []); }
  async function loadMedicoes() { const { data } = await supabase.from('medicoes').select('*').eq('contrato_id', selectedContratoId).order('created_at', { ascending: false }); setMedicoes(data || []); }

  // CRUD PEDIDOS
  const handleAddOrUpdatePedido = async (e) => {
    e.preventDefault();
    const payload = { contrato_id: selectedContratoId, codigo_pedido: formPedido.codigo_pedido, cnpj_terceiro: formPedido.cnpj_terceiro, razao_social_terceiro: formPedido.razao_social_terceiro, valor_total_aprovado: parseCurrency(formPedido.valor_total_aprovado) };
    if (isEditingPedido) {
      const { error } = await supabase.from('pedidos_compra').update(payload).eq('id', formPedido.id);
      if (error) alert('Erro: ' + error.message); else { setFormPedido({ id: null, codigo_pedido: '', cnpj_terceiro: '', razao_social_terceiro: '', valor_total_aprovado: '' }); setIsEditingPedido(false); loadPedidos(); }
    } else {
      const { error } = await supabase.from('pedidos_compra').insert([payload]);
      if (error) alert('Erro: ' + error.message); else { setFormPedido({ id: null, codigo_pedido: '', cnpj_terceiro: '', razao_social_terceiro: '', valor_total_aprovado: '' }); loadPedidos(); }
    }
  };

  const handleEditPedidoClick = (p) => {
    setFormPedido({ id: p.id, codigo_pedido: p.codigo_pedido, cnpj_terceiro: p.cnpj_terceiro || '', razao_social_terceiro: p.razao_social_terceiro, valor_total_aprovado: formatToCurrencyString(p.valor_total_aprovado) });
    setIsEditingPedido(true);
  };

  const handleDeletePedido = async (id) => {
    if (!window.confirm("Atenção: Deseja apagar este Pedido de Compra?\n\nSe o pedido já possuir notas fiscais atreladas na Alfândega, o sistema impedirá a exclusão.")) return;
    const { error } = await supabase.from('pedidos_compra').delete().eq('id', id);
    if (error) alert("BLOQUEIO DE SEGURANÇA:\nNão é possível excluir pois já existem documentos fiscais vinculados a este pedido na Alfândega.");
    else loadPedidos();
  };

  // CRUD MEDIÇÕES
  const handleAddOrUpdateMedicao = async (e) => {
    e.preventDefault();
    const payload = { 
        contrato_id: selectedContratoId, 
        codigo_medicao: formMedicao.codigo_medicao, 
        data_lancamento: formMedicao.data_lancamento, 
        valor_bruto_medido: parseCurrency(formMedicao.valor_bruto_medido), 
        desconto_fundo_canteiro: parseCurrency(formMedicao.desconto_fundo_canteiro), 
        descontos_diversos: parseCurrency(formMedicao.descontos_diversos),
        caucao: parseCurrency(formMedicao.caucao),
        retencao: parseCurrency(formMedicao.retencao),
        descontos_fd: parseCurrency(formMedicao.descontos_fd),
        adiantamento_sinal: parseCurrency(formMedicao.adiantamento_sinal)
    };
    
    if (isEditingMedicao) {
      const { error } = await supabase.from('medicoes').update(payload).eq('id', formMedicao.id);
      if (error) alert('Erro: ' + error.message); else { setFormMedicao(initialMedicaoState); setIsEditingMedicao(false); loadMedicoes(); }
    } else {
      const { error } = await supabase.from('medicoes').insert([payload]);
      if (error) alert('Erro: ' + error.message); else { setFormMedicao(initialMedicaoState); loadMedicoes(); }
    }
  };

  const handleEditMedicaoClick = (m) => {
    setFormMedicao({ 
        id: m.id, codigo_medicao: m.codigo_medicao, data_lancamento: m.data_lancamento, 
        valor_bruto_medido: formatToCurrencyString(m.valor_bruto_medido), 
        desconto_fundo_canteiro: formatToCurrencyString(m.desconto_fundo_canteiro), 
        descontos_diversos: formatToCurrencyString(m.descontos_diversos),
        caucao: formatToCurrencyString(m.caucao),
        retencao: formatToCurrencyString(m.retencao),
        descontos_fd: formatToCurrencyString(m.descontos_fd),
        adiantamento_sinal: formatToCurrencyString(m.adiantamento_sinal)
    });
    setIsEditingMedicao(true);
  };

  const handleDeleteMedicao = async (id) => {
    if (!window.confirm("Atenção: Deseja apagar este Boletim de Medição?\n\nSe a medição já possuir notas fiscais atreladas na Alfândega, o sistema impedirá a exclusão.")) return;
    const { error } = await supabase.from('medicoes').delete().eq('id', id);
    if (error) alert("BLOQUEIO DE SEGURANÇA:\nNão é possível excluir pois já existem documentos fiscais vinculados a esta medição na Alfândega.");
    else loadMedicoes();
  };

  // Cálculo ao vivo do Líquido do Boletim de Medição
  const calcLiquidoMedicao = () => {
      const bruto = parseCurrency(formMedicao.valor_bruto_medido);
      const canteiro = parseCurrency(formMedicao.desconto_fundo_canteiro);
      const div = parseCurrency(formMedicao.descontos_diversos);
      const caucao = parseCurrency(formMedicao.caucao);
      const retencao = parseCurrency(formMedicao.retencao);
      const fd = parseCurrency(formMedicao.descontos_fd);
      const adiant = parseCurrency(formMedicao.adiantamento_sinal);
      return bruto - (canteiro + div + caucao + retencao + fd + adiant);
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-8 px-2 sm:px-0 pb-20">
      <header className="mb-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Engenharia e Aprovações</h2>
        <p className="text-sm sm:text-base text-slate-500">Registro de Avanço Físico (Medições) e Aprovação de Materiais.</p>
      </header>
      
      {/* FILTROS GLOBAIS DE INSERÇÃO */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">1. Investidor</label>
          <select className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs sm:text-sm" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}><option value="">-- Empresa --</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}</select>
        </div>
        <div className={`${!selectedEmpresaId ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">2. Obra</label>
          <select className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs sm:text-sm disabled:opacity-50" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}><option value="">-- Obra --</option>{obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra}</option>)}</select>
        </div>
        <div className={`sm:col-span-2 md:col-span-1 ${!selectedObraId ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 block">3. Contrato Alvo</label>
          <select className="w-full p-2.5 sm:p-3 bg-emerald-50 border border-emerald-200 rounded-xl font-black text-emerald-800 text-xs sm:text-sm disabled:opacity-50" value={selectedContratoId} onChange={e => setSelectedContratoId(e.target.value)}><option value="">-- Contrato --</option>{contratos.map(c => <option key={c.id} value={c.id}>{c.codigo_contrato}</option>)}</select>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 ${!selectedContratoId ? 'opacity-30 pointer-events-none blur-sm' : ''} transition-all duration-500`}>
        
        {/* MÓDULO PEDIDOS DE COMPRA */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-md border-t-4 border-t-blue-500 border-x border-b border-slate-200 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-xl text-blue-600"><ShoppingCart size={20}/></div> Pedidos de Compra</h3>
          </div>
          
          <form onSubmit={handleAddOrUpdatePedido} className="space-y-4 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 relative">
            {isEditingPedido && (
              <div className="absolute -top-3 right-4 bg-amber-400 text-amber-900 text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                Editando <button type="button" onClick={() => {setIsEditingPedido(false); setFormPedido({ id: null, codigo_pedido: '', cnpj_terceiro: '', razao_social_terceiro: '', valor_total_aprovado: '' });}}><X size={12}/></button>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                 <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Cód. Pedido</label>
                 <input required placeholder="Ex: PC-001" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" value={formPedido.codigo_pedido} onChange={e => setFormPedido({...formPedido, codigo_pedido: e.target.value})} />
              </div>
              <div>
                 <label className="text-[10px] font-black text-blue-600 uppercase ml-1 block mb-1">Valor Aprovado (R$)</label>
                 <CurrencyInput required placeholder="0,00" className="w-full p-2.5 border border-blue-200 bg-blue-50 rounded-lg text-sm font-black text-blue-900 outline-none focus:ring-2 focus:ring-blue-500" value={formPedido.valor_total_aprovado} onChange={val => setFormPedido({...formPedido, valor_total_aprovado: val})} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                 <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">CNPJ Fornecedor</label>
                 <input required placeholder="Apenas números" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formPedido.cnpj_terceiro} onChange={e => setFormPedido({...formPedido, cnpj_terceiro: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Fornecedor do Material</label>
                 <input required placeholder="Razão Social" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={formPedido.razao_social_terceiro} onChange={e => setFormPedido({...formPedido, razao_social_terceiro: e.target.value})} />
              </div>
            </div>
            
            <button type="submit" className={`w-full text-white p-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-colors shadow-lg ${isEditingPedido ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}>
              {isEditingPedido ? 'Salvar Edição' : 'Aprovar Pedido'}
            </button>
          </form>
          
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[200px]">
            {pedidos.length === 0 ? <p className="text-center text-sm font-medium text-slate-400 p-8 border-2 border-dashed rounded-xl">Nenhum pedido de material registado.</p> : 
            <div className="space-y-3">
              {pedidos.map(p => (
                <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 hover:border-blue-300 transition-colors">
                  <div>
                    <span className="text-sm font-black text-slate-800">{p.codigo_pedido}</span>
                    <p className="text-[10px] font-bold text-slate-500 truncate max-w-[200px] mt-0.5">{p.razao_social_terceiro}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Teto Aprovado</p>
                      <span className="text-base font-black text-blue-600">{formatMoney(p.valor_total_aprovado)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditPedidoClick(p)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={14}/></button>
                      <button onClick={() => handleDeletePedido(p.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        </div>

        {/* MÓDULO BOLETINS DE MEDIÇÃO (ATUALIZADO COM DEDUÇÕES E LÍQUIDO) */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-md border-t-4 border-t-emerald-500 border-x border-b border-slate-200 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-3"><div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><Ruler size={20}/></div> Boletins de Medição</h3>
          </div>

          <form onSubmit={handleAddOrUpdateMedicao} className="space-y-4 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 relative">
            {isEditingMedicao && (
              <div className="absolute -top-3 right-4 bg-amber-400 text-amber-900 text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
                Editando <button type="button" onClick={() => {setIsEditingMedicao(false); setFormMedicao(initialMedicaoState);}}><X size={12}/></button>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Cód. Medição (BM)</label><input required placeholder="Ex: BM-01" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" value={formMedicao.codigo_medicao} onChange={e => setFormMedicao({...formMedicao, codigo_medicao: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Data Lançamento</label><input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500" value={formMedicao.data_lancamento} onChange={e => setFormMedicao({...formMedicao, data_lancamento: e.target.value})} /></div>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-emerald-600 uppercase ml-1 block mb-1">Valor Bruto do Boletim (R$)</label>
              <CurrencyInput required placeholder="0,00" className="w-full p-3 border border-emerald-300 bg-emerald-50 rounded-xl text-lg font-black text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formMedicao.valor_bruto_medido} onChange={val => setFormMedicao({...formMedicao, valor_bruto_medido: val})} />
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Espelho de Deduções (Opcional)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><label className="text-[9px] font-black text-slate-500 uppercase ml-1 block mb-1">Caução</label><CurrencyInput placeholder="0,00" className="w-full p-2 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-emerald-400" value={formMedicao.caucao} onChange={val => setFormMedicao({...formMedicao, caucao: val})} /></div>
                <div><label className="text-[9px] font-black text-slate-500 uppercase ml-1 block mb-1">Desc. Canteiro</label><CurrencyInput placeholder="0,00" className="w-full p-2 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-emerald-400" value={formMedicao.desconto_fundo_canteiro} onChange={val => setFormMedicao({...formMedicao, desconto_fundo_canteiro: val})} /></div>
                <div><label className="text-[9px] font-black text-slate-500 uppercase ml-1 block mb-1">Retenção</label><CurrencyInput placeholder="0,00" className="w-full p-2 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-emerald-400" value={formMedicao.retencao} onChange={val => setFormMedicao({...formMedicao, retencao: val})} /></div>
                <div><label className="text-[9px] font-black text-slate-500 uppercase ml-1 block mb-1">Descontos FD</label><CurrencyInput placeholder="0,00" className="w-full p-2 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-emerald-400" value={formMedicao.descontos_fd} onChange={val => setFormMedicao({...formMedicao, descontos_fd: val})} /></div>
                <div><label className="text-[9px] font-black text-amber-600 uppercase ml-1 block mb-1">Amortiza. Adiant.</label><CurrencyInput placeholder="0,00" className="w-full p-2 border border-amber-200 bg-amber-50 rounded-md text-xs font-bold text-amber-900 outline-none focus:border-amber-400" value={formMedicao.adiantamento_sinal} onChange={val => setFormMedicao({...formMedicao, adiantamento_sinal: val})} /></div>
                <div><label className="text-[9px] font-black text-slate-500 uppercase ml-1 block mb-1">Desc. Diversos</label><CurrencyInput placeholder="0,00" className="w-full p-2 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-emerald-400" value={formMedicao.descontos_diversos} onChange={val => setFormMedicao({...formMedicao, descontos_diversos: val})} /></div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                 <p className="text-[10px] font-black uppercase text-slate-500">Líquido da Medição (=)</p>
                 <p className="text-lg font-black text-emerald-600">{formatMoney(calcLiquidoMedicao())}</p>
              </div>
            </div>

            <button type="submit" className={`w-full text-white p-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-colors shadow-lg ${isEditingMedicao ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'}`}>
              {isEditingMedicao ? 'Salvar Edição' : 'Aprovar Boletim'}
            </button>
          </form>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[200px]">
             {medicoes.length === 0 ? <p className="text-center text-sm font-medium text-slate-400 p-8 border-2 border-dashed rounded-xl">Nenhuma medição registada.</p> : 
             <div className="space-y-3">
               {medicoes.map(m => {
                 const mBruto = Number(m.valor_bruto_medido || 0);
                 const mLiquido = mBruto - (Number(m.caucao||0) + Number(m.desconto_fundo_canteiro||0) + Number(m.retencao||0) + Number(m.descontos_fd||0) + Number(m.adiantamento_sinal||0) + Number(m.descontos_diversos||0));
                 return (
                   <div key={m.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 hover:border-emerald-300 transition-colors">
                     <div>
                       <span className="text-sm font-black text-slate-800">{m.codigo_medicao}</span>
                       <p className="text-[10px] font-bold text-slate-500 mt-0.5">Em: {formatDate(m.data_lancamento)}</p>
                     </div>
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-3 sm:gap-6 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                       <div className="flex gap-4">
                         <div className="text-left sm:text-right">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Físico (Bruto)</p>
                           <span className="text-sm font-black text-slate-600">{formatMoney(mBruto)}</span>
                         </div>
                         <div className="text-left sm:text-right border-l border-slate-200 pl-4">
                           <p className="text-[9px] font-black text-emerald-600 uppercase mb-0.5">Líquido</p>
                           <span className="text-base font-black text-emerald-600">{formatMoney(mLiquido)}</span>
                         </div>
                       </div>
                       <div className="flex items-center gap-1 self-end sm:self-auto">
                         <button onClick={() => handleEditMedicaoClick(m)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={14}/></button>
                         <button onClick={() => handleDeleteMedicao(m.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                       </div>
                     </div>
                   </div>
                 )
               })}
             </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. ABA 3: ALFÂNDEGA E AUDITORIA DE CAIXA
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
  
  const [naturezaOp, setNaturezaOp] = useState('Serviço'); 
  const [buscaNF, setBuscaNF] = useState('');
  const [selectedNF, setSelectedNF] = useState(null); 
  
  const [isEditingNF, setIsEditingNF] = useState(false);
  const [originalNF, setOriginalNF] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null); 
  
  const [pesquisaGlobalTerm, setPesquisaGlobalTerm] = useState('');
  const [resultadoGlobal, setResultadoGlobal] = useState(null);
  const [isPesquisandoGlobal, setIsPesquisandoGlobal] = useState(false);
  
  const [formNF, setFormNF] = useState({ 
    id: null, numero_documento: '', data_emissao: '', data_vencimento: '', 
    valor_bruto: '', impostos_destacados: '', valor_retencao_tecnica: '', 
    valor_amortizado_adiantamento: '', juros_multas: '', forma_pagamento: '',
    pedido_id: '', medicao_id: '', classificacao_faturamento: 'Direto',
    tipo_documento: 'Nota Fiscal' 
  });

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { if (selectedObraId) loadContratos(); else { setContratos([]); setSelectedContratoId(''); } }, [selectedObraId]);
  useEffect(() => { if (selectedContratoId) { loadTetoFisico(); loadNotasFiscais(); } else { setPedidos([]); setMedicoes([]); setNotasFiscais([]); } }, [selectedContratoId]);

  useEffect(() => {
    if (naturezaOp === 'Pagamento de Retenção') {
        setFormNF(prev => ({...prev, tipo_documento: 'Liberação Retenção'}));
    } else if (formNF.tipo_documento === 'Liberação Retenção') {
        setFormNF(prev => ({...prev, tipo_documento: 'Nota Fiscal'}));
    }
  }, [naturezaOp]);

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras() { const { data } = await supabase.from('obras').select('*').eq('empresa_id', selectedEmpresaId).order('nome_obra'); setObras(data || []); }
  async function loadContratos() { const { data } = await supabase.from('contratos').select('*').eq('obra_id', selectedObraId).order('codigo_contrato'); setContratos(data || []); }
  async function loadTetoFisico() { 
    const { data: pData } = await supabase.from('pedidos_compra').select('*').eq('contrato_id', selectedContratoId); 
    const { data: mData } = await supabase.from('medicoes').select('*').eq('contrato_id', selectedContratoId); 
    setPedidos(pData || []); setMedicoes(mData || []); 
  }
  
  async function loadNotasFiscais() { 
    const { data } = await supabase.from('documentos_fiscais')
      .select('*, pedidos_compra(codigo_pedido), medicoes(codigo_medicao), contratos(razao_social, codigo_contrato), lotes_pagamento(codigo_lote)')
      .eq('contrato_id', selectedContratoId)
      .order('created_at', { ascending: false }); 
    setNotasFiscais(data || []); 
  }

  const handlePesquisaGlobal = async (e) => {
    e.preventDefault();
    if(!pesquisaGlobalTerm || !selectedObraId) return alert("Selecione uma Obra primeiro e digite um Nº de Nota ou CNPJ.");
    
    setIsPesquisandoGlobal(true);
    const { data } = await supabase.from('documentos_fiscais')
      .select('*, contratos!inner(obra_id, razao_social, codigo_contrato, centro_custo_raiz, cnpj_fornecedor)')
      .eq('contratos.obra_id', selectedObraId)
      .or(`numero_documento.ilike.%${pesquisaGlobalTerm}%,contratos.cnpj_fornecedor.ilike.%${pesquisaGlobalTerm}%`)
      .order('created_at', { ascending: false });
    
    setResultadoGlobal(data || []);
    setIsPesquisandoGlobal(false);
  };

  const cancelEdit = () => {
    setIsEditingNF(false); setOriginalNF(null);
    setFormNF({ id: null, numero_documento: '', data_emissao: '', data_vencimento: '', valor_bruto: '', impostos_destacados: '', valor_retencao_tecnica: '', valor_amortizado_adiantamento: '', juros_multas: '', forma_pagamento: '', pedido_id: '', medicao_id: '', classificacao_faturamento: 'Direto', tipo_documento: 'Nota Fiscal' });
  };

  const handleEditNFClick = (nf) => {
    if (nf.lote_pagamento_id) return alert("BLOQUEIO DE AUDITORIA:\nEsta nota já está atrelada a um Romaneio. Não pode ser editada.");
    if (['Cancelado', 'Substituido', 'Anulado'].includes(nf.status_documento)) return alert("BLOQUEIO:\nDocumentos invalidados não podem ser reativados via edição.");

    setNaturezaOp(nf.natureza_operacao || 'Serviço'); 
    setFormNF({
      id: nf.id, numero_documento: nf.numero_documento || '', data_emissao: nf.data_emissao || '', data_vencimento: nf.data_vencimento || '',
      valor_bruto: formatToCurrencyString(nf.valor_bruto), impostos_destacados: formatToCurrencyString(nf.impostos_destacados),
      valor_retencao_tecnica: formatToCurrencyString(nf.valor_retencao_tecnica), valor_amortizado_adiantamento: formatToCurrencyString(nf.valor_amortizado_adiantamento),
      juros_multas: formatToCurrencyString(nf.juros_multas), forma_pagamento: nf.conta_corrente || '',
      pedido_id: nf.pedido_id || '', medicao_id: nf.medicao_id || '', classificacao_faturamento: nf.classificacao_faturamento || 'Direto',
      tipo_documento: nf.tipo_documento || 'Nota Fiscal'
    });
    setOriginalNF(nf); setIsEditingNF(true); setActionMenuOpen(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAcao = async (nf, acao) => {
    if (nf.lote_pagamento_id) return alert(`BLOQUEIO DE AUDITORIA:\nEsta nota já está atrelada ao Romaneio ${nf.lotes_pagamento?.codigo_lote}.\nÉ estritamente proibido anular, cancelar ou alterar seu status.`);
    
    let msg = ''; let novoStatus = '';
    if (acao === 'ANULAR') { msg = "ANULAR POR ERRO:\nDeseja marcar este lançamento como um erro (Anulado)? Ele deixará de somar no Dashboard, mas o registro forense permanecerá."; novoStatus = 'Anulado'; }
    else if (acao === 'CANCELAR') { msg = 'Deseja Cancelar esta nota?'; novoStatus = 'Cancelado'; }
    else if (acao === 'SUBSTITUIR') { msg = 'Deseja marcar esta nota como Substituída por outra?'; novoStatus = 'Substituido'; }

    if (!window.confirm(msg)) return;
    
    const diffs = [`Status alterado para: ${novoStatus}`];
    let historicoNovo = nf.historico_edicoes ? [...nf.historico_edicoes] : [];
    historicoNovo.push({ data: new Date().toISOString(), alteracoes: diffs });

    const { error } = await supabase.from('documentos_fiscais').update({ status_documento: novoStatus, historico_edicoes: historicoNovo }).eq('id', nf.id);
    if (error) alert("Erro: " + error.message); else loadNotasFiscais();
    setActionMenuOpen(null);
  };

  const handleSubmitNF = async (e) => {
    e.preventDefault();
    
    const vBruto = parseCurrency(formNF.valor_bruto); const vImpostos = parseCurrency(formNF.impostos_destacados); const vRetencao = parseCurrency(formNF.valor_retencao_tecnica); const vAmortiza = parseCurrency(formNF.valor_amortizado_adiantamento); const vJuros = parseCurrency(formNF.juros_multas);

    const isIndependente = ['Liberação Retenção', 'Nota de Débito', 'DACTE', 'Fatura', 'Recibo Adiantamento'].includes(formNF.tipo_documento) || naturezaOp === 'Pagamento de Retenção';

    const payload = {
      contrato_id: selectedContratoId, 
      natureza_operacao: naturezaOp, 
      tipo_documento: formNF.tipo_documento,
      numero_documento: formNF.numero_documento,
      data_emissao: formNF.data_emissao, data_vencimento: formNF.data_vencimento, 
      valor_bruto: vBruto, impostos_destacados: vImpostos, valor_retencao_tecnica: vRetencao, valor_amortizado_adiantamento: vAmortiza, juros_multas: vJuros,
      conta_corrente: formNF.forma_pagamento, classificacao_faturamento: formNF.classificacao_faturamento, 
      pedido_id: (!isIndependente && naturezaOp === 'Material') ? formNF.pedido_id : null, 
      medicao_id: (!isIndependente && naturezaOp === 'Serviço') ? formNF.medicao_id : null
    };

    if (isEditingNF) {
      const diffs = [];
      if (Number(originalNF.valor_bruto) !== vBruto) diffs.push(`Bruto: de ${formatMoney(originalNF.valor_bruto)} para ${formatMoney(vBruto)}`);
      if (Number(originalNF.valor_retencao_tecnica) !== vRetencao) diffs.push(`Retenção: de ${formatMoney(originalNF.valor_retencao_tecnica)} para ${formatMoney(vRetencao)}`);
      if (originalNF.numero_documento !== formNF.numero_documento) diffs.push(`Doc: de ${originalNF.numero_documento} para ${formNF.numero_documento}`);
      if (originalNF.data_vencimento !== formNF.data_vencimento) diffs.push(`Vencimento modificado`);
      
      let historicoNovo = originalNF.historico_edicoes ? [...originalNF.historico_edicoes] : [];
      if (diffs.length > 0) {
        historicoNovo.push({ data: new Date().toISOString(), alteracoes: diffs });
        payload.historico_edicoes = historicoNovo;
      }

      const { error } = await supabase.from('documentos_fiscais').update(payload).eq('id', formNF.id);
      if (error) alert(`[BLOQUEIO DE EDIÇÃO]\n\n${error.message}`); else { cancelEdit(); loadNotasFiscais(); }
    } else {
      const { error } = await supabase.from('documentos_fiscais').insert([payload]);
      if (error) alert(`[BLOQUEIO DA ALFÂNDEGA]\n\n${error.message}`); else { alert("Sucesso!"); cancelEdit(); loadNotasFiscais(); }
    }
  };

  const notasFiltradas = notasFiscais.filter(nf => {
    if (!buscaNF) return true;
    const term = buscaNF.toLowerCase();
    return nf.numero_documento.toLowerCase().includes(term) || nf.contratos.razao_social.toLowerCase().includes(term) || (nf.tipo_documento && nf.tipo_documento.toLowerCase().includes(term));
  });

  return (
    <div className="animate-in fade-in duration-700 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-20 px-2 sm:px-0">
      
      {/* MODAL DO BUSCADOR GLOBAL */}
      {resultadoGlobal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-900 text-white shrink-0">
              <div>
                <h3 className="font-black text-base sm:text-xl flex items-center gap-2"><Globe size={20} className="text-indigo-400"/> Radar de Rateio (Global)</h3>
                <p className="text-[10px] sm:text-xs text-indigo-300 font-bold tracking-wide mt-1">Buscando por: "{pesquisaGlobalTerm}"</p>
              </div>
              <button onClick={() => setResultadoGlobal(null)} className="text-indigo-400 hover:text-white p-1.5 sm:p-2 bg-indigo-800 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 flex-1">
               {resultadoGlobal.length === 0 ? (
                 <div className="p-8 sm:p-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl">
                    Nenhum documento encontrado na base de dados desta obra com este termo.
                 </div>
               ) : (
                 <div className="space-y-4 sm:space-y-6">
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800 text-xs sm:text-sm font-medium">
                      Foram encontradas <strong className="font-black">{resultadoGlobal.length} alocações</strong> que correspondem a este documento. Se houver mais de uma, trata-se de um Rateio Multicontrato.
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto max-w-full">
                       <table className="w-full text-sm text-left min-w-[700px]">
                         <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px]">
                           <tr>
                             <th className="p-4 whitespace-nowrap">Nº Doc</th>
                             <th className="p-4 whitespace-nowrap">Contrato (Centro de Custo)</th>
                             <th className="p-4 whitespace-nowrap">Fornecedor</th>
                             <th className="p-4 text-center whitespace-nowrap">Status</th>
                             <th className="p-4 text-right whitespace-nowrap">Valor Rateado (R$)</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                           {resultadoGlobal.map(rg => (
                             <tr key={rg.id} className="hover:bg-slate-50 transition-colors">
                               <td className="p-4 font-black text-slate-900">{rg.numero_documento}</td>
                               <td className="p-4">
                                  <span className="font-bold text-slate-700 whitespace-nowrap">{rg.contratos.codigo_contrato}</span>
                                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">{rg.contratos.centro_custo_raiz}</span>
                               </td>
                               <td className="p-4 text-xs font-bold text-slate-600">{rg.contratos.razao_social}</td>
                               <td className="p-4 text-center">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${rg.status_documento === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{rg.status_documento}</span>
                               </td>
                               <td className="p-4 text-right font-black text-slate-800 whitespace-nowrap">{formatMoney(rg.valor_bruto)}</td>
                             </tr>
                           ))}
                         </tbody>
                         <tfoot className="bg-indigo-900 text-white">
                           <tr>
                             <td colSpan="4" className="p-4 text-right font-black uppercase text-[10px] sm:text-xs tracking-widest text-indigo-300">Valor Bruto Físico da Nota (Soma)</td>
                             <td className="p-4 text-right font-black text-base sm:text-lg text-white whitespace-nowrap">
                                {formatMoney(resultadoGlobal.reduce((acc, curr) => acc + (curr.status_documento === 'Ativo' ? Number(curr.valor_bruto) : 0), 0))}
                             </td>
                           </tr>
                         </tfoot>
                       </table>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL RAIO-X DA NOTA FISCAL */}
      {selectedNF && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div>
                <h3 className="font-black text-base sm:text-xl flex items-center gap-2"><ScanSearch size={20} className="text-blue-400"/> Raio-X Documental</h3>
                <p className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-wide mt-1">Nota/Doc: {selectedNF.numero_documento} • {selectedNF.tipo_documento}</p>
              </div>
              <button onClick={() => setSelectedNF(null)} className="text-slate-400 hover:text-white p-1.5 sm:p-2 bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-4 sm:p-8 overflow-y-auto bg-slate-50 space-y-4 sm:space-y-6">
              
              {selectedNF.lote_pagamento_id && (
                <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 shadow-sm">
                  <FolderLock size={24} className="shrink-0 hidden sm:block" />
                  <div>
                    <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider">Documento Trancado em Romaneio</h4>
                    <p className="text-[10px] sm:text-xs font-medium mt-0.5">Esta nota foi despachada para o financeiro no lote <strong className="font-black">{selectedNF.lotes_pagamento?.codigo_lote}</strong>.</p>
                  </div>
                </div>
              )}

              <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-1">Fornecedor / Emitente</p>
                <p className="text-base sm:text-lg font-black text-slate-800 leading-tight">{selectedNF.contratos.razao_social}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">Ref. Contrato: {selectedNF.contratos.codigo_contrato}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200"><p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-1">Data Emissão</p><p className="text-sm sm:text-base font-black text-slate-700">{formatDate(selectedNF.data_emissao)}</p></div>
                <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200"><p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-1">Data Vencimento</p><p className="text-sm sm:text-base font-black text-slate-700">{formatDate(selectedNF.data_vencimento)}</p></div>
              </div>

              <div className="bg-slate-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl border border-slate-800 text-white">
                 <h4 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-3 mb-4">Memória de Cálculo (Pagar)</h4>
                 <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                   <div className="flex justify-between items-center"><span className="text-xs sm:text-sm font-bold text-slate-300">Valor Bruto</span><span className="text-sm sm:text-base font-black text-white">{formatMoney(selectedNF.valor_bruto)}</span></div>
                   {Number(selectedNF.impostos_destacados) > 0 && <div className="flex justify-between items-center"><span className="text-[10px] sm:text-sm font-medium text-slate-400">(-) Impostos</span><span className="text-[10px] sm:text-sm font-black text-rose-400">{formatMoney(selectedNF.impostos_destacados)}</span></div>}
                   {Number(selectedNF.valor_retencao_tecnica) > 0 && <div className="flex justify-between items-center"><span className="text-[10px] sm:text-sm font-medium text-slate-400">(-) Retenção Cativa</span><span className="text-[10px] sm:text-sm font-black text-rose-400">{formatMoney(selectedNF.valor_retencao_tecnica)}</span></div>}
                   {Number(selectedNF.valor_amortizado_adiantamento) > 0 && <div className="flex justify-between items-center"><span className="text-[10px] sm:text-sm font-medium text-slate-400">(-) Amortização</span><span className="text-[10px] sm:text-sm font-black text-rose-400">{formatMoney(selectedNF.valor_amortizado_adiantamento)}</span></div>}
                   {Number(selectedNF.juros_multas) > 0 && <div className="flex justify-between items-center"><span className="text-[10px] sm:text-sm font-medium text-slate-400">(+) Juros / Multas</span><span className="text-[10px] sm:text-sm font-black text-emerald-400">{formatMoney(selectedNF.juros_multas)}</span></div>}
                 </div>
                 
                 <div className="pt-3 sm:pt-4 border-t border-slate-700 flex justify-between items-center">
                   <div><p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Líquido a Pagar</p><p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-0.5">{selectedNF.conta_corrente || 'Padrão Cadastral'}</p></div>
                   {(() => {
                      let liquido = Number(selectedNF.valor_bruto) - Number(selectedNF.impostos_destacados || 0) - Number(selectedNF.valor_retencao_tecnica || 0) - Number(selectedNF.valor_amortizado_adiantamento || 0) + Number(selectedNF.juros_multas || 0);
                      if (selectedNF.natureza_operacao === 'Pagamento de Retenção') liquido = Number(selectedNF.valor_bruto) - Number(selectedNF.impostos_destacados || 0) - Number(selectedNF.valor_retencao_tecnica || 0) - Number(selectedNF.valor_amortizado_adiantamento || 0) + Number(selectedNF.juros_multas || 0);
                      return <p className="text-xl sm:text-3xl font-black text-emerald-400">{formatMoney(liquido)}</p>;
                   })()}
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-2 sm:gap-0">
                 <span className="text-[10px] sm:text-xs font-bold text-slate-400">Alocação Fiscal: <strong className="text-slate-700">{selectedNF.classificacao_faturamento}</strong></span>
                 <span className={`text-[9px] sm:text-[10px] font-black uppercase px-3 py-1 rounded-full ${['Cancelado','Anulado'].includes(selectedNF.status_documento) ? 'bg-rose-100 text-rose-800' : (selectedNF.status_documento === 'Substituido' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800')}`}>{selectedNF.status_documento} • {selectedNF.status_aprovacao}</span>
              </div>

              {/* BLOCO DE AUDITORIA */}
              {selectedNF.historico_edicoes && selectedNF.historico_edicoes.length > 0 && (
                <div className="bg-slate-100 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 mt-4">
                  <h4 className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4"><History size={14}/> Trilha de Auditoria (Edições/Status)</h4>
                  <div className="space-y-4">
                    {selectedNF.historico_edicoes.map((ed, idx) => (
                      <div key={idx} className="border-l-2 border-slate-300 pl-3 ml-2">
                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400">{formatDateTime(ed.data)}</p>
                        <ul className="mt-1 space-y-1">
                          {ed.alteracoes.map((alt, i) => <li key={i} className="text-[10px] sm:text-xs font-medium text-slate-700">• {alt}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="mb-4 sm:mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Alfândega de Faturas</h2>
          <p className="text-sm sm:text-base text-slate-500">Ponto de checagem. Nenhum fluxo de caixa passa sem lastro.</p>
        </div>
        
        {/* O BUSCADOR GLOBAL NO TOPO DA ALFÂNDEGA */}
        <form onSubmit={handlePesquisaGlobal} className="w-full lg:w-[400px] relative flex items-center">
           <input required type="text" placeholder="Buscar Nº Doc. ou CNPJ na Obra..." className="w-full pl-10 pr-20 sm:pr-24 py-2.5 sm:py-3 bg-white shadow-sm border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none" value={pesquisaGlobalTerm} onChange={e => setPesquisaGlobalTerm(e.target.value)} disabled={!selectedObraId} />
           <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none"><Search size={14} className="text-indigo-400"/></div>
           <button type="submit" disabled={!selectedObraId || isPesquisandoGlobal} className="absolute inset-y-1 right-1 bg-indigo-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 sm:px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1">
             {isPesquisandoGlobal ? '...' : 'Radar'}
           </button>
        </form>
      </header>

      {/* FILTROS GLOBAIS DE INSERÇÃO */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">1. Investidor</label>
          <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}><option value="">-- Selecionar --</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}</select>
        </div>
        <div className={`${!selectedEmpresaId ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">2. Obra</label>
          <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}><option value="">-- Selecionar --</option>{obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra}</option>)}</select>
        </div>
        <div className={`sm:col-span-2 md:col-span-1 ${!selectedObraId ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 block">3. Contrato Alvo (Lançamento)</label>
          <select className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-black text-emerald-800" value={selectedContratoId} onChange={e => setSelectedContratoId(e.target.value)}><option value="">-- Selecionar Contrato --</option>{contratos.map(c => <option key={c.id} value={c.id}>{c.codigo_contrato}</option>)}</select>
        </div>
      </div>

      <div className={`flex flex-col gap-6 sm:gap-8 ${!selectedContratoId ? 'opacity-30 pointer-events-none blur-[2px]' : ''} transition-all duration-500`}>
        
        {/* FORMULÁRIO DE ENTRADA PANORÂMICO */}
        <div className="w-full bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl border-t-4 border-t-rose-600 border-x border-b border-slate-200">
          <form onSubmit={handleSubmitNF} className="space-y-4 sm:space-y-5 h-full flex flex-col relative">
            
            {isEditingNF && (
              <div className="absolute -top-8 sm:-top-10 left-0 bg-amber-400 text-amber-900 text-[9px] sm:text-[10px] font-black uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-2 shadow-md animate-bounce z-10">
                Editando Nota <button type="button" onClick={cancelEdit} className="hover:bg-amber-500 p-1 rounded-full"><X size={14}/></button>
              </div>
            )}

            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase ml-1 block mb-2">Vínculo de Engenharia (Natureza)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {['Serviço', 'Material', 'Pagamento de Retenção'].map(tipo => (
                  <button key={tipo} type="button" disabled={isEditingNF} onClick={() => setNaturezaOp(tipo)} className={`px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-bold rounded-xl border transition-colors ${naturezaOp === tipo ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-50'}`}>
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Documento Base</label>
                {(() => {
                  const isIndependente = ['Liberação Retenção', 'Nota de Débito', 'DACTE', 'Fatura', 'Recibo Adiantamento'].includes(formNF.tipo_documento) || naturezaOp === 'Pagamento de Retenção';
                  
                  if (isIndependente) {
                    return <div className="p-2 sm:p-2.5 border border-dashed border-rose-200 bg-rose-50 text-rose-700 text-[9px] sm:text-[10px] font-black rounded-lg flex items-center justify-center uppercase tracking-wider h-[38px] sm:h-[42px]">Documento Independente</div>;
                  }
                  if (naturezaOp === 'Serviço') {
                    return <select required className="w-full p-2 sm:p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-700 outline-none" value={formNF.medicao_id} onChange={e => setFormNF({...formNF, medicao_id: e.target.value})}><option value="">Selecione a Medição</option>{medicoes.map(m => <option key={m.id} value={m.id}>{m.codigo_medicao} ({formatMoney(m.valor_bruto_medido)})</option>)}</select>;
                  }
                  if (naturezaOp === 'Material') {
                    return <select required className="w-full p-2 sm:p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-700 outline-none" value={formNF.pedido_id} onChange={e => setFormNF({...formNF, pedido_id: e.target.value})}><option value="">Selecione o Pedido</option>{pedidos.map(p => <option key={p.id} value={p.id}>{p.codigo_pedido} ({formatMoney(p.valor_total_aprovado)})</option>)}</select>;
                  }
                })()}
              </div>

              <div>
                <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Tipo de Documento</label>
                <select required className="w-full p-2 sm:p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-700 outline-none" value={formNF.tipo_documento} onChange={e => setFormNF({...formNF, tipo_documento: e.target.value})}>
                   <option value="Nota Fiscal">Nota Fiscal</option>
                   <option value="Nota de Débito">Nota de Débito</option>
                   <option value="DACTE">DACTE</option>
                   <option value="Fatura">Fatura</option>
                   <option value="Recibo Adiantamento">Recibo Adiantamento</option>
                   {naturezaOp === 'Pagamento de Retenção' && <option value="Liberação Retenção">Liberação de Retenção</option>}
                </select>
              </div>
              
              <div>
                <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Alocação Fiscal</label>
                <select required className="w-full p-2 sm:p-2.5 border border-indigo-200 bg-indigo-50 text-indigo-900 font-bold rounded-lg text-xs sm:text-sm outline-none" value={formNF.classificacao_faturamento} onChange={e => setFormNF({...formNF, classificacao_faturamento: e.target.value})}>
                   <option value="Direto">Direto (Inquilino)</option>
                   <option value="Indireto">Indireto (Const.)</option>
                </select>
              </div>

              <div><label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Data Emissão</label><input required type="date" className="w-full p-2 sm:p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-600 outline-none focus:border-rose-400" value={formNF.data_emissao} onChange={e => setFormNF({...formNF, data_emissao: e.target.value})} /></div>
              <div><label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Data Vencimento</label><input required type="date" className="w-full p-2 sm:p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-600 outline-none focus:border-rose-400" value={formNF.data_vencimento} onChange={e => setFormNF({...formNF, data_vencimento: e.target.value})} /></div>
              
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 sm:gap-4 items-end">
                <div className="lg:col-span-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Nº do Documento</label>
                    <input required placeholder="Ex: 12345" className="w-full p-2.5 sm:p-3 mb-3 sm:mb-4 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-rose-400" value={formNF.numero_documento} onChange={e => setFormNF({...formNF, numero_documento: e.target.value})} />

                    <label className="text-[9px] sm:text-[10px] font-black text-rose-600 uppercase ml-1 block mb-1">{formNF.tipo_documento === 'Liberação Retenção' ? 'Valor a Devolver' : 'Valor Bruto Total'}</label>
                    <CurrencyInput required placeholder="R$ 0,00" className="w-full p-2.5 sm:p-3 border border-rose-300 rounded-xl text-base sm:text-lg font-black text-rose-900 bg-rose-50 outline-none focus:ring-2 focus:ring-rose-500" value={formNF.valor_bruto} onChange={val => setFormNF({...formNF, valor_bruto: val})} />
                </div>
                
                <div className="lg:col-span-4 border border-slate-100 p-3 rounded-xl bg-slate-50 grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
                    <div><label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">Impostos (-)</label><CurrencyInput placeholder="0,00" className="w-full p-1.5 sm:p-2 border border-slate-300 rounded-md text-xs font-bold text-slate-700 outline-none" value={formNF.impostos_destacados} onChange={val => setFormNF({...formNF, impostos_destacados: val})} /></div>
                    <div><label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">Retenção Cativa (-)</label><CurrencyInput placeholder="0,00" className="w-full p-1.5 sm:p-2 border border-slate-300 rounded-md text-xs font-bold text-rose-700 outline-none" value={formNF.valor_retencao_tecnica} onChange={val => setFormNF({...formNF, valor_retencao_tecnica: val})} /></div>
                    <div><label className="text-[8px] sm:text-[9px] font-black text-amber-500 uppercase ml-1 block mb-1">Amortiza Adiant. (-)</label><CurrencyInput placeholder="0,00" className="w-full p-1.5 sm:p-2 border border-amber-300 bg-amber-50 rounded-md text-xs font-bold text-amber-800 outline-none" value={formNF.valor_amortizado_adiantamento} onChange={val => setFormNF({...formNF, valor_amortizado_adiantamento: val})} /></div>
                    <div><label className="text-[8px] sm:text-[9px] font-black text-emerald-600 uppercase ml-1 block mb-1">Juros (+)</label><CurrencyInput placeholder="0,00" className="w-full p-1.5 sm:p-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-bold text-emerald-800 outline-none" value={formNF.juros_multas} onChange={val => setFormNF({...formNF, juros_multas: val})} /></div>
                    <div className="col-span-2 md:col-span-1"><label className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase ml-1 block mb-1">Conta Pgto</label><input placeholder="Ex: Bradesco" className="w-full p-1.5 sm:p-2 border border-slate-300 rounded-md text-xs font-bold text-slate-700 outline-none" value={formNF.forma_pagamento} onChange={e => setFormNF({...formNF, forma_pagamento: e.target.value})} /></div>
                </div>
            </div>

            <div className="mt-2 flex justify-end">
              <button type="submit" className={`w-full md:w-auto md:px-12 text-white p-3 sm:p-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-colors flex justify-center items-center gap-2 shadow-xl ${isEditingNF ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-rose-700'}`}>
                {isEditingNF ? <><Pencil size={18}/> Gravar Edição com Auditoria</> : <><ShieldCheck size={18}/> Reter na Alfândega</>}
              </button>
            </div>
          </form>
        </div>

        {/* LADO INFERIOR: HISTÓRICO PANORÂMICO */}
        <div className="w-full bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 flex flex-col">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
             <h3 className="font-black text-slate-800 text-base sm:text-lg flex items-center gap-2"><Database size={18} className="text-blue-500"/> Histórico do Contrato Alvo</h3>
             <div className="relative w-full sm:w-72">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={14} className="text-slate-400"/></div>
               <input type="text" placeholder="Filtrar nesta lista..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" value={buscaNF} onChange={e => setBuscaNF(e.target.value)} />
             </div>
           </div>

           <div className="flex-1 space-y-2 sm:space-y-3 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
             {notasFiltradas.length === 0 ? (
               <div className="p-8 sm:p-10 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl sm:rounded-2xl">
                 Nenhum documento encontrado neste contrato.
               </div>
             ) : (
               notasFiltradas.map(nf => {
                 const isEditada = nf.historico_edicoes && nf.historico_edicoes.length > 0;
                 return (
                   <div key={nf.id} className={`p-3 sm:p-4 border rounded-xl sm:rounded-2xl flex flex-col md:flex-row md:justify-between md:items-center transition-colors hover:shadow-md gap-4 md:gap-0 ${['Cancelado', 'Anulado'].includes(nf.status_documento) ? 'bg-rose-50/30 border-rose-100 opacity-60 grayscale' : (nf.status_documento === 'Substituido' ? 'bg-blue-50/30 border-blue-100 opacity-80' : (nf.natureza_operacao === 'Pagamento de Retenção' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'))}`}>
                     <div className="flex-1 min-w-0 pr-0 md:pr-4 flex flex-col sm:flex-row sm:items-start md:items-center gap-2 sm:gap-4">
                       
                       <div className="w-full sm:w-1/3 shrink-0">
                         <div className="flex items-center flex-wrap gap-2 mb-1">
                           <span className={`font-black text-sm sm:text-base leading-none ${['Cancelado','Anulado'].includes(nf.status_documento) ? 'line-through text-slate-400' : 'text-slate-800'}`}>Doc {nf.numero_documento}</span>
                           {nf.status_documento === 'Anulado' && <span className="text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-white flex items-center gap-1"><AlertOctagon size={10}/> Anulada</span>}
                           {nf.status_documento === 'Cancelado' && <span className="text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">Cancelada</span>}
                           {nf.status_documento === 'Substituido' && <span className="text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Substituída</span>}
                           {nf.status_documento === 'Ativo' && isEditada && <span className="text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">Editada</span>}
                           {nf.status_documento === 'Ativo' && <span className={`text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${nf.status_aprovacao === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{nf.status_aprovacao}</span>}
                         </div>
                         <p className={`text-[9px] sm:text-[10px] font-bold ${nf.natureza_operacao === 'Pagamento de Retenção' ? 'text-emerald-600' : 'text-slate-400'}`}>{nf.tipo_documento} ({nf.natureza_operacao}) • {nf.classificacao_faturamento}</p>
                       </div>

                       <div className="flex-1">
                          <p className="text-[10px] sm:text-xs font-bold text-slate-600 truncate mb-0.5" title={nf.contratos.razao_social}>{nf.contratos.razao_social}</p>
                          <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Ref. Contrato: {nf.contratos.codigo_contrato}</p>
                       </div>

                       <div className="flex-1 text-left md:text-right flex sm:flex-col gap-3 sm:gap-0">
                          <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold sm:mb-0.5">Emissão: {formatDate(nf.data_emissao)}</p>
                          <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold">Vencto: {formatDate(nf.data_vencimento)}</p>
                       </div>
                     </div>
                     
                     <div className="text-right shrink-0 flex items-center justify-between md:justify-end gap-3 pt-3 border-t border-slate-200 md:border-t-0 md:pt-0">
                       <div className="text-left md:text-right mr-2">
                         <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase mb-0.5">{nf.natureza_operacao === 'Pagamento de Retenção' ? 'Devolvido' : 'Bruto'}</p>
                         <p className={`text-base sm:text-xl font-black ${['Cancelado','Anulado'].includes(nf.status_documento) ? 'text-slate-400' : (nf.natureza_operacao === 'Pagamento de Retenção' ? 'text-emerald-600' : 'text-slate-900')}`}>{formatMoney(nf.valor_bruto)}</p>
                       </div>
                       
                       <div className="flex items-center gap-1.5 sm:gap-3">
                         <button onClick={() => setSelectedNF(nf)} className="p-2 sm:p-2.5 bg-white border border-slate-200 text-slate-500 rounded-lg sm:rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm" title="Raio-X da Nota">
                           <Eye size={16} className="sm:w-4 sm:h-4"/>
                         </button>

                         {nf.status_documento === 'Ativo' && (
                           <div className="flex items-center md:flex-col gap-1 relative">
                             <button onClick={() => handleEditNFClick(nf)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Editar Nota">
                               <Pencil size={14} className="sm:w-3.5 sm:h-3.5"/>
                             </button>
                             <button onClick={() => setActionMenuOpen(actionMenuOpen === nf.id ? null : nf.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Opções de Exclusão">
                               <Trash2 size={14} className="sm:w-3.5 sm:h-3.5"/>
                             </button>
                             
                             {actionMenuOpen === nf.id && (
                               <div className="absolute right-8 top-0 md:top-8 w-48 sm:w-56 bg-white border border-slate-200 shadow-2xl rounded-xl z-20 p-2 animate-in fade-in zoom-in-95">
                                 <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Decisão Fiscal</p>
                                 <button onClick={() => handleDeleteAcao(nf, 'ANULAR')} className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2">
                                   Anular (Erro) <FileWarning size={12}/>
                                 </button>
                                 <button onClick={() => handleDeleteAcao(nf, 'CANCELAR')} className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                   Cancelar Lançamento
                                 </button>
                                 <button onClick={() => handleDeleteAcao(nf, 'SUBSTITUIR')} className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                   Substituir Nota
                                 </button>
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 );
               })
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. ABA 4: LOTES E ROMANEIOS
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

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras() { const { data } = await supabase.from('obras').select('*').eq('empresa_id', selectedEmpresaId).order('nome_obra'); setObras(data || []); }
  
  async function loadTabelas() {
    const { data: notas } = await supabase.from('documentos_fiscais')
      .select('*, contratos!inner(obra_id, razao_social, codigo_contrato, centro_custo_raiz, cnpj_fornecedor)')
      .eq('contratos.obra_id', selectedObraId)
      .eq('status_aprovacao', 'Pendente')
      .is('lote_pagamento_id', null)
      .neq('status_documento', 'Cancelado')
      .neq('status_documento', 'Substituido')
      .neq('status_documento', 'Anulado');
      
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
    
    // CÉREBRO DE FUSÃO BANCÁRIA (RATEIO)
    const groupedNFs = {};
    
    lote.documentos_fiscais.filter(nf => !['Cancelado', 'Substituido', 'Anulado'].includes(nf.status_documento)).forEach(nf => {
      const bruto = Number(nf.valor_bruto || 0); const impostos = Number(nf.impostos_destacados || 0); const retencao = Number(nf.valor_retencao_tecnica || 0); const adiantamento = Number(nf.valor_amortizado_adiantamento || 0); const juros = Number(nf.juros_multas || 0);
      let liquido = bruto - impostos - retencao - adiantamento + juros;
      if(nf.natureza_operacao === 'Pagamento de Retenção') liquido = bruto - impostos - retencao - adiantamento + juros; 

      // Usa Numero + CNPJ como chave para fundir rateios da mesma nota
      const key = `${nf.numero_documento}_${nf.contratos.cnpj_fornecedor}_${nf.tipo_documento}`;
      
      if (!groupedNFs[key]) {
         groupedNFs[key] = {
           'Nº ROMANEIO': lote.codigo_lote, 'DATA FECHAMENTO': formatDate(lote.data_geracao), 'RAZÃO SOCIAL FORNECEDOR': nf.contratos?.razao_social, 'CNPJ': nf.contratos?.cnpj_fornecedor, 'Nº DOCUMENTO': nf.numero_documento, 'TIPO DOC': nf.tipo_documento, 'NATUREZA': nf.natureza_operacao, 'CENTROS DE CUSTO (RATEIO)': [nf.contratos?.centro_custo_raiz], 'EMISSÃO': formatDate(nf.data_emissao), 'VENCIMENTO': formatDate(nf.data_vencimento), 'VALOR BRUTO/RETIDO (R$)': bruto, 'VALOR DE IMPOSTOS': impostos, 'VALOR DE RETENÇÃO': retencao, 'DESCONTO ADIANTAMENTO/SINAL': adiantamento, 'VALOR DE JUROS E MULTAS': juros, 'LÍQUIDO A PAGAR (TED/PIX)': liquido, 'CONTA CORRENTE': nf.conta_corrente || '' 
         };
      } else {
         // Funde os valores se a nota existir mais de uma vez (Rateio)
         groupedNFs[key]['VALOR BRUTO/RETIDO (R$)'] += bruto;
         groupedNFs[key]['VALOR DE IMPOSTOS'] += impostos;
         groupedNFs[key]['VALOR DE RETENÇÃO'] += retencao;
         groupedNFs[key]['DESCONTO ADIANTAMENTO/SINAL'] += adiantamento;
         groupedNFs[key]['VALOR DE JUROS E MULTAS'] += juros;
         groupedNFs[key]['LÍQUIDO A PAGAR (TED/PIX)'] += liquido;
         if (!groupedNFs[key]['CENTROS DE CUSTO (RATEIO)'].includes(nf.contratos?.centro_custo_raiz)) {
             groupedNFs[key]['CENTROS DE CUSTO (RATEIO)'].push(nf.contratos?.centro_custo_raiz);
         }
      }
    });

    const dadosExcel = Object.values(groupedNFs).map(row => ({
       ...row,
       'CENTROS DE CUSTO (RATEIO)': row['CENTROS DE CUSTO (RATEIO)'].join(' + ') // Transforma Array em String bonita
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosExcel); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Romaneio Bancário"); XLSX.writeFile(workbook, `${lote.codigo_lote}_Exportacao_Financeiro.xlsx`);
  };

  const valorTotalSelecionado = notasPendentes.filter(n => selecionadas.includes(n.id)).reduce((acc, n) => acc + Number(n.valor_bruto), 0);

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-8 px-2 sm:px-0">
      <header><h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3"><FolderLock className="text-blue-600" size={28} /> Lotes & Romaneios</h2></header>
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <select className="flex-1 p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs sm:text-sm" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}><option value="">1. Empresa Investidora</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}</select>
        <select disabled={!selectedEmpresaId} className="flex-1 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-xl font-black text-blue-800 text-xs sm:text-sm disabled:opacity-50" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}><option value="">2. Obra (Alvo do Fechamento)</option>{obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra}</option>)}</select>
      </div>
      <div className={`transition-all duration-500 ${!selectedObraId ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
           <div className="p-4 sm:p-6 bg-slate-900 text-white flex justify-between items-center"><h3 className="font-black text-base sm:text-lg flex items-center gap-2"><CheckSquare size={18}/> Notas Pendentes</h3></div>
           <div className="overflow-x-auto max-w-full">
             <table className="w-full text-sm text-left min-w-[600px]">
               <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase text-[9px] sm:text-[10px]"><tr><th className="p-3 sm:p-4 w-10 sm:w-12">SEL</th><th className="p-3 sm:p-4">Fornecedor</th><th className="p-3 sm:p-4">Documento</th><th className="p-3 sm:p-4 text-right">Valor Bruto / Devolvido (R$)</th></tr></thead>
               <tbody className="divide-y divide-slate-100">{notasPendentes.map(n => (<tr key={n.id} onClick={() => toggleNota(n.id)} className={`cursor-pointer ${selecionadas.includes(n.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}><td className="p-3 sm:p-4"><input type="checkbox" checked={selecionadas.includes(n.id)} readOnly className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"/></td><td className="p-3 sm:p-4 font-black text-xs sm:text-sm">{n.contratos.razao_social}</td><td className="p-3 sm:p-4 text-xs sm:text-sm">Doc {n.numero_documento} <span className="block text-[8px] sm:text-[9px] text-slate-400">{n.tipo_documento} ({n.natureza_operacao})</span></td><td className="p-3 sm:p-4 text-right font-black text-sm sm:text-base">{formatMoney(n.valor_bruto)}</td></tr>))}</tbody>
             </table>
           </div>
           <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
              <div className="text-center sm:text-left"><p className="text-[10px] sm:text-xs font-black uppercase text-slate-400">Soma</p><p className="text-2xl sm:text-3xl font-black text-blue-600">{formatMoney(valorTotalSelecionado)}</p></div>
              <button onClick={handleGerarLote} disabled={selecionadas.length===0} className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-xs sm:text-sm font-black uppercase ${selecionadas.length > 0 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Fechar Lote</button>
           </div>
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-base sm:text-lg mb-4 sm:mb-6 flex items-center gap-2"><FileSpreadsheet className="text-emerald-600"/> Histórico</h3>
          <div className="grid grid-cols-1 gap-4">
            {lotesFechados.map(lote => {
               const somaLote = lote.documentos_fiscais.filter(nf => !['Cancelado', 'Substituido', 'Anulado'].includes(nf.status_documento)).reduce((acc, n) => acc + Number(n.valor_bruto), 0);
               return (
                 <div key={lote.id} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                   <div>
                     <h4 className="text-lg sm:text-xl font-black text-slate-900">{lote.codigo_lote}</h4>
                     <p className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">{formatMoney(somaLote)}</p>
                   </div>
                   <button onClick={() => handleExportarExcel(lote)} className="w-full sm:w-auto flex justify-center items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-xs sm:text-sm font-black uppercase transition-colors">
                     <Download size={18} /> Baixar Padrão LYON
                   </button>
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
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768); 

  // VERIFICAÇÃO DE AUTENTICAÇÃO (O GUARDA-COSTAS)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // VERIFICAÇÃO DE CONEXÃO E RESPONSIVIDADE
  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('empresas').select('id').limit(1);
        if (!error) setIsConnected(true);
      } catch (err) { console.warn("Status: Aguardando Banco (Offline)"); }
    }
    checkConnection();

    const handleResize = () => {
      if (window.innerWidth <= 768) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // SE NÃO HOUVER SESSÃO, O SISTEMA É BLOQUEADO E EXIBE O LOGIN
  if (!session) {
    return <LoginScreen />;
  }

  // SE HOUVER SESSÃO, O COFRE ESTÁ ABERTO
  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      {/* OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR RESPONSIVA */}
      <aside className={`fixed md:relative top-0 left-0 h-full bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50 shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-64 sm:w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'}`}>
        <div className="h-16 sm:h-20 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/50 overflow-hidden shrink-0">
          <div className={`flex items-center gap-3 whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'md:opacity-0 md:hidden'}`}>
            <ShieldCheck className="text-emerald-500 shrink-0" size={28} />
            <div>
              <h1 className="text-xl font-black text-white tracking-wide leading-none uppercase">Crivo<span className="text-emerald-500 lowercase">.app</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Gerenciadora PMG</p>
            </div>
          </div>
          
          {!isSidebarOpen && <ShieldCheck className="text-emerald-500 mx-auto shrink-0 hidden md:block" size={24} />}
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
        </div>
        
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:flex absolute top-6 -right-3 bg-slate-800 border border-slate-700 text-white p-1.5 rounded-full hover:bg-emerald-500 hover:border-emerald-400 transition-colors z-50 shadow-lg" title={isSidebarOpen ? "Recolher Menu" : "Expandir Menu"}>
          <Menu size={14} />
        </button>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 overflow-x-hidden custom-scrollbar">
          {isSidebarOpen && <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-4 whitespace-nowrap">Visão Executiva</p>}
          <MenuButton isExpanded={isSidebarOpen} id="dashboard" icon={<LineChart size={18} className="shrink-0"/>} label="Dashboard PMG" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); if(window.innerWidth <= 768) setIsSidebarOpen(false);}} />
          
          {isSidebarOpen && <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-8 whitespace-nowrap">Estrutura</p>}
          <MenuButton isExpanded={isSidebarOpen} id="contratos" icon={<Building2 size={18} className="shrink-0"/>} label="EAP & Contratos" active={activeTab === 'contratos'} onClick={() => {setActiveTab('contratos'); if(window.innerWidth <= 768) setIsSidebarOpen(false);}} />
          
          {isSidebarOpen && <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-8 whitespace-nowrap">Operação de Campo</p>}
          <MenuButton isExpanded={isSidebarOpen} id="engenharia" icon={<HardHat size={18} className="shrink-0"/>} label="Engenharia (Medições)" active={activeTab === 'engenharia'} onClick={() => {setActiveTab('engenharia'); if(window.innerWidth <= 768) setIsSidebarOpen(false);}} />
          <MenuButton isExpanded={isSidebarOpen} id="alfandega" icon={<ShieldCheck size={18} className="shrink-0"/>} label="Alfândega (NFs)" active={activeTab === 'alfandega'} onClick={() => {setActiveTab('alfandega'); if(window.innerWidth <= 768) setIsSidebarOpen(false);}} />
          
          {isSidebarOpen && <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-8 whitespace-nowrap">Fechamento</p>}
          <MenuButton isExpanded={isSidebarOpen} id="lotes" icon={<FolderLock size={18} className="shrink-0"/>} label="Lotes de Pagamento" active={activeTab === 'lotes'} onClick={() => {setActiveTab('lotes'); if(window.innerWidth <= 768) setIsSidebarOpen(false);}} />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/30 overflow-hidden shrink-0">
          <div className={`flex items-center gap-3 px-3 py-3 ${isSidebarOpen ? 'justify-start' : 'justify-center'} rounded-2xl bg-slate-800/50 border border-slate-700/50 transition-all`}>
            <div className="relative flex h-2 w-2 shrink-0">
              {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </div>
            {isSidebarOpen && (
              <div className="text-[10px] uppercase font-black tracking-tighter whitespace-nowrap">
                <p className={isConnected ? 'text-emerald-400' : 'text-slate-400'}>{isConnected ? 'Motor Online & Blindado' : 'Aguardando Banco'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col relative overflow-hidden w-full">
        {/* HEADER RESPONSIVO */}
        <header className="h-16 sm:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-10 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 bg-slate-50 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest"><Database size={14} className="hidden sm:block"/> Base de Dados / AMS Automações</div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black text-slate-500 hover:text-rose-600 transition-colors uppercase tracking-widest"><LogOut size={14} /> <span className="hidden sm:inline">Logout</span></button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 bg-slate-50/50 custom-scrollbar">
          {activeTab === 'dashboard' && <AbaDashboard />}
          {activeTab === 'contratos' && <AbaContratos />}
          {activeTab === 'engenharia' && <AbaEngenharia />}
          {activeTab === 'alfandega' && <AbaAlfandega />}
          {activeTab === 'lotes' && <AbaLotes />}
        </div>
      </main>
    </div>
  );
}

function MenuButton({ active, icon, label, onClick, isExpanded }) {
  return (
    <button 
      onClick={onClick} 
      title={label}
      className={`w-full flex items-center gap-3 px-4 ${isExpanded ? 'justify-start' : 'justify-center'} py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all duration-300 ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:bg-slate-800 hover:text-white border border-transparent'}`}
    >
      {icon} 
      {isExpanded && <span className="whitespace-nowrap overflow-hidden text-left">{label}</span>}
    </button>
  );
}
