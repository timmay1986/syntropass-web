import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { receiveSharedVaultKey, symmetricEncrypt, type AsymmetricEncryptedData } from '@syntropass/crypto';

interface Invite {
  id: string;
  vaultId: string;
  vaultName: string;
  inviterEmail: string;
  permission: string;
  status: string;
  encryptedVaultKey: string;
  createdAt: string;
}

export default function InvitesPage() {
  const { keys } = useAuthStore();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInvites = async () => {
    setIsLoading(true);
    try {
      const data = await api<Invite[]>('/api/sharing/invites');
      setInvites(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const handleRespond = async (invite: Invite, accept: boolean) => {
    setProcessingId(invite.id);
    setError(null);
    try {
      let encryptedVaultKey: string | undefined;

      if (accept && invite.encryptedVaultKey && keys) {
        // Deserialize the AsymmetricEncryptedData that was sent by the inviter
        const parsed = JSON.parse(invite.encryptedVaultKey);
        const asymData: AsymmetricEncryptedData = {
          ephemeralPublicKey: Uint8Array.from(atob(parsed.ephemeralPublicKey), c => c.charCodeAt(0)),
          ciphertext: Uint8Array.from(atob(parsed.ciphertext), c => c.charCodeAt(0)),
          nonce: Uint8Array.from(atob(parsed.nonce), c => c.charCodeAt(0)),
        };

        // Decrypt the vault key using our private key
        const vaultKey = receiveSharedVaultKey(keys.privateKey, asymData);

        // Re-encrypt vault key with our symmetric key so openVault() works
        const reEncrypted = symmetricEncrypt(keys.symmetricKey, vaultKey);
        encryptedVaultKey = JSON.stringify({
          ciphertext: btoa(String.fromCharCode(...reEncrypted.ciphertext)),
          nonce: btoa(String.fromCharCode(...reEncrypted.nonce)),
        });
      }

      await api(`/api/sharing/invites/${invite.id}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          accept,
          ...(encryptedVaultKey ? { encryptedVaultKey } : {}),
        }),
      });

      await loadInvites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingInvites = invites.filter((inv) => inv.status === 'pending');
  const pastInvites = invites.filter((inv) => inv.status !== 'pending');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Vault Invites</h2>
        {pendingInvites.length > 0 && (
          <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {pendingInvites.length} pending
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-zinc-500">Loading invites...</p>
      ) : pendingInvites.length === 0 && pastInvites.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p className="text-lg">No invites</p>
          <p className="text-sm mt-1">When someone shares a vault with you, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingInvites.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Pending</h3>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-zinc-100">
                        {invite.vaultName || `Vault ${invite.vaultId.substring(0, 8)}...`}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        From <span className="text-zinc-400">{invite.inviterEmail}</span>
                        {' · '}
                        <span className="capitalize">{invite.permission}</span> access
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(invite, false)}
                        disabled={processingId === invite.id}
                        className="text-zinc-500 hover:text-red-400 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleRespond(invite, true)}
                        disabled={processingId === invite.id}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        {processingId === invite.id ? 'Accepting...' : 'Accept'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pastInvites.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">History</h3>
              <div className="space-y-2">
                {pastInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between opacity-60"
                  >
                    <div>
                      <p className="font-medium text-zinc-100">
                        {invite.vaultName || `Vault ${invite.vaultId.substring(0, 8)}...`}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        From <span className="text-zinc-400">{invite.inviterEmail}</span>
                        {' · '}
                        <span className="capitalize">{invite.permission}</span> access
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${
                        invite.status === 'accepted'
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-red-900/40 text-red-400'
                      }`}
                    >
                      {invite.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
