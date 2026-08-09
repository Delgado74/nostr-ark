// The amount is in the HRP (before '1'), so we can test with fake data part
function parseInvoiceAmount(inv) {
  const lower = inv.replace(/^lightning:/i, '').toLowerCase();
  let prefix = '';
  if (lower.startsWith('lnbc')) prefix = 'lnbc';
  else if (lower.startsWith('lntbs')) prefix = 'lntbs';
  else if (lower.startsWith('lntb')) prefix = 'lntb';
  else return 0;
  const afterPrefix = lower.slice(prefix.length);
  if (!afterPrefix) return 0;
  let amountStr = '';
  let multiplier = 0;
  for (const ch of afterPrefix) {
    if (ch >= '0' && ch <= '9') amountStr += ch;
    else if (ch === 'p') { multiplier = 0.0001; break; }
    else if (ch === 'n') { multiplier = 0.1; break; }
    else if (ch === 'u') { multiplier = 100; break; }
    else if (ch === 'm') { multiplier = 100000; break; }
    else break;
  }
  if (!amountStr) return 0;
  if (multiplier === 0) multiplier = 0.0001;
  return Math.round(Number(amountStr) * multiplier);
}

const cases = [
  'lnbc210n1pj2p8x',        // 21 sats
  'LNBC210N1PJ2P8X',        // 21 sats uppercase
  'lnbc2500u1pj2p8x',       // 2500 u = 250000 sats
  'LNBC2500U1PJ2P8X',       // uppercase
  'lntb10u1pj2p8x',         // testnet 10u = 1000 sats (starts with 1)
  'LNBC1PJ2P8X',            // amountless
  'lightning:LNBC210N1PJ2P8X', // uppercase + lightning prefix
  'LIGHTNING:LNBC210N1PJ2P8X', // all caps + prefix
];
for (const c of cases) console.log(c, '->', parseInvoiceAmount(c));
