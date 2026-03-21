import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVaultStore } from '@/stores/vault.store';
import ItemCard from '@/components/ItemCard';
import ItemForm from '@/components/ItemForm';

export default function VaultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { vaults, currentItems, loadItems, createItem, deleteItem, isLoading } = useVaultStore();
  const [showForm, setShowForm] = useState(false);

  const vault = vaults.find((v) => v.id === id);

  useEffect(() => {
    if (id) loadItems(id);
  }, [id]);

  if (!vault) return <p className="text-zinc-500">Vault not found</p>;

  const handleCreate = async (data: Record<string, any>) => {
    await createItem(id!, data);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/vaults" className="text-zinc-500 hover:text-zinc-300">&larr; Back</Link>
        <h2 className="text-2xl font-bold">{vault.name}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Item
        </button>
      </div>

      {showForm && <div className="mb-4"><ItemForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} /></div>}

      {isLoading ? (
        <p className="text-zinc-500">Decrypting items...</p>
      ) : currentItems.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p className="text-lg">No items in this vault</p>
          <p className="text-sm mt-1">Add your first password or secure note.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentItems.map((item) => (
            <ItemCard key={item.id} item={item} onDelete={() => deleteItem(id!, item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
