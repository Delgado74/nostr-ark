import { useState } from 'react';
import { type ArkBalance } from '../lib/ark';
import { tFunc } from '../lib/i18n';

interface Props {
  balance: ArkBalance;
  onNavigate: (page: string) => void;
  onOnboard: () => Promise<void>;
  onOffboard: (address: string, amountSats: number) => Promise<void>;
}

export function ConvertScreen({ balance, onNavigate, onOnboard, onOffboard }: Props) {
  const [onboarding, setOnboarding] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAddr, setWithdrawAddr] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hasOnchain = balance.onchain.total > 0;
  const hasArk = balance.confirmed > 0;

  const handleOnboard = async () => {
    setOnboarding(true);
    setError('');
    setSuccess('');
    try {
      await onOnboard();
      setSuccess(tFunc('convert.onboardSuccess'));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setOnboarding(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAddr.trim() || !withdrawAmt || Number(withdrawAmt) <= 0) return;
    setWithdrawing(true);
    setError('');
    setSuccess('');
    try {
      await onOffboard(withdrawAddr.trim(), Number(withdrawAmt));
      setWithdrawOpen(false);
      setWithdrawAddr('');
      setWithdrawAmt('');
      setSuccess(tFunc('convert.withdrawSuccess'));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setWithdrawing(false);
    }
  };

  const withdrawDisabled =
    withdrawing || !withdrawAddr.trim() || !withdrawAmt || Number(withdrawAmt) <= 0;

  return (
    <div>
      <div className="header">
        <button className="header-btn" onClick={() => onNavigate('dash')}>
          ←
        </button>
        <h1>{tFunc('convert.title')}</h1>
        <div style={{ width: 28 }}></div>
      </div>

      <div className="convert-screen">
        <div className="card convert-tile">
          <div className="convert-tile-head">
            <span className="convert-tile-icon">⬇️</span>
            <div>
              <div className="convert-tile-title">₿ {tFunc('dash.onchain')} → 🔗 {tFunc('dash.ark')}</div>
              <div className="convert-tile-desc">{tFunc('convert.onboardDesc')}</div>
            </div>
          </div>
          <div className={`convert-tile-amount ${hasOnchain ? '' : 'empty'}`}>
            {hasOnchain
              ? `${balance.onchain.total.toLocaleString('es-ES')} sats ${tFunc('convert.available')}`
              : tFunc('convert.noOnchain')}
          </div>
          <button
            className="btn btn-primary vtxo-btn"
            onClick={handleOnboard}
            disabled={onboarding || !hasOnchain}
          >
            {onboarding ? `⏳ ${tFunc('convert.converting')}` : `⬇️ ${tFunc('convert.convertToArk')}`}
          </button>
        </div>

        <div className="card convert-tile">
          <div className="convert-tile-head">
            <span className="convert-tile-icon">⬆️</span>
            <div>
              <div className="convert-tile-title">🔗 {tFunc('dash.ark')} → ₿ {tFunc('dash.onchain')}</div>
              <div className="convert-tile-desc">{tFunc('convert.withdrawDesc')}</div>
            </div>
          </div>
          <div className={`convert-tile-amount ${hasArk ? '' : 'empty'}`}>
            {hasArk
              ? `${balance.confirmed.toLocaleString('es-ES')} sats ${tFunc('convert.available')}`
              : tFunc('convert.noArk')}
          </div>
          <button
            className="btn btn-primary vtxo-btn"
            onClick={() => setWithdrawOpen(!withdrawOpen)}
            disabled={!hasArk}
          >
            ⬆️ {tFunc('convert.withdraw')}
          </button>
        </div>

        {withdrawOpen && (
          <div className="card withdraw-panel">
            <input
              className="input"
              placeholder={tFunc('convert.withdrawAddrPlaceholder')}
              value={withdrawAddr}
              onChange={(e) => setWithdrawAddr(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <input
              className="input"
              type="number"
              placeholder={tFunc('convert.withdrawAmountPlaceholder')}
              value={withdrawAmt}
              onChange={(e) => setWithdrawAmt(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <button
              className="btn btn-primary vtxo-btn"
              onClick={handleWithdraw}
              disabled={withdrawDisabled}
            >
              {withdrawing ? `⏳ ${tFunc('convert.withdrawing')}` : `⬆️ ${tFunc('convert.withdrawConfirm')}`}
            </button>
          </div>
        )}

        {success && <div className="convert-msg success">{success}</div>}
        {error && <div className="convert-msg error">{error}</div>}
      </div>
    </div>
  );
}
