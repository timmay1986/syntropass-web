import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Copy, Check, Plus, Minus, ChevronDown } from 'lucide-react';
import { generatePassword } from '@syntropass/crypto';
import TotpField, { isOtpAuthUri } from './TotpField';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FieldType = 'text' | 'url' | 'email' | 'password' | 'phone' | 'note';

export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: FieldType;
}

export interface ItemData {
  name: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  tags?: string[];
  fields?: Record<string, { value: string; type: string }>;
  [key: string]: any;
}

interface Props {
  item: { id: string; type: string; data: ItemData; favorite: boolean };
  vaultId: string;
  onSave: (data: ItemData) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── CopyBtn ─────────────────────────────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      title="Copy"
      className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
}

// ─── FieldRow (view) ─────────────────────────────────────────────────────────

function FieldRowView({
  label,
  value,
  type,
}: {
  label: string;
  value: string;
  type: FieldType;
}) {
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === 'password';
  const isUrl = type === 'url';
  const isTotp = isOtpAuthUri(value);

  const displayValue = isPassword && !revealed ? '••••••••••••' : value;

  return (
    <div className="flex items-start justify-between py-3 border-b border-zinc-800 last:border-0 group">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500 mb-0.5">{isTotp ? '2FA Code' : label}</p>
        {isTotp ? (
          <TotpField uri={value} />
        ) : isUrl ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 break-all"
          >
            {value}
          </a>
        ) : type === 'note' ? (
          <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">{value}</p>
        ) : (
          <p className={`text-sm text-zinc-200 break-all ${isPassword ? 'font-mono' : ''}`}>
            {displayValue}
          </p>
        )}
      </div>
      {!isTotp && (
        <div className="flex items-center gap-1 ml-3 shrink-0">
          {isPassword && (
            <button
              onClick={() => setRevealed((r) => !r)}
              title={revealed ? 'Hide' : 'Reveal'}
              className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          <CopyBtn value={value} />
        </div>
      )}
    </div>
  );
}

// ─── FieldRow (edit) ─────────────────────────────────────────────────────────

function FieldRowEdit({
  field,
  onChange,
  onDelete,
}: {
  field: CustomField;
  onChange: (updated: CustomField) => void;
  onDelete: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = field.type === 'password';
  const isNote = field.type === 'note';

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        {/* Label */}
        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          placeholder="Label"
          className="flex-1 bg-transparent text-xs font-medium text-zinc-400 placeholder:text-zinc-600 focus:outline-none focus:text-zinc-200"
        />
        {/* Type badge */}
        <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded shrink-0">
          {FIELD_TYPE_LABELS[field.type]}
        </span>
        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          title="Remove field"
          className="text-red-500 hover:text-red-400 transition-colors shrink-0"
        >
          <Minus size={16} />
        </button>
      </div>

      {/* Value */}
      <div className="flex items-start gap-2">
        {isNote ? (
          <textarea
            value={field.value}
            onChange={(e) => onChange({ ...field, value: e.target.value })}
            placeholder="Value"
            rows={3}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        ) : (
          <input
            type={isPassword && !revealed ? 'password' : 'text'}
            value={field.value}
            onChange={(e) => onChange({ ...field, value: e.target.value })}
            placeholder="Value"
            className={`flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isPassword ? 'font-mono' : ''}`}
          />
        )}
        {isPassword && (
          <>
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
            >
              {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              type="button"
              onClick={() => {
                const pw = generatePassword({
                  length: 20,
                  uppercase: true,
                  lowercase: true,
                  digits: true,
                  symbols: true,
                  excludeAmbiguous: true,
                });
                onChange({ ...field, value: pw });
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 whitespace-nowrap"
            >
              Generate
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── AddFieldDropdown ─────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function ItemEditor({ item, onSave, onDelete, onClose }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Edit state
  const [name, setName] = useState(item.data.name || '');
  const [username, setUsername] = useState(item.data.username || '');
  const [password, setPassword] = useState(item.data.password || '');
  const [url, setUrl] = useState(item.data.url || '');
  const [notes, setNotes] = useState(item.data.notes || '');
  const [tagInput, setTagInput] = useState((item.data.tags || []).join(', '));
  const [showPassword, setShowPassword] = useState(false);

  // Custom fields: flatten from item.data.fields map
  const [customFields, setCustomFields] = useState<CustomField[]>(() => {
    const raw = item.data.fields as Record<string, { value: string; type: string }> | undefined;
    if (!raw) return [];
    return Object.entries(raw).map(([label, f]) => ({
      id: uid(),
      label,
      value: f.value,
      type: (f.type as FieldType) || 'text',
    }));
  });

  const handleSave = async () => {
    setSaving(true);
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const fields: Record<string, { value: string; type: string }> = {};
    for (const f of customFields) {
      if (f.label) fields[f.label] = { value: f.value, type: f.type };
    }

    const data: ItemData = {
      name,
      username: username || undefined,
      password: password || undefined,
      url: url || undefined,
      notes: notes || undefined,
      tags: tags.length ? tags : undefined,
      fields: Object.keys(fields).length ? fields : undefined,
    };

    await onSave(data);
    setSaving(false);
    setEditMode(false);
  };

  const handleAddField = (type: FieldType) => {
    setCustomFields((prev) => [
      ...prev,
      { id: uid(), label: FIELD_TYPE_LABELS[type], value: '', type },
    ]);
  };

  const handleUpdateField = (id: string, updated: CustomField) => {
    setCustomFields((prev) => prev.map((f) => (f.id === id ? updated : f)));
  };

  const handleRemoveField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  // ── View mode ────────────────────────────────────────────────────────────────

  if (!editMode) {
    return (
      <div className="flex flex-col h-full bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 text-sm shrink-0"
            >
              ✕
            </button>
            <h2 className="font-semibold text-zinc-100 truncate">{item.data.name || 'Untitled'}</h2>
            <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded shrink-0">
              {item.type}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-zinc-600 hover:text-red-400 text-sm transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Login fields */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 divide-y divide-zinc-800">
            {username && (
              <FieldRowView label="Username" value={username} type="text" />
            )}
            {password && (
              <FieldRowView label="Password" value={password} type="password" />
            )}
            {url && (
              <FieldRowView label="URL" value={url} type="url" />
            )}
            {!username && !password && !url && (
              <p className="text-sm text-zinc-600 py-3">No standard fields set.</p>
            )}
          </div>

          {/* Notes */}
          {notes && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">Notes</p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{notes}</p>
              </div>
            </div>
          )}

          {/* Custom fields */}
          {customFields.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">Custom Fields</p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 divide-y divide-zinc-800">
                {customFields
                  .filter((f) => f.value)
                  .map((f) => (
                    <FieldRowView key={f.id} label={f.label || 'Field'} value={f.value} type={f.type} />
                  ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {item.data.tags && item.data.tags.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">Tags</p>
              <div className="flex flex-wrap gap-2">
                {item.data.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <div className="border-t border-zinc-800 px-6 py-4 bg-zinc-900">
            <p className="text-sm text-zinc-300 mb-3">Delete this item permanently?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-zinc-500 hover:text-zinc-300 px-3 py-1.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Edit mode ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <button
          onClick={() => setEditMode(false)}
          className="text-zinc-500 hover:text-zinc-300 text-sm"
        >
          Cancel
        </button>
        <h2 className="font-semibold text-zinc-100">Edit Item</h2>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {/* Name */}
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. GitHub"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Standard fields */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Login</p>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Username / Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or email"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Password</label>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm font-mono placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                onClick={() => {
                  const pw = generatePassword({
                    length: 20,
                    uppercase: true,
                    lowercase: true,
                    digits: true,
                    symbols: true,
                    excludeAmbiguous: true,
                  });
                  setPassword(pw);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded-lg px-2 py-1 transition-colors whitespace-nowrap"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note…"
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Custom fields */}
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Custom Fields</p>
          <div className="space-y-2">
            {customFields.map((f) => (
              <FieldRowEdit
                key={f.id}
                field={f}
                onChange={(updated) => handleUpdateField(f.id, updated)}
                onDelete={() => handleRemoveField(f.id)}
              />
            ))}
          </div>
          <div className="mt-3">
            <AddFieldDropdown onAdd={handleAddField} />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">
            Tags <span className="normal-case">(comma separated)</span>
          </label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="hetzner, api, work"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
