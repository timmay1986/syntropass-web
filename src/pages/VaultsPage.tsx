import { useEffect, useState } from 'react';
import { useVaultStore } from '@/stores/vault.store';
import VaultCard from '@/components/VaultCard';

export default function VaultsPage() {
  const { vaults, loadVaults, createVault, deleteVault, isLoading } = useVaultStore();
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadVaults();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createVault(newName.trim());
    setNewName('');
    setShowCreate(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Vaults</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + New Vault
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Vault name..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
            Create
          </button>
          <button type="button" onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-zinc-300 px-3">
            Cancel
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-zinc-500">Loading vaults...</p>
      ) : vaults.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p className="text-lg">No vaults yet</p>
          <p className="text-sm mt-1">Create your first vault to start storing passwords.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vaults.map((vault) => (
            <VaultCard
              key={vault.id}
              {...vault}
              onDelete={() => deleteVault(vault.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
