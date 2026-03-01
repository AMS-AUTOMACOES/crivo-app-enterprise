import React, { useState, useEffect } from 'react';
import { 
  Building2, HardHat, FileText, Plus, Pencil, Trash2, X, 
  Search, CheckSquare, AlertOctagon, ScanSearch, Eye, FileWarning, Wallet, FolderLock 
} from 'lucide-react';

// ============================================================================
// ⚠️ INSTRUÇÕES PARA O GITHUB (SEU AMBIENTE LOCAL):
// DESCOMENTE AS DUAS LINHAS ABAIXO NO SEU PROJETO LOCAL E APAGUE A SEÇÃO DE MOCK.
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
// ============================================================================

// ============================================================================
// UTILITÁRIOS LOCAIS E MÁSCARAS
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
  return <input type="text" value={value || ''} onChange={handleChange} placeholder={placeholder || "0,00"} className={className} required={required} disabled={disabled} />;
}

// ============================================================================
// COMPONENTE PRINCIPAL (Extraído intacto do App original)
// ============================================================================
export default function Alfandega() {
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [medicoes, setMedicoes] = useState([]);
  const [notas, setNotas] = useState([]);
  
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [selectedObraId, setSelectedObraId] = useState('');

  const [buscaAba, setBuscaAba] = useState('');
  
  const [showModalNota, setShowModalNota] = useState(false);
  const [isEditingNota, setIsEditingNota] = useState(false);
  
  const initialNotaState = {
    id: null, contrato_id: '', pedido_compra_id: '', medicao_id: '', numero_documento: '',
    data_emissao: '', data_vencimento: '', valor_bruto: '', impostos_destacados: '', valor_retencao_tecnica: '',
    valor_amortizado_adiantamento: '', juros_multas: '', tipo_documento: 'Nota Fiscal',
    natureza_operacao: 'Serviço', classificacao_faturamento: 'Direto', conta_corrente: '', status_documento: 'Pendente'
  };
  const [formNota, setFormNota] = useState(initialNotaState);

  const [xrayNota, setXrayNota] = useState(null);

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { 
    if (selectedObraId) { loadContratos(); loadNotas(); } 
    else { setContratos([]); setNotas([]); setPedidos([]); setMedicoes([]); } 
  }, [selectedObraId]);

  // Carrega Pedidos e Medições dinamicamente quando um Contrato é selecionado no Form
  useEffect(() => {
    if (formNota.contrato_id) {
      loadPedidos(formNota.contrato_id);
      loadMedicoes(formNota.contrato_id);
    } else {
      setPedidos([]); setMedicoes([]);
    }
  }, [formNota.contrato_id]);

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras() { const { data } = await supabase.from('obras').select('*').eq('empresa_id', selectedEmpresaId).order('nome_obra'); setObras(data || []); }
  async function loadContratos() { const { data } = await supabase.from('contratos').select('*').eq('obra_id', selectedObraId).order('codigo_contrato'); setContratos(data || []); }
  async function loadPedidos(cId) { const { data } = await supabase.from('pedidos_compra').select('*').eq('contrato_id', cId); setPedidos(data || []); }
  async function loadMedicoes(cId) { const { data } = await supabase.from('medicoes').select('*').eq('contrato_id', cId); setMedicoes(data || []); }
  
  async function loadNotas() { 
    const { data } = await supabase.from('documentos_fiscais')
      .select('*, contratos(codigo_contrato, razao_social, cnpj_fornecedor, centro_custo_raiz)')
      .eq('obra_id', selectedObraId)
      .order('created_at', { ascending: false }); 
    setNotas(data || []); 
  }

  const handleOpenNewNota = () => { setFormNota(initialNotaState); setIsEditingNota(false); setShowModalNota(true); };
  
  const handleEditNotaClick = (n) => {
    setFormNota({
      id: n.id, contrato_id: n.contrato_id || '', pedido_compra_id: n.pedido_compra_id || '',
      medicao_id: n.medicao_id || '', numero_documento: n.numero_documento || '',
      data_emissao: n.data_emissao || '', data_vencimento: n.data_vencimento || '',
      valor_bruto: formatToCurrencyString(n.valor_bruto), impostos_destacados: formatToCurrencyString(n.impostos_destacados),
      valor_retencao_tecnica: formatToCurrencyString(n.valor_retencao_tecnica), valor_amortizado_adiantamento: formatToCurrencyString(n.valor_amortizado_adiantamento),
      juros_multas: formatToCurrencyString(n.juros_multas), tipo_documento: n.tipo_documento || 'Nota Fiscal',
      natureza_operacao: n.natureza_operacao || 'Serviço', classificacao_faturamento: n.classificacao_faturamento || 'Direto',
      conta_corrente: n.conta_corrente || '', status_documento: n.status_documento || 'Pendente'
    });
    setIsEditingNota(true); setShowModalNota(true);
  };

  const handleAddOrUpdateNota = async (e) => {
    e.preventDefault();
    if (!formNota.contrato_id) return alert("Selecione um contrato.");
    
    // Regras de Bloqueio Físico/Financeiro
    const cSelected = contratos.find(c => c.id === formNota.contrato_id);
    const valBruto = parseCurrency(formNota.valor_bruto);
    const valRetido = parseCurrency(formNota.valor_retencao_tecnica);
    const valAmortizado = parseCurrency(formNota.valor_amortizado_adiantamento);

    if (formNota.tipo_documento === 'Recibo Adiantamento') {
      const { data: nfs } = await supabase.from('documentos_fiscais').select('valor_bruto, status_documento').eq('contrato_id', cSelected.id).eq('tipo_documento', 'Recibo Adiantamento');
      let totalAdiantRecebido = 0;
      nfs?.filter(n => n.id !== formNota.id && !['Cancelado','Substituido','Anulado'].includes(n.status_documento)).forEach(n => totalAdiantRecebido += Number(n.valor_bruto));
      const adiantPermitido = Number(cSelected.valor_adiantamento_concedido) || 0;
      if (adiantPermitido > 0 && (totalAdiantRecebido + valBruto) > adiantPermitido) {
         return alert(`BLOQUEIO DE AUDITORIA:\n\nEste Recibo excede o Teto de Adiantamento do Contrato.\nTeto Aprovado: ${formatMoney(adiantPermitido)}\nJá Lançado: ${formatMoney(totalAdiantRecebido)}`);
      }
    }

    if (formNota.tipo_documento === 'Liberação Retenção' || formNota.natureza_operacao === 'Pagamento de Retenção') {
       const { data: nfs } = await supabase.from('documentos_fiscais').select('valor_retencao_tecnica, valor_bruto, tipo_documento, natureza_operacao, status_documento').eq('contrato_id', cSelected.id);
       let totalRetido = 0; let totalDevolvido = 0;
       nfs?.filter(n => n.id !== formNota.id && !['Cancelado','Substituido','Anulado'].includes(n.status_documento)).forEach(n => {
           if (n.tipo_documento === 'Liberação Retenção' || n.natureza_operacao === 'Pagamento de Retenção') totalDevolvido += Number(n.valor_bruto);
           else totalRetido += Number(n.valor_retencao_tecnica || 0);
       });
       if ((totalDevolvido + valBruto) > totalRetido) {
           return alert(`BLOQUEIO DE AUDITORIA:\n\nO valor desta Liberação de Retenção é MAIOR que o Saldo Cativo disponível do Fornecedor.\nRetido Histórico: ${formatMoney(totalRetido)}\nJá Devolvido: ${formatMoney(totalDevolvido)}\nTentativa de Liberação: ${formatMoney(valBruto)}`);
       }
    }

    if (valAmortizado > 0 && formNota.tipo_documento !== 'Recibo Adiantamento') {
       const { data: nfs } = await supabase.from('documentos_fiscais').select('valor_amortizado_adiantamento, tipo_documento, valor_bruto, status_documento').eq('contrato_id', cSelected.id);
       let totalAdiantRecebido = 0; let totalJaAmortizado = 0;
       nfs?.filter(n => n.id !== formNota.id && !['Cancelado','Substituido','Anulado'].includes(n.status_documento)).forEach(n => {
           if (n.tipo_documento === 'Recibo Adiantamento') totalAdiantRecebido += Number(n.valor_bruto);
           else totalJaAmortizado += Number(n.valor_amortizado_adiantamento || 0);
       });
       const adiantContrato = Number(cSelected.valor_adiantamento_concedido) || 0;
       const tetoRealAdiantamento = Math.max(adiantContrato, totalAdiantRecebido);
       if ((totalJaAmortizado + valAmortizado) > tetoRealAdiantamento) {
           return alert(`BLOQUEIO DE AUDITORIA:\n\nVocê está tentando amortizar um valor superior ao Saldo de Adiantamento existente.\nAdiantamento Total: ${formatMoney(tetoRealAdiantamento)}\nJá Amortizado em outras NFs: ${formatMoney(totalJaAmortizado)}\nTentativa: ${formatMoney(valAmortizado)}`);
       }
    }

    const payload = {
      obra_id: selectedObraId, contrato_id: formNota.contrato_id,
      pedido_compra_id: formNota.pedido_compra_id || null, medicao_id: formNota.medicao_id || null,
      numero_documento: formNota.numero_documento, data_emissao: formNota.data_emissao, data_vencimento: formNota.data_vencimento,
      valor_bruto: valBruto, impostos_destacados: parseCurrency(formNota.impostos_destacados),
      valor_retencao_tecnica: valRetido, valor_amortizado_adiantamento: valAmortizado,
      juros_multas: parseCurrency(formNota.juros_multas), tipo_documento: formNota.tipo_documento,
      natureza_operacao: formNota.natureza_operacao, classificacao_faturamento: formNota.classificacao_faturamento,
      conta_corrente: formNota.conta_corrente, status_documento: formNota.status_documento
    };

    if (isEditingNota) {
      const { error } = await supabase.from('documentos_fiscais').update(payload).eq('id', formNota.id);
      if (error) alert('Erro: ' + error.message); else { setShowModalNota(false); loadNotas(); }
    } else {
      const { error } = await supabase.from('documentos_fiscais').insert([payload]);
      if (error) alert('Erro: ' + error.message); else { setShowModalNota(false); loadNotas(); }
    }
  };

  const handleDeleteNota = async (id) => {
    if (!window.confirm("Deseja apagar este Documento Fiscal? (Ele sumirá da tela de Lotes também)")) return;
    const { error } = await supabase.from('documentos_fiscais').delete().eq('id', id);
    if (error) alert("Erro: " + error.message); else loadNotas();
  };

  const calcLiquidoDocumento = (nf) => {
    const bruto = parseCurrency(nf.valor_bruto);
    const impostos = parseCurrency(nf.impostos_destacados);
    const retencao = parseCurrency(nf.valor_retencao_tecnica);
    const amortizado = parseCurrency(nf.valor_amortizado_adiantamento);
    const juros = parseCurrency(nf.juros_multas);
    return bruto - impostos - retencao - amortizado + juros;
  };

  const notasFiltradas = notas.filter(n => {
    const term = buscaAba.toLowerCase();
    return !term || 
      n.numero_documento?.toLowerCase().includes(term) ||
      n.contratos?.razao_social?.toLowerCase().includes(term) ||
      n.contratos?.codigo_contrato?.toLowerCase().includes(term);
  });

  return (
    <Layout>
      <div className="animate-in fade-in duration-700 w-full max-w-7xl mx-auto space-y-6 pb-20 px-2 sm:px-0">
        
        {/* MODAL DE RAIO-X (AUDITORIA VISUAL DA NF) */}
        {xrayNota && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                   <div>
                     <h3 className="font-black flex items-center gap-2 text-lg"><ScanSearch size={20} className="text-emerald-400"/> Raio-X do Documento</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Doc: {xrayNota.numero_documento} | Tipo: {xrayNota.tipo_documento}</p>
                   </div>
                   <button onClick={() => setXrayNota(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X size={18}/></button>
                </div>
                <div className="p-6 bg-slate-50">
                   <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Fornecedor</p><p className="font-bold text-slate-800 truncate">{xrayNota.contratos?.razao_social}</p><p className="text-[10px] text-slate-500 font-mono mt-1">{xrayNota.contratos?.cnpj_fornecedor}</p></div>
                     <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Contrato Alvo</p><p className="font-bold text-blue-700">{xrayNota.contratos?.codigo_contrato}</p><p className="text-[10px] text-slate-500 font-mono mt-1">CC: {xrayNota.contratos?.centro_custo_raiz}</p></div>
                   </div>
                   <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                     <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><FileText size={16}/> Composição a Pagar</h4>
                     <div className="space-y-3">
                       <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-600">Valor Bruto Declarado</span><span className="text-sm font-black text-slate-900">{formatMoney(xrayNota.valor_bruto)}</span></div>
                       <div className="flex justify-between items-center text-rose-600"><span className="text-sm font-bold opacity-80">Impostos Destacados (-)</span><span className="text-sm font-black">{formatMoney(xrayNota.impostos_destacados)}</span></div>
                       <div className="flex justify-between items-center text-rose-600"><span className="text-sm font-bold opacity-80">Retenção Técnica Cativa (-)</span><span className="text-sm font-black">{formatMoney(xrayNota.valor_retencao_tecnica)}</span></div>
                       <div className="flex justify-between items-center text-rose-600"><span className="text-sm font-bold opacity-80">Amortização de Adiantamento (-)</span><span className="text-sm font-black">{formatMoney(xrayNota.valor_amortizado_adiantamento)}</span></div>
                       {Number(xrayNota.juros_multas) > 0 && <div className="flex justify-between items-center text-amber-600"><span className="text-sm font-bold opacity-80">Juros / Multas / Acréscimos (+)</span><span className="text-sm font-black">{formatMoney(xrayNota.juros_multas)}</span></div>}
                     </div>
                     <div className="mt-4 pt-4 border-t-2 border-slate-100 flex justify-between items-center">
                       <span className="text-xs font-black uppercase text-emerald-700">Líquido a Pagar (=)</span>
                       <span className="text-2xl font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100 shadow-inner">{formatMoney(calcLiquidoDocumento(xrayNota))}</span>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* MODAL DE LANÇAMENTO / EDIÇÃO DE NF */}
        {showModalNota && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[98vh] sm:max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                  {isEditingNota ? <Pencil size={18} className="text-amber-500"/> : <Plus size={18} className="text-emerald-500"/>}
                  {isEditingNota ? 'Editar Lançamento Fiscal' : 'Triagem de Nova Nota Fiscal'}
                </h3>
                <button onClick={() => setShowModalNota(false)} className="text-slate-400 hover:text-rose-500 p-1"><X size={20}/></button>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 space-y-6">
                <form id="nfForm" onSubmit={handleAddOrUpdateNota} className="space-y-6">
                  
                  {/* Bloco 1: Vínculo Obrigatório */}
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FolderLock size={14}/> 1. Vínculo do Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-1">Contrato Mãe (Obrigatório)</label>
                        <select required className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formNota.contrato_id} onChange={e => setFormNota({...formNota, contrato_id: e.target.value})}>
                          <option value="">-- Selecione o Contrato --</option>
                          {contratos.map(c => <option key={c.id} value={c.id}>{c.codigo_contrato} - {c.razao_social}</option>)}
                        </select>
                      </div>
                      <div className={!formNota.contrato_id ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-1">Pedido de Compra (Opcional)</label>
                        <select className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" value={formNota.pedido_compra_id} onChange={e => setFormNota({...formNota, pedido_compra_id: e.target.value})}>
                          <option value="">-- Sem Pedido Vinculado --</option>
                          {pedidos.map(p => <option key={p.id} value={p.id}>{p.codigo_pedido}</option>)}
                        </select>
                      </div>
                      <div className={!formNota.contrato_id ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-1">Medição Física (Opcional)</label>
                        <select className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" value={formNota.medicao_id} onChange={e => setFormNota({...formNota, medicao_id: e.target.value})}>
                          <option value="">-- Sem Boletim Vinculado --</option>
                          {medicoes.map(m => <option key={m.id} value={m.id}>{m.codigo_medicao}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Dados do Documento */}
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText size={14}/> 2. Espelho do Documento</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="col-span-2 md:col-span-1"><label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-1">Nº Nota / Recibo</label><input required placeholder="Ex: 12345" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={formNota.numero_documento} onChange={e => setFormNota({...formNota, numero_documento: e.target.value})} /></div>
                      <div className="col-span-2 md:col-span-1"><label className="text-[10px] font-black text-blue-600 uppercase ml-1 block mb-1">Valor Bruto (R$)</label><CurrencyInput required className="w-full p-2.5 border border-blue-300 bg-blue-50 rounded-lg text-sm font-black text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none" value={formNota.valor_bruto} onChange={val => setFormNota({...formNota, valor_bruto: val})} /></div>
                      <div><label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-1">Data Emissão</label><input required type="date" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formNota.data_emissao} onChange={e => setFormNota({...formNota, data_emissao: e.target.value})} /></div>
                      <div><label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-1">Data Vencimento</label><input required type="date" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold text-rose-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formNota.data_vencimento} onChange={e => setFormNota({...formNota, data_vencimento: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-1">Tipo de Documento</label>
                        <select className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold outline-none" value={formNota.tipo_documento} onChange={e => setFormNota({...formNota, tipo_documento: e.target.value})}>
                          <option>Nota Fiscal</option><option>Fatura</option><option>Recibo Adiantamento</option><option>Liberação Retenção</option><option>Nota de Débito</option><option>DACTE</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-1">Natureza da Operação</label>
                        <select className="w-full p-2.5 border border-slate-300 rounded-lg text-xs outline-none" value={formNota.natureza_operacao} onChange={e => setFormNota({...formNota, natureza_operacao: e.target.value})}>
                          <option>Serviço</option><option>Material</option><option>Equipamento</option><option>Frete</option><option>Pagamento de Retenção</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-1">Classificação Contábil</label>
                        <select className="w-full p-2.5 border border-slate-300 rounded-lg text-xs outline-none" value={formNota.classificacao_faturamento} onChange={e => setFormNota({...formNota, classificacao_faturamento: e.target.value})}>
                          <option>Direto</option><option>Indireto</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 3: Deduções */}
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Wallet size={14}/> 3. Retenções e Amortizações Matemáticas</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div><label className="text-[9px] font-black text-slate-500 uppercase ml-1 block mb-1">Impostos NF (-)</label><CurrencyInput className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none" value={formNota.impostos_destacados} onChange={val => setFormNota({...formNota, impostos_destacados: val})} /></div>
                      <div><label className="text-[9px] font-black text-rose-600 uppercase ml-1 block mb-1">Retenção Cativa (-)</label><CurrencyInput className="w-full p-2.5 border border-rose-200 bg-rose-50 rounded-lg text-xs font-bold text-rose-800 outline-none" value={formNota.valor_retencao_tecnica} onChange={val => setFormNota({...formNota, valor_retencao_tecnica: val})} /></div>
                      <div><label className="text-[9px] font-black text-amber-600 uppercase ml-1 block mb-1">Amort. Adiantamento (-)</label><CurrencyInput className="w-full p-2.5 border border-amber-200 bg-amber-50 rounded-lg text-xs font-bold text-amber-800 outline-none" value={formNota.valor_amortizado_adiantamento} onChange={val => setFormNota({...formNota, valor_amortizado_adiantamento: val})} /></div>
                      <div><label className="text-[9px] font-black text-slate-500 uppercase ml-1 block mb-1">Juros / Acréscimos (+)</label><CurrencyInput className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none" value={formNota.juros_multas} onChange={val => setFormNota({...formNota, juros_multas: val})} /></div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <p className="text-[10px] font-black uppercase text-emerald-800">Líquido Calculado para Pagamento (=)</p>
                      <p className="text-xl font-black text-emerald-600">{formatMoney(calcLiquidoDocumento(formNota))}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                       <label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-1">Conta Bancária / Chave PIX</label>
                       <input placeholder="Padrão Cadastral..." className="w-full p-2.5 border border-slate-300 rounded-lg text-xs outline-none" value={formNota.conta_corrente} onChange={e => setFormNota({...formNota, conta_corrente: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-1">Status na Fila (Workflow)</label>
                       <select className={`w-full p-2.5 border rounded-lg text-xs font-bold outline-none ${formNota.status_documento === 'Pendente' ? 'border-amber-300 bg-amber-50 text-amber-800' : (formNota.status_documento === 'Aprovado Lote' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-slate-50 text-slate-600')}`} value={formNota.status_documento} onChange={e => setFormNota({...formNota, status_documento: e.target.value})}>
                         <option value="Pendente">Pendente (Em Análise)</option>
                         <option value="Aprovado Lote">Aprovado (Pronto para Lote)</option>
                         <option value="Cancelado">Cancelado / Rejeitado</option>
                       </select>
                     </div>
                  </div>
                </form>
              </div>
              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <button type="submit" form="nfForm" className={`w-full text-white p-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${isEditingNota ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/30'}`}>
                  {isEditingNota ? 'Atualizar Documento' : 'Salvar Documento Fiscal'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CABEÇALHO DA PÁGINA */}
        <header className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Alfândega Fisc/Fin</h2>
          <p className="text-sm sm:text-base text-slate-500">Recepção de NFs, dedução de adiantamentos e retenção de impostos.</p>
        </header>

        {/* FILTROS GLOBAIS DE VISUALIZAÇÃO */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Building2 size={12}/> Empresa</label>
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none" value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}><option value="">Selecione...</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.razao_social}</option>)}</select>
          </div>
          <div className={`flex-1 ${!selectedEmpresaId ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><HardHat size={12}/> Obra</label>
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)}><option value="">Selecione...</option>{obras.map(o => <option key={o.id} value={o.id}>{o.codigo_obra}</option>)}</select>
          </div>
        </div>

        {/* ÁREA PRINCIPAL DA TABELA */}
        <div className={`bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden transition-all duration-500 ${!selectedObraId ? 'opacity-30 pointer-events-none grayscale blur-[2px]' : ''}`}>
          
          {/* TOPO DA TABELA (Busca e Botão Novo) */}
          <div className="p-4 sm:p-6 bg-slate-900 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 rounded-xl"><FileText size={24} className="text-emerald-400"/></div>
                <div>
                  <h3 className="font-black text-white text-lg">Caixa de Entrada (Fila)</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{notasFiltradas.length} Documentos em processamento</p>
                </div>
             </div>
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-slate-400"/></div>
                  <input type="text" placeholder="Buscar por fornecedor, NF ou contrato..." className="w-full pl-10 pr-4 py-3 bg-slate-800 border-none rounded-xl text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none" value={buscaAba} onChange={e => setBuscaAba(e.target.value)} />
                  {buscaAba && <button onClick={() => setBuscaAba('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"><X size={16}/></button>}
                </div>
                <button onClick={handleOpenNewNota} className="flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap">
                   <Plus size={16}/> Triagem Manual
                </button>
             </div>
          </div>

          {/* TABELA DE NOTAS */}
          <div className="overflow-x-auto max-w-full min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[1200px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 pl-6">Nº Doc / Tipo</th>
                  <th className="p-4">Fornecedor / CC</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4 text-right">Valor Bruto</th>
                  <th className="p-4 text-right">Amort. / Ret.</th>
                  <th className="p-4 text-right text-emerald-700">Líquido a Pagar</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center pr-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notasFiltradas.length === 0 ? (
                   <tr><td colSpan="8" className="p-16 text-center text-slate-400"><CheckSquare size={48} className="mx-auto mb-4 opacity-20"/><p className="text-base font-bold text-slate-500">Caixa de entrada limpa.</p></td></tr>
                ) : (
                  notasFiltradas.map(n => {
                    const liquido = calcLiquidoDocumento(n);
                    let statusColor = 'bg-slate-100 text-slate-600';
                    if (n.status_documento === 'Pendente') statusColor = 'bg-amber-100 text-amber-700 border-amber-200';
                    if (n.status_documento === 'Aprovado Lote') statusColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                    if (n.status_documento === 'Cancelado') statusColor = 'bg-rose-100 text-rose-700 border-rose-200 line-through';

                    return (
                      <tr key={n.id} className={`hover:bg-slate-50 transition-colors group ${n.status_documento === 'Cancelado' ? 'opacity-50' : ''}`}>
                        <td className="p-4 pl-6">
                           <p className="font-black text-slate-900 text-sm">{n.numero_documento}</p>
                           <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{n.tipo_documento}</p>
                        </td>
                        <td className="p-4">
                           <p className="font-bold text-slate-700 truncate max-w-[200px]" title={n.contratos?.razao_social}>{n.contratos?.razao_social}</p>
                           <p className="text-[9px] text-slate-400 font-mono mt-0.5">Ref: {n.contratos?.codigo_contrato} | CC: {n.contratos?.centro_custo_raiz}</p>
                        </td>
                        <td className="p-4">
                           <p className={`font-bold text-sm ${new Date(n.data_vencimento) < new Date() && n.status_documento !== 'Aprovado Lote' && n.status_documento !== 'Cancelado' ? 'text-rose-600' : 'text-slate-700'}`}>{formatDate(n.data_vencimento)}</p>
                           <p className="text-[9px] text-slate-400 uppercase mt-0.5">Emissão: {formatDate(n.data_emissao)}</p>
                        </td>
                        <td className="p-4 text-right font-black text-slate-800">{formatMoney(n.valor_bruto)}</td>
                        <td className="p-4 text-right">
                           <p className="text-[10px] text-amber-600 font-bold" title="Adiantamento Amortizado">Ad: {formatMoney(n.valor_amortizado_adiantamento)}</p>
                           <p className="text-[10px] text-rose-600 font-bold" title="Retenção Cativa">Rt: {formatMoney(n.valor_retencao_tecnica)}</p>
                        </td>
                        <td className="p-4 text-right">
                           <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 font-black text-sm">{formatMoney(liquido)}</span>
                        </td>
                        <td className="p-4 text-center">
                           <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${statusColor}`}>{n.status_documento}</span>
                        </td>
                        <td className="p-4 pr-6 text-center space-x-1.5">
                           <button onClick={() => setXrayNota(n)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm" title="Raio-X">
                             <Eye size={14}/>
                           </button>
                           <button onClick={() => handleEditNotaClick(n)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors shadow-sm" title="Editar">
                             <Pencil size={14}/>
                           </button>
                           <button onClick={() => handleDeleteNota(n.id)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-sm" title="Excluir">
                             <Trash2 size={14}/>
                           </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}
