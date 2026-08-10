# NostrArk

Bitcoin wallet with Nostr identity and Ark protocol backend. Send and receive over Lightning (LNbits), Ark, and on-chain from a single key pair, with amounts in CUP, USD, and EUR.

## Features

- **Nostr identity**: your wallet is your `nsec`/`npub` key pair (bech32).
- **BIP39 backup (NIP-06)**: on wallet creation, a 12-word backup phrase is shown (derivation `m/44'/1237'/0'/0/0`). Restore from the nsec or from the words (ES/EN).
- **Lightning with an LNbits backend**: connect your LNbits instance via URL + API key or by scanning a QR; create and pay BOLT11 invoices.
- **Ark Protocol**: balance in VTXOs via Arkade SDK/ASP (no channels or liquidity management).
- **On-chain (boarding)**: boarding address to fund the Ark wallet.
- **QR scanner**: captures BOLT11 invoices with the camera (`@capacitor-mlkit/barcode-scanning`).
- **Multi-currency**: CUP, USD, EUR with Yadio rates.
- **Bilingual**: Español / English.
- **Self-custodial**: you always control your keys.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Mobile**: Capacitor 6 (Android)
- **Ark**: `@arkade-os/sdk`
- **Lightning**: LNbits API (URL + API key backend)
- **Crypto**: `@noble/hashes`, `@noble/curves`, `bech32`, `@scure/bip39`, `@scure/bip32`, `nostr-tools`
- **Fiat**: Yadio API (exchange rates)
- **CI/CD**: GitHub Actions (`build-apk.yml`)

## Development

### Prerequisites

- Node.js 22+

### Setup

```bash
# Install dependencies
npm install

# Web development server
npm run dev

# Production web build
npm run build

# Decoder tests (BOLT11, mnemonic)
node scripts/test_decode.mjs
node scripts/test_parse.mjs
node scripts/test_mnemonic.mjs
```

### Building the Android APK

The APK is built with GitHub Actions (manual `workflow_dispatch` trigger):

1. `Actions` → `Build Android APK` → `Run workflow` (pick the branch).
2. Download the `nostr-ark-apk` artifact.

Local build:

```bash
npm run build
npx cap add android   # first time only
npx cap sync android
node scripts/prepare-android.mjs   # injects camera + ML Kit permissions into the manifest
cd android && ./gradlew assembleDebug
```

## Project Structure

```
nostr-ark/
├── src/
│   ├── pages/               # AuthScreen, Dashboard, Send/Receive/History/Settings
│   ├── components/          # QrScanner, etc.
│   ├── lib/
│   │   ├── nostr.ts         # nsec/npub bech32, signing
│   │   ├── mnemonic.ts      # BIP39 / NIP-06 (generate, import, detect)
│   │   ├── ark.ts           # Ark wallet (balance, VTXOs, boarding, payments)
│   │   ├── lnbits.ts        # LNbits client (invoices, payments, balance)
│   │   ├── bolt11.ts        # BOLT11 decoder (amount, memo, expiry)
│   │   ├── yadio.ts         # CUP/USD/EUR rates
│   │   ├── i18n.ts          # Translations es/en
│   │   └── storage.ts       # Capacitor Preferences
│   └── styles.css
├── scripts/
│   ├── prepare-android.mjs  # Idempotent: camera/ML Kit permissions in CI
│   └── test_*.mjs           # Decoder tests
├── .github/workflows/
│   └── build-apk.yml        # APK build (workflow_dispatch)
└── capacitor.config.ts
```

## Supported networks

- **Lightning**: instant payments via BOLT11 invoices with an LNbits backend.
- **Ark**: VTXOs via Arkade ASP (mainnet).
- **On-chain**: boarding address to fund the wallet.

## Currency support

- CUP (Cuban Peso)
- USD (US Dollar)
- EUR (Euro)

## Security

- Keys stored locally with Capacitor Preferences (device only).
- Backup words and nsec are hidden by default and only revealed on user action.
- No registration or central server: the backend is your own LNbits instance and the Ark ASP.
- Self-custodial by design.
- The CI APK is built from a verified manifest (camera + ML Kit permissions).

## License

MIT
