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

// IMPORTANTE: Importamos a muralha de segurança que acabaste de criar
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Rotas Privadas Blindadas - Nota que agora as páginas estão "abraçadas" pelo ProtectedRoute */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/alfandega" element={<ProtectedRoute><Alfandega /></ProtectedRoute>} />
        <Route path="/contratos" element={<ProtectedRoute><Contratos /></ProtectedRoute>} />
        <Route path="/engenharia" element={<ProtectedRoute><Engenharia /></ProtectedRoute>} />
        <Route path="/lotes" element={<ProtectedRoute><Lotes /></ProtectedRoute>} />
        
        {/* Rota Restrita */}
        <Route path="/superadmin" element={<ProtectedRoute><SuperAdmin /></ProtectedRoute>} />

        {/* Rota de Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
