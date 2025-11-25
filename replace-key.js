// replace-key.js
const fs = require('fs');

const key = process.env.VITE_YANDEX_API_KEY?.trim();

if (!key) {
  console.error('VITE_YANDEX_API_KEY не найден или пустой!');
  process.exit(1);
}

console.log('Найден ключ Яндекса (первые 8 символов):', key.substring(0, 8) + '...');

let content = fs.readFileSync('script.js', 'utf8');

if (content.includes('YOUR_KEY_WILL_BE_HERE')) {
  content = content.replace('YOUR_KEY_WILL_BE_HERE', key);
  fs.writeFileSync('script.js', content);
  console.log('Ключ успешно подставлен в script.js');
} else {
  console.log('Ключ уже был подставлен ранее');
}