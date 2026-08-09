import { bech32 } from 'bech32';
import { decodeBolt11 } from '../src/lib/bolt11.ts';

const amtless =
  'lnbc1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaq9qrsgq357wnc5r2ueh7ck6q93dj32dlqnls087fxdwk8qakdyafkq3yap9us6v52vjjsrvywa6rt52cm9r9zqt8r2t7mlcwspyetp5h2tztugp9lfyql';

const coffee =
  'lnbc2500u1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpu9qrsgquk0rl77nj30yxdy8j9vdx85fkpmdla2087ne0xh8nhedh8w27kyke0lp53ut353s06fv3qfegext0eh0ymjpf39tuven09sam30g4vgpfna3rh';

const upper =
  'LNBC25M1PVJLUEZPP5QQQSYQCYQ5RQWZQFQQQSYQCYQ5RQWZQFQQQSYQCYQ5RQWZQFQYPQDQ5VDHKVEN9V5SXYETPDEESSP5ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYG3ZYGS9Q5SQQQQQQQQQQQQQQQQSGQ2A25DXL5HRNTDTN6ZVYDT7D66HYZSYHQS4WDYNAVYS42XGL6SGX9C4G7ME86A27T07MDTFRY458RTJR0V92CNMSWPSJSCGT2VCSE3SGPZ3UAPA';

let failed = 0;

const checks = [
  ['amountless invoice', amtless, { timestamp: 1496314658, amountMsat: 0, description: 'Please consider supporting this project', paymentHash: '0001020304050607080900010203040506070809000102030405060708090102' }],
  ['coffee invoice', coffee, { timestamp: 1496314658, amountMsat: 250000000, description: '1 cup coffee', expiry: 60 }],
  ['uppercase invoice', upper, { timestamp: 1496314658, amountMsat: 2500000000, description: 'coffee beans' }],
];

for (const [name, invoice, expected] of checks) {
  const d = decodeBolt11(invoice);
  if (!d) { console.log('FAIL', name, '-> null'); failed++; continue; }
  let ok = true;
  for (const [k, v] of Object.entries(expected)) {
    if (d[k] !== v) { ok = false; console.log('  mismatch', k, '=', d[k], 'expected', v); }
  }
  console.log(ok ? 'PASS' : 'FAIL', name, 'amountMsat:', d.amountMsat, 'desc:', JSON.stringify(d.description));
  if (!ok) failed++;
}

// build a valid mainnet invoice with a features (9) field to exercise the non-byte-aligned path
{
  const tsWords = [];
  let ts = 1496314658;
  for (let i = 0; i < 7; i++) { tsWords.unshift(ts & 31); ts = Math.floor(ts / 32); }
  const ph = bech32.toWords(Buffer.alloc(32, 0xab));
  const desc = bech32.toWords(Buffer.from('test', 'utf8'));
  const data = [
    ...tsWords,
    1, 1, 20, ...ph,
    13, (desc.length >> 5) & 31, desc.length & 31, ...desc,
    5, 0, 3, 16, 8, 0,
    ...bech32.toWords(Buffer.alloc(65, 0)),
  ];
  const invoice = bech32.encode('lnbc10u', data, 2000);
  const d = decodeBolt11(invoice);
  const ok = d && d.amountMsat === 1000000 && d.description === 'test' && d.paymentHash === 'ab'.repeat(32);
  console.log(ok ? 'PASS' : 'FAIL', 'mainnet 10u + features field', d ? { amountMsat: d.amountMsat, desc: d.description, ph: d.paymentHash } : null);
  if (!ok) failed++;
}

console.log(failed === 0 ? 'ALL PASS' : failed + ' FAILED');
