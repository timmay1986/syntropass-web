import { useState } from 'react';
import { generatePassword } from '@syntropass/crypto';

interface Props {
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
}

export default function ItemForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, username, password, url, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <h3 className="font-medium text-zinc-100">New Item</h3>

      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. GitHub)"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500" required />

      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username / Email"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />

      <div className="flex gap-2">
        <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm font-mono placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="button" onClick={handleGenerate}
          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-3 py-2 rounded-lg text-sm transition-colors">
          Generate
        </button>
      </div>

      <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />

      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-zinc-500 hover:text-zinc-300 px-3 py-2 text-sm">Cancel</button>
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">Save</button>
      </div>
    </form>
  );
}
