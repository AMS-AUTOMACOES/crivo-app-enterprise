import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertOctagon, Pencil, Trash2, Search, Eye, FileWarning, Globe, FolderLock, X, Database } from 'lucide-react';

// ============================================================================
// ⚠️ INSTRUÇÕES PARA O GITHUB (SEU AMBIENTE LOCAL):
// Descomente as linhas abaixo no seu projeto local e apague a seção de Mock.
import { supabase } from '../lib/supabase';
import { formatMoney, formatDate, formatDateTime, formatToCurrencyString, parseCurrency, CurrencyInput } from '../utils/formatters';
// ============================================================================

// -------------------------------------------------------------------

export default function Alfandega() {
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
