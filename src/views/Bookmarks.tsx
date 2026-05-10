import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { navigate, Link } from '../hooks/useRouter';
import { Bookmark, Heart, MessageCircle, Eye, Lock, ArrowLeft } from 'lucide-react';

interface BookmarkedPost {
  id: string;
  title: string;
  excerpt: string;
  cover_image_url: string;
  post_type: string;
  is_anonymous: boolean;
  views_count: number;
  created_at: string;
  categories: { name: string } | null;
  profiles: { username: string; full_name: string } | null;
  likes: { count: number }[];
  comments: { count: number }[];
}

export default function Bookmarks() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchBookmarks();
  }, [user]);

  async function fetchBookmarks() {
    const { data } = await supabase
      .from('bookmarks')
      .select(`
        post_id,
        posts (
          id, title, excerpt, cover_image_url, post_type, is_anonymous,
          views_count, created_at,
          categories ( name ),
          profiles ( username, full_name ),
          likes ( count ),
          comments ( count )
        )
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      const bookmarked = data
        .map((b: any) => b.posts)
        .filter(Boolean) as unknown as BookmarkedPost[];
      setPosts(bookmarked);
    }
    setLoading(false);
  }

  async function removeBookmark(postId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', user.id);
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate('/feed')} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Mes favoris</h1>
            <p className="text-sm text-stone-500">Les histoires que tu as sauvegardees</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-stone-200/60 p-5 animate-pulse">
                <div className="h-4 bg-stone-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-stone-100 rounded w-full mb-2" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200/60">
            <Bookmark className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-stone-700 mb-2">Aucun favori</h3>
            <p className="text-sm text-stone-400 mb-4">Sauvegarde des histoires pour les retrouver facilement</p>
            <Link to="/feed" className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-all">
              Explorer
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link key={post.id} to={`/post/${post.id}`} className="block group">
                <article className="bg-white rounded-xl border border-stone-200/60 p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.is_anonymous ? (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Lock className="w-3 h-3" /> Anonyme
                          </span>
                        ) : post.profiles ? (
                          <span className="text-xs text-stone-400">@{post.profiles.username}</span>
                        ) : null}
                        <span className="text-xs text-stone-400">{formatDate(post.created_at)}</span>
                      </div>
                      <h3 className="text-base font-semibold text-stone-900 group-hover:text-stone-700 transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-stone-500 line-clamp-2 mt-1">{post.excerpt}</p>
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
                    </div>
                    <button
                      onClick={(e) => removeBookmark(post.id, e)}
                      className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg transition-all flex-shrink-0"
                      title="Retirer des favoris"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
