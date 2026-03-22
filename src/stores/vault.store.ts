import { create } from 'zustand';
import { api } from '@/api/client';
import { useAuthStore } from './auth.store';
import {
  createVault as cryptoCreateVault,
  openVault,
  decryptVaultName,
  encryptItem as cryptoEncryptItem,
  decryptItem as cryptoDecryptItem,
} from '@syntropass/crypto';
import { encodeEncrypted, decodeEncrypted } from '@/lib/crypto';

interface Vault {
  id: string;
  name: string;       // Decrypted locally
  type: string;
  createdAt: string;
}

interface VaultItem {
  id: string;
  type: string;
  data: Record<string, any>; // Decrypted locally
  favorite: boolean;
  version: number;
}

interface VaultState {
  vaults: Vault[];
  currentVaultId: string | null;
  currentItems: VaultItem[];
  vaultKeys: Map<string, Uint8Array>; // vaultId → decrypted vault key (in memory)
  isLoading: boolean;

  loadVaults: () => Promise<void>;
  createVault: (name: string) => Promise<void>;
  deleteVault: (vaultId: string) => Promise<void>;
  loadItems: (vaultId: string) => Promise<void>;
  createItem: (vaultId: string, data: Record<string, any>, type?: string) => Promise<void>;
  updateItem: (vaultId: string, itemId: string, data: Record<string, any>) => Promise<void>;
  deleteItem: (vaultId: string, itemId: string) => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  vaults: [],
  currentVaultId: null,
  currentItems: [],
  vaultKeys: new Map(),
  isLoading: false,

  loadVaults: async () => {
    set({ isLoading: true });
    const keys = useAuthStore.getState().keys;

    try {
      const serverVaults = await api<any[]>('/api/vaults');

      const vaults: Vault[] = [];
      const vaultKeys = new Map(get().vaultKeys);

      for (const sv of serverVaults) {
        if (keys) {
          try {
            const vaultKey = openVault(keys.symmetricKey, decodeEncrypted(sv.encryptedKey));
            const name = decryptVaultName(vaultKey, decodeEncrypted(sv.encryptedName));
            vaultKeys.set(sv.id, vaultKey);
            vaults.push({ id: sv.id, name, type: sv.type, createdAt: sv.createdAt });
          } catch (err) {
            // Can't decrypt — show vault ID as fallback
            vaults.push({ id: sv.id, name: `Vault ${sv.id.substring(0, 8)}...`, type: sv.type, createdAt: sv.createdAt });
          }
        } else {
          // No keys (after reload) — show vault without decrypted name
          vaults.push({ id: sv.id, name: `🔒 Locked vault`, type: sv.type, createdAt: sv.createdAt });
        }
      }

      set({ vaults, vaultKeys, isLoading: false });
    } catch (err) {
      console.error('Failed to load vaults:', err);
      set({ isLoading: false });
    }
  },

  createVault: async (name: string) => {
    const keys = useAuthStore.getState().keys;
    if (!keys) return;

    const vault = cryptoCreateVault(keys.symmetricKey, name);

    await api('/api/vaults', {
      method: 'POST',
      body: JSON.stringify({
        encryptedName: encodeEncrypted(vault.encryptedName),
        encryptedKey: encodeEncrypted(vault.encryptedVaultKey),
      }),
    });

    await get().loadVaults();
  },

  deleteVault: async (vaultId: string) => {
    await api(`/api/vaults/${vaultId}`, { method: 'DELETE' });
    const vaultKeys = new Map(get().vaultKeys);
    vaultKeys.delete(vaultId);
    set({ vaultKeys });
    await get().loadVaults();
  },

  loadItems: async (vaultId: string) => {
    set({ isLoading: true, currentVaultId: vaultId });
    const vaultKey = get().vaultKeys.get(vaultId);
    if (!vaultKey) return;

    const serverItems = await api<any[]>(`/api/vaults/${vaultId}/items`);

    const items: VaultItem[] = [];
    for (const si of serverItems) {
      try {
        const data = cryptoDecryptItem(vaultKey, decodeEncrypted(si.encryptedData));
        items.push({
          id: si.id,
          type: si.type,
          data: data as Record<string, any>,
          favorite: si.favorite,
          version: si.version,
        });
      } catch (err) {
        console.error('Failed to decrypt item:', si.id, err);
      }
    }

    set({ currentItems: items, isLoading: false });
  },

  createItem: async (vaultId: string, data: Record<string, any>, type = 'login') => {
    const vaultKey = get().vaultKeys.get(vaultId);
    if (!vaultKey) return;

    const encrypted = cryptoEncryptItem(vaultKey, data);

    await api(`/api/vaults/${vaultId}/items`, {
      method: 'POST',
      body: JSON.stringify({
        type,
        encryptedData: encodeEncrypted(encrypted),
      }),
    });

    await get().loadItems(vaultId);
  },

  updateItem: async (vaultId: string, itemId: string, data: Record<string, any>) => {
    const vaultKey = get().vaultKeys.get(vaultId);
    if (!vaultKey) return;

    const encrypted = cryptoEncryptItem(vaultKey, data);

    await api(`/api/vaults/${vaultId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        encryptedData: encodeEncrypted(encrypted),
      }),
    });

    await get().loadItems(vaultId);
  },

  deleteItem: async (vaultId: string, itemId: string) => {
    await api(`/api/vaults/${vaultId}/items/${itemId}`, { method: 'DELETE' });
    await get().loadItems(vaultId);
  },
}));
