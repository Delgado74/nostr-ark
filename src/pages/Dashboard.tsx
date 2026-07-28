import { useState, useEffect } from 'react';
import { type NostrKeyPair, shortPubkey } from '../lib/nostr';
import { type ArkBalance } from '../lib/ark';
import { satsToFiat, getCurrency } from '../lib/yadio';
import { tFunc, getNetwork } from '../lib/i18n';

interface Props {
  keypair: NostrKeyPair;
  onNavigate: (page: string) => void;
  balance: ArkBalance;
}

function pubkeyToHex(keypair: NostrKeyPair): string {
  return Array.from(keypair.pubkey)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function Dashboard({ keypair, onNavigate, balance }: Props) {
  const [fiatValue, setFiatValue] = useState('...');
  const pubkeyHex = pubkeyToHex(keypair);
  const network = getNetwork();

  useEffect(() => {
    satsToFiat(balance.confirmed, getCurrency()).then(setFiatValue);
  }, [balance.confirmed]);

  return (
    <div>
      <div className="header">
        <h1>NostrArk</h1>
        <button className="header-btn" onClick={() => onNavigate('settings')}>
          ⚙
        </button>
      </div>

      <div className={`network-badge ${network}`}>
        <span className="dot"></span>
        {network === 'mainnet' ? tFunc('dash.mainnet') : tFunc('dash.testnet')}
      </div>

      <div className="balance-section">
        <div className="balance-label">{tFunc('dash.balance')}</div>
        <div className="balance-sats">
          {balance.confirmed.toLocaleString('es-ES')} sats
        </div>
        <div className="balance-fiat">≈ {fiatValue}</div>
        {balance.pending > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
            +{balance.pending.toLocaleString('es-ES')} pending
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
