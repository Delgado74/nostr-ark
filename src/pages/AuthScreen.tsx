import { useState } from 'react';
import { generateKeyPair, importFromNsec, type NostrKeyPair } from '../lib/nostr';
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

  const handleCreate = async () => {
    setCreating(true);
    try {
      const kp = generateKeyPair();
      await storage.set(KEYS.NSEC, kp.nsec);
      await storage.set(KEYS.NPUB, kp.npub);
      onAuthenticated(kp);
    } catch {
      setError(tFunc('auth.importError'));
    } finally {
      setCreating(false);
    }
  };

  const handleImport = async () => {
    try {
      const kp = importFromNsec(nsecInput);
      await storage.set(KEYS.NSEC, kp.nsec);
      await storage.set(KEYS.NPUB, kp.npub);
      onAuthenticated(kp);
    } catch {
      setError(tFunc('auth.importError'));
    }
  };

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
