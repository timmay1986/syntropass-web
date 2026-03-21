import { Link } from 'react-router-dom';

interface Props {
  id: string;
  name: string;
  type: string;
  onDelete: () => void;
}

export default function VaultCard({ id, name, type, onDelete }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
      <Link to={`/vaults/${id}`} className="flex-1">
        <h3 className="font-medium text-zinc-100">{name}</h3>
        <p className="text-xs text-zinc-500 mt-1">{type}</p>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); onDelete(); }}
        className="text-zinc-600 hover:text-red-400 transition-colors text-sm"
      >
        Delete
      </button>
    </div>
  );
}
