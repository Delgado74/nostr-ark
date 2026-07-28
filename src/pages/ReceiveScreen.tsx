import { useState, useEffect } from 'react';
import { type NostrKeyPair, getPubkeyHex } from '../lib/nostr';
import { getArkAddress } from '../lib/ark';
import { satsToFiat, getCurrency } from '../lib/yadio';
import { tFunc } from '../lib/i18n';
import { Clipboard } from '@capacitor/clipboard';

interface Props {
  keypair: NostrKeyPair;
  onNavigate: (page: string) => void;
}

export function ReceiveScreen({ keypair, onNavigate }: Props) {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [copied, setCopied] = useState(false);
  const [arkAddress, setArkAddress] = useState('');
  const [fiatValue, setFiatValue] = useState('...');

  const pubkeyHex = getPubkeyHex(keypair);

  useEffect(() => {
    getArkAddress(pubkeyHex).then(setArkAddress);
  }, [pubkeyHex]);

  useEffect(() => {
    if (amount && Number(amount) > 0) {
      satsToFiat(Number(amount), getCurrency()).then(setFiatValue);
    } else {
      setFiatValue('...');
    }
  }, [amount]);

  const handleCopy = async () => {
    try {
      await Clipboard.write({ string: arkAddress });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div>
      <div className="header">
        <button className="header-btn" onClick={() => onNavigate('dash')}>
          ←
        </button>
        <h1>{tFunc('receive.title')}</h1>
        <div style={{ width: 28 }}></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: 8,
            fontSize: 13,
            color: 'var(--text2)',
          }}
        >
          {tFunc('receive.ark')}
        </div>
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 64 }}>⚡</span>
            <div
              style={{
                fontSize: 10,
                color: '#333',
                marginTop: 8,
                fontFamily: 'monospace',
                maxWidth: 200,
                wordBreak: 'break-all',
              }}
            >
              {arkAddress}
            </div>
          </div>
        </div>
      </div>

      <div className="input-group">
        <label>{tFunc('receive.amountLabel')}</label>
        <input
          className="input"
          type="number"
          placeholder={tFunc('receive.amountPlaceholder')}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {fiatValue !== '...' && (
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
            ≈ {fiatValue}
          </div>
        )}
      </div>

      <div className="input-group">
        <label>{tFunc('receive.memoLabel')}</label>
        <input
          className="input"
          placeholder={tFunc('receive.memoPlaceholder')}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <button className="btn btn-primary" onClick={handleCopy}>
        {copied
          ? `✓ ${tFunc('receive.copied')}`
          : `📋 ${tFunc('receive.copyAddress')}`}
      </button>
    </div>
  );
}
