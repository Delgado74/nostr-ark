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
  status: 'pending' | 'success' | 'failed';
  memo?: string;
  created_at: number;
  paid_at?: number;
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
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.url && parsed.key) {
      await storage.set(KEYS.LNBITS_URL, parsed.url);
      await storage.set(KEYS.LNBITS_KEY, parsed.key);
      configCache = { url: parsed.url.replace(/\/$/, ''), key: parsed.key };
      return true;
    }
  } catch {
    // Try as plain key with manual URL
  }

  const config = await getConfig();
  if (config && qrData.trim()) {
    await storage.set(KEYS.LNBITS_KEY, qrData.trim());
    configCache = { ...config, key: qrData.trim() };
    return true;
  }

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
    return wallet.balance;
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
    const data = await apiRequest('GET', '/api/v1/payments?limit=50') as {
      details?: { list?: LnbitsPayment[] };
    };
    return data.details?.list || [];
  } catch {
    return [];
  }
}

export async function getTransactions(): Promise<ArkTransaction[]> {
  const payments = await getPayments();
  return payments.map((p) => ({
    id: p.payment_hash,
    type: p.amount > 0 ? 'incoming' as const : 'outgoing' as const,
    amount: Math.abs(p.amount),
    timestamp: (p.created_at || Date.now() / 1000) * 1000,
    memo: p.memo || undefined,
    network: 'lightning' as const,
  }));
}
