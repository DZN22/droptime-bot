import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  BarChart3,
  UserPlus,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  DollarSign,
  Send,
  Lock,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Application {
  id: string;
  type: 'payment' | 'team';
  user: string;
  userId: string;
  nickname?: string;
  platform?: string;
  channel?: string;
  views?: string;
  subscribers?: string;
  video?: string;
  paymentInfo?: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface TeamMember {
  id: string;
  name: string;
  userId: string;
  nickname: string;
  channel: string;
  subs: string;
  avgViews: string;
  totalEarned: number;
  platform: string;
  status: 'active' | 'banned';
}

const ADMIN_ID = "7822594120";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'apps' | 'team' | 'stats' | 'broadcast'>('apps');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [applications, setApplications] = useState<Application[]>([
    {
      id: '1',
      type: 'payment',
      user: 'Ivan_K',
      userId: '12345',
      video: 'https://vm.tiktok.com/Z...',
      paymentInfo: 'Сбер, СБП, 300р',
      status: 'pending'
    },
    {
      id: '2',
      type: 'team',
      user: 'MediaCreator',
      userId: '67890',
      nickname: 'Creator_GG',
      platform: 'YouTube',
      channel: 'youtube.com/c/test',
      views: '10k',
      subscribers: '1.2k',
      status: 'pending'
    },
  ]);

  const [team] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Ivan_K',
      userId: '12345',
      nickname: 'Ivan_Play',
      channel: 'youtube.com/@ivan',
      subs: '1.2k',
      avgViews: '400',
      totalEarned: 1200,
      platform: 'YouTube',
      status: 'active'
    }
  ]);

  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUserId(user.id.toString());
        if (user.id.toString() === ADMIN_ID) {
          setIsAuthenticated(true);
        }
      }
    } else {
      setUserId(ADMIN_ID);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) return <div className="min-h-screen bg-pink-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>;

  if (!isAuthenticated) return <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-6 text-center"><div className="bg-white p-8 rounded-3xl shadow-xl border border-pink-200"><Lock className="w-16 h-16 text-pink-400 mx-auto mb-4" /><h1 className="text-2xl font-bold text-gray-800 mb-2">Доступ ограничен</h1><p className="text-gray-500 mb-6">Панель администратора DropTime.</p><div className="bg-pink-100 p-3 rounded-xl text-pink-700 text-sm font-mono">Ваш ID: {userId || '???'}</div></div></div>;

  const handleAppAction = (id: string, status: 'approved' | 'rejected') => {
    setApplications(apps => apps.map(a => a.id === id ? { ...a, status } : a));
  };

  const sendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    alert('Рассылка запущена!');
    setBroadcastMessage('');
  };

  return (
      <div className="min-h-screen bg-[#FFF5F7] text-gray-800 font-sans pb-24">
        <header className="bg-white border-b border-pink-100 p-6 sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-pink-600">DropTime</h1>
            <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">Media Dashboard</p>
          </div>
          <div className="bg-pink-50 px-3 py-1 rounded-full border border-pink-200 text-[10px] font-bold text-pink-500">ADMIN</div>
        </header>

        <main className="p-4 max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'apps' && (
                <motion.div key="apps" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-pink-700"><UserPlus className="w-5 h-5" /> Новые заявки</h2>
                  {applications.filter(a => a.status === 'pending').map(app => (
                      <div key={app.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-pink-50">
                        <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${app.type === 'payment' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {app.type === 'payment' ? 'Выплата' : 'В КП'}
                    </span>
                          <span className="text-xs text-gray-400 font-medium">@{app.user}</span>
                        </div>

                        {app.type === 'team' ? (
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center gap-2"><User className="w-4 h-4 text-pink-400" /><span className="text-sm font-bold text-gray-700">{app.nickname}</span></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-pink-50/50 p-2 rounded-xl text-[11px]"><p className="text-gray-400">Платформа</p><p className="font-bold">{app.platform}</p></div>
                                <div className="bg-pink-50/50 p-2 rounded-xl text-[11px]"><p className="text-gray-400">Подписчики</p><p className="font-bold">{app.subscribers}</p></div>
                              </div>
                              <div className="bg-pink-50/50 p-3 rounded-xl text-[11px]"><p className="text-gray-400">Канал</p><p className="font-bold text-pink-600 truncate">{app.channel}</p></div>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-6">
                              <div className="bg-pink-50/50 p-3 rounded-xl text-[11px]"><p className="text-gray-400">Видео</p><p className="font-bold text-blue-500 truncate">{app.video}</p></div>
                              <div className="bg-pink-50/50 p-3 rounded-xl text-[11px]"><p className="text-gray-400">Реквизиты</p><p className="font-bold text-green-600">{app.paymentInfo}</p></div>
                            </div>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => handleAppAction(app.id, 'approved')} className="flex-1 bg-pink-500 text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-100"><CheckCircle className="w-4 h-4" /> Одобрить</button>
                          <button onClick={() => handleAppAction(app.id, 'rejected')} className="flex-1 bg-white border border-gray-200 text-gray-500 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-50"><XCircle className="w-4 h-4" /> Отказ</button>
                        </div>
                      </div>
                  ))}
                </motion.div>
            )}

            {activeTab === 'team' && (
                <motion.div key="team" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-pink-700"><Users className="w-5 h-5" /> Состав медиа ({team.length})</h2>
                  {team.map(member => (
                      <div key={member.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-pink-50">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 font-black text-xl">{member.nickname[0]}</div>
                          <div>
                            <h3 className="font-bold text-gray-900">@{member.name}</h3>
                            <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">{member.platform}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div className="bg-pink-50/50 p-3 rounded-xl text-[11px]"><p className="text-gray-400">Выплачено</p><p className="font-bold text-green-600">{member.totalEarned} ᴘ</p></div>
                          <div className="bg-pink-50/50 p-3 rounded-xl text-[11px]"><p className="text-gray-400">Подписчики</p><p className="font-bold">{member.subs}</p></div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 bg-orange-50 text-orange-600 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-orange-100"><Ban className="w-3.5 h-3.5" /> Бан</button>
                          <button className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-red-100"><Trash2 className="w-3.5 h-3.5" /> Кик</button>
                        </div>
                      </div>
                  ))}
                </motion.div>
            )}

            {activeTab === 'stats' && (
                <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-pink-700"><BarChart3 className="w-5 h-5" /> Глобальная стата</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-pink-50 text-center"><DollarSign className="w-6 h-6 text-pink-500 mx-auto mb-2" /><p className="text-2xl font-black text-gray-900">1.5k ᴘ</p><p className="text-[10px] text-gray-400 font-bold uppercase">Всего выплат</p></div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-pink-50 text-center"><Users className="w-6 h-6 text-pink-500 mx-auto mb-2" /><p className="text-2xl font-black text-gray-900">{team.length}</p><p className="text-[10px] text-gray-400 font-bold uppercase">В команде</p></div>
                  </div>
                </motion.div>
            )}

            {activeTab === 'broadcast' && (
                <motion.div key="broadcast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-pink-700"><MessageSquare className="w-5 h-5" /> Рассылка по базе</h2>
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-pink-50">
                <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Ваше сообщение..."
                    className="w-full h-40 bg-pink-50/30 border border-pink-100 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-pink-200 text-gray-700 resize-none mb-4"
                />
                    <button
                        onClick={sendBroadcast}
                        className="w-full bg-pink-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-100"
                    >
                      <Send className="w-5 h-5" /> Начать рассылку
                    </button>
                  </div>
                </motion.div>
            )}
          </AnimatePresence>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-pink-50 p-4 pb-10 z-20 flex justify-around max-w-lg mx-auto">
          <NavBtn active={activeTab === 'apps'} onClick={() => setActiveTab('apps')} icon={<UserPlus />} label="Заявки" />
          <NavBtn active={activeTab === 'team'} onClick={() => setActiveTab('team')} icon={<Users />} label="Состав" />
          <NavBtn active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 />} label="Стата" />
          <NavBtn active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} icon={<MessageSquare />} label="Рассылка" />
        </nav>
      </div>
  );
};

const NavBtn = ({ active, onClick, icon, label }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-pink-500 scale-105' : 'text-gray-400'}`}>
      <div className={`p-2 rounded-xl ${active ? 'bg-pink-50 shadow-inner' : ''}`}>{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
);

export default App;