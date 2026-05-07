import { Telegraf, Markup, Scenes, session } from 'telegraf';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// --- DATABASE SCHEMA ---
const MONGO_URI = process.env.MONGO_URI || 'ВАША_ССЫЛКА_ИЗ_MONGODB_ATLAS';
mongoose.connect(MONGO_URI).then(() => console.log('MongoDB Connected')).catch(err => console.log(err));

const AppSchema = new mongoose.Schema({
    id: String,
    type: String,
    userId: String,
    user: String,
    nickname: String,
    platform: String,
    subscribers: String,
    views: String,
    channel: String,
    video: String,
    paymentInfo: String,
    status: { type: String, default: 'pending' },
    date: { type: Date, default: Date.now }
});

const TeamSchema = new mongoose.Schema({
    userId: String,
    nickname: String,
    channel: String,
    subs: String,
    totalEarned: { type: Number, default: 0 }
});

const Application = mongoose.model('Application', AppSchema);
const TeamMember = mongoose.model('TeamMember', TeamSchema);
const BotUser = mongoose.model('BotUser', new mongoose.Schema({ userId: String }));

// --- BOT SETUP ---
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 7822594120;
const MINI_APP_URL = 'https://droptime-media.vercel.app';

const bot = new Telegraf(BOT_TOKEN);

// --- API SERVER ---
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/data', async (req, res) => {
    const applications = await Application.find({ status: 'pending' });
    const team = await TeamMember.find();
    res.json({ applications, team });
});

// --- SCENES ---
const teamScene = new Scenes.WizardScene(
    'team_wizard',
    async (ctx) => {
        const userId = ctx.from.id.toString();
        const existing = await Application.findOne({ userId, status: 'pending' });
        if (existing) return ctx.reply('⏳ Заявка уже есть!');
        await ctx.reply('Введите игровой никнейм:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.nickname = ctx.message.text;
        await ctx.reply('Платформа:', Markup.keyboard([['TikTok', 'YouTube']]).oneTime().resize());
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.platform = ctx.message.text;
        await ctx.reply('Подписчики:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.subs = ctx.message.text;
        await ctx.reply('Просмотры:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.views = ctx.message.text;
        await ctx.reply('Ссылка на канал:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        await new Application({
            type: 'team',
            userId: ctx.from.id.toString(),
            user: ctx.from.username || ctx.from.first_name,
            ...ctx.wizard.state,
            channel: ctx.message.text
        }).save();
        await ctx.reply('✅ Отправлено!');
        return ctx.scene.leave();
    }
);

const paymentScene = new Scenes.WizardScene(
    'payment_wizard',
    async (ctx) => {
        await ctx.reply('Пришлите ссылку на видео:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.video = ctx.message.text;
        await ctx.reply('Реквизиты и сумма:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        await new Application({
            type: 'payment',
            userId: ctx.from.id.toString(),
            user: ctx.from.username || ctx.from.first_name,
            video: ctx.wizard.state.video,
            paymentInfo: ctx.message.text
        }).save();
        await ctx.reply('✅ Отправлено!');
        return ctx.scene.leave();
    }
);

const stage = new Scenes.Stage([teamScene, paymentScene]);
bot.use(session());
bot.use(stage.middleware());

bot.start(async (ctx) => {
    await BotUser.updateOne({ userId: ctx.from.id }, { userId: ctx.from.id }, { upsert: true });
    const buttons = [['Заявка в КП', 'Прайс'], ['Информация', 'Выплата']];
    if (ctx.from.id === ADMIN_ID) buttons.push([Markup.button.webApp('Панель Управления', MINI_APP_URL)]);
    await ctx.reply('Привет!', Markup.keyboard(buttons).resize());
});

bot.hears('Заявка в КП', (ctx) => ctx.scene.enter('team_wizard'));
bot.hears('Выплата', (ctx) => ctx.scene.enter('payment_wizard'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`API running on ${PORT}`));
bot.launch();
