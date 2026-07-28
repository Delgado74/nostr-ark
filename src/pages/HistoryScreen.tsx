import { type ArkTransaction } from '../lib/ark';
import { formatCurrency, getCurrency } from '../lib/yadio';
import { tFunc } from '../lib/i18n';

interface Props {
  transactions: ArkTransaction[];
  onNavigate: (page: string) => void;
}

export function HistoryScreen({ transactions, onNavigate }: Props) {
  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
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
