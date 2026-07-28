import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const id = 'qr-scanner-' + Math.random().toString(36).slice(2);
    const el = document.createElement('div');
    el.id = id;
    containerRef.current?.appendChild(el);

    const scanner = new Html5Qrcode(id);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        scanner.stop().catch(() => {});
        onScan(decodedText);
      },
      () => {},
    ).catch(() => {});

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="qr-scanner-container" onClick={(e) => e.stopPropagation()}>
        <div
          ref={containerRef}
          style={{ width: '100%', maxWidth: 300, margin: '0 auto' }}
        />
        <button
          className="btn btn-secondary"
          style={{ marginTop: 12, width: '100%' }}
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
