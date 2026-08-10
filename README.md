# NostrArk

Billetera Bitcoin con identidad Nostr y backend Ark. Envía y recibe por Lightning (LNbits), Ark y on-chain desde un único par de claves, con montos en CUP, USD y EUR.

## Características

- **Identidad Nostr**: tu wallet es tu par de claves `nsec`/`npub` (bech32).
- **Respaldo BIP39 (NIP-06)**: al crear la billetera se muestran 12 palabras de respaldo (derivación `m/44'/1237'/0'/0/0`). Restaura desde el nsec o desde las palabras (ES/EN).
- **Lightning con backend LNbits**: conecta tu instancia LNbits por URL + API key o escaneando un QR; crea y paga invoices BOLT11.
- **Ark Protocol**: saldo en VTXOs vía Arkade SDK/ASP (sin canales ni gestión de liquidez).
- **On-chain (boarding)**: dirección de boarding para fondear el wallet Ark.
- **Escáner QR**: captura de invoices BOLT11 con cámara (`@capacitor-mlkit/barcode-scanning`).
- **Multi-moneda**: CUP, USD, EUR con tasas de Yadio.
- **Bilingüe**: Español / English.
- **Self-custodial**: siempre controlas tus claves.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Móvil**: Capacitor 6 (Android)
- **Ark**: `@arkade-os/sdk`
- **Lightning**: API de LNbits (backend por URL + API key)
- **Cripto**: `@noble/hashes`, `@noble/curves`, `bech32`, `@scure/bip39`, `@scure/bip32`, `nostr-tools`
- **Fiat**: API de Yadio (tasas)
- **CI/CD**: GitHub Actions (`build-apk.yml`)

## Development

### Prerequisites

- Node.js 22+

### Setup

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo web
npm run dev

# Build de producción web
npm run build

# Tests de los decoders (BOLT11, mnemónico)
node scripts/test_decode.mjs
node scripts/test_parse.mjs
node scripts/test_mnemonic.mjs
```

### Build del APK Android

El APK se genera con GitHub Actions (disparador manual `workflow_dispatch`):

1. `Actions` → `Build Android APK` → `Run workflow` (elige la rama).
2. Descarga el artifact `nostr-ark-apk`.

Build local:

```bash
npm run build
npx cap add android   # primera vez
npx cap sync android
node scripts/prepare-android.mjs   # inyecta permisos cámara + ML Kit en el manifest
cd android && ./gradlew assembleDebug
```

## Project Structure

```
nostr-ark/
├── src/
│   ├── pages/               # AuthScreen, Dashboard, Send/Receive/History/Settings
│   ├── components/          # QrScanner, etc.
│   ├── lib/
│   │   ├── nostr.ts         # nsec/npub bech32, firma
│   │   ├── mnemonic.ts      # BIP39 / NIP-06 (generar, importar, detectar)
│   │   ├── ark.ts           # Wallet Ark (balance, VTXOs, boarding, pagos)
│   │   ├── lnbits.ts        # Cliente LNbits (invoices, pagos, saldo)
│   │   ├── bolt11.ts        # Decoder BOLT11 (monto, memo, expiry)
│   │   ├── yadio.ts         # Tasas CUP/USD/EUR
│   │   ├── i18n.ts          # Traducciones es/en
│   │   └── storage.ts       # Capacitor Preferences
│   └── styles.css
├── scripts/
│   ├── prepare-android.mjs  # Idempotente: permisos cámara/ML Kit en CI
│   └── test_*.mjs           # Tests de decoders
├── .github/workflows/
│   └── build-apk.yml        # Build APK (workflow_dispatch)
└── capacitor.config.ts
```

## Redes soportadas

- **Lightning**: pagos instantáneos vía invoices BOLT11 con backend LNbits.
- **Ark**: VTXOs vía Arkade ASP (mainnet; opción signet disponible en Ajustes).
- **On-chain**: dirección de boarding para fondear el wallet.

## Soporte de monedas

- CUP (Peso Cubano)
- USD (Dólar)
- EUR (Euro)

## Seguridad

- Claves guardadas localmente con Capacitor Preferences (solo en el dispositivo).
- Las palabras de respaldo y el nsec se muestran ocultos: se revelan solo a decisión del usuario.
- Sin registro ni servidor central: el backend es tu propia instancia LNbits y el ASP Ark.
- Self-custodial por diseño.
- El APK de CI se genera con manifest verificado (permisos cámara + ML Kit).

## License

MIT
