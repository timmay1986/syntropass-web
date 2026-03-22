interface Props {
  item: { id: string; type: string; data: Record<string, any>; favorite: boolean };
  onDelete: (e?: React.MouseEvent) => void;
}

const typeIcons: Record<string, string> = {
  login: '🔑',
  server: '🖥️',
  database: '🗄️',
  ssh_key: '🔐',
  secure_note: '📝',
  api_credential: '🔗',
  password: '🔒',
  document: '📄',
  custom: '📦',
};

export default function ItemCard({ item, onDelete }: Props) {
  const { data } = item;
  const icon = typeIcons[item.type] || '📦';
  const subtitle = data.username || data.url || data.notes?.substring(0, 50) || '';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-zinc-700 transition-colors">
      <span className="text-lg shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-zinc-100 text-sm truncate">{data.name || 'Untitled'}</h3>
        {subtitle && (
          <p className="text-xs text-zinc-500 truncate mt-0.5">{subtitle}</p>
        )}
      </div>
      <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">{item.type}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(e); }}
        className="text-zinc-700 hover:text-red-400 text-xs shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
