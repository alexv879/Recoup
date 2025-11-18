// Deprecated Node contrast checker. Replaced by Python script.

const fs = require('fs');
const path = require('path');

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

function luminance([r, g, b]) {
    const a = [r, g, b].map(v => {
        v = v / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(hex1, hex2) {
    const L1 = luminance(hexToRgb(hex1));
    const L2 = luminance(hexToRgb(hex2));
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
}

const cssPath = path.join(__dirname, '..', 'app', 'globals.css');
if (!fs.existsSync(cssPath)) {
    console.error('globals.css not found at', cssPath);
    process.exit(2);
}

const css = fs.readFileSync(cssPath, 'utf8');
const regex = /--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6})/g;
let m;
const tokens = [];
while ((m = regex.exec(css)) !== null) {
    tokens.push({ key: m[1], color: m[2] });
}

if (tokens.length === 0) {
    console.log('No color tokens found.');
    process.exit(0);
}

let failed = 0;
console.log('Checking color tokens contrast (threshold 4.5/1 - WCAG AAA for normal text)');
for (const token of tokens) {
    const c = token.color;
    const ratioWhite = contrastRatio(c, '#ffffff');
    const ratioBlack = contrastRatio(c, '#000000');
    const best = Math.max(ratioWhite, ratioBlack);
    const bg = best === ratioWhite ? 'white' : 'black';
    const pass = best >= 4.5;
    console.log(`${token.key}: ${c} -> best contrast ${best.toFixed(2)} on ${bg} (${pass ? 'PASS' : 'FAIL'})`);
    if (!pass) failed++;
}

if (failed > 0) {
    console.error(`${failed} token(s) failed contrast check`);
    process.exit(1);
}

console.log('All tokens passed contrast check.');
process.exit(0);
