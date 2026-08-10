import { useState, useEffect } from 'react';
import { type ArkTransaction } from '../lib/ark';
import { satsToFiat, formatCurrency, getCurrency } from '../lib/yadio';
import * as lnbits from '../lib/lnbits';
import { Clipboard } from '@capacitor/clipboard';
import { tFunc } from '../lib/i18n';

const EXPLORER_URL = 'https://mempool.signet.arkade.sh/tx/';

interface Props {
  tx: ArkTransaction;
  onClose: () => void;
}

export function TransactionDetail({ tx, onClose }: Props) {
  const [details, setDetails] = useState<lnbits.LnbitsPayment | null>(null);
  const [fiatNow, setFiatNow] = useState('...');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (tx.network === 'lightning' && tx.paymentHash) {
      lnbits.getPaymentDetails(tx.paymentHash).then((d) => {
        if (d) setDetails(d);
      });
    }
  }, [tx.network, tx.paymentHash]);

  useEffect(() => {
    satsToFiat(tx.amount, getCurrency()).then(setFiatNow);
  }, [tx.amount]);

  const formatDate = (ts?: number) => {
    if (!ts || isNaN(ts)) return '-';
    return new Date(ts).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copy = async (value: string, label: string) => {
    try {
      await Clipboard.write({ string: value });
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const openExplorer = () => {
    if (!tx.onchainTxid) return;
    window.open(`${EXPLORER_URL}${tx.onchainTxid}`, '_system');
  };

  const short = (s?: string) => {
    if (!s) return '';
    return s.length > 28 ? `${s.slice(0, 14)}…${s.slice(-14)}` : s;
  };

  const preimage = details?.preimage || tx.preimage;
  const destination = details?.destination || tx.destination;
  const fee = details?.fee !== undefined ? Math.round(details.fee / 1000) : tx.fee;
  const status = details?.status || tx.status;

  const rows: { label: string; value: string; mono?: boolean; full?: boolean }[] = [];

  if (tx.memo) rows.push({ label: 'Memo', value: tx.memo });
  if (fee !== undefined && fee > 0) rows.push({ label: 'Fee', value: `${fee.toLocaleString('es-ES')} sats` });
  if (tx.amount) rows.push({ label: 'Monto', value: `${tx.amount.toLocaleString('es-ES')} sats` });
  if (tx.paymentHash) rows.push({ label: 'Payment hash', value: short(tx.paymentHash), mono: true });
  if (preimage) rows.push({ label: 'Preimagen', value: short(preimage), mono: true });
  if (destination) rows.push({ label: 'Destino', value: short(destination), mono: true });
  if (tx.bolt11) rows.push({ label: 'Factura (bolt11)', value: short(tx.bolt11), mono: true });
  if (tx.onchainTxid) rows.push({ label: 'TXID', value: tx.onchainTxid, mono: true, full: true });
  if (tx.txid && tx.txid !== tx.onchainTxid) rows.push({ label: 'ID', value: tx.txid, mono: true, full: true });
  else if (tx.id && tx.id !== 'unknown' && tx.id !== tx.onchainTxid && tx.id !== tx.txid) {
    rows.push({ label: 'ID', value: tx.id, mono: true, full: true });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className={`tx-icon ${tx.type}`} style={{ width: 48, height: 48, fontSize: 22 }}>
            {tx.type === 'incoming' ? '↙' : '↗'}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {tx.type === 'incoming' ? '+' : '-'}
              {tx.amount.toLocaleString('es-ES')} sats
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              {tx.network === 'lightning' ? '⚡ Lightning' : tx.network === 'ark' ? '🔗 Ark' : '₿ Onchain'}
              {status === 'pending' ? ' ⏳' : status === 'failed' ? ' ❌' : ''}
            </div>
          </div>
        </div>

        <div className="tx-date" style={{ marginBottom: 16, fontSize: 13 }}>
          {formatDate(tx.timestamp)}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            background: 'var(--surface2)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            gap: 8,
          }}
        >
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Al momento</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {tx.fiatAtTime !== undefined
                ? formatCurrency(tx.fiatAtTime, getCurrency())
                : '—'}
            </div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Ahora</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>≈ {fiatNow}</div>
          </div>
        </div>

        {rows.map((r) => (
          <div key={r.label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>{r.label}</div>
            <div
              onClick={() => r.full && copy(r.value, r.label)}
              style={{
                fontSize: 13,
                wordBreak: 'break-all',
                fontFamily: r.mono ? 'monospace' : 'inherit',
                cursor: r.full ? 'pointer' : 'default',
              }}
            >
              {r.value}
              {r.full && (
                <span style={{ color: 'var(--text2)', fontSize: 11, marginLeft: 6 }}>
                  {copied === r.label ? '✓ copiado' : '📋'}
                </span>
              )}
            </div>
          </div>
        ))}

        {tx.onchainTxid && (
          <button className="btn btn-primary" onClick={openExplorer} style={{ marginTop: 8 }}>
            🔍 {tFunc('tx.viewExplorer')}
          </button>
        )}

        <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: 8 }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
