import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, Currency, TranslationKeys } from './i18n';
import { getCurrency, saveCurrency } from './storage';

interface AppContextType {
  language: Language;
  currency: Currency;
  t: TranslationKeys;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');
  const [currency, setCurrencyState] = useState<Currency>('CUP');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const savedCurrency = await getCurrency();
    if (savedCurrency === 'CUP' || savedCurrency === 'USD' || savedCurrency === 'EUR') {
      setCurrencyState(savedCurrency);
    }
  }

  function setLanguage(lang: Language) {
    setLanguageState(lang);
  }

  async function setCurrency(curr: Currency) {
    setCurrencyState(curr);
    await saveCurrency(curr);
  }

  const t = translations[language];

  return (
    <AppContext.Provider value={{ language, currency, t, setLanguage, setCurrency }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
