import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVaultStore } from '@/stores/vault.store';
import ItemCard from '@/components/ItemCard';
import ItemForm from '@/components/ItemForm';
import ItemEditor from '@/components/ItemEditor';

type VaultItem = { id: string; type: string; data: Record<string, any>; favorite: boolean };

export default function VaultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { vaults, currentItems, loadItems, createItem, updateItem, deleteItem, isLoading } =
    useVaultStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [search, setSearch] = useState('');

  const vault = vaults.find((v) => v.id === id);

  useEffect(() => {
    if (id) loadItems(id);
  }, [id]);

  // Keep selectedItem in sync when currentItems reload (e.g. after save)
  useEffect(() => {
    if (selectedItem) {
      const refreshed = currentItems.find((i) => i.id === selectedItem.id);
      if (refreshed) setSelectedItem(refreshed);
    }
  }, [currentItems]);

  if (!vault) return <p className="text-zinc-500">Vault not found</p>;

  const handleCreate = async (data: Record<string, any>) => {
    await createItem(id!, data);
    setShowForm(false);
  };

  const handleSave = async (data: Record<string, any>) => {
    if (!selectedItem) return;
    await updateItem(id!, selectedItem.id, data);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    await deleteItem(id!, selectedItem.id);
    setSelectedItem(null);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left pane: item list — scrollable */}
      <div className={`shrink-0 overflow-y-auto ${selectedItem ? 'hidden md:block w-80 lg:w-96 border-r border-zinc-800' : 'w-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/vaults" className="text-zinc-500 hover:text-zinc-300">
              &larr; Back
            </Link>
            <h2 className="text-2xl font-bold truncate">{vault.name}</h2>
            <button
              onClick={() => { setShowForm(!showForm); setSelectedItem(null); }}
              className="ml-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shrink-0"
            >
              + Add Item
            </button>
          </div>

          {/* Search */}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search in vault..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

          {showForm && (
            <div className="mb-4">
              <ItemForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {isLoading ? (
            <p className="text-zinc-500">Decrypting items...</p>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p className="text-lg">No items in this vault</p>
              <p className="text-sm mt-1">Add your first password or secure note.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {currentItems.filter(item => {
                if (!search.trim()) return true;
                const q = search.toLowerCase();
                return (item.data.name || '').toLowerCase().includes(q) ||
                  (item.data.username || '').toLowerCase().includes(q) ||
                  (item.data.url || '').toLowerCase().includes(q);
              }).map((item) => (
                <div
                  key={item.id}
                  onClick={() => { setSelectedItem(item); setShowForm(false); }}
                  className={`cursor-pointer rounded-xl transition-colors ${
                    selectedItem?.id === item.id
                      ? 'ring-2 ring-blue-500'
                      : 'hover:ring-1 hover:ring-zinc-600'
                  }`}
                >
                  <ItemCard
                    item={item}
                    onDelete={(e) => {
                      e?.stopPropagation?.();
                      deleteItem(id!, item.id);
                      if (selectedItem?.id === item.id) setSelectedItem(null);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right pane: item editor */}
      {selectedItem && (
        <div className="flex-1 min-w-0 overflow-y-auto h-full sticky top-0">
          <ItemEditor
            key={selectedItem.id}
            item={selectedItem as any}
            vaultId={id!}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={() => setSelectedItem(null)}
          />
        </div>
      )}
    </div>
  );
}
