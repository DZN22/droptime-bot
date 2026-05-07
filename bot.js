import { Telegraf, Markup, Scenes, session } from 'telegraf';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
// --- DATABASE (Простая реализация на JSON файле) ---
const DB_PATH = './db.json';
// Инициализация БД
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
        applications: [],
        team: [],
        users: [],
        stats: { totalPaid: 0 }
    }, null, 2));
}
const getData = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const saveData = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
const BOT_TOKEN = '8767761276:AAFRmhWKiSMZufw0mmeV85DlL9ShuyhGQ6A';
const ADMIN_ID = 7822594120;
const MINI_APP_URL = 'https://droptime-media.vercel.app';
// --- API SERVER ---
const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/data', (req, res) => {
    res.json(getData());
});
app.listen(3000, () => console.log('API Server running on port 3000'));
// --- BOT SCENES ---
const teamScene = new Scenes.WizardScene(
    'team_wizard',
    async (ctx) => {
        const db = getData();
        const userId = ctx.from.id.toString();
        if (db.team.find(m => m.userId === userId)) {
            await ctx.reply('❌ Вы уже в команде!');
            return ctx.scene.leave();
        }
        await ctx.reply('📝 Заявка в КП.\n\nВведите ваш игровой никнейм:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.nickname = ctx.message.text;
        await ctx.reply('Платформа (TikTok / YouTube):', Markup.keyboard([['TikTok', 'YouTube']]).oneTime().resize());
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.platform = ctx.message.text;
        await ctx.reply('Количество подписчиков:', Markup.removeKeyboard());
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.subs = ctx.message.text;
        await ctx.reply('Средние просмотры:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.avgViews = ctx.message.text;
        await ctx.reply('Ссылка на канал:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const data = ctx.wizard.state;
        const db = getData();
        const newApp = {
            id: Date.now().toString(),
            type: 'team',
            userId: ctx.from.id.toString(),
            user: ctx.from.username || ctx.from.first_name,
            nickname: data.nickname,
            platform: data.platform,
            subscribers: data.subs,
            views: data.avgViews,
            channel: ctx.message.text,
            status: 'pending',
            date: new Date().toISOString()
        };
        db.applications.push(newApp);
        saveData(db);
        await ctx.reply('✅ Заявка в КП отправлена!');
        return ctx.scene.leave();
    }
);
const paymentScene = new Scenes.WizardScene(
    'payment_wizard',
    async (ctx) => {
        await ctx.reply('💰 Оформление выплаты.\n\nПришлите ссылку на ваше видео:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.video = ctx.message.text;
        await ctx.reply('Укажите реквизиты и сумму (Пример: Сбер, СБП, 300р):');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const db = getData();
        const newApp = {
            id: Date.now().toString(),
            type: 'payment',
            userId: ctx.from.id.toString(),
            user: ctx.from.username || ctx.from.first_name,
            video: ctx.wizard.state.video,
            paymentInfo: ctx.message.text,
            status: 'pending',
            date: new Date().toISOString()
        };
        db.applications.push(newApp);
        saveData(db);
        await ctx.reply('✅ Заявка на выплату отправлена!');
        return ctx.scene.leave();
    }
);
const bot = new Telegraf(BOT_TOKEN);
const stage = new Scenes.Stage([teamScene, paymentScene]);
bot.use(session());
bot.use(stage.middleware());
bot.start(async (ctx) => {
    await ctx.scene.leave();
    const db = getData();
    const userId = ctx.from.id.toString();
    if (!db.users.includes(userId)) {
        db.users.push(userId);
        saveData(db);
    }
    const buttons = [['Заявка в КП', 'Прайс'], ['Информация', 'Выплата']];
    if (ctx.from.id === ADMIN_ID) buttons.push([Markup.button.webApp('Панель Управления', MINI_APP_URL)]);
    await ctx.reply('Привет! Это DropTime Media.', Markup.keyboard(buttons).resize());
});
bot.hears('Заявка в КП', async (ctx) => {
    await ctx.scene.leave();
    await ctx.scene.enter('team_wizard');
});
bot.hears('Выплата', async (ctx) => {
    await ctx.scene.leave();
    await ctx.scene.enter('payment_wizard');
});
bot.hears('Прайс', (ctx) => {
    ctx.reply('Прайс:\n4000 просм = 300р\n2000 просм = 200р');
});
bot.hears('Информация', async (ctx) => {
    const db = getData();
    const member = db.team.find(m => m.userId === ctx.from.id.toString());
    if (!member) return ctx.reply('Вы не в команде.');
    await ctx.reply(`Ник: ${member.nickname}\nВыплачено: ${member.totalEarned || 0}р`);
});
bot.launch().then(() => console.log('Бот запущен! Ошибок нет.'));
