import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../hooks/useRouter';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Database,
  Eye,
  FileText,
  HardDrive,
  Heart,
  Headphones,
  Lock,
  MessageCircle,
  Plus,
  RefreshCw,
  Rocket,
  Shield,
  SquarePen as PenSquare,
  Trash2,
  TrendingUp,
  Users,
  Video,
  XCircle,
} from 'lucide-react';

type Report = {
  generated_at: string;
  overview: Record<string, number>;
  content: {
    by_type: Record<string, number>;
    by_publication: Record<string, number>;
    anonymous_posts: number;
    media_posts: number;
    top_posts: AdminPost[];
    recent_posts: AdminPost[];
  };
  users: {
    recent: AdminUser[];
    most_active: ActiveUser[];
  };
  collectes: {
    by_status: Record<string, number>;
    by_type: Record<string, number>;
    total_target_amount: number;
    current_collected_amount: number;
    total_donation_amount: number;
    donations_count: number;
    recent: AdminCollecte[];
  };
  moderation: {
    pending_collectes: number;
    draft_posts: number;
    rejected_collectes: number;
    anonymous_posts: number;
    anonymous_comments: number;
    recent_comments: AdminComment[];
  };
  media: {
    s3_configured: boolean;
    total_assets: number;
    total_size: number;
    by_storage: Record<string, number>;
    by_type: Record<string, number>;
    recent: AdminMedia[];
  };
  activity: ActivityPoint[];
  alerts: { level: 'high' | 'medium' | 'low'; label: string }[];
};

type AdminPost = {
  id: string;
  title: string;
  post_type: string;
  published: boolean;
  is_anonymous: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  engagement_score: number;
  created_at: string;
  has_audio: boolean;
  has_video: boolean;
  profiles: { username: string; full_name: string } | null;
};

type AdminCollecte = {
  id: string;
  title: string;
  description: string;
  collecte_type: string;
  status: string;
  target_amount: number;
  current_amount: number;
  documents: Array<string | { url: string; name?: string; storage?: string }>;
  created_at: string;
  profiles: { username: string; full_name: string } | null;
};

type AdminUser = {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  created_at: string;
  posts_count: number;
};

type ActiveUser = {
  id: string;
  username: string;
  full_name: string;
  role: string;
  status: string;
  posts_count: number;
  comments_count: number;
  donations_count: number;
};

type AdminComment = {
  id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  post_id?: string;
  post_title?: string;
  profiles: { username: string; full_name: string } | null;
};

type AdminMedia = {
  id: string;
  storage: string;
  content_type: string;
  size: number;
  created_at: string;
  original_name: string;
};

type ActivityPoint = {
  date: string;
  users: number;
  posts: number;
  comments: number;
  collectes: number;
  media: number;
};

type UserDetail = {
  user: AdminUser;
  profile: ActiveUser & { bio?: string; avatar_url?: string };
  stats: { posts_count: number; comments_count: number; collectes_count: number; donations_count: number };
};

type AdminActivityResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

