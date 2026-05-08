import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, BarChart3, UserPlus, Trash2, Ban, CheckCircle, XCircle, DollarSign, Send, Lock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Application { id: string; type: 'payment' | 'team'; user: string; userId: string; nickname?: string; platform?: string; channel?: string; views?: string; subscribers?: string; video?: string; paymentInfo?: string; status: 'pending' | 'approved' | 'rejected'; }
interface TeamMember { id: string; name: string; userId: string; nickname: string; channel: string; subs: string; avgViews: string; totalEarned: number; platform: string; status: 'active' | 'banned'; }

const ADMIN_ID = "7822594120";
const API_BASE_URL = 'https://droptime-bot.onrender.com'; // ВАША ССЫЛКА ОТ RENDER

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'apps' | 'team' | 'stats' | 'broadcast'>('apps');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/data`);
      const data = await res.json();
      if (data.applications) setApplications(data.applications);
      if (data.team) setTeam(data.team);
    } catch (e) { console.error('Error fetching data:', e); }
  };

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready(); tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUserId(user.id.toString());
        if (user.id.toString() === ADMIN_ID) setIsAuthenticated(true);
      }
    } else { setUserId(ADMIN_ID); setIsAuthenticated(true); }
    loadData();
    const interval = setInterval(loadData, 10000);
    setIsLoading(false);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div className="min-h-screen bg-pink-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-6 text-center"><div className="bg-white p-8 rounded-3xl shadow-xl border border-pink-200"><Lock className="w-16 h-16 text-pink-400 mx-auto mb-4" /><h1 className="text-2xl font-bold text-gray-800 mb-2">Доступ ограничен</h1><div className="bg-pink-100 p-3 rounded-xl text-pink-700 text-sm font-mono">ID: {userId || '???'}</div></div></div>;

  const handleAppAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) loadData();
    } catch (e) { alert('Ошибка соединения с ботом'); }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-gray-800 pb-24">
      <header className="bg-white border-b border-pink-100 p-6 sticky top-0 z-10 flex justify-between items-center">
        <div><h1 className="text-2xl font-black text-pink-600">DropTime</h1><p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">Media Dashboard</p></div>
        <div className="bg-pink-50 px-3 py-1 rounded-full text-[10px] font-bold text-pink-500">LIVE DB</div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'apps' && (
            <motion.div key="apps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-pink-700"><UserPlus className="w-5 h-5" /> Новые заявки ({applications.length})</h2>
              {applications.map(app => (
                <div key={app.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-pink-50">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${app.type === 'payment' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{app.type === 'payment' ? 'Выплата' : 'В КП'}</span>
                    <span className="text-xs text-gray-400">@{app.user}</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    {app.type === 'team' ? <>
                      <div className="flex items-center gap-2"><User className="w-4 h-4 text-pink-400" /><span className="text-sm font-bold">{app.nickname}</span></div>
                      <div className="bg-pink-50/50 p-3 rounded-xl text-[11px]"><p className="text-gray-400">Канал</p><p className="font-bold text-pink-600 truncate">{app.channel}</p></div>
                    </> : <>
                      <div className="bg-pink-50/50 p-3 rounded-xl text-[11px]"><p className="text-gray-400">Видео</p><p className="font-bold text-blue-500 truncate">{app.video}</p></div>
                      <div className="bg-pink-50/50 p-3 rounded-xl text-[11px]"><p className="text-gray-400">Реквизиты</p><p className="font-bold text-green-600">{app.paymentInfo}</p></div>
                    </>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAppAction(app.id, 'approved')} className="flex-1 bg-pink-500 text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-100">Одобрить</button>
                    <button onClick={() => handleAppAction(app.id, 'rejected')} className="flex-1 bg-white border border-gray-200 text-gray-500 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2">Отказ</button>
                  </div>
                </div>
              ))}
              {applications.length === 0 && <div className="text-center py-20 opacity-30 font-bold">Заявок пока нет</div>}
            </motion.div>
          )}
          {/* Аналогично для вкладок team и stats... */}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-pink-50 p-4 pb-10 flex justify-around max-w-lg mx-auto">
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
    <div className={`p-2 rounded-xl ${active ? 'bg-pink-50' : ''}`}>{icon}</div>
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);
export default App;
