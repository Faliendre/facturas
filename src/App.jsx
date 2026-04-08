import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegistrarGasto from './pages/RegistrarGasto';
import Historial from './pages/Historial';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Cargando sesión...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && role !== requiredRole && role !== 'admin') return <Navigate to="/" />;

  return children;
};

// Root App Component
function AppRoutes() {
  const { user, role } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout userRole={role} /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="registrar" element={
          <ProtectedRoute requiredRole="admin">
            <RegistrarGasto />
          </ProtectedRoute>
        } />
        <Route path="historial" element={<Historial userRole={role} />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
