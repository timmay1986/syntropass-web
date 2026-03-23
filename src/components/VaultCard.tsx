import { Link } from 'react-router-dom';

interface Props {
  id: string;
  name: string;
  type: string;
  isOwned?: boolean;
  sharedBy?: string;
  onDelete: () => void;
  onShare?: () => void;
}

export default function VaultCard({ id, name, type, isOwned = true, sharedBy, onDelete, onShare }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
      <Link to={`/vaults/${id}`} className="flex-1 min-w-0">
        <h3 className="font-medium text-zinc-100">{name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-zinc-500">{type}</p>
          {sharedBy && (
            <span className="text-xs text-blue-400">Shared by {sharedBy}</span>
          )}
        </div>
      </Link>
      <div className="flex items-center gap-2 ml-3">
        {isOwned && onShare && (
          <button
            onClick={(e) => { e.preventDefault(); onShare(); }}
            className="text-zinc-500 hover:text-blue-400 transition-colors text-sm"
          >
            Share
          </button>
        )}
        {isOwned && (
          <button
            onClick={(e) => { e.preventDefault(); onDelete(); }}
            className="text-zinc-600 hover:text-red-400 transition-colors text-sm"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
