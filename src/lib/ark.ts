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
  return `ark1${pubkeyHex}`;
}

export async function createLightningInvoice(
  amountSats: number,
  memo: string,
  pubkeyHex: string
): Promise<string> {
  return `lnbc${amountSats}${pubkeyHex.slice(0, 20)}`;
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
