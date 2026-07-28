export type Lang = 'es' | 'en';

const t: Record<Lang, Record<string, string>> = {
  es: {
    // Auth
    'auth.title': 'NostrArk',
    'auth.subtitle': 'Tu billetera Bitcoin con identidad Nostr',
    'auth.create': 'Crear Billetera',
    'auth.import': 'Importar con nsec',
    'auth.importPlaceholder': 'nsec1...',
    'auth.importConfirm': 'Importar',
    'auth.importError': 'nsec inválido',

    // Dashboard
    'dash.balance': 'Saldo',
    'dash.network': 'Red',
    'dash.mainnet': 'Mainnet',
    'dash.testnet': 'Testnet',
    'dash.send': 'Enviar',
    'dash.receive': 'Recibir',
    'dash.history': 'Historial',
    'dash.settings': 'Ajustes',
    'dash.noTx': 'Sin transacciones aún',

    // Send
    'send.title': 'Enviar',
    'send.pasteOrScan': 'Pegar invoice, dirección o escanear QR',
    'send.invoiceLabel': 'Invoice / Dirección',
    'send.invoicePlaceholder': 'lnbc..., ark..., o bc1...',
    'send.amountLabel': 'Monto (opcional)',
    'send.amountPlaceholder': '0',
    'send.memoLabel': 'Nota (opcional)',
    'send.memoPlaceholder': 'Descripción del pago',
    'send.fiat': 'Fiat estimado',
    'send.confirm': 'Enviar',
    'send.scanning': 'Escaneando QR...',
    'send.scanButton': 'Escanear QR',
    'send.pasteButton': 'Pegar',
    'send.invalidInput': 'Entrada inválida',
    'send.type.lightning': 'Lightning',
    'send.type.ark': 'Ark',
    'send.type.onchain': 'On-chain',

    // Receive
    'receive.title': 'Recibir',
    'receive.amountLabel': 'Monto en sats',
    'receive.amountPlaceholder': '0',
    'receive.memoLabel': 'Nota (opcional)',
    'receive.memoPlaceholder': 'Descripción',
    'receive.copyAddress': 'Copiar dirección',
    'receive.copied': '¡Copiado!',
    'receive.lightning': 'Lightning Invoice',
    'receive.ark': 'Dirección Ark',
    'receive.onchain': 'Dirección On-chain',
    'receive.fiat': 'Valor fiat',
    'receive.networkType': 'Tipo de red',

    // History
    'history.title': 'Historial',
    'history.empty': 'Sin transacciones',
    'history.incoming': 'Recibido',
    'history.outgoing': 'Enviado',

    // Settings
    'settings.title': 'Ajustes',
    'settings.language': 'Idioma',
    'settings.currency': 'Moneda',
    'settings.network': 'Red',
    'settings.mainnet': 'Mainnet',
    'settings.testnet': 'Testnet',
    'settings.backup': 'Copia de Seguridad',
    'settings.backupTitle': 'Tu clave nsec',
    'settings.backupWarning': 'Guarda esta clave en un lugar seguro. Es tu acceso a la billetera.',
    'settings.copyNsec': 'Copiar nsec',
    'settings.delete': 'Eliminar Billetera',
    'settings.deleteConfirm': '¿Eliminar? Se perderán todos los datos.',
    'settings.about': 'Acerca de',
    'settings.version': 'Versión 0.1.0',
    'settings.close': 'Cerrar',
  },
  en: {
    // Auth
    'auth.title': 'NostrArk',
    'auth.subtitle': 'Your Bitcoin wallet with Nostr identity',
    'auth.create': 'Create Wallet',
    'auth.import': 'Import with nsec',
    'auth.importPlaceholder': 'nsec1...',
    'auth.importConfirm': 'Import',
    'auth.importError': 'Invalid nsec',

    // Dashboard
    'dash.balance': 'Balance',
    'dash.network': 'Network',
    'dash.mainnet': 'Mainnet',
    'dash.testnet': 'Testnet',
    'dash.send': 'Send',
    'dash.receive': 'Receive',
    'dash.history': 'History',
    'dash.settings': 'Settings',
    'dash.noTx': 'No transactions yet',

    // Send
    'send.title': 'Send',
    'send.pasteOrScan': 'Paste invoice, address or scan QR',
    'send.invoiceLabel': 'Invoice / Address',
    'send.invoicePlaceholder': 'lnbc..., ark..., or bc1...',
    'send.amountLabel': 'Amount (optional)',
    'send.amountPlaceholder': '0',
    'send.memoLabel': 'Memo (optional)',
    'send.memoPlaceholder': 'Payment description',
    'send.fiat': 'Estimated fiat',
    'send.confirm': 'Send',
    'send.scanning': 'Scanning QR...',
    'send.scanButton': 'Scan QR',
    'send.pasteButton': 'Paste',
    'send.invalidInput': 'Invalid input',
    'send.type.lightning': 'Lightning',
    'send.type.ark': 'Ark',
    'send.type.onchain': 'On-chain',

    // Receive
    'receive.title': 'Receive',
    'receive.amountLabel': 'Amount in sats',
    'receive.amountPlaceholder': '0',
    'receive.memoLabel': 'Memo (optional)',
    'receive.memoPlaceholder': 'Description',
    'receive.copyAddress': 'Copy address',
    'receive.copied': 'Copied!',
    'receive.lightning': 'Lightning Invoice',
    'receive.ark': 'Ark Address',
    'receive.onchain': 'On-chain Address',
    'receive.fiat': 'Fiat value',
    'receive.networkType': 'Network type',

    // History
    'history.title': 'History',
    'history.empty': 'No transactions',
    'history.incoming': 'Received',
    'history.outgoing': 'Sent',

    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.currency': 'Currency',
    'settings.network': 'Network',
    'settings.mainnet': 'Mainnet',
    'settings.testnet': 'Testnet',
    'settings.backup': 'Backup',
    'settings.backupTitle': 'Your nsec key',
    'settings.backupWarning': 'Save this key in a safe place. It is your wallet access.',
    'settings.copyNsec': 'Copy nsec',
    'settings.delete': 'Delete Wallet',
    'settings.deleteConfirm': 'Delete? All data will be lost.',
    'settings.about': 'About',
    'settings.version': 'Version 0.1.0',
    'settings.close': 'Close',
  },
};

let currentLang: Lang = (localStorage.getItem('lang') as Lang) || 'es';

export const setLang = (lang: Lang) => {
  currentLang = lang;
  localStorage.setItem('lang', lang);
};

export const getLang = () => currentLang;

export const tFunc = (key: string): string => {
  return t[currentLang]?.[key] || t['es']?.[key] || key;
};

export type Network = 'mainnet' | 'testnet';

let currentNetwork: Network = (localStorage.getItem('network') as Network) || 'mainnet';

export const setNetwork = (network: Network) => {
  currentNetwork = network;
  localStorage.setItem('network', network);
};

export const getNetwork = () => currentNetwork;
