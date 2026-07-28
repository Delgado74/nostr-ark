import { useState, useEffect } from 'react';
import { type NostrKeyPair } from '../lib/nostr';
import { storage } from '../lib/storage';
import { setLang, getLang, tFunc, type Lang, setNetwork, getNetwork, type Network } from '../lib/i18n';
import { setCurrency, getCurrency, type Currency } from '../lib/yadio';
import { Clipboard } from '@capacitor/clipboard';
import * as lnbits from '../lib/lnbits';
import { QrScanner } from '../components/QrScanner';

interface Props {
  keypair: NostrKeyPair;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onNetworkChange: () => void;
}

export function SettingsScreen({ keypair, onNavigate, onLogout, onNetworkChange }: Props) {
  const [showBackup, setShowBackup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lnbitsConnected, setLnbitsConnected] = useState(false);
  const [lnbitsName, setLnbitsName] = useState('');
  const [showLnbitsModal, setShowLnbitsModal] = useState(false);
  const [lnbitsUrl, setLnbitsUrl] = useState('');
  const [lnbitsKey, setLnbitsKey] = useState('');
  const [lnbitsError, setLnbitsError] = useState('');
  const [lnbitsLoading, setLnbitsLoading] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  useEffect(() => {
    const checkLnbits = async () => {
      const connected = await lnbits.isConnected();
      setLnbitsConnected(connected);
      if (connected) {
        try {
          const wallet = await lnbits.getWalletDetails();
          setLnbitsName(wallet.name);
        } catch {
          // ignore
        }
      }
    };
    checkLnbits();
  }, []);

  const handleQrScanResult = async (data: string) => {
    setShowQrScanner(false);
    setLnbitsLoading(true);
    setLnbitsError('');

    const raw = data.replace(/^lightning:/, '').trim();
    let extractedKey = raw;
    try {
      const parsed = JSON.parse(raw);
      extractedKey = parsed.admin || parsed.invoice || parsed.key || raw;
      if (parsed.url) {
        setLnbitsUrl(parsed.url);
      }
    } catch {
      // plain key
    }

    setLnbitsKey(extractedKey);

    try {
      const success = await lnbits.connect(data);
      if (success) {
        setLnbitsConnected(true);
        setShowLnbitsModal(false);
        const wallet = await lnbits.getWalletDetails();
        setLnbitsName(wallet.name);
      }
    } catch {
      setLnbitsError(tFunc('settings.lnbitsError'));
    } finally {
      setLnbitsLoading(false);
    }
  };

  const handleConnectLnbitsManual = async () => {
    if (!lnbitsUrl || !lnbitsKey) return;
    setLnbitsLoading(true);
    setLnbitsError('');
    try {
      const success = await lnbits.connectManual(lnbitsUrl, lnbitsKey);
      if (success) {
        setLnbitsConnected(true);
        setShowLnbitsModal(false);
        const wallet = await lnbits.getWalletDetails();
        setLnbitsName(wallet.name);
      } else {
        setLnbitsError(tFunc('settings.lnbitsError'));
      }
    } catch {
      setLnbitsError(tFunc('settings.lnbitsError'));
    } finally {
      setLnbitsLoading(false);
    }
  };

  const handleDisconnectLnbits = async () => {
    await lnbits.disconnect();
    setLnbitsConnected(false);
    setLnbitsName('');
  };

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

  const handleNetworkChange = (network: Network) => {
    setNetwork(network);
    onNetworkChange();
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

        <div className="setting-item">
          <span className="setting-label">⛓ {tFunc('settings.network')}</span>
          <select
            className="input"
            style={{ width: 'auto', padding: '8px 12px', fontSize: 14 }}
            value={getNetwork()}
            onChange={(e) => handleNetworkChange(e.target.value as Network)}
          >
            <option value="mainnet">{tFunc('settings.mainnet')}</option>
            <option value="signet">{tFunc('settings.signet')}</option>
          </select>
        </div>

        <div className="setting-item">
          <span className="setting-label">⚡ LNbits</span>
          {lnbitsConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--green)' }}>
                ✓ {lnbitsName || tFunc('settings.lnbitsConnected')}
              </span>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDisconnectLnbits}
              >
                {tFunc('settings.lnbitsDisconnect')}
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowLnbitsModal(true)}
            >
              {tFunc('settings.lnbits')} →
            </button>
          )}
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

      {showLnbitsModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowLnbitsModal(false);
            setLnbitsError('');
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              ⚡ {tFunc('settings.lnbits')}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text2)',
                marginBottom: 16,
              }}
            >
              {tFunc('settings.scanQrInfo')}
            </p>

            <button
              className="btn btn-primary"
              onClick={() => setShowQrScanner(true)}
              disabled={lnbitsLoading}
              style={{ marginBottom: 8 }}
            >
              {lnbitsLoading ? '...' : `📷 ${tFunc('settings.scanQr')}`}
            </button>

            {showQrScanner && (
              <QrScanner
                onScan={handleQrScanResult}
                onClose={() => setShowQrScanner(false)}
              />
            )}

            <div
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--text2)',
                margin: '12px 0',
              }}
            >
              — {tFunc('settings.lnbitsManual')} —
            </div>

            <div className="input-group">
              <label>{tFunc('settings.lnbitsUrl')}</label>
              <input
                className="input"
                placeholder="Introduce la URL manualmente"
                value={lnbitsUrl}
                onChange={(e) => setLnbitsUrl(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>{tFunc('settings.lnbitsKey')}</label>
              <input
                className="input"
                type="password"
                placeholder="Escanea QR en tu billetera LNbits"
                value={lnbitsKey}
                onChange={(e) => setLnbitsKey(e.target.value)}
              />
            </div>

            {lnbitsError && (
              <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
                {lnbitsError}
              </p>
            )}

            <button
              className="btn btn-primary"
              onClick={handleConnectLnbitsManual}
              disabled={lnbitsLoading || !lnbitsUrl || !lnbitsKey}
            >
              {lnbitsLoading ? '...' : `⚡ ${tFunc('settings.lnbitsConnect')}`}
            </button>

            <button
              className="btn btn-secondary"
              style={{ marginTop: 8 }}
              onClick={() => {
                setShowLnbitsModal(false);
                setLnbitsError('');
              }}
            >
              {tFunc('settings.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
