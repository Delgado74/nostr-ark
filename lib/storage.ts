import * as SecureStore from 'expo-secure-store';

const NSEC_KEY = 'nostr_ark_nsec';
const NPUB_KEY = 'nostr_ark_npub';
const PASSWORD_KEY = 'nostr_ark_password';
const CURRENCY_KEY = 'nostr_ark_currency';

export async function saveNsec(nsec: string, password: string): Promise<void> {
  const encrypted = btoa(nsec + ':' + password);
  await SecureStore.setItemAsync(NSEC_KEY, encrypted);
}

export async function getNsec(password: string): Promise<string | null> {
  const encrypted = await SecureStore.getItemAsync(NSEC_KEY);
  if (!encrypted) return null;
  
  const decrypted = atob(encrypted);
  const [storedNsec, storedPassword] = decrypted.split(':');
  
  if (storedPassword !== password) {
    return null;
  }
  
  return storedNsec;
}

export async function saveNpub(npub: string): Promise<void> {
  await SecureStore.setItemAsync(NPUB_KEY, npub);
}

export async function getNpub(): Promise<string | null> {
  return await SecureStore.getItemAsync(NPUB_KEY);
}

export async function hasWallet(): Promise<boolean> {
  const nsec = await SecureStore.getItemAsync(NSEC_KEY);
  return nsec !== null;
}

export async function deleteWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(NSEC_KEY);
  await SecureStore.deleteItemAsync(NPUB_KEY);
}

export async function saveCurrency(currency: string): Promise<void> {
  await SecureStore.setItemAsync(CURRENCY_KEY, currency);
}

export async function getCurrency(): Promise<string> {
  const currency = await SecureStore.getItemAsync(CURRENCY_KEY);
  return currency || 'CUP';
}
