const { Telegraf, Markup } = require('telegraf');
const mongoose = require('mongoose');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Keep alive
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is alive!');
});
server.listen(process.env.PORT || 3000);

// ភ្ជាប់ MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.log('MongoDB error:', err));

// Schemas
const productSchema = new mongoose.Schema({
  category: String,
  name: String,
  price: String,
  url: String,
  active: { type: Boolean, default: true }
});

const orderSchema = new mongoose.Schema({
  userId: Number,
  username: String,
  product: String,
  name: String,
  phone: String,
  address: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  userId: Number,
  username: String,
  firstName: String,
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const User = mongoose.model('User', userSchema);

const ADMIN_ID = process.env.ADMIN_ID;
const sessions = {};

// Track User
async function trackUser(ctx) {
  const u = ctx.from;
  await User.findOneAndUpdate(
    { userId: u.id },
    { username: u.username, firstName: u.first_name, lastSeen: new Date() },
    { upsert: true }
  );
}

// Main Menu
function mainMenu() {
  return Markup.keyboard([
    ['👕 អាវ', 'ខោ', '👔 ខ្សែក្រវ៉ាត់'],
    ['👟 ស្បែកជើង', '🔍 ស្វែងរក'],
    ['💰 តារាងតំលៃ', '📞 ទំនក់ទំនង']
  ]).resize();
}

// /start
bot.start(async (ctx) => {
  await trackUser(ctx);
  ctx.reply(
    '🛍 សូមស្វាគមន៍មកកាន់ KH Fashion Shop!\nសូមជ្រើសរើសប្រភេទទំនិញ 👇',
    mainMenu()
  );
});

// បង្ហាញទំនិញ
async function showProducts(ctx, category) {
  await trackUser(ctx);
  const items = await Product.find({ category, active: true });
  if (items.length === 0) return ctx.reply('😔 មិនមានទំនិញប្រភេទនេះទេ!');
  for (const item of items) {
    await ctx.replyWithPhoto(item.url, {
      caption: `🏷 ម៉ូដែល: ${item.name}\n💰 តំលៃ: ${item.price}`,
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🛒 កម្មង់ទំនិញ', `order_${item._id}`)],
        [Markup.button.callback('📞 សាកសួរបន្ថែម', 'contact')]
      ])
    });
  }
}

bot.hears(['👕 អាវ', 'អាវ'], (ctx) => showProducts(ctx, 'អាវ'));
bot.hears(['👔 ខ្សែក្រវ៉ាត់', 'ខ្សែក្រវ៉ាត់'], (ctx) => showProducts(ctx, 'ខ្សែក្រវ៉ាត់'));
bot.hears(['👟 ស្បែកជើង', 'ស្បែកជើង'], (ctx) => showProducts(ctx, 'ស្បែកជើង'));

// តារាងតំលៃ
bot.hears(['💰 តារាងតំលៃ', 'តំលៃ'], async (ctx) => {
  const items = await Product.find({ active: true });
  if (items.length === 0) return ctx.reply('😔 មិនមានទំនិញទេ!');
  const grouped = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  let msg = '💰 តារាងតំលៃទំនិញ\n━━━━━━━━━━━━━━\n';
  for (const [cat, list] of Object.entries(grouped)) {
    msg += `\n📦 ${cat}\n`;
    for (const item of list) msg += `  • ${item.name}: ${item.price}\n`;
  }
  msg += '━━━━━━━━━━━━━━\n📞 ទំនក់ទំនង: @yourusername';
  ctx.reply(msg);
});

// ទំនក់ទំនង
bot.hears(['📞 ទំនក់ទំនង', 'ទំនក់ទំនង'], (ctx) => {
  ctx.reply('📞 ទំនក់ទំនងយើង:\nTelegram: @yourusername\nPhone: 012 345 678');
});

// ស្វែងរក
bot.hears(['🔍 ស្វែងរក', 'ស្វែងរក'], (ctx) => {
  ctx.reply('🔍 សូមវាយឈ្មោះទំនិញ:\nឧទាហរណ៍: អាវវ៉ែនតា');
});

// Inline Button កម្មង់
bot.action(/order_(.+)/, async (ctx) => {
  const product = await Product.findById(ctx.match[1]);
  if (!product) return ctx.answerCbQuery('មិនមានទំនិញនេះទេ!');
  sessions[ctx.from.id] = { product: product.name, step: 'name' };
  await ctx.answerCbQuery();
  ctx.reply(`🛒 កម្មង់: ${product.name}\n\nសូមបញ្ចូល ឈ្មោះ របស់អ្នក:`);
});

bot.action('contact', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply('📞 ទំនក់ទំនងយើង:\nTelegram: @yourusername\nPhone: 012 345 678');
});

// ===== ADMIN =====
bot.command('admin', (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  ctx.reply('👑 Admin Panel', Markup.keyboard([
    ['📦 បន្ថែមទំនិញ', '📋 មើលការកម្មង់'],
    ['📊 ស្ថិតិ', '🔙 ចេញពី Admin']
  ]).resize());
});

bot.hears('📊 ស្ថិតិ', async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  const totalUsers = await User.countDocuments();
  const totalOrders = await Order.countDocuments();
  const pending = await Order.countDocuments({ status: 'pending' });
  const done = await Order.countDocuments({ status: 'done' });
  ctx.reply(
    `📊 ស្ថិតិ KH Fashion Shop\n━━━━━━━━━━━━\n` +
    `👥 អ្នកប្រើសរុប: ${totalUsers}\n` +
    `📦 ការកម្មង់សរុប: ${totalOrders}\n` +
    `⏳ រង់ចាំ: ${pending}\n` +
    `✅ បានបញ្ជាក់: ${done}`
  );
});

