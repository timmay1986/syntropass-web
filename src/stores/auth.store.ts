import { create } from 'zustand';
import { api, setAccessToken } from '@/api/client';
import { registerCrypto, loginCrypto, deriveAuthHash } from '@/lib/crypto';
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
  // Check if we have a token from previous session (survives reload)
  isAuthenticated: !!sessionStorage.getItem('sp_access_token'),
  user: JSON.parse(sessionStorage.getItem('sp_user') || 'null'),
  tenant: JSON.parse(sessionStorage.getItem('sp_tenant') || 'null'),
  keys: (() => {
    try {
      const stored = sessionStorage.getItem('sp_keys');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return {
        symmetricKey: new Uint8Array(parsed.symmetricKey),
        privateKey: new Uint8Array(parsed.privateKey),
        publicKey: new Uint8Array(parsed.publicKey),
        authKeyHash: parsed.authKeyHash,
      };
    } catch { return null; }
  })(),
  isLoading: false, error: null,

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
      sessionStorage.setItem('sp_user', JSON.stringify(result.user));
      sessionStorage.setItem('sp_tenant', JSON.stringify(result.tenant));
      sessionStorage.setItem('sp_keys', JSON.stringify({
        symmetricKey: Array.from(keys.symmetricKey),
        privateKey: Array.from(keys.privateKey),
        publicKey: Array.from(keys.publicKey),
        authKeyHash: keys.authKeyHash,
      }));
      set({ isAuthenticated: true, user: result.user, tenant: result.tenant, keys, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  login: async (email, password, tenantSlug) => {
    set({ isLoading: true, error: null });
    try {
      // Step 1: Get kdfSalt from server
      const prelogin = await api('/api/auth/prelogin', {
        method: 'POST',
        body: JSON.stringify({ email, tenantSlug }),
      });

      // Step 2: Derive auth key hash with the SAME salt used at registration
      const authKeyHash = await deriveAuthHash(
        password,
        prelogin.kdfSalt,
        prelogin.kdfMemory,
        prelogin.kdfIterations,
      );

      // Step 3: Login
      const result = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, tenantSlug, authKeyHash }),
      });
      setAccessToken(result.accessToken);

      const { keys } = await loginCrypto(password, result.user);
      sessionStorage.setItem('sp_user', JSON.stringify(result.user));
      sessionStorage.setItem('sp_tenant', JSON.stringify(result.tenant));
      sessionStorage.setItem('sp_keys', JSON.stringify({
        symmetricKey: Array.from(keys.symmetricKey),
        privateKey: Array.from(keys.privateKey),
        publicKey: Array.from(keys.publicKey),
        authKeyHash: keys.authKeyHash,
      }));
      set({ isAuthenticated: true, user: result.user, tenant: result.tenant, keys, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  logout: async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    setAccessToken(null);
    sessionStorage.removeItem('sp_user');
    sessionStorage.removeItem('sp_tenant');
    sessionStorage.removeItem('sp_keys');
    set({ isAuthenticated: false, user: null, tenant: null, keys: null });
  },

  clearError: () => set({ error: null }),
}));
