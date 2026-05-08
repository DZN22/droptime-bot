import { Telegraf, Markup, Scenes, session } from 'telegraf';
import express from 'express';
import cors from 'cors';
import fs from 'fs';

const DB_PATH = './db.json';

// --- ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ---
const getData = () => {
    if (!fs.existsSync(DB_PATH)) {
        const initialData = { applications: [], team: [], users: [], stats: { totalPaid: 0 } };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
};
const saveData = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

const BOT_TOKEN = '8767761276:AAFRmhWKiSMZufw0mmeV85DlL9ShuyhGQ6A';
const ADMIN_ID = 7822594120;
const MINI_APP_URL = 'https://droptime-media.vercel.app'; // Ваша ссылка Vercel

const bot = new Telegraf(BOT_TOKEN);

// --- API СЕРВЕР ДЛЯ ПАНЕЛИ ---
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/data', (req, res) => {
    res.json(getData());
});

app.post('/api/action', (req, res) => {
    const { id, action } = req.body;
    const db = getData();
    const appIndex = db.applications.findIndex(a => a.id === id);
    if (appIndex === -1) return res.status(404).json({ error: 'Заявка не найдена' });
    const application = db.applications[appIndex];

    if (action === 'approved') {
        if (application.type === 'team') {
            db.team.push({
                id: Date.now().toString(),
                userId: application.userId,
                name: application.user,
                nickname: application.nickname,
                platform: application.platform,
                subs: application.subscribers,
                avgViews: application.views,
                channel: application.channel,
                totalEarned: 0,
                status: 'active'
            });
        }
    }
    db.applications.splice(appIndex, 1); // Удаляем заявку после обработки
    saveData(db);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`API Server on ${PORT}`));

// --- СЦЕНЫ ТЕЛЕГРАМ ---
const teamScene = new Scenes.WizardScene(
    'team_wizard',
    async (ctx) => {
        const db = getData();
        const userId = ctx.from.id.toString();
        if (db.applications.find(a => a.userId === userId)) return ctx.reply('⏳ Заявка уже есть!').then(() => ctx.scene.leave());
        if (db.team.find(m => m.userId === userId)) return ctx.reply('❌ Вы уже в команде!').then(() => ctx.scene.leave());
        await ctx.reply('📝 Заявка в КП.\n\nВведите ваш игровой никнейм:');
        return ctx.wizard.next();
    },
    async (ctx) => { ctx.wizard.state.nickname = ctx.message.text; await ctx.reply('Платформа:', Markup.keyboard([['TikTok', 'YouTube']]).oneTime().resize()); return ctx.wizard.next(); },
    async (ctx) => { ctx.wizard.state.platform = ctx.message.text; await ctx.reply('Подписчики:', Markup.removeKeyboard()); return ctx.wizard.next(); },
    async (ctx) => { ctx.wizard.state.subs = ctx.message.text; await ctx.reply('Средние просмотры:'); return ctx.wizard.next(); },
    async (ctx) => { ctx.wizard.state.avgViews = ctx.message.text; await ctx.reply('Ссылка на ваш канал:'); return ctx.wizard.next(); },
    async (ctx) => {
        const db = getData();
        db.applications.push({ id: Date.now().toString(), type: 'team', userId: ctx.from.id.toString(), user: ctx.from.username || ctx.from.first_name, nickname: ctx.wizard.state.nickname, platform: ctx.wizard.state.platform, subscribers: ctx.wizard.state.subs, views: ctx.wizard.state.avgViews, channel: ctx.message.text, status: 'pending' });
        saveData(db);
        await ctx.reply('✅ Заявка отправлена!');
        return ctx.scene.leave();
    }
);

const paymentScene = new Scenes.WizardScene(
    'payment_wizard',
    async (ctx) => {
        const db = getData();
        if (db.applications.find(a => a.userId === ctx.from.id.toString())) return ctx.reply('⏳ У вас уже есть активная заявка!').then(() => ctx.scene.leave());
        await ctx.reply('💰 Оформление выплаты.\n\nПришлите ссылку на видео:');
        return ctx.wizard.next();
    },
    async (ctx) => { ctx.wizard.state.video = ctx.message.text; await ctx.reply('Укажите реквизиты и сумму:'); return ctx.wizard.next(); },
    async (ctx) => {
        const db = getData();
        db.applications.push({ id: Date.now().toString(), type: 'payment', userId: ctx.from.id.toString(), user: ctx.from.username || ctx.from.first_name, video: ctx.wizard.state.video, paymentInfo: ctx.message.text, status: 'pending' });
        saveData(db);
        await ctx.reply('✅ Заявка отправлена!');
        return ctx.scene.leave();
    }
);

const stage = new Scenes.Stage([teamScene, paymentScene]);
bot.use(session());
bot.use(stage.middleware());

bot.start(async (ctx) => {
    await ctx.scene.leave();
    const db = getData();
    if (!db.users.includes(ctx.from.id.toString())) { db.users.push(ctx.from.id.toString()); saveData(db); }
    const buttons = [['Заявка в КП', 'Прайс'], ['Информация', 'Выплата']];
    if (ctx.from.id === ADMIN_ID) buttons.push([Markup.button.webApp('Панель Управления', MINI_APP_URL)]);
    await ctx.reply('Привет! Это DropTime Media.', Markup.keyboard(buttons).resize());
});

bot.hears('Заявка в КП', (ctx) => ctx.scene.enter('team_wizard'));
bot.hears('Выплата', (ctx) => ctx.scene.enter('payment_wizard'));
bot.hears('Прайс', (ctx) => ctx.reply('Цены:\n4000 просм = 300р\n2000 просм = 200р\nВидео не должно быть старше 1 дня!'));
bot.hears('Информация', async (ctx) => {
    const db = getData();
    const member = db.team.find(m => m.userId === ctx.from.id.toString());
    if (!member) return ctx.reply('Вы не в команде.');
    await ctx.reply(`👤 Профиль:\nНик: ${member.nickname}\nКанал: ${member.channel}\nПодписчики: ${member.subs}\nВыплачено: ${member.totalEarned}р`);
});

bot.launch();
