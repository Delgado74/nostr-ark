import { useState, useEffect, useRef } from 'react';
import { type NostrKeyPair, getPubkeyHex } from '../lib/nostr';
import { getArkAddress, getOnchainAddress } from '../lib/ark';
import * as lnbits from '../lib/lnbits';
import { satsToFiat, getCurrency } from '../lib/yadio';
import { tFunc } from '../lib/i18n';
import { Clipboard } from '@capacitor/clipboard';
import QRCode from 'qrcode';

type NetworkType = 'lightning' | 'ark' | 'onchain';

interface Props {
  keypair: NostrKeyPair;
  onNavigate: (page: string) => void;
  onPaymentReceived?: () => void;
}

export function ReceiveScreen({ keypair, onNavigate, onPaymentReceived }: Props) {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [copied, setCopied] = useState(false);
  const [address, setAddress] = useState('');
  const [fiatValue, setFiatValue] = useState('...');
  const [networkType, setNetworkType] = useState<NetworkType>('ark');
  const [lnbitsConnected, setLnbitsConnected] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [paymentHash, setPaymentHash] = useState('');
  const qrRef = useRef<HTMLCanvasElement>(null);
  const pollingRef = useRef<number | null>(null);

  const pubkeyHex = getPubkeyHex(keypair);

  useEffect(() => {
    lnbits.isConnected().then(setLnbitsConnected);
  }, []);

  useEffect(() => {
    if (networkType === 'ark') {
      getArkAddress().then(setAddress).catch(() => setAddress(''));
    } else if (networkType === 'onchain') {
      getOnchainAddress().then(setAddress).catch(() => setAddress(''));
    } else {
      setAddress('');
    }
  }, [networkType, pubkeyHex]);

  const handleGenerateInvoice = async () => {
    if (!lnbitsConnected || !amount || Number(amount) <= 0) return;
    setCreatingInvoice(true);
    try {
      const result = await lnbits.createInvoice(Number(amount), memo);
      setAddress(result.bolt11);
      setPaymentHash(result.payment_hash);
      setPendingPayment(true);
      setPaymentReceived(false);
    } catch {
      setAddress('');
    } finally {
      setCreatingInvoice(false);
    }
  };

  useEffect(() => {
    if (pendingPayment && paymentHash && networkType === 'lightning') {
      pollingRef.current = window.setInterval(async () => {
        try {
          const config = await lnbits.getConfig();
          if (!config) return;
          const res = await fetch(`${config.url}/api/v1/payments/${paymentHash}`, {
            headers: { 'X-Api-Key': config.key },
          });
          if (res.ok) {
            const data = await res.json() as { paid?: boolean; status?: string };
            if (data.paid || data.status === 'success') {
              setPaymentReceived(true);
              setPendingPayment(false);
              if (pollingRef.current) clearInterval(pollingRef.current);
              onPaymentReceived?.();
            }
          }
        } catch {
          // ignore
        }
      }, 3000);
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [pendingPayment, paymentHash, networkType]);

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

  const availableNetworks: NetworkType[] = lnbitsConnected
    ? ['lightning', 'ark', 'onchain']
    : ['ark', 'onchain'];

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
        {availableNetworks.map((type) => (
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
          {creatingInvoice ? 'Creando invoice...' : address}
        </div>

        {paymentReceived && (
          <div style={{
            textAlign: 'center',
            padding: 12,
            background: 'rgba(46, 204, 113, 0.1)',
            borderRadius: 8,
            marginTop: 8,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--green)',
          }}>
            ✓ ¡Pago recibido!
          </div>
        )}

        {pendingPayment && !paymentReceived && (
          <div style={{
            textAlign: 'center',
            padding: 12,
            background: 'rgba(241, 196, 15, 0.1)',
            borderRadius: 8,
            marginTop: 8,
            fontSize: 13,
            color: '#f1c40f',
          }}>
            ⏳ Esperando pago...
          </div>
        )}
      </div>

      {networkType === 'lightning' && (
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
      )}

      {networkType === 'lightning' && (
        <div className="input-group">
          <label>{tFunc('receive.memoLabel')}</label>
          <input
            className="input"
            placeholder={tFunc('receive.memoPlaceholder')}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      )}

      {networkType === 'lightning' && lnbitsConnected && !address && (
        <button
          className="btn btn-primary"
          onClick={handleGenerateInvoice}
          disabled={creatingInvoice || !amount || Number(amount) <= 0}
          style={{ marginBottom: 12 }}
        >
          {creatingInvoice ? '...' : '⚡ Generar factura'}
        </button>
      )}

      {networkType === 'lightning' && !lnbitsConnected && (
        <div className="card card-sm" style={{ marginBottom: 12, borderColor: 'var(--yellow)' }}>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            ⚡ Conecta tu LNbits en Ajustes para recibir Lightning
          </div>
        </div>
      )}

      {address && (
        <button className="btn btn-primary" onClick={handleCopy}>
          {copied
            ? `✓ ${tFunc('receive.copied')}`
            : `📎 ${tFunc('receive.copyAddress')}`}
        </button>
      )}
    </div>
  );
}
