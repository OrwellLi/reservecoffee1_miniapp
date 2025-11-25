// replace-key.js — запускается на Vercel
const fs = require('fs');

const key = process.env.VITE_YANDEX_API_KEY?.trim();
if (!key) {
  console.error('VITE_YANDEX_API_KEY не найден!');
  process.exit(1);
}

console.log('Ключ найден:', key.substring(0, 10) + '...');

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('YOUR_YANDEX_KEY_WILL_BE_HERE', key);
fs.writeFileSync('index.html', html);

console.log('Ключ успешно подставлен в index.html');