import { useState } from 'react';
import { type NostrKeyPair } from '../lib/nostr';
import { storage } from '../lib/storage';
import { setLang, getLang, tFunc, type Lang } from '../lib/i18n';
import { setCurrency, getCurrency, type Currency } from '../lib/yadio';
import { Clipboard } from '@capacitor/clipboard';

interface Props {
  keypair: NostrKeyPair;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function SettingsScreen({ keypair, onNavigate, onLogout }: Props) {
  const [showBackup, setShowBackup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCopyNsec = async () => {
    try {
      await Clipboard.write({ string: keypair.nsec });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await storage.clear();
    onLogout();
  };

  return (
    <div>
      <div className="header">
        <button className="header-btn" onClick={() => onNavigate('dash')}>
          ←
        </button>
        <h1>{tFunc('settings.title')}</h1>
        <div style={{ width: 28 }}></div>
      </div>

      <div className="card">
        <div className="setting-item">
          <span className="setting-label">🌐 {tFunc('settings.language')}</span>
          <select
            className="input"
            style={{ width: 'auto', padding: '8px 12px', fontSize: 14 }}
            value={getLang()}
            onChange={(e) => setLang(e.target.value as Lang)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="setting-item">
          <span className="setting-label">💱 {tFunc('settings.currency')}</span>
          <select
            className="input"
            style={{ width: 'auto', padding: '8px 12px', fontSize: 14 }}
            value={getCurrency()}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            <option value="CUP">CUP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div
          className="setting-item"
          style={{ cursor: 'pointer' }}
          onClick={() => setShowBackup(true)}
        >
          <span className="setting-label">🔑 {tFunc('settings.backup')}</span>
          <span className="setting-value">→</span>
        </div>

        <div className="setting-item">
          <span className="setting-label">ℹ️ {tFunc('settings.about')}</span>
          <span className="setting-value">{tFunc('settings.version')}</span>
        </div>
      </div>

      <button
        className="btn btn-danger"
        onClick={handleDelete}
        style={{ marginTop: 16 }}
      >
        {confirmDelete
          ? tFunc('settings.deleteConfirm')
          : `🗑 ${tFunc('settings.delete')}`}
      </button>

      {showBackup && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowBackup(false);
            setConfirmDelete(false);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {tFunc('settings.backupTitle')}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text2)',
                marginBottom: 16,
              }}
            >
              {tFunc('settings.backupWarning')}
            </p>
            <div
              style={{
                background: 'var(--surface2)',
                padding: 16,
                borderRadius: 12,
                wordBreak: 'break-all',
                fontSize: 13,
                fontFamily: 'monospace',
                marginBottom: 16,
              }}
            >
              {keypair.nsec}
            </div>
            <button className="btn btn-primary" onClick={handleCopyNsec}>
              {copied
                ? '✓ Copiado'
                : `📋 ${tFunc('settings.copyNsec')}`}
            </button>
            <button
              className="btn btn-secondary"
              style={{ marginTop: 8 }}
              onClick={() => setShowBackup(false)}
            >
              {tFunc('settings.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
