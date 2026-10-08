function getLuminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return [ (num >> 16) & 255, (num >> 8) & 255, num & 255 ];
}

function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

const pairs = [
  { name: 'White (#FFFFFF) vs Primary Focus (#2185D5)', fg: '#FFFFFF', bg: '#2185D5' },
  { name: 'White (#FFFFFF) vs Primary Strong (#1B6DAE)', fg: '#FFFFFF', bg: '#1B6DAE' },
  { name: 'White (#FFFFFF) vs Primary Strong Hover (#155A92)', fg: '#FFFFFF', bg: '#155A92' },
  { name: 'Ink (#1E293B) vs Background (#F8FAFC)', fg: '#1E293B', bg: '#F8FAFC' },
  { name: 'Ink Soft (#64748B) vs Background (#F8FAFC)', fg: '#64748B', bg: '#F8FAFC' },
  { name: 'Primary Strong (#1B6DAE) vs Background (#F8FAFC)', fg: '#1B6DAE', bg: '#F8FAFC' },
  { name: 'Neutral Hover (#E2E8F0) vs Ink (#1E293B)', fg: '#1E293B', bg: '#E2E8F0' },
];

console.log('| Kombinasi Warna | Foreground | Background | Rasio Kontras | WCAG AA Normal Text (>=4.5:1) |');
console.log('| :--- | :---: | :---: | :---: | :---: |');

for (const p of pairs) {
  const ratio = getContrastRatio(p.fg, p.bg);
  const pass = ratio >= 4.5 ? 'PASS' : 'FAIL';
  console.log(`| ${p.name} | \`${p.fg}\` | \`${p.bg}\` | **${ratio.toFixed(2)}:1** | ${pass} |`);
}
