import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, AlertOctagon, Lock } from 'lucide-react';

export default function Login() {
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center items-center gap-3 mb-6">
          <ShieldCheck className="text-emerald-500 shrink-0" size={48} />
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Crivo<span className="text-emerald-500 lowercase">.app</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">
              Enterprise Edition
            </p>
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
        <div className="bg-white py-8 px-4 shadow-2xl rounded-2xl sm:rounded-3xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm font-bold text-rose-700 flex items-center gap-2">
                <AlertOctagon size={16} className="shrink-0" />
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                E-mail Corporativo
              </label>
              <div className="mt-1">
                <input 
                  required 
                  type="email" 
                  placeholder="nome@construtora.com" 
                  className="block w-full appearance-none rounded-xl border border-slate-300 px-4 py-3 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm font-medium transition-all" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                Senha de Acesso (Cofre)
              </label>
              <div className="mt-1">
                <input 
                  required 
                  type="password" 
                  placeholder="••••••••" 
                  className="block w-full appearance-none rounded-xl border border-slate-300 px-4 py-3 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm font-medium transition-all" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                disabled={loading} 
                type="submit" 
                className="flex w-full justify-center items-center gap-2 rounded-xl border border-transparent bg-slate-900 py-3.5 px-4 text-sm font-black uppercase tracking-wider text-white shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-70 active:scale-[0.98]"
              >
                {loading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Lock size={18} /> 
                    Aceder ao Sistema
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest flex items-center justify-center gap-1">
               <ShieldCheck size={12}/> Ambiente Blindado & Auditado
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
