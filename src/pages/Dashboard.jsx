import React, { useState, useEffect } from 'react';
import { 
  Building2, HardHat, PieChart, ScanSearch, X, Layers, Wallet, 
  FolderLock, Database, TrendingUp, TrendingDown, Activity, 
  DollarSign, ListTree, Users, ChevronDown, ChevronRight, CornerDownRight 
} from 'lucide-react';

// ============================================================================
// ⚠️ INSTRUÇÕES PARA O GITHUB (SEU AMBIENTE LOCAL):
// Descomente as linhas abaixo no seu projeto local e apague a seção de Mock.
import { supabase } from '../lib/supabase';
import { formatMoney, formatDate, getBaseCode, getAllBaseCodes, findBaseCode } from '../utils/formatters';
// ============================================================================


export default function Dashboard() {
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

      let qtdNFsAmortizadas = 0; let qtdNFsRetidas = 0; let qtdNFsDevolvidas = 0;
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

      let globalCapex = 0; let globalContratado = 0; let globalIncorrido = 0; let globalSaldoAdiantamentoTotal = 0; let globalSaldoRetencaoTotal = 0;
      let globalTetoBase = 0; let globalAditivos = 0; let globalTotalRetido = 0; let globalTotalDevolvido = 0; let globalAdiantamentoConcedido = 0; let globalTotalAmortizado = 0;

      const linhasMatematicas = orcData.map(orc => {
        const capex = Number(orc.valor_aprovado_teto); globalCapex += capex;
        const contratosDaLinha = (contData || []).filter(c => c.orcamento_pmg_id === orc.id).map(c => {
           const aditivosVal = c.aditivos_contrato?.reduce((acc, a) => acc + Number(a.valor_acrescimo), 0) || 0;
           const tetoAtualizado = Number(c.valor_inicial) + aditivosVal;
           const agg = nfAggByContract[c.id] || { fatDireto: 0, fatIndireto: 0, totalIncorrido: 0, retidoTotal: 0, retencaoDevolvida: 0, amortizadoAcumulado: 0, nfServico: 0, nfMaterial: 0, nfDebito: 0, nfDacte: 0, nfFatura: 0, nfAdiantamento: 0 };
           const totalMedido = medAggByContract[c.id] || 0;
           
           const adiantamentoContrato = Number(c.valor_adiantamento_concedido) || 0;
           const adiantamentoTotal = Math.max(adiantamentoContrato, agg.nfAdiantamento);
           const saldoAdiantamento = adiantamentoTotal - agg.amortizadoAcumulado;
           const saldoRetencao = agg.retidoTotal - agg.retencaoDevolvida;

           globalSaldoAdiantamentoTotal += saldoAdiantamento; globalSaldoRetencaoTotal += saldoRetencao; globalTetoBase += Number(c.valor_inicial); globalAditivos += aditivosVal; globalTotalRetido += agg.retidoTotal; globalTotalDevolvido += agg.retencaoDevolvida; globalAdiantamentoConcedido += adiantamentoTotal; globalTotalAmortizado += agg.amortizadoAcumulado;

           return { ...c, tetoAtualizado, ...agg, totalMedido, adiantamentoTotal, saldoAdiantamento, saldoRetencao };
        });
        const contratadoLinha = contratosDaLinha.reduce((acc, c) => acc + c.tetoAtualizado, 0); globalContratado += contratadoLinha;
        const incorridoLinha = contratosDaLinha.reduce((acc, c) => acc + c.totalIncorrido, 0); globalIncorrido += incorridoLinha;
        const saveEap = capex - contratadoLinha; const percComprometido = capex > 0 ? (contratadoLinha / capex) * 100 : 0;
        return { ...orc, capex, contratadoLinha, saveEap, incorridoLinha, percComprometido, contratosDetalhes: contratosDaLinha };
      });

      const contratosAgg = {}; const allCodes = getAllBaseCodes(contData || []);

      (contData || []).forEach(c => {
         const baseCode = findBaseCode(c.codigo_contrato, allCodes);
         if (!contratosAgg[baseCode]) {
             contratosAgg[baseCode] = { baseCode, fornecedor: c.razao_social, cnpj: c.cnpj_fornecedor, status_vigencia: c.status_vigencia, tetoGlobal: 0, fatDiretoGlobal: 0, fatIndiretoGlobal: 0, totalIncorridoGlobal: 0, retidoGlobal: 0, devolvidoGlobal: 0, saldoRetencaoGlobal: 0, adiantamentoConcedidoGlobal: 0, amortizadoGlobal: 0, saldoAdiantamentoGlobal: 0, totalMedidoGlobal: 0, nfServicoGlobal: 0, nfMaterialGlobal: 0, nfDebitoGlobal: 0, nfDacteGlobal: 0, nfFaturaGlobal: 0, nfAdiantamentoGlobal: 0, faccoes: [] };
         }
         const aditivosVal = c.aditivos_contrato?.reduce((acc, a) => acc + Number(a.valor_acrescimo), 0) || 0; const tetoAtualizado = Number(c.valor_inicial) + aditivosVal; const agg = nfAggByContract[c.id] || { fatDireto: 0, fatIndireto: 0, totalIncorrido: 0, retidoTotal: 0, retencaoDevolvida: 0, amortizadoAcumulado: 0, nfServico: 0, nfMaterial: 0, nfDebito: 0, nfDacte: 0, nfFatura: 0, nfAdiantamento: 0 }; const totalMedido = medAggByContract[c.id] || 0;
         const adiantamentoContrato = Number(c.valor_adiantamento_concedido) || 0; const adiantamentoReal = Math.max(adiantamentoContrato, agg.nfAdiantamento); const saldoAdiantamento = adiantamentoReal - agg.amortizadoAcumulado; const saldoRetencao = agg.retidoTotal - agg.retencaoDevolvida;

         contratosAgg[baseCode].tetoGlobal += tetoAtualizado; contratosAgg[baseCode].totalIncorridoGlobal += agg.totalIncorrido; contratosAgg[baseCode].fatDiretoGlobal += agg.fatDireto; contratosAgg[baseCode].fatIndiretoGlobal += agg.fatIndireto; contratosAgg[baseCode].retidoGlobal += agg.retidoTotal; contratosAgg[baseCode].devolvidoGlobal += agg.retencaoDevolvida; contratosAgg[baseCode].saldoRetencaoGlobal += saldoRetencao; contratosAgg[baseCode].adiantamentoConcedidoGlobal += adiantamentoReal; contratosAgg[baseCode].amortizadoGlobal += agg.amortizadoAcumulado; contratosAgg[baseCode].saldoAdiantamentoGlobal += saldoAdiantamento; contratosAgg[baseCode].totalMedidoGlobal += totalMedido; contratosAgg[baseCode].nfServicoGlobal += agg.nfServico; contratosAgg[baseCode].nfMaterialGlobal += agg.nfMaterial; contratosAgg[baseCode].nfDebitoGlobal += agg.nfDebito; contratosAgg[baseCode].nfDacteGlobal += agg.nfDacte; contratosAgg[baseCode].nfFaturaGlobal += agg.nfFatura; contratosAgg[baseCode].nfAdiantamentoGlobal += agg.nfAdiantamento;
         const orcamentoCorrespondente = orcData.find(o => o.id === c.orcamento_pmg_id);
         contratosAgg[baseCode].faccoes.push({ ...c, tetoAtualizado, ...agg, totalMedido, codigo_centro_custo: orcamentoCorrespondente?.codigo_centro_custo || 'N/A', descricao_centro_custo: orcamentoCorrespondente?.descricao_servico || 'N/A', adiantamentoTotal: adiantamentoReal, saldoAdiantamento, saldoRetencao });
      });

      const globalSave = globalCapex - globalContratado;
      let qtdContratosComAdiant = 0;
      (contData || []).forEach(c => {
         const agg = nfAggByContract[c.id] || { nfAdiantamento: 0 }; const adiantContrato = Number(c.valor_adiantamento_concedido) || 0;
         if (Math.max(adiantContrato, agg.nfAdiantamento) > 0) qtdContratosComAdiant++;
      });

      setDashboardData({ 
        orcamentos: linhasMatematicas, contratosConsolidados: Object.values(contratosAgg), 
        kpis: { globalCapex, globalContratado, globalSave, globalIncorrido, globalSaldoAdiantamentoTotal, globalSaldoRetencaoTotal, globalTetoBase, globalAditivos, globalTotalRetido, globalTotalDevolvido, globalAdiantamentoConcedido, globalTotalAmortizado, qtdContratosAtivos: (contData || []).length, qtdAditivosLancados: (contData || []).reduce((acc, c) => acc + (c.aditivos_contrato?.length || 0), 0), qtdNFsAmortizadas, qtdNFsRetidas, qtdNFsDevolvidas, qtdContratosComAdiant } 
      });
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const toggleCC = (id) => setExpandedCCs(p => ({...p, [id]: !p[id]})); 
  const toggleContrato = (bc) => setExpandedContratos(p => ({...p, [bc]: !p[bc]})); 
  const term = buscaDashboard.toLowerCase();
  
  const orcamentosFiltrados = dashboardData.orcamentos.filter(orc => {
    if (!term) return true;
    const matchCC = orc.codigo_centro_custo.toLowerCase().includes(term) || orc.descricao_servico.toLowerCase().includes(term);
    const matchContract = orc.contratosDetalhes.some(c => c.codigo_contrato.toLowerCase().includes(term) || c.razao_social.toLowerCase().includes(term) || (c.cnpj_fornecedor && c.cnpj_fornecedor.includes(term)));
    if (matchContract && !expandedCCs[orc.id] && term.length > 2) setTimeout(() => setExpandedCCs(p => ({...p, [orc.id]: true})), 10);
    return matchCC || matchContract;
  });

  const consolidadosFiltrados = dashboardData.contratosConsolidados.filter(c => {
    if (!term) return true;
    const matchBase = c.baseCode.toLowerCase().includes(term) || c.fornecedor.toLowerCase().includes(term) || (c.cnpj && c.cnpj.includes(term));
    const matchPMGFacao = c.faccoes.some(f => f.codigo_centro_custo.toLowerCase().includes(term));
    if (matchPMGFacao && !expandedContratos[c.baseCode] && term.length > 2) setTimeout(() => setExpandedContratos(p => ({...p, [c.baseCode]: true})), 10);
    return matchBase || matchPMGFacao;
  });

  const openXRay = (e, item, isAgrupado = false) => { e.stopPropagation(); setXrayData({ item, isAgrupado }); };

  return (
    <div className="animate-in fade-in duration-700 w-full max-w-7xl mx-auto space-y-6 pb-20 px-2 sm:px-0">
      <header className="mb-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Painel Executivo PMG</h2>
        <p className="text-sm sm:text-base text-slate-500">Controle de Capex, Comprometimento e Execução Financeira em tempo real.</p>
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
