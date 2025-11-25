// replace-key.js — запускается Vercel при деплое
const fs = require('fs');

const key = process.env.VITE_YANDEX_API_KEY;

if (!key) {
  console.error('VITE_YANDEX_API_KEY не найден в Vercel!');
  process.exit(1);
}

let content = fs.readFileSync('script.js', 'utf8');
content = content.replace('YOUR_KEY_WILL_BE_HERE', key);

fs.writeFileSync('script.js', content);
console.log('Ключ Яндекса успешно подставлен в script.js');