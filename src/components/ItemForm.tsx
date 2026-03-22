import { useState, useRef, useEffect } from 'react';
import { generatePassword } from '@syntropass/crypto';
import { Eye, EyeOff, Plus, Minus, ChevronDown } from 'lucide-react';

type FieldType = 'text' | 'url' | 'email' | 'password' | 'phone' | 'note';

interface CustomField {
  id: string;
  label: string;
  value: string;
  type: FieldType;
}

interface Props {
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
  url: 'URL',
  email: 'Email',
  password: 'Password',
  phone: 'Phone',
  note: 'Note',
};

const FIELD_TYPES: FieldType[] = ['text', 'url', 'email', 'password', 'phone', 'note'];

function AddFieldDropdown({ onAdd }: { onAdd: (type: FieldType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2 transition-colors"
      >
        <Plus size={14} />
        Add Field
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 overflow-hidden">
          {FIELD_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onAdd(t);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
            >
              {FIELD_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ItemForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const handleGenerate = () => {
    const pw = generatePassword({
      length: 20,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: true,
      excludeAmbiguous: true,
    });
    setPassword(pw);
  };

  const handleAddField = (type: FieldType) => {
    setCustomFields((prev) => [
      ...prev,
      { id: uid(), label: FIELD_TYPE_LABELS[type], value: '', type },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fields: Record<string, { value: string; type: string }> = {};
    for (const f of customFields) {
      if (f.label) fields[f.label] = { value: f.value, type: f.type };
    }

    onSubmit({
      name,
      username: username || undefined,
      password: password || undefined,
      url: url || undefined,
      notes: notes || undefined,
      fields: Object.keys(fields).length ? fields : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
      <h3 className="font-medium text-zinc-100">New Item</h3>

      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (e.g. GitHub)"
        required
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Username */}
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username / Email"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Password */}
      <div className="flex gap-2">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm font-mono placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-3 py-2 rounded-lg text-sm transition-colors"
        >
          Generate
        </button>
      </div>

      {/* URL */}
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        rows={2}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      {/* Custom fields */}
      {customFields.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Custom Fields</p>
          {customFields.map((f) => (
            <div key={f.id} className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={f.label}
                  onChange={(e) =>
                    setCustomFields((prev) =>
                      prev.map((x) => (x.id === f.id ? { ...x, label: e.target.value } : x))
                    )
                  }
                  placeholder="Label"
                  className="flex-1 bg-transparent text-xs font-medium text-zinc-400 placeholder:text-zinc-600 focus:outline-none focus:text-zinc-200"
                />
                <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">
                  {FIELD_TYPE_LABELS[f.type]}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomFields((prev) => prev.filter((x) => x.id !== f.id))}
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  <Minus size={16} />
                </button>
              </div>
              {f.type === 'note' ? (
                <textarea
                  value={f.value}
                  onChange={(e) =>
                    setCustomFields((prev) =>
                      prev.map((x) => (x.id === f.id ? { ...x, value: e.target.value } : x))
                    )
                  }
                  placeholder="Value"
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              ) : (
                <input
                  type={f.type === 'password' ? 'password' : 'text'}
                  value={f.value}
                  onChange={(e) =>
                    setCustomFields((prev) =>
                      prev.map((x) => (x.id === f.id ? { ...x, value: e.target.value } : x))
                    )
                  }
                  placeholder="Value"
                  className={`w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 ${f.type === 'password' ? 'font-mono' : ''}`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <AddFieldDropdown onAdd={handleAddField} />

      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="text-zinc-500 hover:text-zinc-300 px-3 py-2 text-sm">
          Cancel
        </button>
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
          Save
        </button>
      </div>
    </form>
  );
}
