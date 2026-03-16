const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf('8190289200:AAFm7I5PtzeWTx2XKS85awuSICV42FRGDC4');

bot.start((ctx) => {
  ctx.reply(
    'ស្វាគមន៍! សូមជ្រើសរើសប្រភេទទំនិញ 👇',
    Markup.keyboard([
      ['អាវ', 'ខ្សែក្រវ៉ាត់'],
      ['ស្បែកជើង', 'ទំនក់ទំនង']
    ]).resize()
  );
});

bot.hears('អាវ', async (ctx) => {
  await ctx.replyWithMediaGroup([
    {
      type: 'photo',
      media: { https://imgur.com/a/CPhhxjw' },
    },
    {
      type: 'photo',
      media: { https://imgur.com/a/lTvqmPX' },
      caption: 'ម៉ូដែល: អាវវ៉ែនតា\nតំលៃ: 15,000រៀល'
    }
  ]);
});

bot.hears('ខ្សែក្រវ៉ាត់', async (ctx) => {
  await ctx.replyWithMediaGroup([
    {
      type: 'photo',
      media: { source: 'belt/belt1.jpg' },
    },
    {
      type: 'photo',
      media: { source: 'belt/belt2.jpg' },
      caption: 'ម៉ូដែល: ខ្សែក្រវ៉ាត់ស្បែក\nតំលៃ: 25,000រៀល'
    }
  ]);
});

bot.launch();
console.log('Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));