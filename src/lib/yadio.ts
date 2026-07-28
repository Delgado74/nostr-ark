export type Currency = 'CUP' | 'USD' | 'EUR';

const YADIO_API = 'https://api.yadio.io';

let currentCurrency: Currency = (localStorage.getItem('currency') as Currency) || 'CUP';

export const setCurrency = (c: Currency) => {
  currentCurrency = c;
  localStorage.setItem('currency', c);
};

export const getCurrency = () => currentCurrency;

export async function getSatsPerUnit(currency: Currency): Promise<number> {
  try {
    const res = await fetch(`${YADIO_API}/json/USD`);
    if (!res.ok) return getFallbackRate(currency);
    const data = await res.json() as {
      BTC?: { price?: number; eur?: number };
      CUP?: { rate?: number };
      EUR?: { rate?: number };
    };

    if (!data.BTC?.price) return getFallbackRate(currency);
    const btcUsd = data.BTC.price;

    switch (currency) {
      case 'USD':
        return btcUsd;
      case 'EUR':
        return data.BTC.eur || Math.round(btcUsd / (data.EUR?.rate || 1));
      case 'CUP':
        return Math.round(btcUsd * (data.CUP?.rate || 675));
      default:
        return getFallbackRate(currency);
    }
  } catch {
    return getFallbackRate(currency);
  }
}

export function getFallbackRate(currency: Currency): number {
  const fallbacks: Record<Currency, number> = {
    CUP: 43000000,
    USD: 64000,
    EUR: 56000,
  };
  return fallbacks[currency];
}

export async function satsToFiat(sats: number, currency: Currency): Promise<string> {
  const rate = await getSatsPerUnit(currency);
  const btc = sats / 100000000;
  const value = btc * rate;
  return formatCurrency(value, currency);
}

export function formatCurrency(value: number, currency: Currency): string {
  const symbols: Record<Currency, string> = { CUP: 'CUP', USD: '$', EUR: '€' };
  const sym = symbols[currency];

  if (currency === 'CUP') {
    return `${sym} ${Math.round(value).toLocaleString('es-ES')}`;
  }
  return `${sym} ${value.toFixed(2)}`;
}

export async function fiatToSats(fiatAmount: number, currency: Currency): Promise<number> {
  const rate = await getSatsPerUnit(currency);
  if (rate === 0) return 0;
  const btc = fiatAmount / rate;
  return Math.round(btc * 100000000);
}
