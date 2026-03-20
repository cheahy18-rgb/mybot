const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ទំនិញ database
const products = {
  អាវ: [
    { name: 'អាវវ៉ែនតា', price: '15,000រៀល', url: 'URL_រូបអាវ1' },
    { name: 'អាវប៉ូឡូ', price: '20,000រៀល', url: 'URL_រូបអាវ2' },
  ],
  ខ្សែក្រវ៉ាត់: [
    { name: 'ខ្សែក្រវ៉ាត់ស្បែក', price: '25,000រៀល', url: 'URL_រូបខ្សែ1' },
    { name: 'ខ្សែក្រវ៉ាត់ក្រណាត់', price: '18,000រៀល', url: 'URL_រូបខ្សែ2' },
  ],
  ស្បែកជើង: [
    { name: 'ស្បែកជើងកីឡា', price: '45,000រៀល', url: 'URL_រូបស្បែកជើង1' },
    { name: 'ស្បែកជើងផ្លូវការ', price: '60,000រៀល', url: 'URL_រូបស្បែកជើង2' },
  ],
};

// /start
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

// បង្ហាញទំនិញ + Inline Buttons
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

// ចុចប៊ូតុង អាវ
bot.hears(['👕 អាវ', 'អាវ'], (ctx) => showProducts(ctx, 'អាវ'));

// ចុចប៊ូតុង ខ្សែក្រវ៉ាត់
bot.hears(['👔 ខ្សែក្រវ៉ាត់', 'ខ្សែក្រវ៉ាត់'], (ctx) => showProducts(ctx, 'ខ្សែក្រវ៉ាត់'));

// ចុចប៊ូតុង ស្បែកជើង
bot.hears(['👟 ស្បែកជើង', 'ស្បែកជើង'], (ctx) => showProducts(ctx, 'ស្បែកជើង'));

// 💰 តារាងតំលៃ
bot.hears(['💰 តារាងតំលៃ', 'តារាងតំលៃ', 'តំលៃ'], (ctx) => {
  let msg = '💰 តារាងតំលៃទំនិញ\n';
  msg += '━━━━━━━━━━━━━━\n';
  for (const [cat, items] of Object.entries(products)) {
    msg += `\n📦 ${cat}\n`;
    for (const item of items) {
      msg += `  • ${item.name}: ${item.price}\n`;
    }
  }
  msg += '━━━━━━━━━━━━━━\n';
  msg += '📞 ទំនក់ទំនង: @yourusername';
  ctx.reply(msg);
});

// 🔍 ស្វែងរកទំនិញ
bot.hears(['🔍 ស្វែងរក', 'ស្វែងរក'], (ctx) => {
  ctx.reply('🔍 សូមវាយឈ្មោះទំនិញដែលចង់ស្វែងរក\nឧទាហរណ៍: អាវវ៉ែនតា');
});

// ដំណើរការ Search
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const keywords = ['👕 អាវ', '👔 ខ្សែក្រវ៉ាត់', '👟 ស្បែកជើង',
    '🔍 ស្វែងរក', '💰 តារាងតំលៃ', '📞 ទំនក់ទំនង',
    'អាវ', 'ខ្សែក្រវ៉ាត់', 'ស្បែកជើង', '/start'];
  if (keywords.includes(text)) return;

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
  if (!found) ctx.reply('😔 រកមិនឃើញទំនិញនេះទេ!\nសូមសាកស្វែងរកពាក្យផ្សេង');
});

// 🛒 ប្រព័ន្ធកម្មង់
const orders = {};

bot.action(/order_(.+)/, async (ctx) => {
  const item = ctx.match[1];
  const userId = ctx.from.id;
  orders[userId] = { item, step: 'name' };
  await ctx.answerCbQuery();
  ctx.reply(`🛒 កម្មង់: ${item}\n\nសូមបញ្ចូល ឈ្មោះ របស់អ្នក:`);
});

// 📞 ទំនក់ទំនង
bot.action('contact', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply('📞 ទំនក់ទំនងយើង:\nTelegram: @yourusername\nPhone: 012 345 678');
});

bot.hears(['📞 ទំនក់ទំនង', 'ទំនក់ទំនង'], (ctx) => {
  ctx.reply('📞 ទំនក់ទំនងយើង:\nTelegram: @yourusername\nPhone: 012 345 678');
});

// ដំណើរការ order steps
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const order = orders[userId];
  if (!order) return;

  if (order.step === 'name') {
    order.name = ctx.message.text;
    order.step = 'phone';
    ctx.reply('📱 សូមបញ្ចូល លេខទូរស័ព្ទ:');
  } else if (order.step === 'phone') {
    order.phone = ctx.message.text;
    order.step = 'address';
    ctx.reply('📍 សូមបញ្ចូល អាសយដ្ឋាន:');
  } else if (order.step === 'address') {
    order.address = ctx.message.text;
    delete orders[userId];
    ctx.reply(
      `✅ បានទទួលការកម្មង់ហើយ!\n\n` +
      `🏷 ទំនិញ: ${order.item}\n` +
      `👤 ឈ្មោះ: ${order.name}\n` +
      `📱 ទូរស័ព្ទ: ${order.phone}\n` +
      `📍 អាសយដ្ឋាន: ${order.address}\n\n` +
      `⏰ យើងនឹងទំនក់ទំនងអ្នកក្នុងរយៈពេល 24 ម៉ោង!`
    );
  }
});

bot.launch();
console.log('Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
```

---

## 📌 អ្វីដែលត្រូវកែ
```
1. URL_រូបអាវ1, URL_រូបអាវ2      ← ដាក់ URL រូបភាពពិត
2. URL_រូបខ្សែ1, URL_រូបខ្សែ2    ← ដាក់ URL រូបភាពពិត
3. URL_រូបស្បែកជើង1, 2           ← ដាក់ URL រូបភាពពិត
4. @yourusername                  ← ដាក់ username Telegram អ្នក
5. 012 345 678                    ← ដាក់លេខទូរស័ព្ទពិត
```

