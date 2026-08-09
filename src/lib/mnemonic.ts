import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english.js';
import { wordlist as spanish } from '@scure/bip39/wordlists/spanish.js';
import { HDKey } from '@scure/bip32';
import { keyPairFromPrivkey, type NostrKeyPair } from './nostr.ts';

const NIP06_PATH = "m/44'/1237'/0'/0/0";
const VALID_WORD_COUNTS = new Set([12, 15, 18, 21, 24]);

export function normalizeMnemonic(text: string): string {
  return text.trim().toLowerCase().split(/\s+/).join(' ');
}

export function isMnemonic(text: string): boolean {
  return VALID_WORD_COUNTS.has(normalizeMnemonic(text).split(' ').length);
}

export interface MnemonicKeypair {
  mnemonic: string;
  keypair: NostrKeyPair;
}

export function generateMnemonicKeypair(): MnemonicKeypair {
  const mnemonic = generateMnemonic(english, 128);
  return { mnemonic, keypair: deriveKeypair(mnemonic, english) };
}

export function importFromMnemonic(text: string): MnemonicKeypair {
  const mnemonic = normalizeMnemonic(text);
  const words = mnemonic.split(' ');

  if (!VALID_WORD_COUNTS.has(words.length)) {
    throw new Error(`Invalid mnemonic word count: ${words.length}`);
  }

  let keypair: NostrKeyPair | null = null;
  for (const wordlist of [english, spanish]) {
    if (validateMnemonic(mnemonic, wordlist)) {
      keypair = deriveKeypair(mnemonic, wordlist);
      break;
    }
  }

  if (!keypair) {
    throw new Error('Invalid mnemonic checksum');
  }

  return { mnemonic, keypair };
}

function deriveKeypair(mnemonic: string, wordlist: string[]): NostrKeyPair {
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new Error('Invalid mnemonic');
  }
  const seed = mnemonicToSeedSync(mnemonic, '');
  const node = HDKey.fromMasterSeed(seed).derive(NIP06_PATH);
  const privkey = node.privateKey;
  if (!privkey) {
    throw new Error('Failed to derive private key');
  }
  return keyPairFromPrivkey(privkey);
}
