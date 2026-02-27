import React, { useState, useEffect } from 'react';

// ============================================================================
// ⚠️ INSTRUÇÃO PARA O GITHUB: DESCOMENTE AS 2 LINHAS ABAIXO E APAGUE OS MOCKS ⚠️
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
// ============================================================================

import { 
  Building2, HardHat, ShieldCheck, FolderLock, LineChart, LogOut,
  Plus, ArrowRight, Database, ShoppingCart, Ruler, FileText,
  AlertOctagon, CheckSquare, Download, FileSpreadsheet, Pencil, X, ListTree, Search, Menu, History, Trash2, CopyPlus,
  ChevronRight, ChevronDown, CornerDownRight, PieChart, TrendingUp, TrendingDown, DollarSign, Activity, Wallet, Percent
} from 'lucide-react';

// ============================================================================
// 1. CONEXÃO COM O MOTOR (SUPABASE) - PRODUÇÃO PURA
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

// ============================================================================
// 1. ABA DASHBOARD (A VISÃO DE ÁGUIA PMG E MATRIZ EM ÁRVORE)
// ============================================================================
function AbaDashboard() {
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [selectedObraId, setSelectedObraId] = useState('');
  
  const [dashboardData, setDashboardData] = useState({ orcamentos: [], kpis: null });
  const [loading, setLoading] = useState(false);
  
  // Controles de UX do Dashboard
  const [buscaDashboard, setBuscaDashboard] = useState('');
  const [expandedCCs, setExpandedCCs] = useState({}); // Controla quais nós da EAP estão abertos

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(selectedEmpresaId); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { if (selectedObraId) buildDashboard(selectedObraId); else setDashboardData({ orcamentos: [], kpis: null }); }, [selectedObraId]);

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras(empId) { const { data } = await supabase.from('obras').select('*').eq('empresa_id', empId).order('nome_obra'); setObras(data || []); }

  async function buildDashboard(obrId) {
    setLoading(true);
    try {
      // 1. Buscar EAP (Orçamento Base)
      const { data: orcData } = await supabase.from('orcamento_pmg').select('*').eq('obra_id', obrId).order('codigo_centro_custo');
      
      // 2. Buscar Contratos e Aditivos
      const { data: contData } = await supabase.from('contratos').select('*, aditivos_contrato(valor_acrescimo)').eq('obra_id', obrId);
      
      // 3. Buscar NFs com as colunas de Retenção e Faturamento Direto/Indireto
      const { data: nfData } = await supabase.from('documentos_fiscais')
        .select('valor_bruto, valor_retencao_tecnica, valor_amortizado_adiantamento, classificacao_faturamento, contratos!inner(id, obra_id, orcamento_pmg_id)')
        .eq('contratos.obra_id', obrId);

      if (!orcData) return;

      // Agregação de Notas por Contrato (Para exibir o detalhe por contrato na árvore)
      const nfAggByContract = {};
      (nfData || []).forEach(nf => {
        const cId = nf.contratos.id;
        if (!nfAggByContract[cId]) {
          nfAggByContract[cId] = { fatDireto: 0, fatIndireto: 0, retencaoAcumulada: 0, amortizadoAcumulado: 0, totalIncorrido: 0 };
        }
        const v = Number(nf.valor_bruto);
        nfAggByContract[cId].totalIncorrido += v;
        nfAggByContract[cId].retencaoAcumulada += Number(nf.valor_retencao_tecnica || 0);
        nfAggByContract[cId].amortizadoAcumulado += Number(nf.valor_amortizado_adiantamento || 0);
        
        if (nf.classificacao_faturamento === 'Indireto') nfAggByContract[cId].fatIndireto += v;
        else nfAggByContract[cId].fatDireto += v; // Trata vazio ou 'Direto' como Direto
      });

      let globalCapex = 0; let globalContratado = 0; let globalIncorrido = 0;

      const linhasMatematicas = orcData.map(orc => {
        const capex = Number(orc.valor_aprovado_teto);
        globalCapex += capex;

        // Varrer contratos desta EAP
        const contratosDaLinha = (contData || []).filter(c => c.orcamento_pmg_id === orc.id).map(c => {
           // Calcular matemática individual do contrato
           const aditivosVal = c.aditivos_contrato?.reduce((acc, a) => acc + Number(a.valor_acrescimo), 0) || 0;
           const tetoAtualizado = Number(c.valor_inicial) + aditivosVal;
           const agg = nfAggByContract[c.id] || { fatDireto: 0, fatIndireto: 0, retencaoAcumulada: 0, amortizadoAcumulado: 0, totalIncorrido: 0 };
           
           const adiantamentoTotal = Number(c.valor_adiantamento_concedido) || 0;
           const saldoAdiantamento = adiantamentoTotal - agg.amortizadoAcumulado;

           return { ...c, tetoAtualizado, ...agg, adiantamentoTotal, saldoAdiantamento };
        });

        const contratadoLinha = contratosDaLinha.reduce((acc, c) => acc + c.tetoAtualizado, 0);
        globalContratado += contratadoLinha;

        const incorridoLinha = contratosDaLinha.reduce((acc, c) => acc + c.totalIncorrido, 0);
        globalIncorrido += incorridoLinha;

        const saveEap = capex - contratadoLinha;
        const percComprometido = capex > 0 ? (contratadoLinha / capex) * 100 : 0;

        return { ...orc, capex, contratadoLinha, saveEap, incorridoLinha, percComprometido, contratosDetalhes: contratosDaLinha };
      });

      const globalSave = globalCapex - globalContratado;
      
      setDashboardData({
        orcamentos: linhasMatematicas,
        kpis: { globalCapex, globalContratado, globalSave, globalIncorrido }
      });

    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const toggleCC = (id) => {
    setExpandedCCs(prev => ({...prev, [id]: !prev[id]}));
  };

  // Motor de Busca Ativo na Matriz
  const term = buscaDashboard.toLowerCase();
  const orcamentosFiltrados = dashboardData.orcamentos.filter(orc => {
    if (!term) return true;
    const matchCC = orc.codigo_centro_custo.toLowerCase().includes(term) || orc.descricao_servico.toLowerCase().includes(term);
    const matchContract = orc.contratosDetalhes.some(c => 
      c.codigo_contrato.toLowerCase().includes(term) || 
      c.razao_social.toLowerCase().includes(term) ||
      (c.cnpj_fornecedor && c.cnpj_fornecedor.includes(term))
    );
    
    // Auto-expandir se achou o contrato escondido dentro da EAP
    if (matchContract && !expandedCCs[orc.id] && term.length > 2) {
      setTimeout(() => setExpandedCCs(prev => ({...prev, [orc.id]: true})), 10);
    }
    return matchCC || matchContract;
  });

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-6 pb-20">
      <header className="mb-4">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Painel Executivo PMG</h2>
        <p className="text-slate-500">Controlo de Capex, Comprometimento e Execução Financeira em tempo real.</p>
      </header>

      {/* FILTROS GLOBAIS DE DIRETORIA */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Building2 size={14}/> Empresa Investidora</label>
          <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}>
            <option value="">-- Filtro Global: Selecionar Investidor --</option>
            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razao_social}</option>)}
          </select>
        </div>
        <div className={`${!selectedEmpresaId ? 'opacity-30 pointer-events-none' : ''} transition-opacity`}>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><HardHat size={14}/> Empreendimento (Obra)</label>
          <select className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm font-black text-blue-900 outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}>
            <option value="">-- Filtro Global: Selecionar Obra --</option>
            {obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra} - {o.nome_obra}</option>)}
          </select>
        </div>
      </div>

      {!selectedObraId ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-white/50">
          <PieChart size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-black text-slate-600 mb-2">Aguardando Parâmetros</h3>
          <p className="text-sm font-medium">Selecione uma Empresa e uma Obra no topo para carregar a matriz PMG.</p>
        </div>
      ) : loading ? (
        <div className="p-12 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
      ) : dashboardData.kpis && (
        <>
          {/* CARDS DE KPI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orçamento Capex</p>
                <Database size={16} className="text-blue-500" />
              </div>
              <h4 className="text-2xl font-black text-slate-900">{formatMoney(dashboardData.kpis.globalCapex)}</h4>
              <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase">Teto Global EAP</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comprometido</p>
                <FolderLock size={16} className="text-amber-500" />
              </div>
              <h4 className="text-2xl font-black text-slate-900">{formatMoney(dashboardData.kpis.globalContratado)}</h4>
              <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase">Soma de Contratos + Aditivos</p>
            </div>

            <div className={`p-6 rounded-2xl shadow-sm border ${dashboardData.kpis.globalSave >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex justify-between items-start mb-2">
                <p className={`text-[10px] font-black uppercase tracking-widest ${dashboardData.kpis.globalSave >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {dashboardData.kpis.globalSave >= 0 ? 'Economia (Save)' : 'Estouro Orçamental'}
                </p>
                {dashboardData.kpis.globalSave >= 0 ? <TrendingUp size={16} className="text-emerald-600" /> : <TrendingDown size={16} className="text-rose-600" />}
              </div>
              <h4 className={`text-2xl font-black ${dashboardData.kpis.globalSave >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatMoney(dashboardData.kpis.globalSave)}</h4>
              <p className={`text-[10px] mt-1 font-bold uppercase ${dashboardData.kpis.globalSave >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Base Aprovada vs. Assinada</p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 text-white relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10"><Activity size={100} /></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Incorrido (Notas)</p>
                  <DollarSign size={16} className="text-blue-400" />
                </div>
                <h4 className="text-2xl font-black">{formatMoney(dashboardData.kpis.globalIncorrido)}</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">Medido e Retido</p>
              </div>
            </div>
          </div>

          {/* MATRIZ DE EAP - LINHA A LINHA COM VISÃO EM ÁRVORE */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-black text-white flex items-center gap-2"><ListTree size={18} className="text-blue-400"/> EAP & Matriz de Contratos</h3>
              <div className="relative w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={14} className="text-slate-400"/></div>
                <input type="text" placeholder="Buscar por código, fornecedor ou CC..." className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" value={buscaDashboard} onChange={e => setBuscaDashboard(e.target.value)} />
                {buscaDashboard && <button onClick={() => setBuscaDashboard('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"><X size={14}/></button>}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100 border-b-2 border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="p-4 pl-6">Rubrica PMG (Nó Pai)</th>
                    <th className="p-4 text-right">Orçamento (Capex)</th>
                    <th className="p-4 text-right">Teto Contratado</th>
                    <th className="p-4 w-40 text-center">Consumo (%)</th>
                    <th className="p-4 text-right">Save Gerado</th>
                    <th className="p-4 text-right">Fat. Incorrido</th>
                  </tr>
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
                          {/* NÓ PAI (EAP) */}
                          <tr className={`transition-colors cursor-pointer group ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`} onClick={() => hasContracts && toggleCC(linha.id)}>
                            <td className="p-4 pl-4 flex items-center gap-2">
                              <button className={`p-1 rounded-md transition-colors ${hasContracts ? 'text-slate-600 bg-slate-200 group-hover:bg-blue-200' : 'text-transparent cursor-default'}`}>
                                {hasContracts ? (isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : <ChevronRight size={14}/>}
                              </button>
                              <div>
                                <span className="inline-block px-1.5 py-0.5 bg-slate-800 text-white rounded text-[10px] font-black mr-1.5">{linha.codigo_centro_custo}</span>
                                <span className="font-bold text-slate-800 text-xs">{linha.descricao_servico}</span>
                              </div>
                            </td>
                            <td className="p-4 text-right font-black text-slate-900">{formatMoney(linha.capex)}</td>
                            <td className="p-4 text-right font-bold text-amber-700">{formatMoney(linha.contratadoLinha)}</td>
                            
                            <td className="p-4">
                              <div className="flex items-center gap-2 justify-end">
                                <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden max-w-[80px]">
                                  <div className={`h-full rounded-full ${linha.percComprometido > 100 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{width: `${Math.min(linha.percComprometido, 100)}%`}}></div>
                                </div>
                                <span className="text-[10px] font-black text-slate-500 w-8">{linha.percComprometido.toFixed(0)}%</span>
                              </div>
                            </td>

                            <td className={`p-4 text-right font-black ${linha.saveEap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatMoney(linha.saveEap)}
                            </td>
                            <td className="p-4 text-right font-black text-blue-700">
                              {formatMoney(linha.incorridoLinha)}
                            </td>
                          </tr>

                          {/* NÓS FILHOS (CONTRATOS) EXPANDIDOS */}
                          {isExpanded && hasContracts && (
                            <tr className="bg-slate-50/80 border-none">
                              <td colSpan="6" className="p-0">
                                <div className="pl-12 pr-6 py-4 bg-gradient-to-r from-blue-50/30 to-slate-50/30 border-l-4 border-l-blue-400 shadow-inner">
                                  <table className="w-full text-left">
                                    <thead className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                      <tr>
                                        <th className="pb-2 w-1/4">Fornecedor Vinculado</th>
                                        <th className="pb-2 text-right">Teto (Base + Adt.)</th>
                                        <th className="pb-2 text-right">Adiantamento (Saldo)</th>
                                        <th className="pb-2 text-right text-emerald-600">Fat. Direto (Inquilino)</th>
                                        <th className="pb-2 text-right text-amber-600">Fat. Indireto (Construtora)</th>
                                        <th className="pb-2 text-right text-rose-600">Retenção Cativa</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/50">
                                      {linha.contratosDetalhes.map(c => (
                                        <tr key={c.id} className="hover:bg-white transition-colors">
                                          <td className="py-3">
                                            <div className="flex items-center gap-2">
                                              <CornerDownRight size={12} className="text-slate-300"/>
                                              <div>
                                                <p className="font-black text-slate-800 text-[11px]">{c.codigo_contrato}</p>
                                                <p className="text-[9px] font-bold text-slate-500 truncate max-w-[200px]" title={c.razao_social}>{c.razao_social}</p>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-3 text-right font-black text-slate-700 text-[11px]">{formatMoney(c.tetoAtualizado)}</td>
                                          <td className="py-3 text-right">
                                            {c.adiantamentoTotal > 0 ? (
                                              <>
                                                <span className="font-bold text-slate-800 text-[11px] block">{formatMoney(c.saldoAdiantamento)}</span>
                                                <span className="text-[8px] text-slate-400 block mt-0.5">CONCEDIDO: {formatMoney(c.adiantamentoTotal)}</span>
                                              </>
                                            ) : <span className="text-slate-300 text-[10px]">-</span>}
                                          </td>
                                          <td className="py-3 text-right font-black text-emerald-700 text-[11px]">{formatMoney(c.fatDireto)}</td>
                                          <td className="py-3 text-right font-black text-amber-700 text-[11px]">{formatMoney(c.fatIndireto)}</td>
                                          <td className="py-3 text-right font-black text-rose-700 text-[11px]">{formatMoney(c.retencaoAcumulada)}</td>
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
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// 2. ABA 1: GESTÃO ESTRUTURAL (ORÇAMENTO PMG + CONTRATOS + ADITIVOS)
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
  
  const initialContratoState = { id: null, orcamento_pmg_id: '', codigo_contrato: '', razao_social: '', cnpj_fornecedor: '', data_inicio: '', data_fechamento: '', valor_inicial: '', valor_adiantamento_concedido: '' };
  const [formContrato, setFormContrato] = useState(initialContratoState);
  const [isEditingContrato, setIsEditingContrato] = useState(false);
  
  // ESTADOS PARA ADITIVOS
  const [showModalAditivo, setShowModalAditivo] = useState(false);
  const [selectedContratoForAditivo, setSelectedContratoForAditivo] = useState(null);
  const [formAditivo, setFormAditivo] = useState({ numero_aditivo: '', data_assinatura: '', valor_acrescimo: '', motivo_justificativa: '' });

  // ESTADOS PARA RATEIO (NOVO CC)
  const [showModalRateio, setShowModalRateio] = useState(false);
  const [contratoBaseRateio, setContratoBaseRateio] = useState(null);
  const [formRateio, setFormRateio] = useState({ orcamento_pmg_id: '', valor_inicial: '', codigo_sugerido: '' });

  const [buscaContrato, setBuscaContrato] = useState('');
  
  // ESTADO DE ÁRVORE RECOLHÍVEL
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
  
  // ---- CRUD ORÇAMENTO PMG ----
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

  // ---- CRUD CONTRATOS ----
  const handleAddOrUpdateContrato = async (e) => {
    e.preventDefault();
    const orcSelected = orcamentos.find(o => o.id === formContrato.orcamento_pmg_id);
    if (!orcSelected) return alert("Selecione a Linha de Orçamento PMG.");

    const payload = {
      obra_id: selectedObraId, orcamento_pmg_id: formContrato.orcamento_pmg_id, codigo_contrato: formContrato.codigo_contrato,
      razao_social: formContrato.razao_social, cnpj_fornecedor: formContrato.cnpj_fornecedor, centro_custo_raiz: orcSelected.codigo_centro_custo, 
      descricao_servico: orcSelected.descricao_servico, data_inicio: formContrato.data_inicio || null, data_fechamento: formContrato.data_fechamento || null,
      valor_inicial: parseCurrency(formContrato.valor_inicial), valor_adiantamento_concedido: parseCurrency(formContrato.valor_adiantamento_concedido)
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
    setFormContrato({ id: c.id, orcamento_pmg_id: c.orcamento_pmg_id || '', codigo_contrato: c.codigo_contrato || '', razao_social: c.razao_social || '', cnpj_fornecedor: c.cnpj_fornecedor || '', data_inicio: c.data_inicio || '', data_fechamento: c.data_fechamento || '', valor_inicial: formatToCurrencyString(c.valor_inicial), valor_adiantamento_concedido: formatToCurrencyString(c.valor_adiantamento_concedido) });
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
    const baseCode = getBaseCode(c.codigo_contrato); 
    const relacionados = contratos.filter(ct => getBaseCode(ct.codigo_contrato) === baseCode);
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
      valor_adiantamento_concedido: 0
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

  // LÓGICA DE AGRUPAMENTO (ÁRVORE)
  const groupedContracts = {};
  contratos.forEach(c => {
    const baseCode = getBaseCode(c.codigo_contrato);
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
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* MODAL DE ADITIVO (OVERLAY) */}
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

      {/* MODAL DE RATEIO (CLONAR CONTRATO PARA NOVO CC) */}
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
        
        <div className="xl:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full relative">
          {isEditingOrcamento && (
             <div className="absolute -top-3 left-6 bg-amber-400 text-amber-900 text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                Editando EAP <button type="button" onClick={handleCancelEditOrcamento}><X size={12}/></button>
             </div>
          )}
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-2"><ListTree size={16} className="text-blue-600"/> 3. Linha Base PMG (EAP)</h3>
          
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
                     <p className="text-sm font-black text-blue-700">{formatMoney(orc.valor_aprovado_teto)}</p>
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
            <div className="grid grid-cols-3 gap-2">
               <div className="col-span-1"><input required placeholder="Cód (Ex: 01.01)" className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-400 outline-none" value={formOrcamento.codigo_centro_custo} onChange={e => setFormOrcamento({...formOrcamento, codigo_centro_custo: e.target.value})} /></div>
               <div className="col-span-2"><input required placeholder="Descrição (Ex: Fundação)" className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:border-blue-400 outline-none" value={formOrcamento.descricao_servico} onChange={e => setFormOrcamento({...formOrcamento, descricao_servico: e.target.value})} /></div>
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
              <div><label className="text-[10px] font-black text-slate-500 uppercase ml-1 block mb-1">Data de Fechamento</label><input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-emerald-400 outline-none" value={formContrato.data_fechamento} onChange={e => setFormContrato({...formContrato, data_fechamento: e.target.value})} /></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <label className="text-[10px] font-black text-emerald-600 uppercase ml-1 block mb-1">Valor Negociado (Base)</label>
                <CurrencyInput required className="w-full p-3 border border-emerald-300 rounded-lg text-base font-black text-emerald-900 bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={formContrato.valor_inicial} onChange={val => setFormContrato({...formContrato, valor_inicial: val})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-amber-500 uppercase ml-1 block mb-1">Adiantamento de Caixa</label>
                <CurrencyInput className="w-full p-3 border border-amber-200 rounded-lg text-base font-black text-amber-800 bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400" value={formContrato.valor_adiantamento_concedido} onChange={val => setFormContrato({...formContrato, valor_adiantamento_concedido: val})} />
              </div>
            </div>

            <div className="mt-auto">
              <div className="mb-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                 <label className="text-[11px] font-black text-blue-800 uppercase mb-2 flex items-center gap-2"><ListTree size={14}/> Vincular à Linha do PMG (Centro de Custo)</label>
                 <select required className="w-full p-3 bg-white border border-blue-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer" value={formContrato.orcamento_pmg_id} onChange={e => setFormContrato({...formContrato, orcamento_pmg_id: e.target.value})}>
                   <option value="">-- Selecione onde alocar este custo --</option>
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

              <button type="submit" className={`w-full text-white p-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 ${isEditingContrato ? 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30'}`}>
                {isEditingContrato ? 'Gravar Alterações do Contrato' : 'Aprovar e Gravar Contrato'} <ArrowRight size={18}/>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* =====================================================================
          LINHA 3: VISUALIZAÇÃO E BUSCA DE CONTRATOS E ADITIVOS (ÁRVORE)
      ===================================================================== */}
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-500 ${!selectedObraId ? 'opacity-30 pointer-events-none grayscale blur-[2px]' : ''}`}>
        <div className="p-6 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-slate-800 rounded-lg"><Database size={20} className="text-blue-400"/></div>
            <div>
              <h3 className="font-black text-lg">Árvore de Contratos & Aditivos</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{Object.keys(groupedContracts).length} Grupos Encontrados</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-slate-400"/></div>
            <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-3 bg-slate-800 border-none rounded-xl text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" value={buscaContrato} onChange={(e) => setBuscaContrato(e.target.value)} />
            {buscaContrato && <button onClick={() => setBuscaContrato('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"><X size={16}/></button>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6 w-10"></th>
                <th className="p-4">Cód. Contrato</th>
                <th className="p-4">Fornecedor</th>
                <th className="p-4">Linha PMG (CC)</th>
                <th className="p-4 text-right">Teto Unificado (R$)</th>
                <th className="p-4 text-center pr-6">Ações</th>
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
                      {/* ROOT ROW (CONTRATO PRINCIPAL) */}
                      <tr className={`transition-colors hover:bg-slate-50 ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                        <td className="p-4 pl-6 text-center">
                          {hasChildren && (
                            <button onClick={() => toggleGroup(baseCode)} className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          )}
                        </td>
                        <td className="p-4 font-black text-slate-900">{root.codigo_contrato}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800 truncate max-w-[200px]" title={root.razao_social}>{root.razao_social}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">CNPJ: {root.cnpj_fornecedor}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                            {root.centro_custo_raiz}
                          </span>
                        </td>
                        <td className="p-4 text-right">
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
                          {/* 1. Aditivos do Contrato Pai */}
                          {rootHasAditivos && root.aditivos_contrato.map(aditivo => (
                            <tr key={aditivo.id} className="bg-slate-50 border-none">
                              <td></td>
                              <td className="p-2 pl-8 text-[11px] font-black text-slate-500 flex items-center gap-2 border-l-2 border-slate-300 ml-4"><CornerDownRight size={14} className="text-slate-400"/> {aditivo.numero_aditivo}</td>
                              <td className="p-2 text-[11px] text-slate-500 truncate" colSpan="2">{aditivo.motivo_justificativa} (Assinatura: {formatDate(aditivo.data_assinatura)})</td>
                              <td className={`p-2 text-right text-xs font-black pr-4 ${aditivo.valor_acrescimo >= 0 ? 'text-slate-700' : 'text-rose-600'}`}>
                                {aditivo.valor_acrescimo > 0 ? '+' : ''}{formatMoney(aditivo.valor_acrescimo)}
                              </td>
                              <td></td>
                            </tr>
                          ))}

                          {/* 2. Rateios (Filhos) e seus respectivos Aditivos */}
                          {hasRateios && group.rateios.map(r => (
                            <React.Fragment key={r.id}>
                              <tr className="bg-indigo-50/30 border-t border-slate-100/50">
                                <td></td>
                                <td className="p-3 pl-8 text-xs font-black text-indigo-900 flex items-center gap-2 border-l-2 border-indigo-300 ml-4"><CornerDownRight size={14} className="text-indigo-400"/> {r.codigo_contrato}</td>
                                <td className="p-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fração de Rateio</td>
                                <td className="p-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-700">{r.centro_custo_raiz}</span></td>
                                <td className="p-3 text-right">
                                  <p className="font-black text-indigo-900 text-sm">{formatMoney(r.valor_inicial)}</p>
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
                              {/* Aditivos do Rateio */}
                              {r.aditivos_contrato && r.aditivos_contrato.map(aditivo => (
                                <tr key={aditivo.id} className="bg-indigo-50/10 border-none">
                                  <td></td>
                                  <td className="p-2 pl-12 text-[10px] font-black text-slate-500 flex items-center gap-2 border-l-2 border-slate-200 ml-4"><History size={10} className="opacity-50"/> {aditivo.numero_aditivo}</td>
                                  <td className="p-2 text-[10px] text-slate-500 truncate" colSpan="2">{aditivo.motivo_justificativa}</td>
                                  <td className={`p-2 text-right text-xs font-black pr-4 ${aditivo.valor_acrescimo >= 0 ? 'text-slate-700' : 'text-rose-600'}`}>
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
    const { error } = await supabase.from('pedidos_compra').insert([{ ...formPedido, contrato_id: selectedContratoId, valor_total_aprovado: parseCurrency(formPedido.valor_total_aprovado) }]);
    if (error) alert('Erro: ' + error.message); else { setFormPedido({ codigo_pedido: '', cnpj_terceiro: '', razao_social_terceiro: '', valor_total_aprovado: '' }); loadPedidos(); }
  };
  const handleAddMedicao = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('medicoes').insert([{ ...formMedicao, contrato_id: selectedContratoId, valor_bruto_medido: parseCurrency(formMedicao.valor_bruto_medido), desconto_fundo_canteiro: parseCurrency(formMedicao.desconto_fundo_canteiro), descontos_diversos: parseCurrency(formMedicao.descontos_diversos) }]);
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
            <div className="grid grid-cols-2 gap-3"><input required placeholder="Cód. (PC-001)" className="p-2.5 border border-slate-200 rounded-lg text-sm" value={formPedido.codigo_pedido} onChange={e => setFormPedido({...formPedido, codigo_pedido: e.target.value})} />
            <CurrencyInput required placeholder="Valor Aprovado (R$)" className="p-2.5 border border-slate-200 rounded-lg text-sm font-bold" value={formPedido.valor_total_aprovado} onChange={val => setFormPedido({...formPedido, valor_total_aprovado: val})} /></div>
            <input required placeholder="Fornecedor Material" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formPedido.razao_social_terceiro} onChange={e => setFormPedido({...formPedido, razao_social_terceiro: e.target.value})} />
            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl text-sm font-black hover:bg-blue-700">Aprovar Pedido</button>
          </form>
          <div className="space-y-3 max-h-60 overflow-y-auto">{pedidos.map(p => (<div key={p.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center"><span className="text-sm font-black">{p.codigo_pedido}</span><span className="text-sm font-black text-blue-600">{formatMoney(p.valor_total_aprovado)}</span></div>))}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-t-emerald-500 border-x border-b border-slate-200">
          <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><Ruler size={24}/></div><h3 className="font-black text-slate-800 text-lg">Boletins de Medição</h3></div>
          <form onSubmit={handleAddMedicao} className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="grid grid-cols-2 gap-3"><input required placeholder="Cód. (BM-01)" className="p-2.5 border border-slate-200 rounded-lg text-sm" value={formMedicao.codigo_medicao} onChange={e => setFormMedicao({...formMedicao, codigo_medicao: e.target.value})} /><input required type="date" className="p-2.5 border border-slate-200 rounded-lg text-sm" value={formMedicao.data_lancamento} onChange={e => setFormMedicao({...formMedicao, data_lancamento: e.target.value})} /></div>
            <CurrencyInput required placeholder="Valor Bruto (R$)" className="w-full p-3 border border-emerald-200 bg-emerald-50/50 rounded-lg text-sm font-black" value={formMedicao.valor_bruto_medido} onChange={val => setFormMedicao({...formMedicao, valor_bruto_medido: val})} />
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput placeholder="Desc. Canteiro (R$)" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formMedicao.desconto_fundo_canteiro} onChange={val => setFormMedicao({...formMedicao, desconto_fundo_canteiro: val})} />
              <CurrencyInput placeholder="Outros Desc. (R$)" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formMedicao.descontos_diversos} onChange={val => setFormMedicao({...formMedicao, descontos_diversos: val})} />
            </div>
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
  
  // NOVO: Adicionado campo de Faturamento Direto/Indireto no formulário
  const [formNF, setFormNF] = useState({ numero_documento: '', data_emissao: '', data_vencimento: '', valor_bruto: '', impostos_destacados: '', valor_retencao_tecnica: '', valor_amortizado_adiantamento: '', pedido_id: '', medicao_id: '', classificacao_faturamento: 'Direto' });

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
      data_emissao: formNF.data_emissao, data_vencimento: formNF.data_vencimento, 
      valor_bruto: parseCurrency(formNF.valor_bruto),
      impostos_destacados: parseCurrency(formNF.impostos_destacados),
      valor_retencao_tecnica: parseCurrency(formNF.valor_retencao_tecnica),
      valor_amortizado_adiantamento: parseCurrency(formNF.valor_amortizado_adiantamento),
      classificacao_faturamento: formNF.classificacao_faturamento, // Salva se é Direto ou Indireto no Banco
      pedido_id: tipoDocumento === 'Material' ? formNF.pedido_id : null, medicao_id: tipoDocumento === 'Serviço' ? formNF.medicao_id : null
    };
    const { error } = await supabase.from('documentos_fiscais').insert([payload]);
    if (error) alert(`[BLOQUEIO DA ALFÂNDEGA]\n\n${error.message}`); else { alert("Sucesso!"); setFormNF({ numero_documento: '', data_emissao: '', data_vencimento: '', valor_bruto: '', impostos_destacados: '', valor_retencao_tecnica: '', valor_amortizado_adiantamento: '', pedido_id: '', medicao_id: '', classificacao_faturamento: 'Direto' }); loadNotasFiscais(); }
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
            
            <div className="grid grid-cols-2 gap-3">
              {tipoDocumento === 'Serviço' && (<select required className="w-full p-2.5 border rounded-lg text-sm" value={formNF.medicao_id} onChange={e => setFormNF({...formNF, medicao_id: e.target.value})}><option value="">Selecione a Medição</option>{medicoes.map(m => <option key={m.id} value={m.id}>{m.codigo_medicao} (Teto: {formatMoney(m.valor_bruto_medido)})</option>)}</select>)}
              {tipoDocumento === 'Material' && (<select required className="w-full p-2.5 border rounded-lg text-sm" value={formNF.pedido_id} onChange={e => setFormNF({...formNF, pedido_id: e.target.value})}><option value="">Selecione o Pedido</option>{pedidos.map(p => <option key={p.id} value={p.id}>{p.codigo_pedido} (Teto: {formatMoney(p.valor_total_aprovado)})</option>)}</select>)}
              
              <select required className="w-full p-2.5 border border-indigo-200 bg-indigo-50 text-indigo-900 font-bold rounded-lg text-sm" value={formNF.classificacao_faturamento} onChange={e => setFormNF({...formNF, classificacao_faturamento: e.target.value})}>
                 <option value="Direto">Fat. Direto (Inquilino)</option>
                 <option value="Indireto">Fat. Indireto (Construtora)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Nº Fatura" className="w-full p-2.5 border rounded-lg text-sm" value={formNF.numero_documento} onChange={e => setFormNF({...formNF, numero_documento: e.target.value})} />
              <CurrencyInput required placeholder="Valor Bruto (R$)" className="w-full p-2.5 border rounded-lg text-sm font-black text-rose-900 bg-rose-50" value={formNF.valor_bruto} onChange={val => setFormNF({...formNF, valor_bruto: val})} />
            </div>
            <div className="grid grid-cols-2 gap-3"><input required type="date" className="w-full p-2.5 border rounded-lg text-sm" value={formNF.data_emissao} onChange={e => setFormNF({...formNF, data_emissao: e.target.value})} /><input required type="date" className="w-full p-2.5 border rounded-lg text-sm" value={formNF.data_vencimento} onChange={e => setFormNF({...formNF, data_vencimento: e.target.value})} /></div>
            
            <div className="border-t border-slate-100 pt-4 mt-4 grid grid-cols-3 gap-3">
              <div><label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Impostos</label><CurrencyInput placeholder="R$ 0,00" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formNF.impostos_destacados} onChange={val => setFormNF({...formNF, impostos_destacados: val})} /></div>
              <div><label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Retenção</label><CurrencyInput placeholder="R$ 0,00" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formNF.valor_retencao_tecnica} onChange={val => setFormNF({...formNF, valor_retencao_tecnica: val})} /></div>
              <div><label className="text-[9px] font-bold text-amber-600 uppercase ml-1">Amortiza?</label><CurrencyInput placeholder="R$ 0,00" className="w-full p-2.5 border border-amber-200 bg-amber-50 rounded-lg text-sm font-bold text-amber-800" value={formNF.valor_amortizado_adiantamento} onChange={val => setFormNF({...formNF, valor_amortizado_adiantamento: val})} /></div>
            </div>

            <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-xl text-sm font-black hover:bg-rose-700 mt-6 flex justify-center items-center gap-2"><ShieldCheck size={18}/> Submeter à Alfândega</button>
          </form>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2"><Database size={20} className="text-slate-400"/> Histórico de Retenção</h3>
           <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
             {notasFiscais.map(nf => (
                 <div key={nf.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                   <div>
                     <span className="font-black text-slate-800 text-lg">NF {nf.numero_documento}</span>
                     <p className="text-xs text-slate-500 font-bold">{nf.tipo_documento} • {nf.classificacao_faturamento}</p>
                   </div>
                   <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase">Valor Bruto</p><p className="text-xl font-black text-slate-900">{formatMoney(nf.valor_bruto)}</p></div>
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('empresas').select('id').limit(1);
        if (!error) setIsConnected(true);
      } catch (err) { console.warn("Status: Aguardando Banco (Offline)"); }
    }
    checkConnection();
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 shrink-0 transition-all duration-300 relative`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/50 overflow-hidden">
          {isSidebarOpen && (
            <div className="flex items-center gap-3 whitespace-nowrap animate-in fade-in">
              <ShieldCheck className="text-emerald-500 shrink-0" size={28} />
              <div>
                <h1 className="text-xl font-black text-white tracking-wide leading-none uppercase">Crivo<span className="text-emerald-500 lowercase">.app</span></h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Gerenciadora PMG</p>
              </div>
            </div>
          )}
          {!isSidebarOpen && <ShieldCheck className="text-emerald-500 mx-auto shrink-0" size={24} />}
        </div>
        
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute top-6 -right-3 bg-slate-800 border border-slate-700 text-white p-1 rounded-full hover:bg-emerald-500 hover:border-emerald-400 transition-colors z-30" title={isSidebarOpen ? "Recolher Menu" : "Expandir Menu"}>
          <Menu size={16} />
        </button>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 overflow-x-hidden">
          {isSidebarOpen && <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-4 whitespace-nowrap">Visão Executiva</p>}
          <MenuButton isOpen={isSidebarOpen} id="dashboard" icon={<LineChart size={18} className="shrink-0"/>} label="Dashboard PMG" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          
          {isSidebarOpen && <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-8 whitespace-nowrap">Estrutura</p>}
          <MenuButton isOpen={isSidebarOpen} id="contratos" icon={<Building2 size={18} className="shrink-0"/>} label="EAP & Contratos" active={activeTab === 'contratos'} onClick={() => setActiveTab('contratos')} />
          
          {isSidebarOpen && <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-8 whitespace-nowrap">Operação de Campo</p>}
          <MenuButton isOpen={isSidebarOpen} id="engenharia" icon={<HardHat size={18} className="shrink-0"/>} label="Engenharia (Medições)" active={activeTab === 'engenharia'} onClick={() => setActiveTab('engenharia')} />
          <MenuButton isOpen={isSidebarOpen} id="alfandega" icon={<ShieldCheck size={18} className="shrink-0"/>} label="Alfândega (NFs)" active={activeTab === 'alfandega'} onClick={() => setActiveTab('alfandega')} />
          
          {isSidebarOpen && <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 mt-8 whitespace-nowrap">Fechamento</p>}
          <MenuButton isOpen={isSidebarOpen} id="lotes" icon={<FolderLock size={18} className="shrink-0"/>} label="Lotes de Pagamento" active={activeTab === 'lotes'} onClick={() => setActiveTab('lotes')} />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/30 overflow-hidden">
          <div className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3 py-3' : 'justify-center py-3'} rounded-2xl bg-slate-800/50 border border-slate-700/50 transition-all`}>
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
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 z-10 shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Database size={14}/> Base de Dados / AMS Automações</div>
          <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-rose-600 transition-colors uppercase tracking-widest"><LogOut size={14} /> Logout</button>
        </header>
        <div className="flex-1 overflow-auto p-10 bg-slate-50/50">
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

function MenuButton({ active, icon, label, onClick, isOpen }) {
  return (
    <button 
      onClick={onClick} 
      title={!isOpen ? label : ''}
      className={`w-full flex items-center ${isOpen ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all duration-300 ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:bg-slate-800 hover:text-white border border-transparent'}`}
    >
      {icon} 
      {isOpen && <span className="whitespace-nowrap overflow-hidden text-left">{label}</span>}
    </button>
  );
}
