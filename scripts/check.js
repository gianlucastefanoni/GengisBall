// Controlla che lo script inline di index.html sia sintatticamente valido.
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('Nessuno script trovato in index.html'); process.exit(1); }
try { new Function(m[1]); console.log('Sintassi OK'); }
catch (e) { console.error('Errore di sintassi:', e.message); process.exit(1); }
