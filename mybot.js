const { Telegraf, Markup } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

const products = {
  'អាវ': [
    { name: 'អាវវ៉ែនតា', price: '15,000រៀល', url: 'URL_រូបអាវ1' },
    { name: 'អាវប៉ូឡូ', price: '20,000រៀល', url: 'URL_រូបអាវ2' },
  ],
  'ខ្សែក្រវ៉ាត់': [
    { name: 'ខ្សែក្រវ៉ាត់ស្បែក', price: '25,000រៀល', url: 'URL_រូបខ្សែ1' },
    { name: 'ខ្សែក្រវ៉ាត់ក្រណាត់', price: '18,000រៀល', url: 'URL_រូបខ្សែ2' },
  ],
  'ស្បែកជើង': [
    { name: 'ស្បែកជើងកីឡា', price: '45,000រៀល', url: 'URL_រូបស្បែកជើង1' },
    { name: 'ស្បែកជើងផ្លូវការ', price: '60,000រៀល', url: 'URL_រូបស្បែកជើង2' },
  ],
};

const orders = {};

bot.start((ctx) => {
  ctx.reply(
    '🛍 សូមស្វាគមន៍មកកាន់ KH Fashion Shop!\nសូមជ្រើសរើសប្រភេទទំនិញ 👇',
    Markup.keyboard([
      ['👕 អាវ', '👔 ខ្សែក្រវ៉ាត់'],
      ['👟 ស្បែកជើង', '🔍 ស្វែងរក'],
      ['💰 តារាងតំលៃ', '📞 ទំនក់ទំនង']
    ]).resize()
  );
});

async function showProducts(ctx, category) {
  const items = products[category];
  if (!items) return ctx.reply('មិនមានទំនិញប្រភេទនេះទេ!');
  for (const item of items) {
    await ctx.replyWithPhoto(item.url, {
      caption: `🏷 ម៉ូដែល: ${item.name}\n💰 តំលៃ: ${item.price}`,
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🛒 កម្មង់ទំនិញ', `order_${item.name}`)],
        [Markup.button.callback('📞 សាកសួរបន្ថែម', 'contact')]
      ])
    });
  }
}

bot.hears(['👕 អាវ', 'អាវ'], (ctx) => showProducts(ctx, 'អាវ'));
bot.hears(['👔 ខ្សែក្រវ៉ាត់', 'ខ្សែក្រវ៉ាត់'], (ctx) => showProducts(ctx, 'ខ្សែក្រវ៉ាត់'));
bot.hears(['👟 ស្បែកជើង', 'ស្បែកជើង'], (ctx) => showProducts(ctx, 'ស្បែកជើង'));

bot.hears(['💰 តារាងតំលៃ', 'តំលៃ'], (ctx) => {
  let msg = '💰 តារាងតំលៃទំនិញ\n━━━━━━━━━━━━━━\n';
  for (const [cat, items] of Object.entries(products)) {
    msg += `\n📦 ${cat}\n`;
    for (const item of items) {
      msg += `  • ${item.name}: ${item.price}\n`;
    }
  }
  msg += '━━━━━━━━━━━━━━\n📞 ទំនក់ទំនង: @yourusername';
  ctx.reply(msg);
});

bot.hears(['📞 ទំនក់ទំនង', 'ទំនក់ទំនង'], (ctx) => {
  ctx.reply('📞 ទំនក់ទំនងយើង:\nTelegram: @yourusername\nPhone: 012 345 678');
});

bot.hears(['🔍 ស្វែងរក', 'ស្វែងរក'], (ctx) => {
  ctx.reply('🔍 សូមវាយឈ្មោះទំនិញ:\nឧទាហរណ៍: អាវវ៉ែនតា');
});

bot.action(/order_(.+)/, async (ctx) => {
  const item = ctx.match[1];
  orders[ctx.from.id] = { item, step: 'name' };
  await ctx.answerCbQuery();
  ctx.reply(`🛒 កម្មង់: ${item}\n\nសូមបញ្ចូល ឈ្មោះ របស់អ្នក:`);
});

bot.action('contact', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply('📞 ទំនក់ទំនងយើង:\nTelegram: @yourusername\nPhone: 012 345 678');
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const userId = ctx.from.id;
  const order = orders[userId];

  // ដំណើរការ order steps
  if (order) {
    if (order.step === 'name') {
      order.name = text;
      order.step = 'phone';
      return ctx.reply('📱 សូមបញ្ចូល លេខទូរស័ព្ទ:');
    } else if (order.step === 'phone') {
      order.phone = text;
      order.step = 'address';
      return ctx.reply('📍 សូមបញ្ចូល អាសយដ្ឋាន:');
    } else if (order.step === 'address') {
      order.address = text;
      delete orders[userId];
      return ctx.reply(
        `✅ បានទទួលការកម្មង់ហើយ!\n\n` +
        `🏷 ទំនិញ: ${order.item}\n` +
        `👤 ឈ្មោះ: ${order.name}\n` +
        `📱 ទូរស័ព្ទ: ${order.phone}\n` +
        `📍 អាសយដ្ឋាន: ${order.address}\n\n` +
        `⏰ យើងនឹងទំនក់ទំនងក្នុង 24 ម៉ោង!`
      );
    }
  }

  // ស្វែងរកទំនិញ
  let found = false;
  for (const [cat, items] of Object.entries(products)) {
    for (const item of items) {
      if (item.name.includes(text) || text.includes(cat)) {
        await ctx.replyWithPhoto(item.url, {
          caption: `🏷 ម៉ូដែល: ${item.name}\n💰 តំលៃ: ${item.price}`,
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🛒 កម្មង់ទំនិញ', `order_${item.name}`)],
          ])
        });
        found = true;
      }
    }
  }
  if (!found) ctx.reply('😔 រកមិនឃើញ!\nសូមសាកស្វែងរកពាក្យផ្សេង');
});

bot.launch();
console.log('Bot is running...');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


