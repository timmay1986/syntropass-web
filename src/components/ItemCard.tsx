import { useState } from 'react';
import CopyButton from './CopyButton';

interface Props {
  item: { id: string; type: string; data: Record<string, any>; favorite: boolean };
  onDelete: (e?: React.MouseEvent) => void;
}

export default function ItemCard({ item, onDelete }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const { data } = item;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-zinc-100">{data.name || 'Untitled'}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">{item.type}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(e); }} className="text-zinc-600 hover:text-red-400 text-sm">Delete</button>
        </div>
      </div>

      {data.username && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Username</p>
            <p className="text-sm text-zinc-300">{data.username}</p>
          </div>
          <CopyButton value={data.username} />
        </div>
      )}

      {data.password && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Password</p>
            <p className="text-sm text-zinc-300 font-mono">
              {showPassword ? data.password : '••••••••••••'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
            <CopyButton value={data.password} />
          </div>
        </div>
      )}

      {data.url && (
        <div>
          <p className="text-xs text-zinc-500">URL</p>
          <a href={data.url} target="_blank" rel="noopener" className="text-sm text-blue-400 hover:text-blue-300">
            {data.url}
          </a>
        </div>
      )}

      {data.notes && (
        <div>
          <p className="text-xs text-zinc-500">Notes</p>
          <p className="text-sm text-zinc-400">{data.notes}</p>
        </div>
      )}
    </div>
  );
}
