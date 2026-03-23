import { useAuthStore } from '@/stores/auth.store';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, tenant, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/vaults', label: 'Vaults', icon: '🔐' },
    { path: '/generator', label: 'Generator', icon: '🎲' },
    { path: '/tokens', label: 'API Tokens', icon: '🔗' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold">SyntroPass</h1>
          <p className="text-xs text-zinc-500 mt-1">{tenant?.name}</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname.startsWith(item.path)
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <p className="text-sm text-zinc-400 truncate">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-2 text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
