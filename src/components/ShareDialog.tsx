import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { useVaultStore } from '@/stores/vault.store';
import { shareVaultKey, type AsymmetricEncryptedData } from '@syntropass/crypto';

interface Share {
  userId: string;
  email: string;
  permission: string;
}

interface Invite {
  id: string;
  inviteeEmail: string;
  permission: string;
  status: string;
}

interface Props {
  vaultId: string;
  vaultName: string;
  onClose: () => void;
}

const PERMISSIONS = ['read', 'write', 'admin'];

export default function ShareDialog({ vaultId, vaultName, onClose }: Props) {
  const { vaultKeys } = useVaultStore();

  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('read');
  const [shares, setShares] = useState<Share[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sharesData, invitesData] = await Promise.all([
        api<Share[]>(`/api/sharing/vaults/${vaultId}/shares`),
        api<Invite[]>('/api/sharing/invites'),
      ]);
      setShares(sharesData || []);
      // Filter invites to only show those for this vault
      const vaultInvites = (invitesData || []).filter((inv: any) => inv.vaultId === vaultId);
      setInvites(vaultInvites);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vaultId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setSuccess(null);
    setIsSending(true);

    try {
      // Get invitee's public key
      const userInfo = await api<{ userId: string; publicKey: string }>(`/api/sharing/users/by-email?email=${encodeURIComponent(email.trim())}`);
      const inviteePublicKey = Uint8Array.from(atob(userInfo.publicKey), c => c.charCodeAt(0));

      // Encrypt vault key with invitee's public key
      const vaultKey = vaultKeys.get(vaultId);
      if (!vaultKey) throw new Error('Vault key not available — please reload the vault first.');

      const encrypted: AsymmetricEncryptedData = shareVaultKey(vaultKey, inviteePublicKey);
      // Serialize to base64 JSON for transport
      const encryptedVaultKey = JSON.stringify({
        ephemeralPublicKey: btoa(String.fromCharCode(...encrypted.ephemeralPublicKey)),
        ciphertext: btoa(String.fromCharCode(...encrypted.ciphertext)),
        nonce: btoa(String.fromCharCode(...encrypted.nonce)),
      });

      await api('/api/sharing/invite', {
        method: 'POST',
        body: JSON.stringify({
          vaultId,
          email: email.trim(),
          permission,
          encryptedVaultKey,
          vaultName,
        }),
      });

      setEmail('');
      setSuccess(`Invite sent to ${email.trim()}`);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleRevokeShare = async (userId: string) => {
    try {
      await api(`/api/sharing/vaults/${vaultId}/shares/${userId}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await api(`/api/sharing/invites/${inviteId}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-lg w-full space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-100">Share "{vaultName}"</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors text-xl leading-none">&times;</button>
        </div>

        {/* Invite form */}
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PERMISSIONS.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isSending || !email.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isSending ? 'Sending...' : 'Send Invite'}
          </button>
        </form>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}

        {isLoading ? (
          <p className="text-zinc-500 text-sm">Loading...</p>
        ) : (
          <>
            {/* Active shares */}
            {shares.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Active Shares</h4>
                <div className="space-y-1">
                  {shares.map((share) => (
                    <div key={share.userId} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-sm text-zinc-100">{share.email}</span>
                        <span className="ml-2 text-xs text-zinc-500 capitalize">{share.permission}</span>
                      </div>
                      <button
                        onClick={() => handleRevokeShare(share.userId)}
                        className="text-zinc-600 hover:text-red-400 transition-colors text-xs"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending invites */}
            {invites.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Pending Invites</h4>
                <div className="space-y-1">
                  {invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-sm text-zinc-100">{invite.inviteeEmail}</span>
                        <span className="ml-2 text-xs text-zinc-500 capitalize">{invite.permission}</span>
                        <span className="ml-2 text-xs text-amber-500 capitalize">{invite.status}</span>
                      </div>
                      <button
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors text-xs"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shares.length === 0 && invites.length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-2">Not shared with anyone yet.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
