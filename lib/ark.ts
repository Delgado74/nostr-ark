export const ARK_SERVER = 'https://arkade.computer';

export interface WalletBalance {
  sats: number;
  vtxos: number;
}

export interface Transaction {
  id: string;
  amount_sats: number;
  memo?: string;
  type: 'send' | 'receive';
  timestamp: number;
  invoice?: string;
  status: 'pending' | 'confirmed';
  rate_at_time?: number;
  fiat_at_time?: number;
  currency?: string;
}

export interface InvoiceData {
  paymentRequest: string;
  amount: number;
  description?: string;
}

export async function createInvoice(amountSats: number, memo?: string): Promise<InvoiceData> {
  // TODO: Integrate with Arkade SDK when available
  // For now, create a placeholder Lightning invoice
  const invoice = `lnbc${amountSats}n1p...placeholder`;
  
  return {
    paymentRequest: invoice,
    amount: amountSats,
    description: memo,
  };
}

export async function decodeInvoice(invoice: string): Promise<{ amount: number; description?: string }> {
  // TODO: Integrate with Arkade SDK when available
  // For now, return placeholder data
  return {
    amount: 0,
    description: undefined,
  };
}

export async function sendPayment(invoice: string): Promise<boolean> {
  // TODO: Integrate with Arkade SDK when available
  console.log('Sending payment:', invoice);
  return true;
}

export function isLightningInvoice(input: string): boolean {
  return input.startsWith('lnbc') || input.startsWith('lntb') || input.startsWith('lnbcrt');
}

export function isArkAddress(input: string): boolean {
  return input.startsWith('ark1');
}

export function isOnChainAddress(input: string): boolean {
  return input.startsWith('bc1') || input.startsWith('3') || input.startsWith('1');
}

export function detectAddressType(input: string): 'lightning' | 'ark' | 'onchain' | 'unknown' {
  if (isLightningInvoice(input)) return 'lightning';
  if (isArkAddress(input)) return 'ark';
  if (isOnChainAddress(input)) return 'onchain';
  return 'unknown';
}

export function generateArkAddress(publicKey: string): string {
  // TODO: Implement actual Ark address generation
  return `ark1qq${publicKey.slice(0, 40)}...`;
}

export function generateOnChainAddress(publicKey: string): string {
  // TODO: Implement actual on-chain address generation
  return `bc1q${publicKey.slice(0, 38)}...`;
}