bot.hears('📋 មើលការកម្មង់', async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  const list = await Order.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(10);
  if (list.length === 0) return ctx.reply('😊 គ្មានការកម្មង់ថ្មីទេ!');
  for (const o of list) {
    await ctx.reply(
      `🆕 ការកម្មង់!\n━━━━━━━━━━\n` +
      `🏷 ទំនិញ: ${o.product}\n` +
      `👤 ឈ្មោះ: ${o.name}\n` +
      `📱 ទូរស័ព្ទ: ${o.phone}\n` +
      `📍 អាសយដ្ឋាន: ${o.address}\n` +
      `📅 ថ្ងៃ: ${o.createdAt.toLocaleDateString()}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ បញ្ជាក់', `done_${o._id}`),
         Markup.button.callback('❌ លុប', `cancel_${o._id}`)]
      ])
    );
  }
});

bot.hears('📦 បន្ថែមទំនិញ', (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  sessions[ctx.from.id] = { step: 'add_category' };
  ctx.reply('📦 បញ្ចូល Category:\nឧទាហរណ៍: អាវ');
});

bot.hears('🔙 ចេញពី Admin', (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  delete sessions[ctx.from.id];
  ctx.reply('✅ ចេញពី Admin', mainMenu());
});

bot.action(/done_(.+)/, async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  await Order.findByIdAndUpdate(ctx.match[1], { status: 'done' });
  await ctx.answerCbQuery('✅ បានបញ្ជាក់!');
  ctx.editMessageReplyMarkup({ inline_keyboard: [] });
});

bot.action(/cancel_(.+)/, async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  await Order.findByIdAndDelete(ctx.match[1]);
  await ctx.answerCbQuery('❌ បានលុប!');
  ctx.editMessageReplyMarkup({ inline_keyboard: [] });
});

// Text Handler
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const userId = ctx.from.id;
  const session = sessions[userId];

  if (!session) {
    // ស្វែងរក
    const items = await Product.find({
      $or: [
        { name: { $regex: text, $options: 'i' } },
        { category: { $regex: text, $options: 'i' } }
      ],
      active: true
    });
    if (items.length > 0) {
      for (const item of items) {
        await ctx.replyWithPhoto(item.url, {
          caption: `🏷 ម៉ូដែល: ${item.name}\n💰 តំលៃ: ${item.price}`,
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🛒 កម្មង់ទំនិញ', `order_${item._id}`)]
          ])
        });
      }
    }
    return;
  }

  // Admin: បន្ថែមទំនិញ
  if (String(userId) === String(ADMIN_ID)) {
    if (session.step === 'add_category') {
      session.category = text;
      session.step = 'add_name';
      return ctx.reply('🏷 បញ្ចូល ឈ្មោះទំនិញ:');
    } else if (session.step === 'add_name') {
      session.name = text;
      session.step = 'add_price';
      return ctx.reply('💰 បញ្ចូល តំលៃ:\nឧទាហរណ៍: 15,000រៀល');
    } else if (session.step === 'add_price') {
      session.price = text;
      session.step = 'add_url';
      return ctx.reply('🖼 បញ្ចូល URL រូបភាព:');
    } else if (session.step === 'add_url') {
      await Product.create({
        category: session.category,
        name: session.name,
        price: session.price,
        url: text
      });
      delete sessions[userId];
      return ctx.reply(
        `✅ បានបន្ថែមទំនិញ!\n` +
        `📦 Category: ${session.category}\n` +
        `🏷 ឈ្មោះ: ${session.name}\n` +
        `💰 តំលៃ: ${session.price}`
      );
    }
  }

  // Customer: កម្មង់
  if (session.step === 'name') {
    session.name = text;
    session.step = 'phone';
    return ctx.reply('📱 សូមបញ្ចូល លេខទូរស័ព្ទ:');
  } else if (session.step === 'phone') {
    session.phone = text;
    session.step = 'address';
    return ctx.reply('📍 សូមបញ្ចូល អាសយដ្ឋាន:');
  } else if (session.step === 'address') {
    const newOrder = await Order.create({
      userId,
      username: ctx.from.username,
      product: session.product,
      name: session.name,
      phone: session.phone,
      address: text
    });
    delete sessions[userId];
    // ជូនដំណឹង Admin
    bot.telegram.sendMessage(ADMIN_ID,
      `🔔 ការកម្មង់ថ្មី!\n━━━━━━━━━━\n` +
      `🏷 ទំនិញ: ${session.product}\n` +
      `👤 ឈ្មោះ: ${session.name}\n` +
      `📱 ទូរស័ព្ទ: ${session.phone}\n` +
      `📍 អាសយដ្ឋាន: ${text}`,
      { reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('✅ បញ្ជាក់', `done_${newOrder._id}`),
         Markup.button.callback('❌ លុប', `cancel_${newOrder._id}`)]
      ]).reply_markup }
    );
    return ctx.reply(
      `✅ បានទទួលការកម្មង់!\n━━━━━━━━━━\n` +
      `🏷 ទំនិញ: ${session.product}\n` +
      `👤 ឈ្មោះ: ${session.name}\n` +
      `📱 ទូរស័ព្ទ: ${session.phone}\n` +
      `📍 អាសយដ្ឋាន: ${text}\n\n` +
      `⏰ យើងនឹងទំនក់ទំនងក្នុង 24 ម៉ោង!`
    );
  }
});

bot.launch();
console.log('Bot is running...');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
