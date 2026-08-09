import { useState } from 'react';
import { generateKeyPair, importFromNsec, type NostrKeyPair } from '../lib/nostr';
import { generateMnemonicKeypair, importFromMnemonic, isMnemonic, type MnemonicKeypair } from '../lib/mnemonic';
import { storage, KEYS } from '../lib/storage';
import { tFunc } from '../lib/i18n';

interface Props {
  onAuthenticated: (keypair: NostrKeyPair) => void;
}

export function AuthScreen({ onAuthenticated }: Props) {
  const [importMode, setImportMode] = useState(false);
  const [nsecInput, setNsecInput] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingMnemonic, setPendingMnemonic] = useState<MnemonicKeypair | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const mkp = generateMnemonicKeypair();
      await storage.set(KEYS.NSEC, mkp.keypair.nsec);
      await storage.set(KEYS.NPUB, mkp.keypair.npub);
      await storage.set(KEYS.MNEMONIC, mkp.mnemonic);
      setPendingMnemonic(mkp);
    } catch {
      setError(tFunc('auth.importError'));
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmWords = () => {
    if (pendingMnemonic) {
      onAuthenticated(pendingMnemonic.keypair);
    }
  };

  const handleBackToCreate = () => {
    setPendingMnemonic(null);
  };

  const handleImport = async () => {
    try {
      if (isMnemonic(nsecInput)) {
        const mkp = importFromMnemonic(nsecInput);
        await storage.set(KEYS.NSEC, mkp.keypair.nsec);
        await storage.set(KEYS.NPUB, mkp.keypair.npub);
        await storage.set(KEYS.MNEMONIC, mkp.mnemonic);
        onAuthenticated(mkp.keypair);
      } else {
        const kp = importFromNsec(nsecInput);
        await storage.set(KEYS.NSEC, kp.nsec);
        await storage.set(KEYS.NPUB, kp.npub);
        onAuthenticated(kp);
      }
    } catch {
      setError(tFunc('auth.importError'));
    }
  };

  if (pendingMnemonic) {
    const words = pendingMnemonic.mnemonic.split(' ');
    return (
      <div className="auth-screen">
        <div className="auth-logo">✍️</div>
        <h1 className="auth-title">{tFunc('auth.wordsTitle')}</h1>
        <p className="auth-subtitle">{tFunc('auth.wordsWarning')}</p>
        <div className="words-grid">
          {words.map((w, i) => (
            <div key={i} className="word">
              <span className="word-index">{i + 1}</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
        <div className="auth-actions">
          <button className="btn btn-primary" onClick={handleConfirmWords}>
            {tFunc('auth.wordsConfirm')}
          </button>
          <button className="btn btn-secondary" onClick={handleBackToCreate}>
            {tFunc('auth.wordsBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">⚡</div>
      <h1 className="auth-title">{tFunc('auth.title')}</h1>
      <p className="auth-subtitle">{tFunc('auth.subtitle')}</p>

      {!importMode ? (
        <div className="auth-actions">
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? '...' : tFunc('auth.create')}
          </button>
          <button className="btn btn-secondary" onClick={() => setImportMode(true)}>
            {tFunc('auth.import')}
          </button>
        </div>
      ) : (
        <div className="auth-actions">
          <div className="input-group">
            <input
              className="input"
              placeholder={tFunc('auth.importPlaceholder')}
              value={nsecInput}
              onChange={(e) => {
                setNsecInput(e.target.value);
                setError('');
              }}
            />
            {error && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 6 }}>{error}</p>}
          </div>
          <button className="btn btn-primary" onClick={handleImport} disabled={!nsecInput.trim()}>
            {tFunc('auth.importConfirm')}
          </button>
          <button className="btn btn-secondary" onClick={() => setImportMode(false)}>
            ←
          </button>
        </div>
      )}
    </div>
  );
}
