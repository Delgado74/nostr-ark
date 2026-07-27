import { generateSeedWords, privateKeyFromSeedWords, getPublicKey } from 'nostr-tools/pure';
import { bytesToHex, hexToBytes } from 'nostr-tools/nip19';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export interface NostrKeyPair {
  nsec: string;
  npub: string;
  privateKey: string;
  publicKey: string;
}

export function generateNostrKeys(): NostrKeyPair {
  const mnemonic = generateSeedWords();
  return importFromMnemonic(mnemonic);
}

export function importFromMnemonic(mnemonic: string): NostrKeyPair {
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new Error('Invalid mnemonic');
  }

  const seed = mnemonicToSeed(mnemonic);
  const privateKey = privateKeyFromSeedWords(seed, false);
  const publicKey = getPublicKey(privateKey);

  const nsec = bytesToHex(privateKey);
  const npub = bytesToHex(publicKey);

  return {
    nsec: `nsec1${nsec}`,
    npub: `npub1${npub}`,
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey),
  };
}

export function importFromNsec(nsec: string): NostrKeyPair {
  if (!nsec.startsWith('nsec1')) {
    throw new Error('Invalid nsec format');
  }

  const hex = nsec.replace('nsec1', '');
  const privateKey = hexToBytes(hex);
  const publicKey = getPublicKey(privateKey);

  return {
    nsec,
    npub: `npub1${bytesToHex(publicKey)}`,
    privateKey: hex,
    publicKey: bytesToHex(publicKey),
  };
}

function mnemonicToSeed(mnemonic: string): Uint8Array {
  const words = mnemonic.split(' ');
  if (words.length !== 12 && words.length !== 24) {
    throw new Error('Invalid mnemonic length');
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(mnemonic);
  
  const key = new Uint8Array(32);
  for (let i = 0; i < data.length && i < 32; i++) {
    key[i] = data[i];
  }
  
  return key;
}

export function maskNpub(npub: string): string {
  if (npub.length <= 16) return npub;
  return npub.slice(0, 8) + '...' + npub.slice(-8);
}
