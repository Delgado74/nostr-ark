import React, { useState, useEffect, useCallback, useRef } from 'react';
import { type NostrKeyPair, getPrivkeyHex } from './lib/nostr';
import { type ArkBalance, type ArkTransaction, type VtxoInfo, initArkWallet, getBalance, getTransactions, renewVtxos, recoverVtxos, getRecoverableBalance, finalizePendingTxs, resetWallet } from './lib/ark';
import * as lnbits from './lib/lnbits';
import { storage, KEYS } from './lib/storage';
import { tFunc } from './lib/i18n';
import { AuthScreen } from './pages/AuthScreen';
import { Dashboard } from './pages/Dashboard';
import { SendScreen } from './pages/SendScreen';
import { ReceiveScreen } from './pages/ReceiveScreen';
import { HistoryScreen } from './pages/HistoryScreen';
import { SettingsScreen } from './pages/SettingsScreen';

export const App: React.FC = () => {
  const [keypair, setKeypair] = useState<NostrKeyPair | null>(null);
  const [page, setPage] = useState('auth');
  const [balance, setBalance] = useState<ArkBalance>({
    confirmed: 0,
    pending: 0,
    recoverable: 0,
    total: 0,
    onchain: { confirmed: 0, unconfirmed: 0, total: 0 },
  });
  const [lnbitsBalance, setLnbitsBalance] = useState(0);
  const [transactions, setTransactions] = useState<ArkTransaction[]>([]);
  const [vtxos, setVtxos] = useState<VtxoInfo[]>([]);
  const [recoverable, setRecoverable] = useState(0);
  const [walletReady, setWalletReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');
  const onboardingRef = useRef(false);
  const refreshTimerRef = useRef<number | null>(null);

  const refreshData = useCallback(async () => {
    if (!walletReady) return;
    try {
      const [b, txs, vtxoList, recBal, lnTx] = await Promise.all([
        getBalance(),
        getTransactions(),
        import('./lib/ark').then(m => m.getVtxos()),
        getRecoverableBalance(),
        lnbits.isConnected().then(c => c ? lnbits.getTransactions() : []),
      ]);
      setBalance(b);
      setVtxos(vtxoList);
      setRecoverable(recBal);

      const lnBal = await lnbits.isConnected().then(c => c ? lnbits.getBalance() : 0);
      setLnbitsBalance(lnBal);

      const seen = new Map<string, ArkTransaction>();
      for (const tx of [...txs, ...lnTx]) {
        let existing = seen.get(tx.id);
        if (!existing) {
          seen.set(tx.id, tx);
        } else if (tx.network === 'lightning' && existing.status !== 'success' && tx.status === 'success') {
          seen.set(tx.id, tx);
        } else if (tx.timestamp > existing.timestamp) {
          seen.set(tx.id, tx);
        }
      }
      const allTxs = Array.from(seen.values()).sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(allTxs);
    } catch (err) {
      console.error('refreshData failed:', err);
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
      refreshTimerRef.current = window.setInterval(refreshData, 60000);
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
    setBalance({
      confirmed: 0,
      pending: 0,
      recoverable: 0,
      total: 0,
      onchain: { confirmed: 0, unconfirmed: 0, total: 0 },
    });
    setLnbitsBalance(0);
    setTransactions([]);
    setVtxos([]);
    setRecoverable(0);
    setPage('auth');
  }, []);

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

  const handleOnboard = useCallback(async (amountSats?: number) => {
    if (onboardingRef.current) return;
    onboardingRef.current = true;
    setOnboarding(true);
    setOnboardingError('');
    let ok = false;
    try {
      const m = await import('./lib/ark');
      await m.onboardToArk(amountSats);
      ok = true;
      setOnboardingError('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setOnboardingError(msg);
      console.error('onboard failed:', msg);
    } finally {
      onboardingRef.current = false;
      setOnboarding(false);
      if (ok) await refreshData();
    }
  }, [refreshData]);

  useEffect(() => {
    if (!walletReady) return;
    const tryAutoOnboard = () => {
      if (balance.onchain.confirmed > 0 && !onboardingRef.current) {
        void handleOnboard();
      }
    };
    tryAutoOnboard();
    const id = window.setInterval(tryAutoOnboard, 60000);
    return () => clearInterval(id);
  }, [walletReady, balance.onchain.confirmed, handleOnboard]);

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
          lnbitsBalance={lnbitsBalance}
          vtxos={vtxos}
          recoverable={recoverable}
          onRenew={handleRenew}
          onRecover={handleRecover}
          onRetryOnboard={handleOnboard}
          renewing={renewing}
          recovering={recovering}
          onboarding={onboarding}
          onboardingError={onboardingError}
        />
      )}
      {page === 'send' && (
        <SendScreen keypair={keypair} onNavigate={setPage} onTx={handleTx} balance={balance} lnbitsBalance={lnbitsBalance} />
      )}
      {page === 'receive' && (
        <ReceiveScreen keypair={keypair} onNavigate={setPage} onPaymentReceived={refreshData} />
      )}
      {page === 'history' && (
        <HistoryScreen transactions={transactions} onNavigate={setPage} />
      )}
      {page === 'settings' && (
        <SettingsScreen keypair={keypair} onNavigate={setPage} onLogout={handleLogout} />
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
