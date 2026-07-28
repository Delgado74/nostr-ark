import { useState, useEffect } from 'react';
import { type NostrKeyPair, shortPubkey, getPubkeyHex } from '../lib/nostr';
import { type ArkBalance, type VtxoInfo } from '../lib/ark';
import { satsToFiat, getCurrency } from '../lib/yadio';
import { tFunc, getNetwork } from '../lib/i18n';

interface Props {
  keypair: NostrKeyPair;
  onNavigate: (page: string) => void;
  balance: ArkBalance;
  vtxos: VtxoInfo[];
  recoverable: number;
  onRenew: () => void;
  onRecover: () => void;
  renewing: boolean;
  recovering: boolean;
}

export function Dashboard({ keypair, onNavigate, balance, vtxos, recoverable, onRenew, onRecover, renewing, recovering }: Props) {
  const [fiatValue, setFiatValue] = useState('...');
  const pubkeyHex = getPubkeyHex(keypair);
  const network = getNetwork();

  useEffect(() => {
    satsToFiat(balance.confirmed, getCurrency()).then(setFiatValue);
  }, [balance.confirmed]);

  const settledCount = vtxos.filter(v => v.state === 'settled').length;
  const preconfirmedCount = vtxos.filter(v => v.state === 'preconfirmed').length;
  const hasVtxos = vtxos.length > 0;
  const hasRecoverable = recoverable > 0;

  return (
    <div>
      <div className="header" style={{ justifyContent: 'center' }}>
        <h1>NostrArk</h1>
      </div>

      <div className={`network-badge ${network}`}>
        <span className="dot"></span>
        {network === 'mainnet' ? tFunc('dash.mainnet') : tFunc('dash.signet')}
      </div>

      <div className="balance-section">
        <div className="balance-label">{tFunc('dash.balance')}</div>
        <div className="balance-sats">
          {balance.confirmed.toLocaleString('es-ES')} sats
        </div>
        <div className="balance-fiat">≈ {fiatValue}</div>
        {balance.pending > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
            +{balance.pending.toLocaleString('es-ES')} {tFunc('dash.pending')}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <button className="btn btn-primary" onClick={() => onNavigate('send')}>
          <span className="btn-icon">↗</span>
          {tFunc('dash.send')}
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate('receive')}>
          <span className="btn-icon">↙</span>
          {tFunc('dash.receive')}
        </button>
      </div>

      {/* VTXO Status Card */}
      <div className="card vtxo-card">
        <div className="vtxo-header">
          <span className="vtxo-title">🔗 {tFunc('dash.vtxoStatus')}</span>
          {hasVtxos && (
            <span className="vtxo-count">{vtxos.length} VTXO{vtxos.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {!hasVtxos ? (
          <div className="vtxo-empty">{tFunc('dash.vtxoEmpty')}</div>
        ) : (
          <div className="vtxo-stats">
            {settledCount > 0 && (
              <div className="vtxo-stat">
                <span className="vtxo-dot settled"></span>
                <span className="vtxo-stat-label">{tFunc('dash.vtxoSettled')}</span>
                <span className="vtxo-stat-value">{settledCount}</span>
              </div>
            )}
            {preconfirmedCount > 0 && (
              <div className="vtxo-stat">
                <span className="vtxo-dot preconfirmed"></span>
                <span className="vtxo-stat-label">{tFunc('dash.vtxoPreconfirmed')}</span>
                <span className="vtxo-stat-value">{preconfirmedCount}</span>
              </div>
            )}
          </div>
        )}

        {hasVtxos && (
          <button
            className="btn btn-secondary btn-sm vtxo-btn"
            onClick={onRenew}
            disabled={renewing}
          >
            {renewing ? `⏳ ${tFunc('dash.vtxoRenewing')}` : `🔄 ${tFunc('dash.vtxoRenew')}`}
          </button>
        )}

        {hasRecoverable && (
          <>
            <div className="vtxo-divider"></div>
            <div className="vtxo-recoverable">
              <div className="vtxo-recoverable-info">
                <span>💰 {recoverable.toLocaleString('es-ES')} sats {tFunc('dash.vtxoRecoverable')}</span>
              </div>
              <button
                className="btn btn-primary btn-sm vtxo-btn"
                onClick={onRecover}
                disabled={recovering}
              >
                {recovering ? `⏳ ${tFunc('dash.vtxoRecovering')}` : `♻️ ${tFunc('dash.vtxoRecover')}`}
              </button>
            </div>
          </>
        )}
      </div>

      <div
        className="card card-sm"
        style={{ cursor: 'pointer' }}
        onClick={() => onNavigate('history')}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            ⏱ {tFunc('dash.history')}
          </span>
          <span style={{ color: 'var(--text2)' }}>→</span>
        </div>
      </div>

      <div className="card card-sm">
        <div style={{ fontSize: 12, color: 'var(--text2)', wordBreak: 'break-all' }}>
          {shortPubkey(pubkeyHex, 16)}
        </div>
      </div>
    </div>
  );
}
