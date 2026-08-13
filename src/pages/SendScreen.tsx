import { useEffect, useState } from 'react';
import { type NostrKeyPair, identifyInputType } from '../lib/nostr';
import {
  sendToAddress,
  offboardToOnchain,
  estimateOnchainSendFee,
  parseInvoiceAmount,
  type ArkTransaction,
  type ArkBalance,
} from '../lib/ark';
import { decodeBolt11 } from '../lib/bolt11';
import * as lnbits from '../lib/lnbits';
import { satsToFiat, getCurrency, getSatsPerUnit } from '../lib/yadio';
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
  const [fiatAtTime, setFiatAtTime] = useState<number | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [onchainFee, setOnchainFee] = useState<number | null>(null);

  const inputType = identifyInputType(input);

  const sendAmount = amount && Number(amount) > 0 ? Number(amount) : 0;

  useEffect(() => {
    let cancelled = false;
    if (inputType === 'onchain' && sendAmount > 0) {
      estimateOnchainSendFee(input.trim(), sendAmount).then((fee) => {
        if (!cancelled) setOnchainFee(fee);
      });
    } else {
      setOnchainFee(null);
    }
    return () => {
      cancelled = true;
    };
  }, [input, inputType, sendAmount]);

  const handleAmountChange = async (val: string) => {
    setAmount(val);
    if (val && Number(val) > 0) {
      const sats = Number(val);
      const fiat = await satsToFiat(sats, getCurrency());
      setFiatEstimate(fiat);
      const rate = await getSatsPerUnit(getCurrency());
      setFiatAtTime((sats / 100000000) * rate);
    } else {
      setFiatEstimate('...');
      setFiatAtTime(undefined);
    }
  };

  const applyInvoice = (raw: string) => {
    const clean = raw.replace(/^lightning:/i, '');
    setInput(clean);
    setError('');
    const decoded = decodeBolt11(clean);
    if (decoded) {
      if (decoded.amountMsat > 0) {
        setAmount((decoded.amountMsat / 1000).toString());
      }
      if (decoded.description) {
        setMemo(decoded.description);
      }
    } else {
      const parsed = parseInvoiceAmount(clean);
      if (parsed > 0) {
        setAmount(parsed.toString());
      }
    }
  };

  const handlePaste = async () => {
    try {
      const { value } = await Clipboard.read();
      if (value) {
        applyInvoice(value);
      }
    } catch {
      // clipboard unavailable
    }
  };

  const handleScan = () => {
    setShowScanner(true);
  };

  const handleQrResult = (data: string) => {
    applyInvoice(data);
    setShowScanner(false);
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
          fiatAtTime: fiatAtTime,
          status: 'success',
          paymentHash: result.payment_hash,
          bolt11: input.trim(),
        };
        onTx(tx);
        onNavigate('dash');
      } else if (inputType === 'onchain') {
        const result = await offboardToOnchain(input.trim(), Number(amount));

        if (result.success) {
          const tx: ArkTransaction = {
            id: result.txId,
            type: 'outgoing',
            amount: Number(amount),
            timestamp: Date.now(),
            memo: memo || undefined,
            network: 'onchain',
            fiatAtTime: fiatAtTime,
            onchainTxid: result.txId,
          };
          onTx(tx);
          onNavigate('dash');
        }
      } else {
        const result = await sendToAddress(input.trim(), Number(amount));

        if (result.success) {
          const tx: ArkTransaction = {
            id: result.txId,
            type: 'outgoing',
            amount: Number(amount),
            timestamp: Date.now(),
            memo: memo || undefined,
            network: 'ark',
            fiatAtTime: fiatAtTime,
          };
          onTx(tx);
          onNavigate('dash');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tFunc('send.errorGeneric'));
    } finally {
      setSending(false);
    }
  };

  const availableBalance =
    inputType === 'lightning' ? lnbitsBalance : balance.confirmed + balance.pending;
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
            applyInvoice(e.target.value);
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

      {inputType === 'onchain' && sendAmount > 0 && (
        <div
          className="card card-sm"
          style={{
            marginBottom: 12,
            borderColor: 'var(--accent)',
            background: 'rgba(255, 159, 28, 0.06)',
          }}
        >
          <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
            <span>₿</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{tFunc('send.onchainTitle')}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                {tFunc('send.onchainInfo')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8 }}>
                <span style={{ color: 'var(--text2)' }}>{tFunc('send.onchainFee')}</span>
                <span>
                  {onchainFee === null ? '...' : `${onchainFee.toLocaleString('es-ES')} sats ${tFunc('send.onchainFeeHint')}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                <span style={{ color: 'var(--text2)' }}>{tFunc('send.onchainRecv')}</span>
                <span style={{ fontWeight: 600 }}>
                  ≈ {Math.max(0, sendAmount - (onchainFee ?? 0)).toLocaleString('es-ES')} sats
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
