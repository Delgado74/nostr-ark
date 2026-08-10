import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';
import { bech32 } from 'bech32';
import { schnorr } from '@noble/curves/secp256k1';

export interface NostrKeyPair {
  nsec: string;
  npub: string;
  privkey: Uint8Array;
  pubkey: Uint8Array;
}

const NSEC_PREFIX = 'nsec';
const NPUB_PREFIX = 'npub';

function bech32Encode(prefix: string, data: Uint8Array): string {
  const words = bech32.toWords(data);
  words.unshift(0);
  return bech32.encode(prefix, words, 100);
}

function bech32Decode(prefix: string, encoded: string): Uint8Array {
  const decoded = bech32.decode(encoded, 100);
  if (decoded.prefix !== prefix) throw new Error(`Invalid prefix: ${decoded.prefix}`);
  const data = bech32.fromWords(decoded.words.slice(1));
  return new Uint8Array(data);
}

export function keyPairFromPrivkey(privkey: Uint8Array): NostrKeyPair {
  const pubkey = schnorr.getPublicKey(privkey);

  return {
    nsec: bech32Encode(NSEC_PREFIX, privkey),
    npub: bech32Encode(NPUB_PREFIX, pubkey),
    privkey,
    pubkey,
  };
}

export function generateKeyPair(): NostrKeyPair {
  return keyPairFromPrivkey(schnorr.utils.randomPrivateKey());
}

export function importFromNsec(nsec: string): NostrKeyPair {
  const privkey = bech32Decode(NSEC_PREFIX, nsec.trim());
  const pubkey = schnorr.getPublicKey(privkey);

  return {
    nsec: nsec.trim(),
    npub: bech32Encode(NPUB_PREFIX, pubkey),
    privkey,
    pubkey,
  };
}

export function getPubkeyHex(keypair: NostrKeyPair): string {
  return bytesToHex(keypair.pubkey);
}

export function getPrivkeyHex(keypair: NostrKeyPair): string {
  return bytesToHex(keypair.privkey);
}

export function shortPubkey(hex: string, chars = 8): string {
  return `${hex.slice(0, chars)}...${hex.slice(-chars)}`;
}

export function shortNsec(nsec: string, chars = 12): string {
  return `${nsec.slice(0, chars)}...${nsec.slice(-chars)}`;
}

export function signEvent(event: any, privkey: Uint8Array): string {
  const serialized = JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
  const hash = sha256(new TextEncoder().encode(serialized));
  return bytesToHex(schnorr.sign(hash, privkey));
}

export function identifyInputType(input: string): 'lightning' | 'ark' | 'onchain' | 'unknown' {
  const trimmed = input.trim().replace(/^lightning:/i, '').toLowerCase();
  if (trimmed.startsWith('lnbc') || trimmed.startsWith('lntb') || trimmed.startsWith('lntbs') || trimmed.startsWith('lnurl')) return 'lightning';
  if (
    trimmed.startsWith('ark1') ||
    trimmed.startsWith('ark:') ||
    trimmed.startsWith('tark1') ||
    trimmed.startsWith('tark:')
  ) return 'ark';
  if (trimmed.startsWith('bc1') || trimmed.startsWith('tb1') || trimmed.startsWith('1') || trimmed.startsWith('3')) return 'onchain';
  return 'unknown';
}
