import { useState } from 'react';
import { type NostrKeyPair, identifyInputType } from '../lib/nostr';
import { sendToAddress, type ArkTransaction } from '../lib/ark';
import { satsToFiat, getCurrency } from '../lib/yadio';
import { tFunc } from '../lib/i18n';
import { Clipboard } from '@capacitor/clipboard';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface Props {
  keypair: NostrKeyPair;
  onNavigate: (page: string) => void;
  onTx: (tx: ArkTransaction) => void;
}

export function SendScreen({ keypair, onNavigate, onTx }: Props) {
  const [input, setInput] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [fiatEstimate, setFiatEstimate] = useState('...');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const inputType = identifyInputType(input);

  const handleAmountChange = async (val: string) => {
    setAmount(val);
    if (val && Number(val) > 0) {
      const fiat = await satsToFiat(Number(val), getCurrency());
      setFiatEstimate(fiat);
    } else {
      setFiatEstimate('...');
    }
  };

  const handlePaste = async () => {
    try {
      const { value } = await Clipboard.read();
      if (value) setInput(value);
    } catch {
      // clipboard unavailable
    }
  };

  const handleScan = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (photo.base64String) {
        // In a real app, you'd use a QR code library to decode this.
        // For now, we'll just try to decode the base64 image with a QR scanner
        // This is a placeholder - in production, use a proper QR scanning library
        setError(tFunc('send.scanning'));
      }
    } catch {
      // User cancelled or camera unavailable
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    setError('');

    try {
      const result = await sendToAddress(
        input.trim(),
        amount ? Number(amount) : 0,
        inputType === 'lightning'
          ? 'lightning'
          : inputType === 'ark'
            ? 'ark'
            : 'onchain',
        keypair.privkey,
      );

      if (result.success) {
        const tx: ArkTransaction = {
          id: result.txId,
          type: 'outgoing',
          amount: amount ? Number(amount) : 0,
          timestamp: Date.now(),
          memo: memo || undefined,
          network:
            inputType === 'lightning'
              ? 'lightning'
              : inputType === 'ark'
                ? 'ark'
                : 'onchain',
        };
        onTx(tx);
        onNavigate('dash');
      }
    } catch {
      setError('Error al enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="header">
        <button className="header-btn" onClick={() => onNavigate('dash')}>
          ←
        </button>
        <h1>{tFunc('send.title')}</h1>
        <div style={{ width: 28 }}></div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
        {tFunc('send.pasteOrScan')}
      </p>

      <div className="input-group">
        <label>{tFunc('send.invoiceLabel')}</label>
        <input
          className="input"
          placeholder={tFunc('send.invoicePlaceholder')}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError('');
          }}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handlePaste}
            style={{ flex: 1 }}
          >
            📋 {tFunc('send.pasteButton')}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleScan}
            style={{ flex: 1 }}
          >
            📷 {tFunc('send.scanButton')}
          </button>
        </div>
        {input && inputType !== 'unknown' && (
          <div style={{ marginTop: 6 }}>
            <span className="type-badge">
              {inputType === 'lightning' &&
                `⚡ ${tFunc('send.type.lightning')}`}
              {inputType === 'ark' && `🔗 ${tFunc('send.type.ark')}`}
              {inputType === 'onchain' &&
                `₿ ${tFunc('send.type.onchain')}`}
            </span>
          </div>
        )}
      </div>

      <div className="input-group">
        <label>{tFunc('send.amountLabel')}</label>
        <input
          className="input"
          type="number"
          placeholder={tFunc('send.amountPlaceholder')}
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
        />
        {fiatEstimate !== '...' && (
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
            ≈ {fiatEstimate}
          </div>
        )}
      </div>

      <div className="input-group">
        <label>{tFunc('send.memoLabel')}</label>
        <textarea
          className="input"
          placeholder={tFunc('send.memoPlaceholder')}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      {error && (
        <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
          {error}
        </p>
      )}

      <button
        className="btn btn-primary"
        onClick={handleSend}
        disabled={!input.trim() || sending}
      >
        {sending ? '...' : `↗ ${tFunc('send.confirm')}`}
      </button>
    </div>
  );
}
