import { bech32 } from 'bech32';

export interface Bolt11Invoice {
  amountMsat: number;
  network: 'mainnet' | 'testnet' | 'signet';
  timestamp: number;
  paymentHash?: string;
  description?: string;
  payeePubkey?: string;
  expiry?: number;
}

const MULTIPLIERS: Record<string, number> = {
  p: 0.1,
  n: 100,
  u: 100000,
  m: 100000000,
};

export function decodeBolt11(invoice: string): Bolt11Invoice | null {
  const clean = invoice.replace(/^lightning:/i, '').trim();
  if (!clean) return null;

  let decoded;
  try {
    decoded = bech32.decode(clean.toLowerCase(), 2000);
  } catch {
    return null;
  }
  const { prefix, words } = decoded;

  let network: Bolt11Invoice['network'];
  if (prefix.startsWith('lnbc')) network = 'mainnet';
  else if (prefix.startsWith('lntbs')) network = 'signet';
  else if (prefix.startsWith('lntb')) network = 'testnet';
  else return null;

  const amountPart = prefix.startsWith('lntbs') ? prefix.slice(5) : prefix.slice(4);
  let amountMsat = 0;
  if (amountPart) {
    const m = amountPart.match(/^(\d+)([pnum])?$/);
    if (m) {
      const multiplier = m[2] ? (MULTIPLIERS[m[2]] ?? 0.1) : 1e11;
      amountMsat = Math.round(Number(m[1]) * multiplier);
    }
  }

  const dataWords = words;
  if (dataWords.length < 111) return null;

  let timestamp = 0;
  for (const w of dataWords.slice(0, 7)) timestamp = timestamp * 32 + w;

  const result: Bolt11Invoice = { amountMsat, network, timestamp };

  const taggedEnd = dataWords.length - 104;
  let offset = 7;
  while (offset + 3 <= taggedEnd) {
    const type = dataWords[offset];
    const length = (dataWords[offset + 1] << 5) | dataWords[offset + 2];
    if (offset + 3 + length > taggedEnd) break;
    const fieldWords = dataWords.slice(offset + 3, offset + 3 + length);

    if (type === 1 || type === 13 || type === 19) {
      try {
        const bytes = bech32.fromWords(fieldWords);
        if (type === 1) result.paymentHash = Buffer.from(bytes).toString('hex');
        else if (type === 13) result.description = Buffer.from(bytes).toString('utf8');
        else result.payeePubkey = Buffer.from(bytes).toString('hex');
      } catch {
        // ignore malformed or non-byte-aligned fields (e.g. features)
      }
    } else if (type === 6) {
      result.expiry = fieldWords.reduce((acc, w) => acc * 32 + w, 0);
    }
    offset += 3 + length;
  }

  return result;
}
