import { type ArkTransaction } from '../lib/ark';
import { formatCurrency, getCurrency } from '../lib/yadio';
import { tFunc } from '../lib/i18n';

interface Props {
  transactions: ArkTransaction[];
  onNavigate: (page: string) => void;
}

export function HistoryScreen({ transactions, onNavigate }: Props) {
  const formatDate = (ts: number) => {
    if (!ts || isNaN(ts)) return '-';
    const d = new Date(ts);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusLabel = (s?: string) => {
    if (!s || s === 'success') return null;
    if (s === 'pending') return '⏳';
    if (s === 'failed') return '❌';
    return null;
  };

  return (
    <div>
      <div className="header">
        <button className="header-btn" onClick={() => onNavigate('dash')}>
          ←
        </button>
        <h1>{tFunc('history.title')}</h1>
        <div style={{ width: 28 }}></div>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>{tFunc('history.empty')}</p>
        </div>
      ) : (
        <div className="card">
          {transactions.map((tx) => (
            <div key={tx.id} className="tx-item">
              <div className={`tx-icon ${tx.type}`}>
                {tx.type === 'incoming' ? '↙' : '↗'}
              </div>
              <div className="tx-info">
                <div className="tx-desc">
                  {tx.memo ||
                    (tx.type === 'incoming'
                      ? tFunc('history.incoming')
                      : tFunc('history.outgoing'))}
                  {statusLabel(tx.status)}
                </div>
                <div className="tx-date">
                  {formatDate(tx.timestamp)}
                  <span className="type-badge" style={{ marginLeft: 6 }}>
                    {tx.network}
                  </span>
                </div>
              </div>
              <div className="tx-amount">
                <div className={`tx-sats ${tx.type}`}>
                  {tx.type === 'incoming' ? '+' : '-'}
                  {tx.amount.toLocaleString('es-ES')} sats
                </div>
                {tx.fee !== undefined && tx.fee > 0 && (
                  <div className="tx-fiat-val" style={{ color: 'var(--text2)' }}>
                    Fee: {tx.fee.toLocaleString('es-ES')} sats
                  </div>
                )}
                {tx.fiatAtTime !== undefined && (
                  <div className="tx-fiat-val">
                    ≈ {formatCurrency(tx.fiatAtTime, getCurrency())}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
