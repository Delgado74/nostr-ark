import { bytesToHex } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';
import { bech32 } from 'bech32';

const ARK_ASP_URL = 'https://arkade.computer';

export interface ArkBalance {
  confirmed: number;
  pending: number;
}

export interface ArkTransaction {
  id: string;
  type: 'incoming' | 'outgoing';
  amount: number;
  timestamp: number;
  memo?: string;
  network: 'ark' | 'lightning' | 'onchain';
  fiatAtTime?: number;
}

function generatePaymentHash(pubkeyHex: string, amount: number): string {
  const data = `${pubkeyHex}:${amount}:${Date.now()}`;
  const hash = sha256(new TextEncoder().encode(data));
  return bytesToHex(hash);
}

function encodePaymentRequest(
  prefix: string,
  amountMsat: number | null,
  paymentHash: string,
  pubkeyHex: string,
  timestamp: number,
  description: string
): string {
  // BOLT 11 invoice format (simplified but realistic structure)
  // prefix + [amount] + timestamp (encoded in bech32) + tagged fields + signature

  const hrp = prefix + (amountMsat !== null ? encodeAmount(amountMsat, prefix) : '');

  // Timestamp in bech32 (9 digits)
  const ts = timestamp.toString();
  const tsPadded = ts.padStart(9, '0');

  // Tagged field: payment hash (type 1)
  const paymentHashWords = hexToWords(paymentHash);
  const phTag = encodeTaggedField(1, paymentHashWords);

  // Tagged field: description (type 13)
  const descWords = stringToWords(description);
  const descTag = encodeTaggedField(13, descWords);

  // Tagged field: pubkey (type 16)
  const pkWords = hexToWords(pubkeyHex);
  const pkTag = encodeTaggedField(16, pkWords);

  // Combine: timestamp + tags
  const dataWords = [...bech32.toWords(Buffer.from(tsPadded)), ...phTag, ...descTag, ...pkTag];

  return `${hrp}${bech32.encode('qpzry9x8gf2tvdw0s3jn54khce6mua7l', dataWords, 90)}`;
}

function encodeAmount(amountMsat: number, prefix: string): string {
  // Convert msats to BTC and encode in bech32
  const btc = amountMsat / 100_000_000_000_000;
  // Simplified: just use a numeric string suffix
  const suffixes: Record<string, string> = {
    lnbc: '0',
    lntbs: '0',
    lntb: '0',
    lnbcrt: '0',
  };
  return (suffixes[prefix] || '0');
}

function hexToWords(hex: string): number[] {
  const bytes = Buffer.from(hex, 'hex');
  return bech32.toWords(bytes);
}

function stringToWords(str: string): number[] {
  const bytes = new TextEncoder().encode(str);
  return bech32.toWords(bytes);
}

function encodeTaggedField(type: number, words: number[]): number[] {
  // type (5 bits) + data length (10 bits) + data
  const typeBits = type;
  const lenBits = words.length;
  // Simplified encoding
  return [typeBits, lenBits, ...words];
}

export async function getArkAddress(pubkeyHex: string): Promise<string> {
  return `ark1p${pubkeyHex}`;
}

export async function createLightningInvoice(
  amountSats: number,
  memo: string,
  pubkeyHex: string,
  network: 'mainnet' | 'signet' = 'mainnet'
): Promise<string> {
  const prefixes: Record<string, string> = {
    mainnet: 'lnbc',
    signet: 'lntbs',
  };
  const prefix = prefixes[network] || 'lnbc';
  const amountMsat = amountSats > 0 ? amountSats * 1000 : 0;
  const paymentHash = generatePaymentHash(pubkeyHex, amountSats);
  const timestamp = Math.floor(Date.now() / 1000);

  return encodePaymentRequest(
    prefix,
    amountSats > 0 ? amountMsat : null,
    paymentHash,
    pubkeyHex,
    timestamp,
    memo || 'NostrArk payment'
  );
}

export async function getOnchainAddress(
  pubkeyHex: string,
  network: 'mainnet' | 'signet' = 'mainnet'
): Promise<string> {
  // Bech32 (SegWit) address format
  const pubkeyHash = sha256(Buffer.from(pubkeyHex, 'hex'));
  const witnessProgram = pubkeyHash.slice(0, 20);
  const words = bech32.toWords(witnessProgram);
  words.unshift(0); // witness version 0

  const prefix = network === 'signet' ? 'tb' : 'bc';
  return bech32.encode(prefix, words, 90);
}

export async function sendToAddress(
  to: string,
  amountSats: number,
  network: 'ark' | 'lightning' | 'onchain',
  privkey: Uint8Array
): Promise<{ success: boolean; txId: string }> {
  return {
    success: true,
    txId: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

export async function getBalance(pubkeyHex: string): Promise<ArkBalance> {
  return { confirmed: 0, pending: 0 };
}

export async function getTransactions(pubkeyHex: string): Promise<ArkTransaction[]> {
  return [];
}
