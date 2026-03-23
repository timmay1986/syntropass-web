import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVaultStore } from '@/stores/vault.store';

type FlatItem = {
  id: string;
  vaultId: string;
  vaultName: string;
  type: string;
  data: Record<string, any>;
  favorite: boolean;
  createdAt?: string;
};

const typeIcons: Record<string, string> = {
  login: '🔑', server: '🖥️', database: '🗄️', ssh_key: '🔐',
  secure_note: '📝', api_credential: '🔗', password: '🔒',
  document: '📄', custom: '📦', card: '💳', identity: '👤',
};

export default function DashboardPage() {
  const { vaults, loadVaults, isLoading } = useVaultStore();
  const [allItems, setAllItems] = useState<FlatItem[]>([]);
  const [tab, setTab] = useState<'recent' | 'created' | 'favorites'>('recent');
  const [search, setSearch] = useState('');
  const [loadingItems, setLoadingItems] = useState(false);
  const navigate = useNavigate();

  const { loadItems } = useVaultStore();

  useEffect(() => {
    loadVaults();
  }, []);

  // Load all items from all vaults
  useEffect(() => {
    if (vaults.length === 0) return;
    setLoadingItems(true);

    const loadAll = async () => {
      const items: FlatItem[] = [];
      for (const vault of vaults) {
        try {
          await loadItems(vault.id);
          const current = useVaultStore.getState().currentItems;
          for (const item of current) {
            items.push({
              ...item,
              vaultId: vault.id,
              vaultName: vault.name,
            });
          }
        } catch {}
      }
      setAllItems(items);
      setLoadingItems(false);
    };

    loadAll();
  }, [vaults]);

  // Filter + sort
  const filtered = useMemo(() => {
    let items = allItems;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        (i.data.name || '').toLowerCase().includes(q) ||
        (i.data.username || '').toLowerCase().includes(q) ||
        (i.data.url || '').toLowerCase().includes(q) ||
        i.vaultName.toLowerCase().includes(q)
      );
    }

    // Tab filter
    if (tab === 'favorites') {
      items = items.filter(i => i.favorite);
    }

    // Sort
    if (tab === 'created') {
      items = [...items].reverse(); // newest first (items come in creation order)
    }

    return items.slice(0, 50); // Max 50 for performance
  }, [allItems, search, tab]);

  const handleClick = (item: FlatItem) => {
    navigate(`/vaults/${item.vaultId}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Search */}
      <div className="mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search passwords, servers, keys..."
          autoFocus
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900 rounded-lg p-1 mb-6 border border-zinc-800">
        {([
          ['recent', 'Recently Used'],
          ['created', 'Recently Created'],
          ['favorites', 'Favorites'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === key
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading || loadingItems ? (
        <p className="text-zinc-500 text-center py-8">Loading items...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          {search ? (
            <p>No results for "{search}"</p>
          ) : tab === 'favorites' ? (
            <p>No favorites yet</p>
          ) : (
            <p>No items yet</p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-colors text-left"
            >
              <span className="text-lg shrink-0">
                {typeIcons[item.type] || '📦'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-100 truncate">
                  {item.data.name || 'Untitled'}
                </div>
                <div className="text-xs text-zinc-500 truncate">
                  {item.data.username || item.data.url || ''}
                  {item.vaultName ? ` · ${item.vaultName}` : ''}
                </div>
              </div>
              {item.favorite && <span className="text-yellow-500 text-xs">★</span>}
              <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                {item.type}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 flex justify-center gap-6 text-xs text-zinc-600">
        <span>{vaults.length} Vaults</span>
        <span>{allItems.length} Items</span>
      </div>
    </div>
  );
}
