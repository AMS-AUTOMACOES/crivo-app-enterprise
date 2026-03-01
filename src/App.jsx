import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importação das tuas páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alfandega from './pages/Alfandega';
import Contratos from './pages/Contratos';
import Engenharia from './pages/Engenharia';
import Lotes from './pages/Lotes';
import SuperAdmin from './pages/SuperAdmin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública Inicial */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Rotas Privadas (Ainda sem bloqueio de segurança real, faremos no Passo 3) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/alfandega" element={<Alfandega />} />
        <Route path="/contratos" element={<Contratos />} />
        <Route path="/engenharia" element={<Engenharia />} />
        <Route path="/lotes" element={<Lotes />} />
        
        {/* Rota Restrita */}
        <Route path="/superadmin" element={<SuperAdmin />} />

        {/* Rota de Fallback: Se o utilizador digitar um URL que não existe, vai para o Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
