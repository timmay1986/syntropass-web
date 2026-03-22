import {
  createUserKeyBundle, unlockUserKeys, deriveKeys, hashAuthKey,
  createVault, openVault, decryptVaultName, encryptItem, decryptItem,
  generatePassword, generatePassphrase, KDF_DEFAULTS,
  type KdfParams, type UserKeyBundle, type EncryptedData,
} from '@syntropass/crypto';

const KDF_PARAMS: KdfParams = KDF_DEFAULTS.desktop;

export function encodeEncrypted(data: EncryptedData): string {
  return JSON.stringify({
    ciphertext: btoa(String.fromCharCode(...data.ciphertext)),
    nonce: btoa(String.fromCharCode(...data.nonce)),
  });
}

export function decodeEncrypted(json: string): EncryptedData {
  const parsed = JSON.parse(json);
  return {
    ciphertext: Uint8Array.from(atob(parsed.ciphertext), c => c.charCodeAt(0)),
    nonce: Uint8Array.from(atob(parsed.nonce), c => c.charCodeAt(0)),
  };
}

export async function registerCrypto(password: string) {
  const bundle = await createUserKeyBundle(password, KDF_PARAMS);
  return {
    authKeyHash: bundle.authKeyHash,
    encryptedSymKey: encodeEncrypted(bundle.encryptedSymmetricKey),
    publicKey: btoa(String.fromCharCode(...bundle.publicKey)),
    encryptedPrivateKey: encodeEncrypted(bundle.encryptedPrivateKey),
    kdfMemory: KDF_PARAMS.memory,
    kdfIterations: KDF_PARAMS.iterations,
    kdfSalt: btoa(String.fromCharCode(...bundle.kdfSalt)),
    kdfParams: KDF_PARAMS,
  };
}

export async function loginCrypto(password: string, serverUser: any) {
  // Reconstruct the UserKeyBundle from server data so unlockUserKeys can
  // re-derive the symmetric key and private key using the original kdfSalt.
  // The server must return kdfSalt (base64) in the user object.
  const kdfSalt = serverUser.kdfSalt
    ? Uint8Array.from(atob(serverUser.kdfSalt), c => c.charCodeAt(0))
    : new Uint8Array(16); // fallback — will produce wrong keys if salt is missing

  const bundle: UserKeyBundle = {
    authKeyHash: serverUser.authKeyHash || '',
    encryptedSymmetricKey: decodeEncrypted(serverUser.encryptedSymKey),
    publicKey: Uint8Array.from(atob(serverUser.publicKey), c => c.charCodeAt(0)),
    encryptedPrivateKey: decodeEncrypted(serverUser.encryptedPrivateKey),
    kdfSalt,
    kdfParams: {
      memory: serverUser.kdfMemory || KDF_PARAMS.memory,
      iterations: serverUser.kdfIterations || KDF_PARAMS.iterations,
      parallelism: KDF_PARAMS.parallelism,
    },
  };

  const keys = await unlockUserKeys(password, bundle);
  return { authKeyHash: keys.authKeyHash, keys };
}

export async function deriveAuthHash(password: string, kdfSalt: string, kdfMemory: number, kdfIterations: number): Promise<string> {
  const salt = Uint8Array.from(atob(kdfSalt), c => c.charCodeAt(0));
  const params: KdfParams = { memory: kdfMemory, iterations: kdfIterations, parallelism: 4 };
  const { authKey } = await deriveKeys(password, salt, params);
  return hashAuthKey(authKey);
}

export { createVault, openVault, decryptVaultName, encryptItem, decryptItem, generatePassword, generatePassphrase };
