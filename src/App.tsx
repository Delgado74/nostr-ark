import React, { useState, useEffect, useCallback, useRef } from 'react';
import { type NostrKeyPair, getPrivkeyHex } from './lib/nostr';
import { type ArkBalance, type ArkTransaction, type VtxoInfo, initArkWallet, getBalance, getTransactions, renewVtxos, recoverVtxos, getRecoverableBalance, finalizePendingTxs, resetWallet } from './lib/ark';
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
  const [balance, setBalance] = useState<ArkBalance>({ confirmed: 0, pending: 0, recoverable: 0, total: 0 });
  const [transactions, setTransactions] = useState<ArkTransaction[]>([]);
  const [network, setNetworkState] = useState(getNetwork());
  const [vtxos, setVtxos] = useState<VtxoInfo[]>([]);
  const [recoverable, setRecoverable] = useState(0);
  const [walletReady, setWalletReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);

  const refreshData = useCallback(async () => {
    if (!walletReady) return;
    try {
      const [b, txs, vtxoList, recBal] = await Promise.all([
        getBalance(),
        getTransactions(),
        import('./lib/ark').then(m => m.getVtxos()),
        getRecoverableBalance(),
      ]);
      setBalance(b);
      setTransactions(txs);
      setVtxos(vtxoList);
      setRecoverable(recBal);
    } catch {
      // silent fail
    }
  }, [walletReady]);

  const handleInitWallet = useCallback(async (privkeyHex: string) => {
    try {
      await initArkWallet(privkeyHex);
      setWalletReady(true);
      await finalizePendingTxs();
    } catch (err) {
      console.error('Failed to init wallet:', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const nsec = await storage.get(KEYS.NSEC);
      if (nsec) {
        try {
          const { importFromNsec, getPrivkeyHex: pkHex } = await import('./lib/nostr');
          const kp = importFromNsec(nsec);
          setKeypair(kp);
          setPage('dash');
          const privkeyHex = pkHex(kp);
          await handleInitWallet(privkeyHex);
        } catch {
          setPage('auth');
        }
      }
      setLoading(false);
    };
    load();
  }, [handleInitWallet]);

  useEffect(() => {
    if (walletReady) {
      refreshData();
      refreshTimerRef.current = window.setInterval(refreshData, 30000);
      return () => {
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      };
    }
  }, [walletReady, refreshData]);

  useEffect(() => {
    if (walletReady) {
      const autoRenew = async () => {
        try {
          const expiring = await import('./lib/ark').then(m => m.getExpiringVtxos());
          if (expiring.length > 0) {
            await renewVtxos();
            await refreshData();
          }
        } catch {
          // silent fail
        }
      };
      autoRenew();
      const renewInterval = window.setInterval(autoRenew, 6 * 60 * 60 * 1000);
      return () => clearInterval(renewInterval);
    }
  }, [walletReady, refreshData]);

  const handleAuthenticated = useCallback(async (kp: NostrKeyPair) => {
    setKeypair(kp);
    setPage('dash');
    const privkeyHex = getPrivkeyHex(kp);
    await handleInitWallet(privkeyHex);
  }, [handleInitWallet]);

  const handleTx = useCallback((_tx: ArkTransaction) => {
    refreshData();
  }, [refreshData]);

  const handleLogout = useCallback(async () => {
    await resetWallet();
    setWalletReady(false);
    setKeypair(null);
    setBalance({ confirmed: 0, pending: 0, recoverable: 0, total: 0 });
    setTransactions([]);
    setVtxos([]);
    setRecoverable(0);
    setPage('auth');
  }, []);

  const handleNetworkChange = useCallback(async () => {
    setNetworkState(getNetwork());
    if (keypair) {
      await resetWallet();
      setWalletReady(false);
      const privkeyHex = getPrivkeyHex(keypair);
      await handleInitWallet(privkeyHex);
    }
  }, [keypair, handleInitWallet]);

  const handleRenew = useCallback(async () => {
    setRenewing(true);
    try {
      await renewVtxos();
      await refreshData();
    } finally {
      setRenewing(false);
    }
  }, [refreshData]);

  const handleRecover = useCallback(async () => {
    setRecovering(true);
    try {
      await recoverVtxos();
      await refreshData();
    } finally {
      setRecovering(false);
    }
  }, [refreshData]);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (page === 'auth' || !keypair) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="app">
      {page === 'dash' && (
        <Dashboard
          keypair={keypair}
          onNavigate={setPage}
          balance={balance}
          vtxos={vtxos}
          recoverable={recoverable}
          onRenew={handleRenew}
          onRecover={handleRecover}
          renewing={renewing}
          recovering={recovering}
        />
      )}
      {page === 'send' && (
        <SendScreen keypair={keypair} onNavigate={setPage} onTx={handleTx} balance={balance} />
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
