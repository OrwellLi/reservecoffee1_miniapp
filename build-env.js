const fs = require('fs');
const path = require('path');
require('dotenv').config();  // Читает env из Vercel

// Путь к script.js
const scriptPath = path.join(__dirname, 'script.js');

// Читаем содержимое script.js
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Заменяем плейсхолдер на реальный ключ (если он есть)
const yandexKey = process.env.VITE_YANDEX_API_KEY;
if (yandexKey) {
    scriptContent = scriptContent.replace(
        /const API_KEY_PLACEHOLDER = 'your-key-here';/,
        `const API_KEY_PLACEHOLDER = '${yandexKey}';`
    );
    console.log('Ключ Яндекс.Карт успешно подставлен в script.js');
} else {
    console.error('VITE_YANDEX_API_KEY не найден — карта не заработает!');
}

// Записываем обратно
fs.writeFileSync(scriptPath, scriptContent);
console.log('Build завершён: env подставлены');