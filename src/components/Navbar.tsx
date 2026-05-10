import { useAuth } from '../hooks/useAuth';
import { navigate } from '../hooks/useRouter';
import { supabase } from '../lib/supabase';
import { Bell, BookOpen, SquarePen as PenSquare, Bookmark, LogOut, Menu, X, Heart, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link: string;
  read_at: string | null;
  created_at: string;
};

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    void fetchNotifications();
    const timer = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [user]);

  async function fetchNotifications() {
    const [{ data }, { count }] = await Promise.all([
      supabase.from('notifications').select('id, title, message, link, read_at, created_at').order('created_at', { ascending: false }).limit(6),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read_at', null),
    ]);
    if (data) setNotifications(data as NotificationItem[]);
    setUnreadCount(count || 0);
  }

  async function openNotification(notification: NotificationItem) {
    setNotificationsOpen(false);
    setMobileOpen(false);
    if (!notification.read_at) {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notification.id);
      void fetchNotifications();
    }
    navigate(notification.link || '/notifications');
  }

  async function handleSignOut() {
    setMobileOpen(false);
    await signOut();
    navigate('/');
  }

  function openProfile() {
    if (profile?.username) {
      navigate(`/profile/${profile.username}`);
      return;
    }
    navigate('/feed');
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'glass border-b border-stone-200/40 shadow-sm shadow-stone-900/5'
        : 'bg-white/60 backdrop-blur-md border-b border-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center group-hover:scale-105 group-hover:rotate-[-2deg] transition-all duration-300">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-900 tracking-tight">JaarJaar</span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/feed">Explorer</NavLink>
            <NavLink to="/collectes" icon={<Heart className="w-3.5 h-3.5" />}>Collectes</NavLink>
            {user && (
              <>
                <NavLink to="/new" icon={<PenSquare className="w-3.5 h-3.5" />}>Ecrire</NavLink>
                <NavLink to="/bookmarks" icon={<Bookmark className="w-3.5 h-3.5" />}>Favoris</NavLink>
              </>
            )}
            {isAdmin && (
              <NavLink to="/admin" icon={<Shield className="w-3.5 h-3.5" />} className="text-amber-700 hover:text-amber-800 hover:bg-amber-50">
                Admin
              </NavLink>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all duration-200" title="Notifications">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notificationsOpen && (
                    <div className="absolute right-0 top-11 w-80 bg-white border border-stone-200/70 rounded-xl shadow-xl shadow-stone-900/10 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                        <p className="text-sm font-bold text-stone-900">Notifications</p>
                        <button onClick={() => { setNotificationsOpen(false); navigate('/notifications'); }} className="text-xs font-medium text-stone-500 hover:text-stone-900">Tout voir</button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length ? notifications.map((notification) => (
                          <button key={notification.id} onClick={() => openNotification(notification)} className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-0">
                            <div className="flex gap-2">
                              {!notification.read_at && <span className="w-2 h-2 rounded-full bg-rose-600 mt-1.5 flex-shrink-0" />}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-stone-800 truncate">{notification.title}</p>
                                <p className="text-xs text-stone-500 line-clamp-2">{notification.message}</p>
                              </div>
                            </div>
                          </button>
                        )) : (
                          <div className="px-4 py-8 text-center text-sm text-stone-400">Aucune notification</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={openProfile} className="flex items-center gap-2 hover:bg-stone-100 rounded-xl px-3 py-1.5 transition-all duration-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center text-sm font-semibold text-stone-600 overflow-hidden">
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : (profile?.full_name?.[0] || profile?.username?.[0] || '?')}
                  </div>
                  <span className="text-sm font-medium text-stone-700">{profile?.username || user.email}</span>
                </button>
                <button onClick={handleSignOut} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all duration-200" title="Deconnexion">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/login')} className="btn-ghost px-4 py-2 text-sm">Connexion</button>
                <button onClick={() => navigate('/register')} className="btn-primary px-4 py-2 text-sm shadow-sm">Rejoindre</button>
              </div>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-xl transition-all duration-200">
            <div className={`transition-transform duration-300 ${mobileOpen ? 'rotate-90' : ''}`}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-400 ${mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-stone-200/40 glass px-4 py-3 space-y-1">
          <MobileNavLink to="/feed" onClick={() => setMobileOpen(false)}>Explorer</MobileNavLink>
          <MobileNavLink to="/collectes" onClick={() => setMobileOpen(false)}>Collectes solidaires</MobileNavLink>
          {user ? (
            <>
              <MobileNavLink to="/new" onClick={() => setMobileOpen(false)}>Ecrire</MobileNavLink>
              <MobileNavLink to="/bookmarks" onClick={() => setMobileOpen(false)}>Favoris</MobileNavLink>
              <MobileNavLink to="/notifications" onClick={() => setMobileOpen(false)}>
                Notifications{unreadCount > 0 ? ` (${unreadCount > 9 ? '9+' : unreadCount})` : ''}
              </MobileNavLink>
              <MobileNavLink to={profile?.username ? `/profile/${profile.username}` : '/feed'} onClick={() => setMobileOpen(false)}>Mon Profil</MobileNavLink>
              {isAdmin && (
                <MobileNavLink to="/admin" onClick={() => setMobileOpen(false)} className="text-amber-700 hover:bg-amber-50">
                  Administration
                </MobileNavLink>
              )}
              <button onClick={handleSignOut} className="block w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200">
                Deconnexion
              </button>
            </>
          ) : (
            <div className="pt-2 space-y-2">
              <button onClick={() => { navigate('/login'); setMobileOpen(false); }} className="w-full btn-secondary px-4 py-2.5 text-sm">Connexion</button>
              <button onClick={() => { navigate('/register'); setMobileOpen(false); }} className="w-full btn-primary px-4 py-2.5 text-sm">Rejoindre</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, children, icon, className }: { to: string; children: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={() => navigate(to)}
      className={`px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100/80 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${className || ''}`}
    >
      {icon}{children}
    </button>
  );
}

function MobileNavLink({ to, children, onClick, className }: { to: string; children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={() => { navigate(to); onClick(); }}
      className={`block w-full text-left px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-all duration-200 ${className || ''}`}
    >
      {children}
    </button>
  );
}
