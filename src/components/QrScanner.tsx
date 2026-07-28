import { useEffect, useRef, useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import jsQR from 'jsqr';

interface Props {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const scan = async () => {
      setBusy(true);
      setError('');
      try {
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
        });

        if (cancelled) return;

        if (!photo.base64String) {
          setError('No se pudo capturar la imagen');
          setBusy(false);
          return;
        }

        const img = new Image();
        const dataUrl = `data:image/jpeg;base64,${photo.base64String}`;

        img.onload = () => {
          if (cancelled) return;
          const canvas = canvasRef.current;
          if (!canvas) {
            setError('Error interno');
            setBusy(false);
            return;
          }
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setError('Error interno');
            setBusy(false);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            onScan(code.data);
          } else {
            setError('No se encontró QR. Asegúrate de que el código esté bien visible.');
            setBusy(false);
          }
        };

        img.onerror = () => {
          if (!cancelled) {
            setError('Error al procesar la imagen');
            setBusy(false);
          }
        };

        img.src = dataUrl;
      } catch (err) {
        if (cancelled) return;
        const msg = (err as Error)?.message || '';
        if (msg.includes('cancel') || msg.includes('User')) {
          onClose();
        } else {
          setError('Error al abrir cámara: ' + msg);
          setBusy(false);
        }
      }
    };

    scan();

    return () => { cancelled = true; };
  }, [attempt, onScan, onClose]);

  const handleRetry = () => {
    setAttempt((a) => a + 1);
  };

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
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {busy && (
        <>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p style={{ color: '#fff', marginTop: 16, fontSize: 14 }}>
            Escaneando QR...
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
            onClick={handleRetry}
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
