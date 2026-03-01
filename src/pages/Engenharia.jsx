import React, { useState, useEffect } from 'react';
import { ShoppingCart, Ruler, X, Pencil, Trash2 } from 'lucide-react';

// ============================================================================
// ⚠️ INSTRUÇÕES PARA O GITHUB (SEU AMBIENTE LOCAL):
// Descomente as linhas abaixo no seu projeto local e apague a seção de Mock.
import { supabase } from '../lib/supabase';
import { formatMoney, formatDate, formatToCurrencyString, parseCurrency, CurrencyInput } from '../utils/formatters';
// ============================================================================


export default function Engenharia() {
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

  // ESTADOS DA MEDIÇÃO
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
