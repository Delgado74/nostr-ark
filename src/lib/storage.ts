import { Preferences } from '@capacitor/preferences';

export const storage = {
  async get(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  },

  async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  },

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  },

  async clear(): Promise<void> {
    await Preferences.clear();
  },
};

export const KEYS = {
  NSEC: 'nostrark_nsec',
  NPUB: 'nostrark_npub',
  LANG: 'nostrark_lang',
  CURRENCY: 'nostrark_currency',
  TXS: 'nostrark_transactions',
  BALANCE: 'nostrark_balance',
  LNBITS_URL: 'nostrark_lnbits_url',
  LNBITS_KEY: 'nostrark_lnbits_key',
};
