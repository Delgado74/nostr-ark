import { generateMnemonic } from '@scure/bip39';
import { wordlist as spanish } from '@scure/bip39/wordlists/spanish.js';
import { generateMnemonicKeypair, importFromMnemonic, isMnemonic } from '../src/lib/mnemonic.ts';
import { getPrivkeyHex, getPubkeyHex } from '../src/lib/nostr.ts';

let failed = 0;

function check(name, cond, detail = '') {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    failed++;
    console.log(`FAIL ${name} ${detail}`);
  }
}

const NIP06_VECTORS = [
  [
    'leader monkey parrot ring guide accident before fence cannon height naive bean',
    '7f7ff03d123792d6ac594bfa67bf6d0c0ab55b6b1fdb6249303fe861f1ccba9a',
  ],
  [
    'what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade',
    'c15d739894c81a2fcfd3a2df85a0d2c0dbc47a280d092799f144d73d7ae78add',
  ],
];

for (const [mnem, expectPrivkey] of NIP06_VECTORS) {
  const { keypair } = importFromMnemonic(mnem);
  const pk = getPrivkeyHex(keypair);
  check(`NIP-06 vector (${mnem.split(' ').length} words): ${expectPrivkey.slice(0, 8)}`, pk === expectPrivkey, pk);
}

const gen = generateMnemonicKeypair();
check('generated mnemonic has 12 words', gen.mnemonic.split(' ').length === 12);

const imported = importFromMnemonic(gen.mnemonic);
check('roundtrip nsec', imported.keypair.nsec === gen.keypair.nsec);
check('roundtrip npub', imported.keypair.npub === gen.keypair.npub);
check('roundtrip privkey', getPrivkeyHex(imported.keypair) === getPrivkeyHex(gen.keypair));
check('roundtrip pubkey', getPubkeyHex(imported.keypair) === getPubkeyHex(gen.keypair));

const upperInput = gen.mnemonic.toUpperCase();
check('import normalizes uppercase mnemonic', importFromMnemonic(upperInput).keypair.nsec === gen.keypair.nsec);

const esMnemonic = generateMnemonic(spanish, 128);
const esImport = importFromMnemonic(esMnemonic);
check('spanish mnemonic accepted (12 words)', esImport.mnemonic.split(' ').length === 12);
check('spanish roundtrip consistent', importFromMnemonic(esMnemonic).keypair.nsec === esImport.keypair.nsec);

check('isMnemonic true for 12 words', isMnemonic(gen.mnemonic) === true);
check('isMnemonic false for short text', isMnemonic('hola') === false);
check('isMnemonic false for 11 words', isMnemonic(Array(11).fill('abandon').join(' ')) === false);
check('isMnemonic true for 24 words', isMnemonic(NIP06_VECTORS[1][0]) === true);

let rejectedChecksum = false;
try {
  importFromMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon');
} catch {
  rejectedChecksum = true;
}
check('invalid checksum rejected', rejectedChecksum);

let rejectedShort = false;
try {
  importFromMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon');
} catch {
  rejectedShort = true;
}
check('11 words rejected', rejectedShort);

console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILURES`);
process.exit(failed === 0 ? 0 : 1);
