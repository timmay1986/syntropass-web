import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import VaultsPage from '@/pages/VaultsPage';
import VaultDetailPage from '@/pages/VaultDetailPage';
import GeneratorPage from '@/pages/GeneratorPage';
import DashboardPage from '@/pages/DashboardPage';
import TokensPage from '@/pages/TokensPage';
import Layout from '@/components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/vaults" element={<ProtectedRoute><VaultsPage /></ProtectedRoute>} />
        <Route path="/vaults/:id" element={<ProtectedRoute><VaultDetailPage /></ProtectedRoute>} />
        <Route path="/generator" element={<ProtectedRoute><GeneratorPage /></ProtectedRoute>} />
        <Route path="/tokens" element={<ProtectedRoute><TokensPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
