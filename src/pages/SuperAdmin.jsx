import React, { useState, useEffect } from 'react';
import { Server, Building2, Users2, LogOut, Plus, Database } from 'lucide-react';

// ============================================================================
// ⚠️ INSTRUÇÕES PARA O GITHUB (SEU AMBIENTE LOCAL):
// DESCOMENTE A LINHA ABAIXO NO SEU PROJETO LOCAL E APAGUE A SEÇÃO DE MOCK.
import { supabase } from '../lib/supabase';
// ============================================================================

// ============================================================================
// UTILITÁRIOS LOCAIS (Garantia anti-quebra)
// ============================================================================
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function SuperAdmin() {
  const [empresas, setEmpresas] = useState([]);
  const [formEmpresa, setFormEmpresa] = useState({ razao_social: '', cnpj: '' });
  const [loading, setLoading] = useState(false);
  
  useEffect(() => { loadEmpresas(); }, []);

  async function loadEmpresas() {
    const { data } = await supabase.from('empresas').select('*').order('created_at', { ascending: false });
    setEmpresas(data || []);
  }

  const handleAddEmpresa = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('empresas').insert([formEmpresa]);
    if (error) alert('Erro ao provisionar inquilino: ' + error.message);
    else { 
      setFormEmpresa({ razao_social: '', cnpj: '' }); 
      loadEmpresas(); 
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // ESTRATÉGIA DE SEGURANÇA: Força o recarregamento total da página para limpar memória RAM (Estados do React)
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Master */}
      <aside className="w-72 bg-black border-r border-slate-800 flex flex-col shrink-0">
        <div className="h-24 flex items-center justify-start px-8 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <Server className="text-amber-500" size={32} />
            <div>
              <h1 className="text-xl font-black text-white tracking-wide uppercase">Crivo<span className="text-amber-500">.Master</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Super Admin Console</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-2">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-4 px-2">Gestão de SaaS</p>
           <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
             <Building2 size={16}/> Inquilinos (Tenants)
           </button>
           <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800 transition-colors opacity-50 cursor-not-allowed" title="Em breve: Disparo de Convites por E-mail">
             <Users2 size={16}/> Convites & Acessos
           </button>
        </nav>
        <div className="p-6 border-t border-slate-800">
           <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 text-xs font-black text-slate-500 hover:text-rose-500 transition-colors uppercase tracking-widest">
             <LogOut size={14}/> Encerrar Sessão Master
           </button>
        </div>
      </aside>

      {/* Main Area Master */}
      <main className="flex-1 overflow-y-auto bg-slate-900 p-10 custom-scrollbar">
         <header className="mb-10 animate-in fade-in">
           <h2 className="text-3xl font-black text-white">Provisionamento de Inquilinos</h2>
           <p className="text-slate-400 mt-2">Crie as instâncias das Construtoras para que elas possam operar o sistema de forma isolada.</p>
         </header>

         <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Form Cadastro Empresa */}
            <div className="xl:col-span-1">
               <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl">
                 <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Plus size={16}/> Novo Inquilino (Cliente)</h3>
                 <form onSubmit={handleAddEmpresa} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Razão Social (Construtora)</label>
                      <input required className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white outline-none focus:border-amber-500" value={formEmpresa.razao_social} onChange={e => setFormEmpresa({...formEmpresa, razao_social: e.target.value})} placeholder="Ex: Construtora Alfa S/A" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">CNPJ da Base</label>
                      <input required className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white outline-none focus:border-amber-500" value={formEmpresa.cnpj} onChange={e => setFormEmpresa({...formEmpresa, cnpj: e.target.value})} placeholder="Somente números" />
                    </div>
                    <button disabled={loading} type="submit" className="w-full bg-amber-500 text-slate-950 p-4 rounded-xl text-xs font-black uppercase tracking-widest mt-4 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50">
                      {loading ? 'Provisionando...' : 'Criar Instância Tenant'}
                    </button>
                 </form>
               </div>
            </div>

            {/* Lista de Empresas */}
            <div className="xl:col-span-2">
               <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl h-full flex flex-col">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Database size={16} className="text-slate-400"/> Base de Clientes Ativos</h3>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {empresas.length === 0 ? (
                       <div className="p-10 text-center border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 font-bold">
                         Nenhum cliente provisionado no banco de dados.
                       </div>
                    ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {empresas.map(emp => (
                           <div key={emp.id} className="p-5 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col justify-between">
                             <div>
                               <div className="flex justify-between items-start mb-2">
                                 <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20">{emp.status || 'Ativo'}</span>
                                 <span className="text-[10px] font-mono text-slate-500">{emp.id ? String(emp.id).split('-')[0] : ''}</span>
                               </div>
                               <h4 className="font-black text-white text-base leading-tight mb-1">{emp.razao_social}</h4>
                               <p className="text-xs font-mono text-slate-400">CNPJ: {emp.cnpj}</p>
                             </div>
                             <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                               <p className="text-[9px] text-slate-500 font-bold uppercase">Cadastrado em {formatDate(emp.created_at)}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                    )}
                  </div>
               </div>
            </div>
         </div>
      </main>
    </div>
  )
}
