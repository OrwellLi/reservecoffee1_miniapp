const { Bot, InlineKeyboard } = require('grammy');

const bot = new Bot(''); // ← свой токен

const webappUrl = 'https://reservecoffee1miniapp.vercel.app/'; // ← свой URL

bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('Открыть приложение 🚀', webappUrl);

  await ctx.reply('Привет! Нажми кнопку ниже:', {
    reply_markup: keyboard,
  });
});

// Получаем данные из sendData (если хочешь обрабатывать)
bot.on('message:web_app_data', async (ctx) => {
  const data = JSON.parse(ctx.message.web_app_data.data);
  await ctx.reply(`Получил от тебя: ${data.text}\nТвой ID: ${data.user_id}`);
});

bot.start();
console.log('Бот запущен');