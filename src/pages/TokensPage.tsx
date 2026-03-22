import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { useVaultStore } from '@/stores/vault.store';
import { symmetricEncrypt } from '@syntropass/crypto';

function encodeEncrypted(data: { ciphertext: Uint8Array; nonce: Uint8Array }): string {
  return JSON.stringify({
    ciphertext: btoa(String.fromCharCode(...data.ciphertext)),
    nonce: btoa(String.fromCharCode(...data.nonce)),
  });
}

interface TokenInfo {
  id: string;
  name: string;
  permission: string;
  vaultIds: string[] | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Create form
  const [name, setName] = useState('');
  const [permission, setPermission] = useState<'read' | 'readwrite'>('read');
  const [selectedVaults, setSelectedVaults] = useState<string[]>([]);
  const [allVaults, setAllVaults] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number>(0);

  const keys = useAuthStore((s) => s.keys);
  const { vaults, loadVaults } = useVaultStore();

  useEffect(() => {
    loadTokens();
    loadVaults();
  }, []);

  const loadTokens = async () => {
    try {
      const result = await api('/api/tokens');
      setTokens(result);
    } catch {}
  };

  const handleCreate = async () => {
    if (!name.trim() || !keys) return;
    setCreating(true);

    try {
      // Generate a random token secret
      const tokenSecretBytes = crypto.getRandomValues(new Uint8Array(32));
      const tokenSecret = 'sp_' + Array.from(tokenSecretBytes, b => b.toString(16).padStart(2, '0')).join('');

      // Hash the token secret (SHA-256)
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tokenSecret));
      const tokenSecretHash = Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('');

      // Encrypt the user's symmetric key with a key derived from the token secret
      // For simplicity: we use the first 32 bytes of the hash as the encryption key
      const tokenKey = new Uint8Array(hashBuffer).slice(0, 32);
      const encryptedSymKey = symmetricEncrypt(tokenKey, keys.symmetricKey);

      await api('/api/tokens', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          permission,
          vaultIds: allVaults ? undefined : selectedVaults.length > 0 ? selectedVaults : undefined,
          expiresInDays: expiresInDays > 0 ? expiresInDays : undefined,
          encryptedSymKey: encodeEncrypted(encryptedSymKey),
          tokenSecretHash,
        }),
      });

      setNewToken(tokenSecret);
      setShowCreate(false);
      setName('');
      setSelectedVaults([]);
      loadTokens();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setCreating(false);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this token? It will stop working immediately.')) return;
    await api(`/api/tokens/${id}`, { method: 'DELETE' });
    loadTokens();
  };

  const [copied, setCopied] = useState(false);
  const copyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">API Tokens</h2>
          <p className="text-sm text-zinc-500 mt-1">Service account tokens for CLI and automation</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setNewToken(null); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Create Token
        </button>
      </div>

      {/* New token display — shown once after creation */}
      {newToken && (
        <div className="bg-green-900/30 border border-green-800 rounded-xl p-4 mb-6">
          <p className="text-green-300 text-sm font-medium mb-2">Token created! Copy it now — you won't see it again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-zinc-900 px-3 py-2 rounded-lg text-sm font-mono text-green-200 break-all select-all">
              {newToken}
            </code>
            <button onClick={copyToken}
              className="bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm shrink-0">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            Usage: <code className="text-zinc-400">export SP_SERVICE_ACCOUNT_TOKEN="{newToken}"</code>
          </p>
          <button onClick={() => setNewToken(null)} className="text-xs text-zinc-600 mt-2 hover:text-zinc-400">
            Dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-zinc-100">New API Token</h3>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Claude Code"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100" />
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">Permission</label>
            <select value={permission} onChange={(e) => setPermission(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100">
              <option value="read">Read only</option>
              <option value="readwrite">Read & Write</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">Vault Access</label>
            <label className="flex items-center gap-2 text-sm text-zinc-300 mb-2 cursor-pointer">
              <input type="checkbox" checked={allVaults} onChange={(e) => setAllVaults(e.target.checked)}
                className="accent-blue-500" />
              All vaults
            </label>
            {!allVaults && (
              <div className="space-y-1 ml-6">
                {vaults.map(v => (
                  <label key={v.id} className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                    <input type="checkbox"
                      checked={selectedVaults.includes(v.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedVaults([...selectedVaults, v.id]);
                        else setSelectedVaults(selectedVaults.filter(id => id !== v.id));
                      }}
                      className="accent-blue-500" />
                    {v.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">Expires</label>
            <select value={expiresInDays} onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100">
              <option value={0}>Never</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowCreate(false)}
              className="text-zinc-500 hover:text-zinc-300 px-3 py-2 text-sm">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !name.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {creating ? 'Creating...' : 'Create Token'}
            </button>
          </div>
        </div>
      )}

      {/* Token list */}
      <div className="space-y-2">
        {tokens.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-lg">No API tokens</p>
            <p className="text-sm mt-1">Create a token to access your vaults from the CLI.</p>
          </div>
        ) : tokens.map(token => (
          <div key={token.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-100 text-sm">{token.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  token.permission === 'readwrite' ? 'bg-amber-900/50 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {token.permission}
                </span>
              </div>
              <div className="flex gap-3 mt-1 text-xs text-zinc-600">
                <span>Created {new Date(token.createdAt).toLocaleDateString()}</span>
                {token.lastUsedAt && <span>Last used {new Date(token.lastUsedAt).toLocaleDateString()}</span>}
                {token.expiresAt && <span>Expires {new Date(token.expiresAt).toLocaleDateString()}</span>}
                {token.vaultIds ? <span>{(token.vaultIds as string[]).length} vaults</span> : <span>All vaults</span>}
              </div>
            </div>
            <button onClick={() => handleRevoke(token.id)}
              className="text-xs text-zinc-600 hover:text-red-400 shrink-0">
              Revoke
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
