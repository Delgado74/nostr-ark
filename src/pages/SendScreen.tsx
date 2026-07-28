import { useState, useEffect } from 'react';
import { type NostrKeyPair, identifyInputType } from '../lib/nostr';
import { sendToAddress, parseInvoiceAmount, estimateFee, type ArkTransaction, type ArkBalance } from '../lib/ark';
import { satsToFiat, getCurrency } from '../lib/yadio';
import { tFunc } from '../lib/i18n';
import { Clipboard } from '@capacitor/clipboard';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface Props {
  keypair: NostrKeyPair;
  onNavigate: (page: string) => void;
  onTx: (tx: ArkTransaction) => void;
  balance: ArkBalance;
}

export function SendScreen({ keypair, onNavigate, onTx, balance }: Props) {
  const [input, setInput] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [fiatEstimate, setFiatEstimate] = useState('...');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const inputType = identifyInputType(input);

  useEffect(() => {
    if (inputType === 'lightning' && input.trim()) {
      const parsed = parseInvoiceAmount(input.trim());
      if (parsed > 0) {
        setAmount(parsed.toString());
      }
    }
  }, [input, inputType]);

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
        setError(tFunc('send.scanning'));
      }
    } catch {
      // User cancelled or camera unavailable
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !amount || Number(amount) <= 0) return;
    setSending(true);
    setError('');

    try {
      const result = await sendToAddress(
        input.trim(),
        Number(amount),
        inputType === 'lightning'
          ? 'lightning'
          : inputType === 'ark'
            ? 'ark'
            : 'onchain',
      );

      if (result.success) {
        const tx: ArkTransaction = {
          id: result.txId,
          type: 'outgoing',
          amount: Number(amount),
          timestamp: Date.now(),
          memo: memo || undefined,
          network:
            inputType === 'lightning'
              ? 'lightning'
              : inputType === 'ark'
                ? 'ark'
                : 'onchain',
          fiatAtTime: fiatEstimate !== '...' ? Number(fiatEstimate.replace(/[^0-9.]/g, '')) : undefined,
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

  const sendAmount = amount && Number(amount) > 0 ? Number(amount) : 0;
  const fee = sendAmount > 0 ? estimateFee(sendAmount, inputType === 'lightning' ? 'lightning' : inputType === 'ark' ? 'ark' : 'onchain') : 0;
  const total = sendAmount + fee;
  const insufficientBalance = total > 0 && balance.confirmed < total;
  const canSend = input.trim() && sendAmount > 0 && inputType !== 'unknown' && !insufficientBalance;

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
              {inputType === 'lightning' && `⚡ ${tFunc('send.type.lightning')}`}
              {inputType === 'ark' && `🔗 ${tFunc('send.type.ark')}`}
              {inputType === 'onchain' && `₿ ${tFunc('send.type.onchain')}`}
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

      {sendAmount > 0 && inputType !== 'unknown' && (
        <div className="card card-sm" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: 'var(--text2)' }}>{tFunc('send.amountLabel')}</span>
            <span>{sendAmount.toLocaleString('es-ES')} sats</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: 'var(--text2)' }}>Fee estimado</span>
            <span>{fee.toLocaleString('es-ES')} sats</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
            <span>Total</span>
            <span style={{ color: 'var(--accent)' }}>{total.toLocaleString('es-ES')} sats</span>
          </div>
        </div>
      )}

      {insufficientBalance && (
        <div className="card card-sm" style={{ marginBottom: 12, borderColor: 'var(--red)', background: 'rgba(231, 76, 60, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--red)' }}>
            <span>⚠️</span>
            <div>
              <div style={{ fontWeight: 600 }}>Saldo insuficiente</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                Disponible: {balance.confirmed.toLocaleString('es-ES')} sats | Necesitas: {total.toLocaleString('es-ES')} sats
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
          {error}
        </p>
      )}

      <button
        className="btn btn-primary"
        onClick={handleSend}
        disabled={!canSend || sending}
      >
        {sending ? '...' : `↗ ${tFunc('send.confirm')}`}
      </button>
    </div>
  );
}
