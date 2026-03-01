import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Download, AlertCircle, Building2, HardHat, FileText, Lock, 
  Search, X, Eye 
} from 'lucide-react';

// ============================================================================
// ⚠️ INSTRUÇÕES PARA O GITHUB (SEU AMBIENTE LOCAL):
// DESCOMENTE AS TRÊS LINHAS ABAIXO NO SEU PROJETO LOCAL E APAGUE A SEÇÃO DE MOCK.
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import * as XLSX from 'xlsx';
// ============================================================================

// ============================================================================
// UTILITÁRIOS LOCAIS
// ============================================================================
const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function Lotes() {
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [selectedObraId, setSelectedObraId] = useState('');

  const [lotesFechados, setLotesFechados] = useState([]);
  const [notasPendentes, setNotasPendentes] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { if (selectedEmpresaId) loadObras(); else { setObras([]); setSelectedObraId(''); } }, [selectedEmpresaId]);
  useEffect(() => { 
    if (selectedObraId) { loadLotesFechados(); loadNotasPendentes(); } 
    else { setLotesFechados([]); setNotasPendentes([]); } 
  }, [selectedObraId]);

  async function loadEmpresas() { const { data } = await supabase.from('empresas').select('*').order('razao_social'); setEmpresas(data || []); }
  async function loadObras() { const { data } = await supabase.from('obras').select('*').eq('empresa_id', selectedEmpresaId).order('nome_obra'); setObras(data || []); }

  async function loadLotesFechados() {
    const { data } = await supabase.from('lotes_pagamento')
      .select('*, documentos_fiscais(*, contratos(codigo_contrato, razao_social, cnpj_fornecedor, centro_custo_raiz))')
      .eq('obra_id', selectedObraId)
      .order('created_at', { ascending: false });
    setLotesFechados(data || []);
  }

  async function loadNotasPendentes() {
    const { data } = await supabase.from('documentos_fiscais')
      .select('*, contratos(codigo_contrato, razao_social, cnpj_fornecedor, centro_custo_raiz)')
      .eq('obra_id', selectedObraId)
      .eq('status_documento', 'Aprovado Lote')
      .is('lote_id', null)
      .order('data_vencimento', { ascending: true });
    setNotasPendentes(data || []);
  }

  const handleToggleSelect = (id) => {
    if (selecionadas.includes(id)) setSelecionadas(selecionadas.filter(val => val !== id));
    else setSelecionadas([...selecionadas, id]);
  };

  const handleGerarLote = async () => {
    if (selecionadas.length === 0) return alert("Selecione ao menos uma NF para o lote.");
    if (!window.confirm(`Confirma o fechamento deste lote com ${selecionadas.length} documento(s)?\n\nIsso irá gerar um Romaneio (Excel) e os documentos não poderão ser alterados.`)) return;
    
    setLoading(true);
    const codigo_lote = `LOT-${Date.now().toString().slice(-6)}`;
    
    const { data: loteData, error: loteError } = await supabase.from('lotes_pagamento').insert([{
      obra_id: selectedObraId,
      codigo_lote: codigo_lote,
      status: 'Fechado'
    }]).select('*').single();

    if (loteError) { alert("Erro ao criar Lote: " + loteError.message); setLoading(false); return; }

    const { error: updError } = await supabase.from('documentos_fiscais')
      .update({ lote_id: loteData.id, status_documento: 'Enviado Financeiro' })
      .in('id', selecionadas);

    if (updError) alert("Erro ao vincular NFs ao Lote: " + updError.message);
    else {
      setSelecionadas([]);
      loadNotasPendentes();
      loadLotesFechados();
    }
    setLoading(false);
  };

  function exportarExcel(lote) {
    if (!lote.documentos_fiscais || lote.documentos_fiscais.length === 0) return alert('Lote vazio.');

    const dados = lote.documentos_fiscais.map(nf => {
      const liquido = Number(nf.valor_bruto) - Number(nf.impostos_destacados || 0) - Number(nf.valor_retencao_tecnica || 0) - Number(nf.valor_amortizado_adiantamento || 0) + Number(nf.juros_multas || 0);

      return {
        'Nº ROMANEIO': lote.codigo_lote,
        'DATA LANÇAMENTO': formatDate(lote.data_geracao),
        'RAZÃO SOCIAL': nf.contratos?.razao_social || '',
        'CNPJ': nf.contratos?.cnpj_fornecedor || '',
        'Nº NOTA / DOC': nf.numero_documento,
        'VALIDAÇÃO': 'OK',
        'TIPO': nf.tipo_documento,
        'NATUREZA': nf.natureza_operacao,
        'CENTRO DE CUSTO': nf.contratos?.centro_custo_raiz || '',
        'CÓD. CONTRATO': nf.contratos?.codigo_contrato || '',
        'DATA EMISSÃO': formatDate(nf.data_emissao),
        'DATA VENCIMENTO': formatDate(nf.data_vencimento),
        'VALOR BRUTO (R$)': Number(nf.valor_bruto),
        'IMPOSTOS (R$)': Number(nf.impostos_destacados || 0),
        'RETENÇÃO (R$)': Number(nf.valor_retencao_tecnica || 0),
        'AMORTIZAÇÃO (R$)': Number(nf.valor_amortizado_adiantamento || 0),
        'LÍQUIDO A PAGAR (R$)': liquido,
        'CONTA/FORMA PGTO': nf.conta_corrente || 'PADRÃO CADASTRAL'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Romaneio");
    XLSX.writeFile(workbook, `${lote.codigo_lote}_LYON.xlsx`);
  }

  const valorTotalSelected = notasPendentes.filter(n => selecionadas.includes(n.id)).reduce((acc, n) => {
    return acc + Number(n.valor_bruto || 0);
  }, 0);

  return (
    <Layout>
      <div className="animate-in fade-in duration-700 w-full max-w-7xl mx-auto space-y-6 pb-20 px-2 sm:px-0">
        
        {/* CABEÇALHO DA PÁGINA */}
        <header className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Romaneios e Fechamentos</h2>
          <p className="text-sm sm:text-base text-slate-500">Agrupamento de documentos aprovados e integração (Exportação Contábil).</p>
        </header>

        {/* FILTROS GLOBAIS */}
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

        <div className={`grid grid-cols-1 xl:grid-cols-12 gap-6 ${!selectedObraId ? 'opacity-30 pointer-events-none grayscale blur-[2px]' : ''} transition-all duration-500`}>
          
          {/* LADO ESQUERDO: NFs Prontas para Lote */}
          <div className="xl:col-span-8 bg-white p-5 sm:p-6 rounded-3xl shadow-lg border border-slate-200 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-3"><div className="p-2 bg-amber-100 rounded-xl text-amber-600"><CheckSquare size={20}/></div> Fila de Pagamento Liberada</h3>
              <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selecionado (Bruto)</p>
                   <p className="font-black text-blue-700">{formatMoney(valorTotalSelected)}</p>
                </div>
                <button onClick={handleGerarLote} disabled={selecionadas.length === 0 || loading} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 hover:bg-slate-800 shadow-md">
                   {loading ? <span className="animate-pulse">Fechando...</span> : <><Lock size={14}/> Fechar Lote</>}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 min-h-[300px] border border-slate-100 rounded-xl bg-slate-50/50 p-2">
               {notasPendentes.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                   <CheckSquare size={48} className="mx-auto mb-4 opacity-20"/>
                   <p className="text-base font-bold text-slate-500">Nenhum documento aguardando Lote.</p>
                   <p className="text-xs mt-1">Aprove NFs no módulo de Alfândega primeiro.</p>
                 </div>
               ) : (
                 <div className="space-y-2">
                   {notasPendentes.map(n => {
                     const isSelected = selecionadas.includes(n.id);
                     const liquido = Number(n.valor_bruto) - Number(n.impostos_destacados || 0) - Number(n.valor_retencao_tecnica || 0) - Number(n.valor_amortizado_adiantamento || 0) + Number(n.juros_multas || 0);
                     return (
                       <div key={n.id} onClick={() => handleToggleSelect(n.id)} className={`p-3 border rounded-xl flex items-center gap-4 cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                         <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-100 border-slate-300'}`}>
                           {isSelected && <CheckSquare size={14}/>}
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-0.5">
                             <span className="font-black text-slate-800 text-sm">{n.numero_documento}</span>
                             <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase tracking-wider">Aprovado</span>
                           </div>
                           <p className="text-[11px] font-bold text-slate-600 truncate" title={n.contratos?.razao_social}>{n.contratos?.razao_social}</p>
                           <p className="text-[9px] text-slate-400 mt-0.5">Ref: {n.contratos?.codigo_contrato} | Venc: <strong className={new Date(n.data_vencimento) < new Date() ? 'text-rose-600' : ''}>{formatDate(n.data_vencimento)}</strong></p>
                         </div>
                         <div className="text-right shrink-0">
                           <p className="text-[10px] font-bold text-slate-500 line-through decoration-slate-300">{formatMoney(n.valor_bruto)}</p>
                           <p className="text-sm font-black text-emerald-600 mt-0.5 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{formatMoney(liquido)}</p>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
          </div>

          {/* LADO DIREITO: Histórico de Lotes e Exportação */}
          <div className="xl:col-span-4 bg-slate-900 p-5 sm:p-6 rounded-3xl shadow-xl border border-slate-800 text-white flex flex-col h-full relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none"><FileText size={200}/></div>
            
            <h3 className="font-black text-white text-lg flex items-center gap-3 mb-6 relative z-10"><div className="p-2 bg-slate-800 rounded-xl text-blue-400"><Layers size={20}/></div> Lotes Fechados</h3>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 relative z-10 custom-scrollbar min-h-[300px]">
              {lotesFechados.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl p-6 text-center">
                   <AlertCircle size={32} className="mx-auto mb-2 opacity-50"/>
                   <p className="text-sm font-bold">Nenhum lote finalizado.</p>
                 </div>
              ) : (
                lotesFechados.map(lote => {
                  const numDocs = lote.documentos_fiscais ? lote.documentos_fiscais.length : 0;
                  const totalLiquidoLote = lote.documentos_fiscais ? lote.documentos_fiscais.reduce((sum, nf) => {
                    return sum + (Number(nf.valor_bruto) - Number(nf.impostos_destacados || 0) - Number(nf.valor_retencao_tecnica || 0) - Number(nf.valor_amortizado_adiantamento || 0) + Number(nf.juros_multas || 0));
                  }, 0) : 0;

                  return (
                    <div key={lote.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm hover:border-blue-500/50 transition-colors group">
                      <div className="flex justify-between items-center mb-3">
                         <div>
                           <p className="font-black text-blue-400 text-sm tracking-wide">{lote.codigo_lote}</p>
                           <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{formatDate(lote.data_geracao)}</p>
                         </div>
                         <span className="bg-slate-900 text-slate-300 border border-slate-700 px-2 py-1 rounded text-[10px] font-black">{numDocs} Docs</span>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-700 flex justify-between items-end">
                         <div>
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Líquido do Lote</p>
                           <p className="font-black text-white text-base">{formatMoney(totalLiquidoLote)}</p>
                         </div>
                         <button onClick={() => exportarExcel(lote)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/50">
                           <Download size={14}/> XLSX
                         </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