const typeIcons: Record<string, React.ReactNode> = {
  article: <BookOpen className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  audio: <Headphones className="w-4 h-4" />,
  confession: <Lock className="w-4 h-4" />,
};

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'collectes' | 'posts' | 'users' | 'media' | 'reporting'>('overview');
  const [activityType, setActivityType] = useState<'posts' | 'comments'>('posts');
  const [activityDate, setActivityDate] = useState(() => formatInputDate(new Date()));
  const [activityHour, setActivityHour] = useState(() => String(new Date().getHours()).padStart(2, '0'));
  const [activityPage, setActivityPage] = useState(1);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [activityPosts, setActivityPosts] = useState<AdminActivityResult<AdminPost>>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [activityComments, setActivityComments] = useState<AdminActivityResult<AdminComment>>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [adminUsers, setAdminUsers] = useState<AdminActivityResult<AdminUser>>({ items: [], total: 0, page: 1, pageSize: 5 });
  const [userFilterDate, setUserFilterDate] = useState('');
  const [userFilterStatus, setUserFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [userPage, setUserPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [overviewPostsPage, setOverviewPostsPage] = useState(1);
  const [topPostsPage, setTopPostsPage] = useState(1);
  const [activeUsersPage, setActiveUsersPage] = useState(1);
  const [mediaPage, setMediaPage] = useState(1);
  const [collectesPage, setCollectesPage] = useState(1);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) return;
    void fetchReport();
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    if (activeTab !== 'posts' && activeTab !== 'reporting') return;
    void fetchActivity();
  }, [user, isAdmin, activeTab, activityType, activityDate, activityHour, activityPage]);

  useEffect(() => {
    if (activeTab === 'posts' && activityType !== 'posts') changeActivityFilter({ type: 'posts' });
  }, [activeTab, activityType]);

  useEffect(() => {
    if (!user || !isAdmin || activeTab !== 'users') return;
    void fetchAdminUsers();
  }, [user, isAdmin, activeTab, userFilterDate, userFilterStatus, userPage]);

  async function fetchReport() {
    setLoading(true);
    const { data } = await api.get<Report>('/api/admin/report');
    if (data) {
      setReport(data);
      if (data.moderation.pending_collectes > 0) setActiveTab('collectes');
    }
    setLoading(false);
  }

  async function approveCollecte(id: string) {
    await supabase.from('collectes').update({ status: 'approved', reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq('id', id);
    await fetchReport();
  }

  async function rejectCollecte(id: string) {
    await supabase.from('collectes').update({ status: 'rejected', reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq('id', id);
    await fetchReport();
  }

  async function togglePublish(postId: string, currentPublished: boolean) {
    await supabase.from('posts').update({ published: !currentPublished }).eq('id', postId);
    await fetchReport();
    if (activeTab === 'posts' || activeTab === 'reporting') await fetchActivity();
  }

  async function deletePost(postId: string) {
    await supabase.from('posts').delete().eq('id', postId);
    await fetchReport();
    if (activeTab === 'posts' || activeTab === 'reporting') await fetchActivity();
  }

  async function updateUserStatus(userId: string, status: 'active' | 'suspended') {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await fetchReport();
    if (activeTab === 'users') await fetchAdminUsers();
  }

  async function showUserDetail(userId: string) {
    const { data } = await api.get<UserDetail>(`/api/admin/users/${userId}`);
    if (data) setUserDetail(data);
  }

  async function fetchActivity() {
    const range = hourRange(activityDate, activityHour);
    setActivityLoading(true);
    setActivityError('');
    const query = new URLSearchParams({
      type: activityType,
      start: range.start,
      end: range.end,
      page: String(activityPage),
      pageSize: '5',
    });
    const { data, error } = await api.get<AdminActivityResult<AdminPost | AdminComment>>(`/api/admin/activity?${query.toString()}`);
    if (error) {
      setActivityError(error.message);
    } else if (data && activityType === 'posts') {
      setActivityPosts(data as AdminActivityResult<AdminPost>);
    } else if (data) {
      setActivityComments(data as AdminActivityResult<AdminComment>);
    }
    setActivityLoading(false);
  }

  function changeActivityFilter(next: { type?: 'posts' | 'comments'; date?: string; hour?: string }) {
    if (next.type) setActivityType(next.type);
    if (next.date !== undefined) setActivityDate(next.date);
    if (next.hour !== undefined) setActivityHour(next.hour);
    setActivityPage(1);
  }

  async function fetchAdminUsers() {
    setUsersLoading(true);
    setUsersError('');
    const query = new URLSearchParams({
      status: userFilterStatus,
      page: String(userPage),
      pageSize: '5',
    });
    if (userFilterDate) {
      const range = dayRange(userFilterDate);
      query.set('start', range.start);
      query.set('end', range.end);
    }
    const { data, error } = await api.get<AdminActivityResult<AdminUser>>(`/api/admin/users?${query.toString()}`);
    if (error) setUsersError(error.message);
    else if (data) setAdminUsers(data);
    setUsersLoading(false);
  }

  function changeUserFilter(next: { date?: string; status?: 'all' | 'active' | 'inactive' }) {
    if (next.date !== undefined) setUserFilterDate(next.date);
    if (next.status) setUserFilterStatus(next.status);
    setUserPage(1);
  }

  const maxActivity = useMemo(() => {
    if (!report) return 1;
    return Math.max(1, ...report.activity.map((point) => point.users + point.posts + point.comments + point.collectes + point.media));
  }, [report]);

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center px-4">
        <div className="max-w-md text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Acces reserve</h2>
          <p className="text-stone-500 mb-6">Le dashboard admin est accessible uniquement aux administrateurs.</p>
          <button onClick={() => navigate('/feed')} className="btn-primary px-6 py-3">Retour a l'exploration</button>
        </div>
      </div>
    );
  }

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
          <p className="text-sm text-stone-400">Chargement de l'administration...</p>
        </div>
      </div>
    );
  }

  const pendingCollectes = report.collectes.recent.filter((collecte) => collecte.status === 'pending');

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate('/feed')} className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Retour au site
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-stone-900 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Dashboard Admin</h1>
              <p className="text-sm text-stone-500">Gerer les collectes, publications, utilisateurs et medias.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigate('/collecte')} className="btn-secondary px-4 py-2.5 text-sm">
              <Plus className="w-4 h-4" /> Collecte
            </button>
            <button onClick={() => navigate('/new')} className="btn-primary px-4 py-2.5 text-sm">
              <PenSquare className="w-4 h-4" /> Contenu
            </button>
          </div>
        </div>

        {report.alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {report.alerts.map((alert) => (
              <div key={alert.label} className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${alert.level === 'high' ? 'bg-red-50 border-red-200 text-red-700' : alert.level === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{alert.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-8">
          <Metric icon={<Users className="w-4 h-4" />} label="Utilisateurs" value={report.overview.users} tone="bg-blue-600" />
          <Metric icon={<Shield className="w-4 h-4" />} label="Admins" value={report.overview.admins} tone="bg-stone-900" />
          <Metric icon={<FileText className="w-4 h-4" />} label="Contenus" value={report.overview.posts} tone="bg-indigo-600" />
          <Metric icon={<Eye className="w-4 h-4" />} label="Vues" value={report.overview.views} tone="bg-amber-600" />
          <Metric icon={<Heart className="w-4 h-4" />} label="Likes" value={report.overview.likes} tone="bg-rose-600" />
          <Metric icon={<MessageCircle className="w-4 h-4" />} label="Commentaires" value={report.overview.comments} tone="bg-emerald-600" />
          <Metric icon={<Rocket className="w-4 h-4" />} label="Collectes" value={report.overview.collectes} tone="bg-cyan-700" />
          <Metric icon={<HardDrive className="w-4 h-4" />} label="Medias" value={report.overview.media_assets} tone="bg-violet-700" />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            ['overview', 'Accueil'],
            ['collectes', 'Collectes'],
            ['posts', 'Publications'],
            ['users', 'Utilisateurs'],
            ['media', 'Medias'],
            ['reporting', 'Statistiques'],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === key ? 'bg-stone-900 text-white shadow-sm' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {userDetail && (
          <div className="bg-stone-900 text-white rounded-xl p-5 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-stone-400 mb-1">Detail utilisateur</p>
                <h2 className="text-lg font-bold">@{userDetail.profile?.username || userDetail.user?.username}</h2>
                <p className="text-sm text-stone-400">{userDetail.user?.email}</p>
              </div>
              <button onClick={() => setUserDetail(null)} className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-sm">Fermer</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
              <MiniDark label="Statut" value={userDetail.user?.status || 'active'} />
              <MiniDark label="Role" value={userDetail.user?.role || 'user'} />
              <MiniDark label="Posts" value={userDetail.stats.posts_count} />
              <MiniDark label="Commentaires" value={userDetail.stats.comments_count} />
              <MiniDark label="Collectes" value={userDetail.stats.collectes_count} />
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Panel title="Actions prioritaires" icon={<AlertTriangle className="w-4 h-4" />} className="xl:col-span-2">
              {pendingCollectes.length ? (
                <CollecteList collectes={pendingCollectes} onApprove={approveCollecte} onReject={rejectCollecte} />
              ) : (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
                  Aucune collecte en attente de validation.
                </div>
              )}
            </Panel>

            <Panel title="Etat plateforme" icon={<TrendingUp className="w-4 h-4" />}>
              <StatusRow label="S3" value={report.media.s3_configured ? 'Configure' : 'Fallback MongoDB'} good={report.media.s3_configured} />
              <StatusRow label="Collectes en attente" value={report.moderation.pending_collectes} good={report.moderation.pending_collectes === 0} />
              <StatusRow label="Brouillons" value={report.moderation.draft_posts} good={report.moderation.draft_posts < 5} />
              <StatusRow label="Anonymat contenus" value={report.moderation.anonymous_posts} good />
              <StatusRow label="Stockage media" value={formatBytes(report.media.total_size)} good />
            </Panel>

            <Panel title="Collectes" icon={<Rocket className="w-4 h-4" />}>
              <Distribution rows={Object.entries(report.collectes.by_status)} />
              <div className="pt-3 mt-3 border-t border-stone-100">
                <MoneyRow label="Objectifs" value={report.collectes.total_target_amount} />
                <MoneyRow label="Deja collecte" value={report.collectes.current_collected_amount} />
              </div>
            </Panel>

            <Panel title="Publications recentes" icon={<FileText className="w-4 h-4" />} className="xl:col-span-2">
              <PostTable posts={pageItems(report.content.recent_posts, overviewPostsPage)} onToggle={togglePublish} onDelete={deletePost} />
              <Pagination page={overviewPostsPage} pageSize={5} total={report.content.recent_posts.length} onPage={setOverviewPostsPage} />
            </Panel>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Panel title="Repartition publication" icon={<FileText className="w-4 h-4" />}>
              <Distribution rows={[
                ['Publies', report.content.by_publication.published || 0],
                ['Brouillons', report.content.by_publication.drafts || 0],
                ['Avec media', report.content.media_posts],
                ['Anonymes', report.content.anonymous_posts],
              ]} />
            </Panel>
            <Panel title="Publications par heure" icon={<Clock className="w-4 h-4" />} className="xl:col-span-2">
              <ActivityFilters
                type={activityType}
                date={activityDate}
                hour={activityHour}
                loading={activityLoading}
                lockedType="posts"
                onChange={changeActivityFilter}
                onRefresh={fetchActivity}
              />
              {activityError ? (
                <InlineError message={activityError} />
              ) : activityLoading ? (
                <LoadingRows label="Chargement des publications..." />
              ) : (
                <>
                  <PostTable posts={activityPosts.items} onToggle={togglePublish} onDelete={deletePost} />
                  <Pagination
                    page={activityPosts.page}
                    pageSize={activityPosts.pageSize}
                    total={activityPosts.total}
                    onPage={setActivityPage}
                  />
                </>
              )}
            </Panel>
          </div>
        )}

        {activeTab === 'collectes' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Panel title="Financement" icon={<Heart className="w-4 h-4" />}>
              <MoneyRow label="Objectifs" value={report.collectes.total_target_amount} />
              <MoneyRow label="Collecte" value={report.collectes.current_collected_amount} />
              <MoneyRow label="Dons declares" value={report.collectes.total_donation_amount} />
              <StatusRow label="Participations" value={report.collectes.donations_count} good />
            </Panel>
            <Panel title="Statuts" icon={<BarChart3 className="w-4 h-4" />}>
              <Distribution rows={Object.entries(report.collectes.by_status)} />
            </Panel>
            <Panel title="Demandes a traiter" icon={<AlertTriangle className="w-4 h-4" />} className="xl:col-span-3">
              <CollecteList collectes={pageItems(pendingCollectes.length ? pendingCollectes : report.collectes.recent, collectesPage)} onApprove={approveCollecte} onReject={rejectCollecte} />
              <Pagination page={collectesPage} pageSize={5} total={(pendingCollectes.length ? pendingCollectes : report.collectes.recent).length} onPage={setCollectesPage} />
            </Panel>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Panel title="Utilisateurs" icon={<Users className="w-4 h-4" />}>
              <UserFilters
                date={userFilterDate}
                status={userFilterStatus}
                loading={usersLoading}
                onChange={changeUserFilter}
                onRefresh={fetchAdminUsers}
              />
              {usersError ? (
                <InlineError message={usersError} />
              ) : usersLoading ? (
                <LoadingRows label="Chargement des utilisateurs..." />
              ) : (
                <>
                  <UserList users={adminUsers.items} onStatus={updateUserStatus} onDetails={showUserDetail} />
                  <Pagination page={adminUsers.page} pageSize={adminUsers.pageSize} total={adminUsers.total} onPage={setUserPage} />
                </>
              )}
            </Panel>
            <Panel title="Utilisateurs actifs" icon={<Activity className="w-4 h-4" />}>
              <ActiveUserList users={pageItems(report.users.most_active, activeUsersPage)} onStatus={updateUserStatus} onDetails={showUserDetail} />
              <Pagination page={activeUsersPage} pageSize={5} total={report.users.most_active.length} onPage={setActiveUsersPage} />
            </Panel>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Panel title="Stockage" icon={<Database className="w-4 h-4" />}>
              <StatusRow label="S3" value={report.media.s3_configured ? 'Actif' : 'Inactif'} good={report.media.s3_configured} />
              <StatusRow label="Fichiers" value={report.media.total_assets} good />
              <StatusRow label="Taille" value={formatBytes(report.media.total_size)} good />
              <Distribution rows={Object.entries(report.media.by_storage)} />
            </Panel>
            <Panel title="Types media" icon={<HardDrive className="w-4 h-4" />}>
              <Distribution rows={Object.entries(report.media.by_type)} />
            </Panel>
            <Panel title="Medias recents" icon={<Clock className="w-4 h-4" />}>
              <MediaList media={pageItems(report.media.recent, mediaPage)} />
              <Pagination page={mediaPage} pageSize={5} total={report.media.recent.length} onPage={setMediaPage} />
            </Panel>
          </div>
        )}

        {activeTab === 'reporting' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Panel title="Activite 14 jours" icon={<Activity className="w-4 h-4" />} className="xl:col-span-2">
              <div className="h-56 flex items-end gap-2 border-b border-stone-100 pb-3">
                {report.activity.map((point) => {
                  const total = point.users + point.posts + point.comments + point.collectes + point.media;
                  return (
                    <div key={point.date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-stone-100 rounded-t-lg overflow-hidden flex items-end" style={{ height: 170 }}>
                        <div className="w-full bg-stone-900 rounded-t-lg transition-all" style={{ height: `${Math.max(4, (total / maxActivity) * 100)}%` }} title={`${total} actions`} />
                      </div>
                      <span className="text-[10px] text-stone-400">{new Date(point.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-5 gap-2 mt-4 text-xs text-stone-500">
                <Legend label="Users" color="bg-blue-600" value={sum(report.activity, 'users')} />
                <Legend label="Posts" color="bg-indigo-600" value={sum(report.activity, 'posts')} />
                <Legend label="Comments" color="bg-emerald-600" value={sum(report.activity, 'comments')} />
                <Legend label="Collectes" color="bg-cyan-700" value={sum(report.activity, 'collectes')} />
                <Legend label="Medias" color="bg-violet-700" value={sum(report.activity, 'media')} />
              </div>
            </Panel>
            <Panel title="Anonymat" icon={<Lock className="w-4 h-4" />}>
              <StatusRow label="Posts anonymes" value={report.moderation.anonymous_posts} good />
              <StatusRow label="Commentaires anonymes" value={report.moderation.anonymous_comments} good />
              <p className="text-xs text-stone-400 leading-relaxed mt-4">Les auteurs anonymes restent masques dans le reporting admin.</p>
            </Panel>
            <Panel title="Top contenus" icon={<Eye className="w-4 h-4" />} className="xl:col-span-2">
              <PostTable posts={pageItems(report.content.top_posts, topPostsPage)} onToggle={togglePublish} onDelete={deletePost} />
              <Pagination page={topPostsPage} pageSize={5} total={report.content.top_posts.length} onPage={setTopPostsPage} />
            </Panel>
            <Panel title="Files moderation" icon={<AlertTriangle className="w-4 h-4" />}>
              <StatusRow label="Collectes en attente" value={report.moderation.pending_collectes} good={report.moderation.pending_collectes === 0} />
              <StatusRow label="Contenus brouillon" value={report.moderation.draft_posts} good={report.moderation.draft_posts < 5} />
              <StatusRow label="Collectes rejetees" value={report.moderation.rejected_collectes} good />
            </Panel>
            <Panel title="Recherche par heure" icon={<Calendar className="w-4 h-4" />} className="xl:col-span-3">
              <ActivityFilters
                type={activityType}
                date={activityDate}
                hour={activityHour}
                loading={activityLoading}
                onChange={changeActivityFilter}
                onRefresh={fetchActivity}
              />
              {activityError ? (
                <InlineError message={activityError} />
              ) : activityLoading ? (
                <LoadingRows label="Chargement de la tranche horaire..." />
              ) : activityType === 'posts' ? (
                <>
                  <PostTable posts={activityPosts.items} onToggle={togglePublish} onDelete={deletePost} />
                  <Pagination page={activityPosts.page} pageSize={activityPosts.pageSize} total={activityPosts.total} onPage={setActivityPage} />
                </>
              ) : (
                <>
                  <CommentList comments={activityComments.items} />
                  <Pagination page={activityComments.page} pageSize={activityComments.pageSize} total={activityComments.total} onPage={setActivityPage} />
                </>
              )}
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityFilters({
  type,
  date,
  hour,
  loading,
  lockedType,
  onChange,
  onRefresh,
}: {
  type: 'posts' | 'comments';
  date: string;
  hour: string;
  loading: boolean;
  lockedType?: 'posts' | 'comments';
  onChange: (next: { type?: 'posts' | 'comments'; date?: string; hour?: string }) => void;
  onRefresh: () => void;
}) {
  const hourLabel = `${hour}h00 - ${hour}h59`;
  return (
    <div className="bg-stone-50 border border-stone-200/70 rounded-xl p-4 mb-4">
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_160px_auto] gap-3 lg:items-end">
        {!lockedType && (
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Type</label>
            <div className="flex rounded-xl bg-white border border-stone-200 p-1">
              <button
                type="button"
                onClick={() => onChange({ type: 'posts' })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${type === 'posts' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                Publications
              </button>
              <button
                type="button"
                onClick={() => onChange({ type: 'comments' })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${type === 'comments' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                Commentaires
              </button>
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(event) => onChange({ date: event.target.value })}
            className="input bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Heure</label>
          <select value={hour} onChange={(event) => onChange({ hour: event.target.value })} className="input bg-white">
            {Array.from({ length: 24 }).map((_, index) => {
              const value = String(index).padStart(2, '0');
              return <option key={value} value={value}>{value}h</option>;
            })}
          </select>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="btn-secondary px-4 py-3 text-sm disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>
      <p className="text-xs text-stone-400 mt-3">
        Tranche affichee : {date ? new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR') : '-'} | {hourLabel}
      </p>
    </div>
  );
}

function UserFilters({
  date,
  status,
  loading,
  onChange,
  onRefresh,
}: {
  date: string;
  status: 'all' | 'active' | 'inactive';
  loading: boolean;
  onChange: (next: { date?: string; status?: 'all' | 'active' | 'inactive' }) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-stone-50 border border-stone-200/70 rounded-xl p-4 mb-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_auto] gap-3 lg:items-end">
        <div>
          <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Date de creation</label>
          <input
            type="date"
            value={date}
            onChange={(event) => onChange({ date: event.target.value })}
            className="input bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Statut</label>
          <select value={status} onChange={(event) => onChange({ status: event.target.value as 'all' | 'active' | 'inactive' })} className="input bg-white">
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Non actifs</option>
          </select>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="btn-secondary px-4 py-3 text-sm disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>
      {date && (
        <button type="button" onClick={() => onChange({ date: '' })} className="text-xs text-stone-400 hover:text-stone-700 mt-3">
          Retirer le filtre date
        </button>
      )}
    </div>
  );
}

function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 border-t border-stone-100 pt-4">
      <p className="text-xs text-stone-500">
        {formatNumber((page - 1) * pageSize + 1)}-{formatNumber(Math.min(total, page * pageSize))} sur {formatNumber(total)}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="btn-secondary w-10 h-10 p-0 disabled:opacity-40"
          title="Page precedente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-stone-700 min-w-20 text-center">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="btn-secondary w-10 h-10 p-0 disabled:opacity-40"
          title="Page suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function LoadingRows({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-stone-400">{label}</p>
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-20 rounded-xl bg-stone-100 animate-pulse" />
      ))}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className={`${tone} text-white rounded-xl p-4`}>
      <div className="flex items-center gap-2 opacity-80 mb-2">{icon}<span className="text-[11px] font-medium">{label}</span></div>
      <p className="text-xl font-bold">{formatNumber(value)}</p>
    </div>
  );
}

function Panel({ title, icon, children, className = '' }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-xl border border-stone-200/70 p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4 text-stone-900">
        {icon}
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Distribution({ rows }: { rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map(([, value]) => Number(value || 0)));
  return (
    <div className="space-y-3">
      {rows.map(([label, value]) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-stone-500 capitalize">{label}</span>
            <span className="font-semibold text-stone-800">{formatNumber(Number(value || 0))}</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-stone-900 rounded-full" style={{ width: `${Math.max(4, (Number(value || 0) / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PostTable({ posts, onToggle, onDelete }: { posts: AdminPost[]; onToggle: (id: string, current: boolean) => void; onDelete: (id: string) => void }) {
  if (!posts.length) return <Empty label="Aucun contenu" />;
  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <div key={post.id} className="flex items-center justify-between gap-4 border border-stone-100 rounded-xl p-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1 text-xs text-stone-500">
              <span className="flex items-center gap-1">{typeIcons[post.post_type] || <FileText className="w-4 h-4" />}{post.post_type}</span>
              {post.is_anonymous && <span className="text-amber-600 flex items-center gap-1"><Lock className="w-3 h-3" />Anonyme</span>}
              {post.has_audio && <span className="text-violet-600">Audio</span>}
              {post.has_video && <span className="text-emerald-600">Video</span>}
              <span>{formatDate(post.created_at)}</span>
            </div>
            <button onClick={() => navigate(`/post/${post.id}`)} className="text-left text-sm font-semibold text-stone-900 truncate hover:underline block max-w-full">{post.title}</button>
            <div className="flex items-center gap-4 mt-1 text-xs text-stone-400">
              <span><Eye className="inline w-3 h-3" /> {formatNumber(post.views_count)}</span>
              <span><Heart className="inline w-3 h-3" /> {formatNumber(post.likes_count)}</span>
              <span><MessageCircle className="inline w-3 h-3" /> {formatNumber(post.comments_count)}</span>
              <span>{post.profiles ? `@${post.profiles.username}` : 'Auteur masque'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => onToggle(post.id, post.published)} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${post.published ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {post.published ? 'Depublier' : 'Publier'}
            </button>
            <button onClick={() => onDelete(post.id)} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CollecteList({ collectes, onApprove, onReject }: { collectes: AdminCollecte[]; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  if (!collectes.length) return <Empty label="Aucune collecte" />;
  return (
    <div className="space-y-3">
      {collectes.map((collecte) => (
        <div key={collecte.id} className="border border-stone-100 rounded-xl p-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`badge ${collecte.collecte_type === 'urgence' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{collecte.collecte_type === 'urgence' ? 'Urgence' : 'Projet'}</span>
                <span className={`badge ${collecte.status === 'pending' ? 'bg-amber-100 text-amber-700' : collecte.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{collecte.status}</span>
                {collecte.profiles && <span className="text-xs text-stone-400">@{collecte.profiles.username}</span>}
              </div>
              <h3 className="text-sm font-semibold text-stone-900">{collecte.title}</h3>
              <p className="text-sm text-stone-500 line-clamp-2 mt-1">{collecte.description}</p>
              <p className="text-xs text-stone-400 mt-2">{formatMoney(collecte.current_amount || 0)} / {formatMoney(collecte.target_amount || 0)} XOF</p>
              {collecte.documents?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {collecte.documents.map((doc, index) => {
                    const url = typeof doc === 'string' ? doc : doc.url;
                    const name = typeof doc === 'string' ? `Document ${index + 1}` : doc.name || `Document ${index + 1}`;
                    return (
                      <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer" className="text-xs bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-lg px-2.5 py-1">
                        {name}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
            {collecte.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => onApprove(collecte.id)} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Approuver</button>
                <button onClick={() => onReject(collecte.id)} className="px-4 py-2 bg-red-600 text-white text-sm rounded-xl flex items-center gap-2"><XCircle className="w-4 h-4" /> Rejeter</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function UserList({ users, onStatus, onDetails }: { users: AdminUser[]; onStatus: (id: string, status: 'active' | 'suspended') => void; onDetails: (id: string) => void }) {
  if (!users.length) return <Empty label="Aucun utilisateur" />;
  return (
    <div className="space-y-2">
      {users.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 border border-stone-100 rounded-xl p-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 truncate">@{item.username}</p>
            <p className="text-xs text-stone-400 truncate">{item.email}</p>
          </div>
          <div className="text-right text-xs text-stone-500 flex-shrink-0">
            <p>{item.role} | {item.status || 'active'}</p>
            <p>{item.posts_count} posts</p>
            <div className="flex justify-end gap-1 mt-1">
              <button onClick={() => onDetails(item.id)} className="px-2 py-1 rounded-lg bg-stone-100 text-stone-700">Details</button>
              <button onClick={() => onStatus(item.id, item.status === 'suspended' ? 'active' : 'suspended')} className={`px-2 py-1 rounded-lg ${item.status === 'suspended' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {item.status === 'suspended' ? 'Debloquer' : 'Suspendre'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActiveUserList({ users, onStatus, onDetails }: { users: ActiveUser[]; onStatus: (id: string, status: 'active' | 'suspended') => void; onDetails: (id: string) => void }) {
  if (!users.length) return <Empty label="Aucune activite" />;
  return (
    <div className="space-y-2">
      {users.map((item) => (
        <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 border border-stone-100 rounded-xl p-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 truncate">@{item.username}</p>
            <p className="text-xs text-stone-400 truncate">{item.full_name || item.role} | {item.status || 'active'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500">{item.posts_count} posts | {item.comments_count} com. | {item.donations_count} dons</p>
            <div className="flex justify-end gap-1 mt-1">
              <button onClick={() => onDetails(item.id)} className="px-2 py-1 rounded-lg text-xs bg-stone-100 text-stone-700">Details</button>
              <button onClick={() => onStatus(item.id, item.status === 'suspended' ? 'active' : 'suspended')} className={`px-2 py-1 rounded-lg text-xs ${item.status === 'suspended' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {item.status === 'suspended' ? 'Debloquer' : 'Suspendre'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MediaList({ media }: { media: AdminMedia[] }) {
  if (!media.length) return <Empty label="Aucun media indexe" />;
  return (
    <div className="space-y-2">
      {media.map((item) => (
        <div key={item.id} className="border border-stone-100 rounded-xl p-3">
          <div className="flex justify-between gap-3">
            <p className="text-sm font-semibold text-stone-900 truncate">{item.original_name || item.content_type}</p>
            <span className="text-xs text-stone-400">{item.storage}</span>
          </div>
          <p className="text-xs text-stone-400 mt-1">{item.content_type} | {formatBytes(item.size)} | {formatDate(item.created_at)}</p>
        </div>
      ))}
    </div>
  );
}

function CommentList({ comments }: { comments: AdminComment[] }) {
  if (!comments.length) return <Empty label="Aucun commentaire" />;
  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <div key={comment.id} className="border border-stone-100 rounded-xl p-3">
          <div className="flex justify-between gap-3 mb-1">
            <span className="text-xs text-stone-400">{comment.is_anonymous ? 'Auteur masque' : `@${comment.profiles?.username || 'inconnu'}`}</span>
            <span className="text-xs text-stone-400">{formatDate(comment.created_at)}</span>
          </div>
          {comment.post_id && (
            <button onClick={() => navigate(`/post/${comment.post_id}`)} className="text-left text-xs font-semibold text-stone-700 hover:underline mb-1 line-clamp-1">
              {comment.post_title || 'Voir la publication'}
            </button>
          )}
          <p className="text-sm text-stone-600 line-clamp-2">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}

function StatusRow({ label, value, good }: { label: string; value: string | number; good: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className={`text-sm font-semibold ${good ? 'text-emerald-700' : 'text-amber-700'}`}>{typeof value === 'number' ? formatNumber(value) : value}</span>
    </div>
  );
}

function MoneyRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-sm font-semibold text-stone-900">{formatMoney(value)} XOF</span>
    </div>
  );
}

function Legend({ label, color, value }: { label: string; color: string; value: number }) {
  return <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${color}`} />{label}: {value}</span>;
}

function MiniDark({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/10 rounded-xl p-3">
      <p className="text-[11px] text-stone-400 mb-1">{label}</p>
      <p className="text-sm font-semibold">{typeof value === 'number' ? formatNumber(value) : value}</p>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="text-center py-10 text-sm text-stone-400">{label}</div>;
}

function sum(points: ActivityPoint[], key: keyof ActivityPoint) {
  return points.reduce((total, point) => total + Number(point[key] || 0), 0);
}

function pageItems<T>(items: T[], page: number, pageSize = 5) {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value || 0);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value || 0);
}

function formatBytes(value: number) {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hourRange(date: string, hour: string) {
  const safeDate = date || formatInputDate(new Date());
  const safeHour = Number(hour);
  const start = new Date(`${safeDate}T00:00:00`);
  start.setHours(Number.isFinite(safeHour) ? safeHour : 0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}
