# NostrArk

Bitcoin wallet with Nostr identity and Ark protocol backend.

## Features

- **Nostr Identity**: Use your nsec/npub as wallet identity
- **Ark Protocol**: No channels, no liquidity management needed
- **Lightning + Ark + On-chain**: Send/receive via all three networks
- **Multi-currency**: CUP, USD, EUR with Yadio rates
- **Self-custodial**: You always control your keys

## Tech Stack

- React Native (Expo)
- Arkade SDK
- Nostr Tools
- Yadio API (exchange rates)

## Development

### Prerequisites

- Node.js 20+
- Expo CLI
- EAS CLI (for building)

### Setup

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Build Android APK
eas build -p android --profile preview
```

## Project Structure

```
nostr-ark/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── lib/                    # Core libraries
│   ├── i18n.ts            # Translations (es/en)
│   ├── context.tsx        # App context (language/currency)
│   ├── nostr.ts           # Nostr utilities
│   ├── ark.ts             # Ark utilities
│   ├── yadio.ts           # Exchange rates
│   └── storage.ts         # Secure storage
├── .github/
│   └── workflows/
│       └── build-apk.yml  # GitHub Actions
└── package.json
```

## Supported Networks

- **Lightning**: Instant payments via invoices
- **Ark**: VTXOs via Arkade ASP (Switzerland)
- **On-chain**: Standard Bitcoin transactions

## Currency Support

- CUP (Cuban Peso)
- USD (US Dollar)
- EUR (Euro)

## Security

- Private keys encrypted with SecureStore
- No registration required
- Self-custodial by design
- Unilateral exit supported

## License

MIT
