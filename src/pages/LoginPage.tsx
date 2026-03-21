import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password, tenantSlug);
    if (useAuthStore.getState().isAuthenticated) navigate('/vaults');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-100">SyntroPass</h1>
          <p className="text-zinc-400 mt-2">Zero-Knowledge Password Manager</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-100">Login</h2>
          {error && (
            <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Organization</label>
            <input
              type="text"
              value={tenantSlug}
              onChange={(e) => { setTenantSlug(e.target.value); clearError(); }}
              placeholder="my-company"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              placeholder="you@company.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              placeholder="••••••••••••"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {isLoading ? 'Deriving keys...' : 'Unlock'}
          </button>
          <p className="text-center text-sm text-zinc-500">
            No account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
