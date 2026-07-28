import React, { useState, useEffect, useCallback } from 'react';
import { type NostrKeyPair } from './lib/nostr';
import { type ArkBalance, type ArkTransaction, getBalance } from './lib/ark';
import { storage, KEYS } from './lib/storage';
import { tFunc, getNetwork } from './lib/i18n';
import { AuthScreen } from './pages/AuthScreen';
import { Dashboard } from './pages/Dashboard';
import { SendScreen } from './pages/SendScreen';
import { ReceiveScreen } from './pages/ReceiveScreen';
import { HistoryScreen } from './pages/HistoryScreen';
import { SettingsScreen } from './pages/SettingsScreen';

export const App: React.FC = () => {
  const [keypair, setKeypair] = useState<NostrKeyPair | null>(null);
  const [page, setPage] = useState('auth');
  const [balance, setBalance] = useState<ArkBalance>({ confirmed: 0, pending: 0 });
  const [transactions, setTransactions] = useState<ArkTransaction[]>([]);
  const [network, setNetworkState] = useState(getNetwork());

  useEffect(() => {
    const load = async () => {
      const nsec = await storage.get(KEYS.NSEC);
      if (nsec) {
        try {
          const { importFromNsec } = await import('./lib/nostr');
          const kp = importFromNsec(nsec);
          setKeypair(kp);
          setPage('dash');
        } catch {
          setPage('auth');
        }
      }
    };
    load();
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!keypair) return;
    const pubkeyHex = Array.from(keypair.pubkey).map(b => b.toString(16).padStart(2, '0')).join('');
    const b = await getBalance(pubkeyHex);
    setBalance(b);
  }, [keypair]);

  useEffect(() => {
    if (keypair) refreshBalance();
  }, [keypair, refreshBalance]);

  const handleTx = useCallback((tx: ArkTransaction) => {
    setTransactions((prev) => [tx, ...prev]);
    refreshBalance();
  }, [refreshBalance]);

  const handleLogout = useCallback(() => {
    setKeypair(null);
    setPage('auth');
  }, []);

  const handleNetworkChange = useCallback(() => {
    setNetworkState(getNetwork());
    refreshBalance();
  }, [refreshBalance]);

  if (page === 'auth' || !keypair) {
    return <AuthScreen onAuthenticated={(kp) => { setKeypair(kp); setPage('dash'); }} />;
  }

  return (
    <div className="app">
      {page === 'dash' && (
        <Dashboard keypair={keypair} onNavigate={setPage} balance={balance} />
      )}
      {page === 'send' && (
        <SendScreen keypair={keypair} onNavigate={setPage} onTx={handleTx} />
      )}
      {page === 'receive' && (
        <ReceiveScreen keypair={keypair} onNavigate={setPage} />
      )}
      {page === 'history' && (
        <HistoryScreen transactions={transactions} onNavigate={setPage} />
      )}
      {page === 'settings' && (
        <SettingsScreen keypair={keypair} onNavigate={setPage} onLogout={handleLogout} onNetworkChange={handleNetworkChange} />
      )}

      {page !== 'auth' && (
        <nav className="bottom-nav">
          <button className={`nav-item ${page === 'dash' ? 'active' : ''}`} onClick={() => setPage('dash')}>
            <span className="nav-icon">🏠</span>
          </button>
          <button className={`nav-item ${page === 'history' ? 'active' : ''}`} onClick={() => setPage('history')}>
            <span className="nav-icon">⏱</span>
          </button>
          <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}>
            <span className="nav-icon">⚙</span>
          </button>
        </nav>
      )}
    </div>
  );
};
