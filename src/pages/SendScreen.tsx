import { useState } from 'react';
import { type NostrKeyPair, identifyInputType } from '../lib/nostr';
import { sendToAddress, parseInvoiceAmount, type ArkTransaction, type ArkBalance } from '../lib/ark';
import * as lnbits from '../lib/lnbits';
import { satsToFiat, getCurrency } from '../lib/yadio';
import { tFunc } from '../lib/i18n';
import { QrScanner } from '../components/QrScanner';
import { Clipboard } from '@capacitor/clipboard';

interface Props {
  keypair: NostrKeyPair;
  onNavigate: (page: string) => void;
  onTx: (tx: ArkTransaction) => void;
  balance: ArkBalance;
  lnbitsBalance: number;
}

export function SendScreen({ keypair, onNavigate, onTx, balance, lnbitsBalance }: Props) {
  const [input, setInput] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [fiatEstimate, setFiatEstimate] = useState('...');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

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
      if (value) {
        const clean = value.replace(/^lightning:/i, '');
        setInput(clean);
        const parsed = parseInvoiceAmount(clean);
        if (parsed > 0) {
          setAmount(parsed.toString());
        }
      }
    } catch {
      // clipboard unavailable
    }
  };

  const handleScan = () => {
    setShowScanner(true);
  };

  const handleQrResult = (data: string) => {
    const clean = data.replace(/^lightning:/i, '');
    setInput(clean);
    setShowScanner(false);
    setError('');
    const parsed = parseInvoiceAmount(clean);
    if (parsed > 0) {
      setAmount(parsed.toString());
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !amount || Number(amount) <= 0) return;
    setSending(true);
    setError('');

    try {
      if (inputType === 'lightning') {
        const result = await lnbits.payInvoice(input.trim());
        const tx: ArkTransaction = {
          id: result.payment_hash,
          type: 'outgoing',
          amount: Number(amount),
          timestamp: Date.now(),
          memo: memo || undefined,
          network: 'lightning',
          fiatAtTime: fiatEstimate !== '...' ? Number(fiatEstimate.replace(/[^0-9.]/g, '')) : undefined,
          status: 'success',
        };
        onTx(tx);
        onNavigate('dash');
      } else {
        const result = await sendToAddress(
          input.trim(),
          Number(amount),
          inputType === 'ark' ? 'ark' : 'onchain',
        );

        if (result.success) {
          const tx: ArkTransaction = {
            id: result.txId,
            type: 'outgoing',
            amount: Number(amount),
            timestamp: Date.now(),
            memo: memo || undefined,
            network: inputType === 'ark' ? 'ark' : 'onchain',
            fiatAtTime: fiatEstimate !== '...' ? Number(fiatEstimate.replace(/[^0-9.]/g, '')) : undefined,
          };
          onTx(tx);
          onNavigate('dash');
        }
      }
    } catch {
      setError('Error al enviar');
    } finally {
      setSending(false);
    }
  };

  const sendAmount = amount && Number(amount) > 0 ? Number(amount) : 0;
  const availableBalance = inputType === 'lightning' ? lnbitsBalance : balance.confirmed;
  const insufficientBalance = sendAmount > 0 && availableBalance < sendAmount;
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
            const val = e.target.value.replace(/^lightning:/i, '');
            setInput(val);
            setError('');
            const parsed = parseInvoiceAmount(val);
            if (parsed > 0) {
              setAmount(parsed.toString());
            }
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
            <span>Total</span>
            <span style={{ color: 'var(--accent)' }}>{sendAmount.toLocaleString('es-ES')} sats</span>
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
                Disponible: {availableBalance.toLocaleString('es-ES')} sats | Necesitas: {sendAmount.toLocaleString('es-ES')} sats
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

      {showScanner && (
        <QrScanner
          onScan={handleQrResult}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
