import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { navigate, Link } from '../hooks/useRouter';
import { BookOpen, Heart, MessageCircle, Eye, Lock, ArrowLeft, Settings, SquarePen, Trash2, Camera, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
}

interface UserPost {
  id: string;
  title: string;
  excerpt: string;
  cover_image_url: string;
  post_type: string;
  is_anonymous: boolean;
  views_count: number;
  created_at: string;
  published: boolean;
  likes: { count: number }[];
  comments: { count: number }[];
}

export default function Profile({ username }: { username: string }) {
  const { user: currentUser, profile: currentProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editName, setEditName] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [postsPage, setPostsPage] = useState(1);
  const postsPageSize = 5;

  const isOwn = currentUser && currentProfile?.username === username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setEditBio(data.bio);
      setEditName(data.full_name);
      if (currentProfile?.username === username) fetchPosts(data.id);
      else setLoading(false);
    } else {
      setLoading(false);
    }
  }

  async function fetchPosts(authorId: string) {
    let query = supabase
      .from('posts')
      .select(`
        id, title, excerpt, cover_image_url, post_type, is_anonymous,
        views_count, created_at, published,
        likes ( count ),
        comments ( count )
      `)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false });

    if (!isOwn) query = query.eq('published', true);
    const { data } = await query;
    if (data) setPosts(data as unknown as UserPost[]);
    setLoading(false);
  }

  async function deletePost(postId: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    await supabase.from('posts').delete().eq('id', postId);
    setPosts((items) => {
      const next = items.filter((item) => item.id !== postId);
      setPostsPage((page) => Math.min(page, Math.max(1, Math.ceil(next.length / postsPageSize))));
      return next;
    });
  }

  function editPost(postId: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    navigate(`/edit/${postId}`);
  }

  async function saveProfile() {
    if (!currentUser) return;
    const { error } = await supabase
      .from('profiles')
      .update({ bio: editBio, full_name: editName, updated_at: new Date().toISOString() })
      .eq('id', currentUser.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, bio: editBio, full_name: editName } : null);
      setEditing(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (!currentUser) return;
    setAvatarError('');
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const extensionAllowed = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!allowed.includes(file.type) || !extensionAllowed) {
      setAvatarError('Formats autorises: JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('La photo doit faire 2 Mo maximum.');
      return;
    }

    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', 'avatar');
      const response = await fetch('/api/media', { method: 'POST', body: form, credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAvatarError(payload.error || 'Upload impossible.');
        return;
      }
      const avatarUrl = payload.data.url;
      const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq('id', currentUser.id);
      if (error) {
        setAvatarError(error.message);
        return;
      }
      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
      await refreshProfile();
    } finally {
      setAvatarUploading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      month: 'long', year: 'numeric'
    });
  }

  const totalPostPages = Math.max(1, Math.ceil(posts.length / postsPageSize));
  const visiblePosts = posts.slice((postsPage - 1) * postsPageSize, postsPage * postsPageSize);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Chargement...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-stone-700">Profil introuvable</h2>
          <button onClick={() => navigate('/feed')} className="mt-4 text-sm text-stone-500 hover:text-stone-700">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate('/feed')} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-6 sm:p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-stone-200 flex items-center justify-center text-2xl font-bold text-stone-600 overflow-hidden">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : (profile.full_name?.[0] || profile.username?.[0])}
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900">
                  {profile.full_name || profile.username}
                </h1>
                <p className="text-sm text-stone-400">@{profile.username}</p>
                <p className="text-xs text-stone-400 mt-1">Membre depuis {formatDate(profile.created_at)}</p>
              </div>
            </div>
            {isOwn && (
              <button
                onClick={() => setEditing(!editing)}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Photo de profil</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-all cursor-pointer">
                    {avatarUploading ? <Upload className="w-4 h-4 animate-pulse" /> : <Camera className="w-4 h-4" />}
                    {avatarUploading ? 'Envoi...' : 'Choisir une photo'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={avatarUploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadAvatar(file);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                  <p className="text-xs text-stone-400">JPG, PNG ou WEBP. 2 Mo maximum.</p>
                </div>
                {avatarError && <p className="text-xs text-red-600 mt-2">{avatarError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Raconte-toi en quelques mots..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveProfile} className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-all">
                  Sauvegarder
                </button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 bg-white text-stone-600 text-sm font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition-all">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            profile.bio && (
              <p className="text-sm text-stone-600 leading-relaxed">{profile.bio}</p>
            )
          )}

          {isOwn && (
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-stone-100">
            <div className="text-center">
              <p className="text-lg font-bold text-stone-900">{posts.length}</p>
              <p className="text-xs text-stone-400">Publications</p>
            </div>
          </div>
          )}
        </div>

        {/* Posts */}
        {isOwn ? (
        <>
        <h2 className="text-lg font-bold text-stone-900 mb-4">
          Mes histoires
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200/60">
            <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500">
              {isOwn ? 'Tu n\'as pas encore publie d\'histoire' : 'Aucune publication pour le moment'}
            </p>
            {isOwn && (
              <Link to="/new" className="inline-block mt-4 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-all">
                Ecrire mon histoire
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {visiblePosts.map((post) => (
              <Link key={post.id} to={`/post/${post.id}`} className="block group">
                <article className="bg-white rounded-xl border border-stone-200/60 p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-4">
                    {post.cover_image_url ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                        <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-stone-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.is_anonymous && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Lock className="w-3 h-3" /> Anonyme
                          </span>
                        )}
                        {isOwn && !post.published && (
                          <span className="flex items-center gap-1 text-xs text-stone-500 bg-stone-100 rounded-full px-2 py-0.5">
                            Brouillon
                          </span>
                        )}
                        <span className="text-xs text-stone-400">{formatDate(post.created_at)}</span>
                      </div>
                      <h3 className="text-base font-semibold text-stone-900 group-hover:text-stone-700 transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-stone-500 line-clamp-1 mt-1">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-stone-400">
                          <Heart className="w-3 h-3" /> {post.likes?.[0]?.count ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-stone-400">
                          <MessageCircle className="w-3 h-3" /> {post.comments?.[0]?.count ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-stone-400">
                          <Eye className="w-3 h-3" /> {post.views_count}
                        </span>
                      </div>
                      {isOwn && (
                        <div className="flex items-center gap-2 mt-3">
                          <button onClick={(event) => editPost(post.id, event)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 inline-flex items-center gap-1">
                            <SquarePen className="w-3 h-3" /> Modifier
                          </button>
                          <button onClick={(event) => deletePost(post.id, event)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 inline-flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
            {posts.length > postsPageSize && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <p className="text-xs text-stone-500">
                  {(postsPage - 1) * postsPageSize + 1}-{Math.min(posts.length, postsPage * postsPageSize)} sur {posts.length} histoires
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPostsPage((page) => Math.max(1, page - 1))}
                    disabled={postsPage <= 1}
                    className="btn-secondary w-10 h-10 p-0 disabled:opacity-40"
                    title="Page precedente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-stone-700 min-w-16 text-center">
                    {postsPage} / {totalPostPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPostsPage((page) => Math.min(totalPostPages, page + 1))}
                    disabled={postsPage >= totalPostPages}
                    className="btn-secondary w-10 h-10 p-0 disabled:opacity-40"
                    title="Page suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200/60 p-6 text-center">
            <Lock className="w-8 h-8 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500">Les publications d'un profil ne sont pas exposees publiquement.</p>
          </div>
        )}
      </div>
    </div>
  );
}
