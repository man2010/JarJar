import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Heart, MessageCircle, Rocket, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../hooks/useRouter';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read_at: string | null;
  created_at: string;
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    void fetchNotifications();
  }, [user]);

  async function fetchNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, message, link, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(40);
    if (data) setNotifications(data as NotificationItem[]);
    setLoading(false);
  }

  async function openNotification(notification: NotificationItem) {
    if (!notification.read_at) {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notification.id);
    }
    navigate(notification.link || '/feed');
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() });
    await fetchNotifications();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate('/feed')} className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Retour
        </button>

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 bg-stone-900 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Notifications</h1>
                <p className="text-sm text-stone-500">{unreadCount ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''} notification${unreadCount > 1 ? 's' : ''}` : 'Tout est a jour'}</p>
              </div>
            </div>
          </div>
          {notifications.length > 0 && (
            <button onClick={markAllRead} className="btn-secondary px-4 py-2.5 text-sm flex-shrink-0">
              <CheckCheck className="w-4 h-4" />
              Tout lu
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-stone-200/70 overflow-hidden shadow-sm">
          {notifications.length ? notifications.map((notification) => (
            <button key={notification.id} onClick={() => openNotification(notification)} className="w-full text-left px-5 py-4 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notification.read_at ? 'bg-stone-100 text-stone-400' : iconTone(notification.type)}`}>
                  {iconFor(notification.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!notification.read_at && <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0" />}
                    <p className="text-sm font-semibold text-stone-900 truncate">{notification.title}</p>
                  </div>
                  <p className="text-sm text-stone-500 leading-relaxed">{notification.message}</p>
                  <p className="text-xs text-stone-400 mt-2">{formatDate(notification.created_at)}</p>
                </div>
              </div>
            </button>
          )) : (
            <div className="py-16 text-center">
              <Bell className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-400">Aucune notification pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function iconFor(type: string) {
  if (type.includes('like')) return <Heart className="w-4 h-4" />;
  if (type.includes('collecte')) return <Rocket className="w-4 h-4" />;
  return <MessageCircle className="w-4 h-4" />;
}

function iconTone(type: string) {
  if (type.includes('like')) return 'bg-rose-50 text-rose-600';
  if (type.includes('approved')) return 'bg-emerald-50 text-emerald-700';
  if (type.includes('rejected')) return 'bg-red-50 text-red-700';
  if (type.includes('collecte')) return 'bg-cyan-50 text-cyan-700';
  return 'bg-blue-50 text-blue-700';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
