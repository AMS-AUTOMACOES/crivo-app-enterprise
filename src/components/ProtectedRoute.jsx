import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // Função para verificar se existe um token de sessão válido no Supabase
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();

    // Fica a ouvir caso o utilizador faça logout noutra aba
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Enquanto a verificação não termina, mostramos um ecrã de carregamento seguro
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        <p className="text-sm font-bold uppercase tracking-widest">A verificar credenciais de acesso...</p>
      </div>
    );
  }

  // Se não estiver autenticado, recambiamos o utilizador para o Login.
  // Se estiver, renderizamos a página que ele pediu (children).
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
