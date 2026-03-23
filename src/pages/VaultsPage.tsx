import { useEffect, useState } from 'react';
import { useVaultStore } from '@/stores/vault.store';
import { useAuthStore } from '@/stores/auth.store';
import VaultCard from '@/components/VaultCard';
import ShareDialog from '@/components/ShareDialog';

export default function VaultsPage() {
  const { vaults, loadVaults, createVault, deleteVault, isLoading } = useVaultStore();
  const { user } = useAuthStore();
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [shareVault, setShareVault] = useState<{ id: string; name: string } | null>(null);

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

  const handleDelete = async () => {
    if (!deleteConfirm || deleteInput !== deleteConfirm.name) return;
    await deleteVault(deleteConfirm.id);
    setDeleteConfirm(null);
    setDeleteInput('');
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
          {vaults.map((vault: any) => {
            const isOwned = !vault.ownerId || vault.ownerId === user?.id;
            return (
              <VaultCard
                key={vault.id}
                {...vault}
                isOwned={isOwned}
                sharedBy={!isOwned ? (vault.ownerEmail || 'someone') : undefined}
                onDelete={() => setDeleteConfirm({ id: vault.id, name: vault.name })}
                onShare={isOwned ? () => setShareVault({ id: vault.id, name: vault.name }) : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold text-zinc-100">Delete Vault</h3>
            <p className="text-sm text-zinc-400">
              This will permanently delete the vault and all its items. This action cannot be undone.
            </p>
            <p className="text-sm text-zinc-400">
              Type the vault name to confirm:
            </p>
            <div
              onClick={() => { navigator.clipboard.writeText(deleteConfirm.name); }}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-red-400 cursor-pointer hover:bg-zinc-750 select-all"
              title="Click to copy"
            >
              {deleteConfirm.name}
            </div>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Enter vault name..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setDeleteConfirm(null); setDeleteInput(''); }}
                className="text-zinc-500 hover:text-zinc-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteInput !== deleteConfirm.name}
                className="bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Delete Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share dialog */}
      {shareVault && (
        <ShareDialog
          vaultId={shareVault.id}
          vaultName={shareVault.name}
          onClose={() => setShareVault(null)}
        />
      )}
    </div>
  );
}
