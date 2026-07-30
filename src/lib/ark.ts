import { Wallet, SingleKey, VtxoManager, type Wallet as WalletType } from '@arkade-os/sdk';
import { bytesToHex } from '@noble/hashes/utils';
import { getNetwork } from './i18n';

const ARK_SERVER_URL = 'https://arkade.computer';

export interface ArkBalance {
  confirmed: number;
  pending: number;
  recoverable: number;
  total: number;
}

export interface VtxoInfo {
  txid: string;
  vout: number;
  value: number;
  state: 'preconfirmed' | 'settled' | 'swept' | 'spent';
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

export interface SendResult {
  success: boolean;
  txId: string;
}

let walletInstance: WalletType | null = null;
let vtxoManagerInstance: VtxoManager | null = null;

export async function initArkWallet(privkeyHex: string): Promise<WalletType> {
  if (walletInstance) return walletInstance;

  const identity = SingleKey.fromHex(privkeyHex);

  walletInstance = await Wallet.create({
    identity,
    arkServerUrl: ARK_SERVER_URL,
    settlementConfig: {
      vtxoThreshold: 259200,
      boardingUtxoSweep: true,
    },
  });

  vtxoManagerInstance = await walletInstance.getVtxoManager();
  return walletInstance;
}

export function getWallet(): WalletType | null {
  return walletInstance;
}

export async function resetWallet(): Promise<void> {
  if (walletInstance) {
    await walletInstance.dispose();
  }
  walletInstance = null;
  vtxoManagerInstance = null;
}

export async function getBalance(): Promise<ArkBalance> {
  if (!walletInstance) return { confirmed: 0, pending: 0, recoverable: 0, total: 0 };

  try {
    const balance = await walletInstance.getBalance();
    return {
      confirmed: Number(balance.available || 0n),
      pending: Number(balance.preconfirmed || 0n),
      recoverable: Number(balance.recoverable || 0n),
      total: Number(balance.total || 0n),
    };
  } catch {
    return { confirmed: 0, pending: 0, recoverable: 0, total: 0 };
  }
}

export async function getArkAddress(): Promise<string> {
  if (!walletInstance) throw new Error('Wallet not initialized');
  return await walletInstance.getAddress();
}

export async function getOnchainAddress(): Promise<string> {
  if (!walletInstance) throw new Error('Wallet not initialized');
  return await walletInstance.getBoardingAddress();
}

export async function createLightningInvoice(
  amountSats: number,
  _memo: string,
): Promise<string> {
  if (!walletInstance) throw new Error('Wallet not initialized');
  return await walletInstance.getAddress();
}

export async function getVtxos(): Promise<VtxoInfo[]> {
  if (!walletInstance) return [];

  try {
    const vtxos = await walletInstance.getVtxos();
    return vtxos.map((vtxo) => ({
      txid: vtxo.txid,
      vout: vtxo.vout,
      value: vtxo.value,
      state: vtxo.virtualStatus.state,
    }));
  } catch {
    return [];
  }
}

export async function getExpiringVtxos(): Promise<VtxoInfo[]> {
  if (!vtxoManagerInstance) return [];

  try {
    const expiring = await vtxoManagerInstance.getExpiringVtxos();
    return expiring.map((vtxo) => ({
      txid: vtxo.txid,
      vout: vtxo.vout,
      value: vtxo.value,
      state: vtxo.virtualStatus.state,
    }));
  } catch {
    return [];
  }
}

export async function renewVtxos(): Promise<string | null> {
  if (!vtxoManagerInstance) return null;

  try {
    return await vtxoManagerInstance.renewVtxos();
  } catch {
    return null;
  }
}

export async function getRecoverableBalance(): Promise<number> {
  if (!vtxoManagerInstance) return 0;

  try {
    const balance = await vtxoManagerInstance.getRecoverableBalance();
    return Number(balance.recoverable || 0n);
  } catch {
    return 0;
  }
}

export async function recoverVtxos(): Promise<string | null> {
  if (!vtxoManagerInstance) return null;

  try {
    return await vtxoManagerInstance.recoverVtxos();
  } catch {
    return null;
  }
}

export async function getTransactions(): Promise<ArkTransaction[]> {
  if (!walletInstance) return [];

  try {
    const history = await walletInstance.getTransactionHistory();
    return history.map((tx) => ({
      id: tx.key.arkTxid || tx.key.boardingTxid || tx.key.commitmentTxid || 'unknown',
      type: tx.type === 'RECEIVED' ? 'incoming' as const : 'outgoing' as const,
      amount: tx.amount,
      timestamp: tx.createdAt * 1000,
      memo: undefined,
      network: tx.key.boardingTxid ? 'onchain' as const : 'ark' as const,
    }));
  } catch {
    return [];
  }
}

export async function sendToAddress(
  to: string,
  amountSats: number,
  _network: 'ark' | 'lightning' | 'onchain',
): Promise<SendResult> {
  if (!walletInstance) throw new Error('Wallet not initialized');

  const txid = await walletInstance.send({
    address: to,
    amount: amountSats,
  });

  return { success: true, txId: txid };
}

export async function finalizePendingTxs(): Promise<{ finalized: string[]; pending: string[] }> {
  if (!walletInstance) return { finalized: [], pending: [] };

  try {
    return await walletInstance.finalizePendingTxs();
  } catch {
    return { finalized: [], pending: [] };
  }
}

export function parseInvoiceAmount(invoice: string): number {
  const lower = invoice.replace(/^lightning:/i, '').toLowerCase();
  let prefix = '';
  if (lower.startsWith('lnbc')) prefix = 'lnbc';
  else if (lower.startsWith('lntbs')) prefix = 'lntbs';
  else if (lower.startsWith('lntb')) prefix = 'lntb';
  else return 0;

  const afterPrefix = lower.slice(prefix.length);
  if (!afterPrefix || afterPrefix[0] === '1') return 0;

  let amountStr = '';
  let multiplier = 0;
  for (const ch of afterPrefix) {
    if (ch >= '0' && ch <= '9') {
      amountStr += ch;
    } else if (ch === 'p') { multiplier = 0.0001; break; }
    else if (ch === 'n') { multiplier = 0.1; break; }
    else if (ch === 'u') { multiplier = 100; break; }
    else if (ch === 'm') { multiplier = 100000; break; }
    else break;
  }

  if (!amountStr) return 0;
  if (multiplier === 0) multiplier = 0.0001;
  return Math.round(Number(amountStr) * multiplier);
}

export function estimateFee(amountSats: number, networkType: 'lightning' | 'ark' | 'onchain'): number {
  switch (networkType) {
    case 'lightning': return 0;
    case 'ark': return Math.max(100, Math.round(amountSats * 0.002));
    case 'onchain': return Math.max(1000, Math.round(amountSats * 0.01));
    default: return 0;
  }
}

export async function disposeWallet(): Promise<void> {
  if (walletInstance) {
    await walletInstance.dispose();
    walletInstance = null;
    vtxoManagerInstance = null;
  }
}
