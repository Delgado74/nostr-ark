import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BarcodeScanner,
  BarcodeFormat,
} from '@capacitor-mlkit/barcode-scanning';

interface Props {
  onScan: (data: string) => void;
  onClose: () => void;
}

function ScannerOverlay({ onScan, onClose }: Props) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [scanKey, setScanKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const stop = async () => {
      try { await BarcodeScanner.stopScan(); } catch { /* ignore */ }
      try { await BarcodeScanner.removeAllListeners(); } catch { /* ignore */ }
    };

    const start = async () => {
      setBusy(true);
      setError('');
      document.body.classList.add('scanner-active');
      try {
        const { supported } = await BarcodeScanner.isSupported();
        if (!supported) {
          setError('Escáner no soportado en este dispositivo');
          setBusy(false);
          return;
        }

        const perm = await BarcodeScanner.requestPermissions();
        if (cancelled) return;
        if (perm.camera === 'denied' || perm.camera === 'prompt') {
          setError('Permiso de cámara denegado');
          setBusy(false);
          return;
        }

        await BarcodeScanner.addListener(
          'barcodeScanned',
          (result) => {
            if (cancelled) return;
            const raw = result.barcode?.rawValue;
            if (raw) {
              cancelled = true;
              stop();
              document.body.classList.remove('scanner-active');
              onScan(raw);
            }
          }
        );

        await BarcodeScanner.startScan({
          formats: [BarcodeFormat.QrCode],
        });

        if (!cancelled) setBusy(false);
      } catch (err) {
        if (cancelled) return;
        const msg = (err as Error)?.message || '';
        if (
          msg.includes('cancel') ||
          msg.includes('User') ||
          msg.includes('user')
        ) {
          cancelled = true;
          stop();
          document.body.classList.remove('scanner-active');
          onClose();
        } else {
          setError('Error: ' + msg);
          setBusy(false);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [scanKey, onScan, onClose]);

  return (
    <div className="scanner-overlay">
      {busy && (
        <p className="scanner-hint">Apunta al código QR</p>
      )}

      {!busy && error && (
        <>
          <p className="scanner-error">{error}</p>
          <button
            className="btn btn-primary"
            style={{ marginBottom: 16 }}
            onClick={() => {
              document.body.classList.remove('scanner-active');
              setScanKey((k) => k + 1);
            }}
          >
            Reintentar
          </button>
        </>
      )}

      <button
        className="btn btn-secondary"
        style={{ width: 200 }}
        onClick={() => {
          BarcodeScanner.stopScan();
          BarcodeScanner.removeAllListeners();
          document.body.classList.remove('scanner-active');
          onClose();
        }}
      >
        Cancelar
      </button>
    </div>
  );
}

export function QrScanner(props: Props) {
  return createPortal(<ScannerOverlay {...props} />, document.body);
}
