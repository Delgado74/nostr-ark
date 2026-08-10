import { Wallet, SeedIdentity, VtxoManager, Ramps, type Wallet as WalletType } from '@arkade-os/sdk';
import { bytesToHex, utf8ToBytes, concatBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';

const ARK_SERVER_URL = 'https://signet.arkade.sh';

export interface ArkBalance {
  confirmed: number;
  pending: number;
  recoverable: number;
  total: number;
  onchain: {
    confirmed: number;
    unconfirmed: number;
    total: number;
  };
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
  fee?: number;
  status?: 'pending' | 'success' | 'failed';
  paymentHash?: string;
  preimage?: string;
  destination?: string;
  destinationPubkey?: string;
  bolt11?: string;
  txid?: string;
  onchainTxid?: string;
}

export interface SendResult {
  success: boolean;
  txId: string;
}

let walletInstance: WalletType | null = null;
let vtxoManagerInstance: VtxoManager | null = null;

function seedFromPrivkey(privkeyHex: string): Uint8Array {
  const a = sha256(utf8ToBytes(`nostr-ark-hd:${privkeyHex}`));
  const b = sha256(utf8ToBytes(`nostr-ark-hd:${privkeyHex}:2`));
  return concatBytes(a, b);
}

export async function initArkWallet(privkeyHex: string): Promise<WalletType> {
  if (walletInstance) return walletInstance;

  const identity = SeedIdentity.fromSeed(seedFromPrivkey(privkeyHex), {
    isMainnet: false,
  });

  walletInstance = await Wallet.create({
    identity,
    arkServerUrl: ARK_SERVER_URL,
    walletMode: 'hd',
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
  if (!walletInstance) {
    return { confirmed: 0, pending: 0, recoverable: 0, total: 0, onchain: { confirmed: 0, unconfirmed: 0, total: 0 } };
  }

  try {
    const balance = await walletInstance.getBalance();
    return {
      confirmed: Number(balance.available || 0n),
      pending: Number(balance.preconfirmed || 0n),
      recoverable: Number(balance.recoverable || 0n),
      total: Number(balance.total || 0n),
      onchain: {
        confirmed: Number(balance.boarding?.confirmed || 0),
        unconfirmed: Number(balance.boarding?.unconfirmed || 0),
        total: Number(balance.boarding?.total || 0),
      },
    };
  } catch {
    return { confirmed: 0, pending: 0, recoverable: 0, total: 0, onchain: { confirmed: 0, unconfirmed: 0, total: 0 } };
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

export async function getNewOnchainAddress(): Promise<string> {
  if (!walletInstance) throw new Error('Wallet not initialized');
  return await walletInstance.getNewBoardingAddress();
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
      timestamp: tx.createdAt ? (tx.createdAt > 1e14 ? tx.createdAt : tx.createdAt * 1000) : Date.now(),
      memo: undefined,
      network: tx.key.boardingTxid ? 'onchain' as const : 'ark' as const,
      txid: tx.key.arkTxid || tx.key.commitmentTxid || tx.key.boardingTxid || undefined,
      onchainTxid: tx.key.commitmentTxid || tx.key.boardingTxid || undefined,
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

export async function onboardToArk(amountSats?: number): Promise<SendResult> {
  if (!walletInstance) throw new Error('Wallet not initialized');

  const ramps = new Ramps(walletInstance);
  const { fees } = await walletInstance.arkProvider.getInfo();
  const txId = await ramps.onboard(
    fees,
    undefined,
    amountSats !== undefined ? BigInt(Math.floor(amountSats)) : undefined,
  );

  return { success: true, txId };
}

export async function offboardToOnchain(
  to: string,
  amountSats: number,
): Promise<SendResult> {
  if (!walletInstance) throw new Error('Wallet not initialized');

  const ownAddresses = await walletInstance.getBoardingAddresses();
  if (ownAddresses.includes(to.trim())) {
    throw new Error(
      'El destino es tu propia dirección de recepción. Usa una dirección externa para retirar a onchain.',
    );
  }

  const ramps = new Ramps(walletInstance);
  const { fees } = await walletInstance.arkProvider.getInfo();
  const txId = await ramps.offboard(to, fees, BigInt(amountSats));

  return { success: true, txId };
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
  if (!afterPrefix) return 0;

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

export async function disposeWallet(): Promise<void> {
  if (walletInstance) {
    await walletInstance.dispose();
    walletInstance = null;
    vtxoManagerInstance = null;
  }
}
