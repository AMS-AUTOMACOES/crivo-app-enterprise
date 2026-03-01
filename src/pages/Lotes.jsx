import React, { useState, useEffect } from 'react';
import { CheckSquare, Download, AlertCircle, Building2, HardHat, FileText, Lock } from 'lucide-react';

export default function App() {
  const [lotesFechados, setLotesFechados] = useState([]);
  const [notasPendentes, setNotasPendentes] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR');
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

    try {
      const headers = Object.keys(dados[0]);
      const csvContent = [
        headers.join(';'),
        ...dados.map(row => headers.map(fieldName => {
          let field = row[fieldName] || '';
          if (typeof field === 'string' && (field.includes(';') || field.includes('"') || field.includes('\n'))) {
            field = `"${field.replace(new RegExp('"', 'g'), '""')}"`;
          }
          return field;
        }).join(';'))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${lote.codigo_lote}_LYON.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Erro ao exportar arquivo.");
      console.error(err);
    }
  }

  const valorTotalSelected = notasPendentes.filter(n => selecionadas.includes(n.id)).reduce((acc, n) => {
    return acc + Number(n.valor_bruto || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg shadow-sm">
            <FileText size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Módulo de Lotes e Romaneios</h1>
        </div>

        <div className="flex flex-col gap-4">
          {lotesFechados && lotesFechados.map((lote, idx) => {
             const totalLiquidoLote = lote.documentos_fiscais ? lote.documentos_fiscais.reduce((sum, nf) => sum + Number(nf.valor_bruto || 0), 0) : 0;
             const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
             
             return (
               <div key={lote.codigo_lote || idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                 <div className="mb-3 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-700">{lote.codigo_lote || `Lote #${idx + 1}`}</h3>
                 </div>
                 <div className="mt-2 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase">Líquido Total</p>
                      <p className="font-black text-emerald-600 text-sm">{formatMoney(totalLiquidoLote)}</p>
                    </div>
                    <button onClick={() => exportarExcel(lote)} className="flex items-center gap-1.5 bg-slate-900 text-white hover:bg-emerald-600 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-colors shadow-md">
                      <Download size={14} /> CSV
                    </button>
                 </div>
               </div>
             );
          })}
          
          {lotesFechados && lotesFechados.length === 0 && (
            <div className="p-8 flex flex-col items-center justify-center text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <AlertCircle size={32} className="text-slate-300 mb-2" />
              <p>Nenhum lote finalizado encontrado no momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
