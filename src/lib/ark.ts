const ARK_ASP_URL = 'https://arkade.computer';
const ARK_ASP_PUBKEY = '';

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

export async function getArkAddress(pubkeyHex: string): Promise<string> {
  // Ark v3+ address format
  return `ark1p${pubkeyHex}`;
}

export async function createLightningInvoice(
  amountSats: number,
  memo: string,
  pubkeyHex: string
): Promise<string> {
  // Lightning invoice format (simplified for demo)
  // In production, this would call an LND/CLN node to generate a real invoice
  const timestamp = Math.floor(Date.now() / 1000);
  const prefix = amountSats > 0 ? 'lnbc' : 'lnbc';
  return `${prefix}${amountSats}${timestamp}${pubkeyHex.slice(0, 16)}`;
}

export async function getOnchainAddress(pubkeyHex: string): Promise<string> {
  // On-chain address format (simplified for demo)
  // In production, this would derive from the pubkey using proper Bitcoin address derivation
  return `bc1q${pubkeyHex.slice(0, 38)}`;
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
