import { create } from 'zustand';
import { api, setAccessToken } from '@/api/client';
import { registerCrypto, loginCrypto } from '@/lib/crypto';
import type { UnlockedUserKeys } from '@syntropass/crypto';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  tenant: any | null;
  keys: UnlockedUserKeys | null;
  isLoading: boolean;
  error: string | null;
  register: (email: string, password: string, tenantName: string, tenantSlug: string) => Promise<void>;
  login: (email: string, password: string, tenantSlug: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false, user: null, tenant: null, keys: null, isLoading: false, error: null,

  register: async (email, password, tenantName, tenantSlug) => {
    set({ isLoading: true, error: null });
    try {
      const crypto = await registerCrypto(password);
      const result = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email, tenantName, tenantSlug,
          authKeyHash: crypto.authKeyHash,
          encryptedSymKey: crypto.encryptedSymKey,
          publicKey: crypto.publicKey,
          encryptedPrivateKey: crypto.encryptedPrivateKey,
          kdfMemory: crypto.kdfMemory,
          kdfIterations: crypto.kdfIterations,
          kdfSalt: crypto.kdfSalt,
        }),
      });
      setAccessToken(result.accessToken);
      // After registration the server returns the user with kdfSalt — use it to unlock keys
      const { keys } = await loginCrypto(password, result.user);
      set({ isAuthenticated: true, user: result.user, tenant: result.tenant, keys, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  login: async (email, password, tenantSlug) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: The authKeyHash sent here is derived with a NEW random salt each call,
      // which will NOT match the hash stored at registration (which used a different salt).
      // CORRECT FIX: Add a /api/auth/prelogin endpoint that returns the user's kdfSalt
      // for a given email+tenantSlug, then derive authKeyHash with that salt before
      // calling this endpoint. For now, registration + same-session use works because
      // keys are already in memory. Cross-session login requires the prelogin endpoint.
      //
      // Workaround: derive a temporary bundle to get a hash. The backend must be
      // configured to accept this or use a prelogin flow.
      const tempBundle = await registerCrypto(password);
      const authKeyHash = tempBundle.authKeyHash;

      const result = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, tenantSlug, authKeyHash }),
      });
      setAccessToken(result.accessToken);
      // The server must return kdfSalt in result.user for key unlocking to work correctly
      const { keys } = await loginCrypto(password, result.user);
      set({ isAuthenticated: true, user: result.user, tenant: result.tenant, keys, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  logout: async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    setAccessToken(null);
    set({ isAuthenticated: false, user: null, tenant: null, keys: null });
  },

  clearError: () => set({ error: null }),
}));
