// replace-key.js — ультра-отладочная версия
const fs = require('fs');
const path = require('path');

console.log('════════════════════════════════');
console.log('ЗАПУСК replace-key.js');
console.log('Рабочая директория:', process.cwd());
console.log('Содержимое папки:', fs.readdirSync('.'));

const key = process.env.VITE_YANDEX_API_KEY;

console.log('Все env-переменные с упоминанием YANDEX или VITE:');
Object.keys(process.env)
  .filter(k => k.toLowerCase().includes('yandex') || k.toLowerCase().includes('vite'))
  .forEach(k => console.log(`  ${k}=${process.env[k]?.substring(0,15) || 'ПУСТО'}...`));

if (!key) {
  console.error('ОШИБКА: VITE_YANDEX_API_KEY НЕ НАЙДЕН ИЛИ ПУСТОЙ');
  process.exit(1);
}

console.log('КЛЮЧ НАЙДЕН! Длина:', key.length);
console.log('Первые 12 символов ключа:', key.substring(0,12));
console.log('Последние 8 символов ключа:', key.slice(-8));

const filePath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

console.log('Содержимое index.html до замены — ищем плейсхолдер...');
if (html.includes('DEBUG_PLACEHOLDER_YANDEX_KEY')) {
  console.log('Плейсхолдер найден — заменяем');
  html = html.replace(/DEBUG_PLACEHOLDER_YANDEX_KEY/g, key);
  fs.writeFileSync(filePath, html);
  console.log('КЛЮЧ УСПЕШНО ПОДСТАВЛЕН В index.html');
} else {
  console.log('Плейсхолдер НЕ найден — возможно уже заменён или файл другой');
  console.log('Текущая строка с ключом в index.html:');
  const lines = html.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('apikey') || line.includes('YANDEX')) {
      console.log(`Строка ${i+1}: ${line.trim()}`);
    }
  });
}

console.log('replace-key.js завершён успешно');
console.log('════════════════════════════════');