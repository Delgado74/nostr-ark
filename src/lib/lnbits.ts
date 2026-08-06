import { storage, KEYS } from './storage';
import { type ArkTransaction } from './ark';

export interface LnbitsConfig {
  url: string;
  key: string;
}

export interface LnbitsBalance {
  balance: number;
}

export interface LnbitsPayment {
  payment_hash: string;
  bolt11: string;
  amount: number;
  fee: number;
  status?: 'pending' | 'success' | 'failed';
  memo?: string;
  created_at?: number | string;
  paid_at?: number;
  time?: number;
  timestamp?: number;
  pending?: boolean;
}

export interface CreateInvoiceResult {
  payment_hash: string;
  bolt11: string;
}

let configCache: LnbitsConfig | null = null;

export async function getConfig(): Promise<LnbitsConfig | null> {
  if (configCache) return configCache;
  const url = await storage.get(KEYS.LNBITS_URL);
  const key = await storage.get(KEYS.LNBITS_KEY);
  if (url && key) {
    configCache = { url: url.replace(/\/$/, ''), key };
    return configCache;
  }
  return null;
}

export async function isConnected(): Promise<boolean> {
  const config = await getConfig();
  return config !== null;
}

export async function connect(qrData: string): Promise<boolean> {
  const raw = qrData.replace(/^lightning:/, '').trim();

  try {
    const parsed = JSON.parse(raw);
    const apiKey = parsed.admin || parsed.invoice || parsed.key;
    if (parsed.url && apiKey) {
      await storage.set(KEYS.LNBITS_URL, parsed.url);
      await storage.set(KEYS.LNBITS_KEY, apiKey);
      configCache = { url: parsed.url.replace(/\/$/, ''), key: apiKey };
      return true;
    }
  } catch {
    // Not JSON
  }

  // Plain key — save it (URL must be set separately)
  await storage.set(KEYS.LNBITS_KEY, raw);
  const config = await getConfig();
  if (config) {
    configCache = { ...config, key: raw };
    return true;
  }
  configCache = { url: '', key: raw };
  return false;
}

export async function connectManual(url: string, key: string): Promise<boolean> {
  if (!url || !key) return false;
  const cleanUrl = url.replace(/\/$/, '');
  await storage.set(KEYS.LNBITS_URL, cleanUrl);
  await storage.set(KEYS.LNBITS_KEY, key);
  configCache = { url: cleanUrl, key };
  return true;
}

export async function disconnect(): Promise<void> {
  await storage.remove(KEYS.LNBITS_URL);
  await storage.remove(KEYS.LNBITS_KEY);
  configCache = null;
}

async function apiRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const config = await getConfig();
  if (!config) throw new Error('LNbits not configured');

  const res = await fetch(`${config.url}${path}`, {
    method,
    headers: {
      'X-Api-Key': config.key,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LNbits API error: ${res.status} - ${text}`);
  }

  return res.json();
}

export async function getWalletDetails(): Promise<{ name: string; balance: number }> {
  const data = await apiRequest('GET', '/api/v1/wallet') as {
    name: string;
    balance: number;
  };
  return { name: data.name, balance: data.balance };
}

export async function getBalance(): Promise<number> {
  try {
    const wallet = await getWalletDetails();
    return Math.round(wallet.balance / 1000);
  } catch {
    return 0;
  }
}

export async function createInvoice(
  amountSats: number,
  memo: string,
): Promise<CreateInvoiceResult> {
  const data = await apiRequest('POST', '/api/v1/payments', {
    out: false,
    amount: amountSats,
    memo: memo || 'NostrArk receive',
  }) as CreateInvoiceResult;
  return data;
}

export async function payInvoice(bolt11: string): Promise<{ payment_hash: string }> {
  const data = await apiRequest('POST', '/api/v1/payments', {
    out: true,
    bolt11,
  }) as { payment_hash: string };
  return data;
}

export async function checkPayment(paymentHash: string): Promise<boolean> {
  try {
    const config = await getConfig();
    if (!config) return false;

    const res = await fetch(`${config.url}/api/v1/payments/${paymentHash}`, {
      headers: { 'X-Api-Key': config.key },
    });

    if (!res.ok) return false;
    const data = await res.json() as { paid?: boolean; status?: string };
    return data.paid === true || data.status === 'success';
  } catch {
    return false;
  }
}

export async function getPayments(): Promise<LnbitsPayment[]> {
  try {
    const data = await apiRequest('GET', '/api/v1/payments?limit=50');
    if (Array.isArray(data)) return data as LnbitsPayment[];
    if (data && typeof data === 'object' && 'details' in (data as Record<string, unknown>)) {
      const d = data as { details?: { list?: LnbitsPayment[] } };
      return d.details?.list || [];
    }
    return [];
  } catch {
    return [];
  }
}

function parseTimestamp(raw?: number | string): number {
  if (raw === undefined || raw === null || raw === '') return Date.now();
  if (typeof raw === 'number') {
    if (isNaN(raw) || raw <= 0) return Date.now();
    return raw > 1e14 ? raw : raw * 1000;
  }
  const n = Number(raw);
  if (!isNaN(n) && raw.trim() !== '') {
    return n > 1e14 ? n : n * 1000;
  }
  const parsed = new Date(raw).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
}

export async function getTransactions(): Promise<ArkTransaction[]> {
  const payments = await getPayments();
  return payments.map((p) => ({
    id: p.payment_hash || `ln-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: p.amount > 0 ? 'incoming' as const : 'outgoing' as const,
    amount: Math.abs(Math.round(p.amount / 1000)),
    timestamp: parseTimestamp(p.created_at ?? p.time ?? p.timestamp),
    memo: p.memo || undefined,
    network: 'lightning' as const,
    fee: p.fee !== undefined ? Math.round(p.fee / 1000) : undefined,
    status: p.status ?? (p.pending ? 'pending' as const : 'success' as const),
  }));
}
