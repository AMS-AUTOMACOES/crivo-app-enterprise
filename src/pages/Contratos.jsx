import React, { useState, useEffect } from 'react';
import { 
  Plus, X, CopyPlus, ListTree, Building2, HardHat, Pencil, 
  Trash2, FolderLock, AlertOctagon, ArrowRight, Database, 
  Search, ChevronDown, ChevronRight, CornerDownRight, History 
} from 'lucide-react';

// ============================================================================
// ⚠️ INSTRUÇÕES PARA O GITHUB (SEU AMBIENTE LOCAL):
// Descomente as linhas abaixo no seu projeto local e apague a seção de Mock.
import { supabase } from '../lib/supabase';
import { formatMoney, formatDate, formatToCurrencyString, parseCurrency, CurrencyInput, getBaseCode, getAllBaseCodes, findBaseCode } from '../utils/formatters';
// ============================================================================



export default function Contratos() {
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
