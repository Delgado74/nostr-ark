const YADIO_API = 'https://api.yadio.io/v2';

export interface CurrencyRate {
  currency: string;
  price: number;
  timestamp: number;
}

let cachedRates: { [key: string]: CurrencyRate } = {};
let lastFetch: number = 0;
const CACHE_DURATION = 60000; // 1 minute

export async function getRate(currency: string): Promise<number> {
  const now = Date.now();
  
  if (cachedRates[currency] && now - lastFetch < CACHE_DURATION) {
    return cachedRates[currency].price;
  }

  try {
    const response = await fetch(`${YADIO_API}/exchange/BTC/${currency}`);
    const data = await response.json();
    
    const rate: CurrencyRate = {
      currency,
      price: data.rate,
      timestamp: now,
    };
    
    cachedRates[currency] = rate;
    lastFetch = now;
    
    return data.rate;
  } catch (error) {
    console.error('Error fetching rate:', error);
    if (cachedRates[currency]) {
      return cachedRates[currency].price;
    }
    throw new Error('Failed to fetch exchange rate');
  }
}

export async function satsToFiat(sats: number, currency: string): Promise<number> {
  const rate = await getRate(currency);
  const btc = sats / 100000000;
  return btc * rate;
}

export async function fiatToSats(fiat: number, currency: string): Promise<number> {
  const rate = await getRate(currency);
  const btc = fiat / rate;
  return Math.round(btc * 100000000);
}

export async function getMultipleRates(sats: number, currencies: string[]): Promise<{ [key: string]: number }> {
  const results: { [key: string]: number } = {};
  
  for (const currency of currencies) {
    results[currency] = await satsToFiat(sats, currency);
  }
  
  return results;
}

export function formatSats(sats: number): string {
  return new Intl.NumberFormat('en-US').format(sats);
}

export function formatFiat(amount: number, currency: string): string {
  const symbols: { [key: string]: string } = {
    CUP: '₱',
    USD: '$',
    EUR: '€',
  };
  
  const symbol = symbols[currency] || currency;
  return `${symbol}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}
