import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;

    const start = async () => {
      try {
        scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            scanner?.stop().catch(() => {});
            onScan(decodedText);
          },
          () => {},
        );
      } catch (err) {
        console.error('QR scanner error:', err);
        onClose();
      }
    };

    const timer = setTimeout(start, 200);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [onScan, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 280,
          height: 280,
          overflow: 'hidden',
          borderRadius: 12,
          background: '#000',
        }}
      >
        <div id="qr-reader" ref={videoRef} />
      </div>

      <p style={{ color: '#fff', marginTop: 16, fontSize: 14 }}>
        Apunta al código QR
      </p>

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
