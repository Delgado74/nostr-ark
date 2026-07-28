import { useEffect, useState } from 'react';
import {
  BarcodeScanner,
  BarcodeFormat,
} from '@capacitor-mlkit/barcode-scanning';

interface Props {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: Props) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const scan = async () => {
      setBusy(true);
      setError('');
      try {
        const { supported } = await BarcodeScanner.isSupported();
        if (!supported) {
          setError('Escáner no soportado en este dispositivo');
          setBusy(false);
          return;
        }

        const { available } =
          await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        if (!available) {
          await BarcodeScanner.installGoogleBarcodeScannerModule();
        }

        const { barcodes } = await BarcodeScanner.scan({
          formats: [BarcodeFormat.QrCode],
        });

        if (cancelled) return;

        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          onScan(barcodes[0].rawValue);
        } else {
          onClose();
        }
      } catch (err) {
        if (cancelled) return;
        const msg = (err as Error)?.message || '';
        if (
          msg.includes('cancel') ||
          msg.includes('User') ||
          msg.includes('user')
        ) {
          onClose();
        } else {
          setError('Error: ' + msg);
          setBusy(false);
        }
      }
    };

    scan();

    return () => { cancelled = true; };
  }, [attempt, onScan, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      {busy && (
        <>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p style={{ color: '#fff', marginTop: 16, fontSize: 14 }}>
            {error || 'Escaneando QR...'}
          </p>
        </>
      )}

      {!busy && error && (
        <>
          <p style={{ color: '#e74c3c', fontSize: 14, textAlign: 'center', padding: '0 24px' }}>
            {error}
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => setAttempt((a) => a + 1)}
          >
            Reintentar
          </button>
        </>
      )}

      <button
        className="btn btn-secondary"
        style={{ marginTop: 24, width: 200 }}
        onClick={onClose}
      >
        Cancelar
      </button>
    </div>
  );
}
