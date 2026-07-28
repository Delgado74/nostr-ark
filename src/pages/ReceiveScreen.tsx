import { useState, useEffect, useRef } from 'react';
import { type NostrKeyPair, getPubkeyHex } from '../lib/nostr';
import { getArkAddress, createLightningInvoice, getOnchainAddress } from '../lib/ark';
import { satsToFiat, getCurrency } from '../lib/yadio';
import { tFunc } from '../lib/i18n';
import { Clipboard } from '@capacitor/clipboard';
import QRCode from 'qrcode';

type NetworkType = 'lightning' | 'ark' | 'onchain';

interface Props {
  keypair: NostrKeyPair;
  onNavigate: (page: string) => void;
}

export function ReceiveScreen({ keypair, onNavigate }: Props) {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [copied, setCopied] = useState(false);
  const [address, setAddress] = useState('');
  const [fiatValue, setFiatValue] = useState('...');
  const [networkType, setNetworkType] = useState<NetworkType>('ark');
  const qrRef = useRef<HTMLCanvasElement>(null);

  const pubkeyHex = getPubkeyHex(keypair);

  useEffect(() => {
    const loadAddress = async () => {
      let addr = '';
      switch (networkType) {
        case 'ark':
          addr = await getArkAddress(pubkeyHex);
          break;
        case 'lightning':
          addr = await createLightningInvoice(
            amount ? Number(amount) : 0,
            memo,
            pubkeyHex
          );
          break;
        case 'onchain':
          addr = await getOnchainAddress(pubkeyHex);
          break;
      }
      setAddress(addr);
    };
    loadAddress();
  }, [networkType, pubkeyHex, amount, memo]);

  useEffect(() => {
    if (amount && Number(amount) > 0) {
      satsToFiat(Number(amount), getCurrency()).then(setFiatValue);
    } else {
      setFiatValue('...');
    }
  }, [amount]);

  useEffect(() => {
    if (qrRef.current && address) {
      QRCode.toCanvas(qrRef.current, address, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  }, [address]);

  const handleCopy = async () => {
    try {
      await Clipboard.write({ string: address });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const networkLabel = {
    lightning: tFunc('receive.lightning'),
    ark: tFunc('receive.ark'),
    onchain: tFunc('receive.onchain'),
  };

  const networkIcon = {
    lightning: '⚡',
    ark: '🔗',
    onchain: '₿',
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

      <div className="network-tabs">
        {(['lightning', 'ark', 'onchain'] as NetworkType[]).map((type) => (
          <button
            key={type}
            className={`network-tab ${networkType === type ? 'active' : ''}`}
            onClick={() => setNetworkType(type)}
          >
            {networkIcon[type]} {networkLabel[type]}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: 12,
            fontSize: 13,
            color: 'var(--text2)',
          }}
        >
          {networkLabel[networkType]}
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
          <canvas ref={qrRef} />
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text2)',
            wordBreak: 'break-all',
            textAlign: 'center',
            padding: '0 8px',
            lineHeight: 1.4,
          }}
        >
          {address}
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
          : `📎 ${tFunc('receive.copyAddress')}`}
      </button>
    </div>
  );
}
