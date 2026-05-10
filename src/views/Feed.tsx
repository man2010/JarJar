import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../hooks/useRouter';
import { Heart, MessageCircle, Eye, Lock, Bookmark, BookOpen, Flame, Briefcase, Activity, Sun, Headphones, Video, SlidersHorizontal, X, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  excerpt: string;
  cover_image_url: string;
  post_type: string;
  is_anonymous: boolean;
  views_count: number;
  created_at: string;
  category_id: string;
  subcategory: string;
  categories: { name: string; slug: string; icon: string; subcategories: string[] } | null;
  profiles: { username: string; full_name: string; avatar_url: string } | null;
  likes: { count: number }[];
  comments: { count: number }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  subcategories: string[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  heart: <Heart className="w-4 h-4" />,
  briefcase: <Briefcase className="w-4 h-4" />,
  activity: <Activity className="w-4 h-4" />,
  lock: <Lock className="w-4 h-4" />,
  flame: <Flame className="w-4 h-4" />,
  sun: <Sun className="w-4 h-4" />,
  'book-open': <BookOpen className="w-4 h-4" />,
};

const typeConfig: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  article: { label: 'Article', icon: <BookOpen className="w-3.5 h-3.5" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/50' },
  video: { label: 'Video', icon: <Video className="w-3.5 h-3.5" />, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/50' },
  audio: { label: 'Audio', icon: <Headphones className="w-3.5 h-3.5" />, bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200/50' },
  confession: { label: 'Confession', icon: <Lock className="w-3.5 h-3.5" />, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/50' },
};

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const pageSize = 6;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const type = params.get('type');
    if (cat) setActiveCategory(cat);
    if (type && typeConfig[type]) setActiveType(type);
  }, []);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { setPage(1); }, [activeCategory, activeSubcategory, activeType]);
  useEffect(() => { fetchPosts(); }, [activeCategory, activeSubcategory, activeType, page]);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data as unknown as Category[]);
  }

  async function fetchPosts() {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select(`
        id, title, excerpt, cover_image_url, post_type, is_anonymous,
        views_count, created_at, category_id, subcategory,
        categories ( name, slug, icon, subcategories ),
        profiles ( username, full_name, avatar_url ),
        likes ( count ),
        comments ( count )
      `, { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (activeCategory) {
      const { data: catData } = await supabase.from('categories').select('id').eq('slug', activeCategory).maybeSingle();
      if (catData) query = query.eq('category_id', catData.id);
    }
    if (activeSubcategory) query = query.eq('subcategory', activeSubcategory);
    if (activeType) query = query.eq('post_type', activeType);

    const from = (page - 1) * pageSize;
    const { data, count } = await query.range(from, from + pageSize - 1);
    if (data) setPosts(data as unknown as Post[]);
    setTotalPosts(count || 0);
    setLoading(false);
  }

  function clearFilters() {
    setActiveCategory(null);
    setActiveSubcategory(null);
    setActiveType(null);
    navigate('/feed');
  }

  function goToPage(nextPage: number) {
    const safePage = Math.min(totalPages, Math.max(1, nextPage));
    if (safePage === page) return;
    setPage(safePage);
    window.requestAnimationFrame(() => {
      document.getElementById('feed-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const hasFilters = activeCategory || activeType || activeSubcategory;
  const activeCategoryData = categories.find(c => c.slug === activeCategory);
  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">Explore les histoires</h1>
            <p className="mt-2 text-stone-500">Des parcours de vie, des confessions, de la motivation — trouve ce qui te parle.</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost px-3 py-2 text-sm flex-shrink-0 ${showFilters ? 'bg-stone-100 text-stone-900' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Filters Panel */}
        <div className={`overflow-hidden transition-all duration-500 ${showFilters ? 'max-h-[500px] opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white rounded-2xl border border-stone-200/60 p-5 space-y-4 animate-fade-in-down">
            {/* Type filters */}
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2.5">Format</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setActiveType(null)} className={`badge transition-all duration-200 ${!activeType ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>Tout</button>
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <button key={key} onClick={() => setActiveType(activeType === key ? null : key)} className={`badge transition-all duration-200 flex items-center gap-1 ${activeType === key ? `${cfg.bg} ${cfg.text}` : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
                    {cfg.icon}{cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filters */}
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2.5">Thematique</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(activeCategory === cat.slug ? null : cat.slug); setActiveSubcategory(null); }}
                    className={`badge transition-all duration-200 flex items-center gap-1.5 ${activeCategory === cat.slug ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                  >
                    {categoryIcons[cat.icon] || <BookOpen className="w-3.5 h-3.5" />}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategory filters */}
            {activeCategoryData && activeCategoryData.subcategories?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2.5">Sous-thematique</p>
                <div className="flex flex-wrap gap-2">
                  {activeCategoryData.subcategories.map((sub: string) => (
                    <button
                      key={sub}
                      onClick={() => setActiveSubcategory(activeSubcategory === sub ? null : sub)}
                      className={`badge transition-all duration-200 ${activeSubcategory === sub ? 'bg-stone-700 text-white' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors">
                <X className="w-3 h-3" /> Effacer les filtres
              </button>
            )}
          </div>
        </div>

        {/* Posts Grid */}
        <div id="feed-results" className="scroll-mt-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden">
                <div className="h-48 shimmer" />
                <div className="p-5 space-y-3">
                  <div className="h-4 shimmer rounded w-3/4" />
                  <div className="h-3 shimmer rounded w-full" />
                  <div className="h-3 shimmer rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-stone-300" />
            </div>
            <h3 className="text-xl font-semibold text-stone-700 mb-2">Aucune histoire pour le moment</h3>
            <p className="text-stone-400 mb-8">Sois le premier a partager ton parcours.</p>
            {user && (
              <button onClick={() => navigate('/new')} className="btn-primary px-6 py-3 group">
                Ecrire une histoire
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
        </div>

        {!loading && posts.length > 0 && (
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-8 bg-white border border-stone-200/60 rounded-2xl p-4">
            <p className="text-sm text-stone-500">
              {Math.min(totalPosts, (page - 1) * pageSize + 1)}-{Math.min(totalPosts, page * pageSize)} sur {totalPosts} publication{totalPosts > 1 ? 's' : ''}
            </p>
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="btn-secondary w-10 h-10 p-0 disabled:opacity-40 disabled:cursor-not-allowed" title="Page precedente">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {visiblePages.map((item, index) => item === 'gap' ? (
                  <span key={`gap-${index}`} className="w-9 text-center text-sm text-stone-300">...</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goToPage(item)}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                      page === item ? 'bg-stone-900 text-white shadow-sm' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="btn-secondary w-10 h-10 p-0 disabled:opacity-40 disabled:cursor-not-allowed" title="Page suivante">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getVisiblePages(current: number, total: number): Array<number | 'gap'> {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current, current - 1, current + 1].filter((value) => value >= 1 && value <= total));
  const sorted = Array.from(pages).sort((a, b) => a - b);
  return sorted.flatMap((value, index) => {
    const previous = sorted[index - 1];
    if (index > 0 && previous && value - previous > 1) return ['gap' as const, value];
    return [value];
  });
}

function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes?.[0]?.count ?? 0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (user) checkLiked();
    if (user) checkBookmarked();
  }, [user]);

  async function checkLiked() {
    const { data } = await supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user!.id).maybeSingle();
    setIsLiked(!!data);
  }

  async function checkBookmarked() {
    const { data } = await supabase.from('bookmarks').select('id').eq('post_id', post.id).eq('user_id', user!.id).maybeSingle();
    setIsBookmarked(!!data);
  }

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      setLikeCount(c => c - 1); setIsLiked(false);
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
      setLikeCount(c => c + 1); setIsLiked(true);
    }
  }

  async function toggleBookmark(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('post_id', post.id).eq('user_id', user.id);
      setIsBookmarked(false);
    } else {
      await supabase.from('bookmarks').insert({ post_id: post.id, user_id: user.id });
      setIsBookmarked(true);
    }
  }

  const cfg = typeConfig[post.post_type] || typeConfig.article;

  return (
    <article
      onClick={() => navigate(`/post/${post.id}`)}
      className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden card-hover cursor-pointer group"
    >
      {/* Cover */}
      {post.cover_image_url ? (
        <div className="h-48 overflow-hidden bg-stone-100 relative">
          <img src={post.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(0 0 0 / 0.06) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }} />
          <div className={`${cfg.bg} ${cfg.text} w-14 h-14 rounded-2xl flex items-center justify-center`}>
            {post.post_type === 'audio' ? <Headphones className="w-7 h-7" /> :
             post.post_type === 'video' ? <Video className="w-7 h-7" /> :
             <BookOpen className="w-7 h-7" />}
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className={`badge ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
            {cfg.icon}{cfg.label}
          </span>
          {post.categories && (
            <span className="badge bg-stone-50 text-stone-500 border border-stone-200/50">
              {post.categories.name}
            </span>
          )}
          {post.subcategory && (
            <span className="badge bg-white text-stone-400 border border-stone-100">
              {post.subcategory}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-stone-900 mb-2 line-clamp-2 group-hover:text-stone-700 transition-colors duration-200 leading-snug">{post.title}</h3>

        {/* Excerpt */}
        {post.excerpt && <p className="text-sm text-stone-400 line-clamp-2 mb-4 leading-relaxed">{post.excerpt}</p>}

        {/* Author */}
        <div className="flex items-center gap-2 mb-4">
          {post.is_anonymous ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center"><Lock className="w-3 h-3 text-amber-500" /></div>
              <span className="text-xs text-stone-400 italic">Anonyme</span>
            </div>
          ) : post.profiles ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center text-[10px] font-bold text-stone-600">
                {post.profiles.full_name?.[0] || post.profiles.username?.[0]}
              </div>
              <span className="text-xs text-stone-500 font-medium">{post.profiles.username}</span>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <div className="flex items-center gap-4">
            <button onClick={toggleLike} className={`flex items-center gap-1 text-xs transition-all duration-200 ${isLiked ? 'text-rose-500' : 'text-stone-400 hover:text-rose-400'}`}>
              <Heart className={`w-3.5 h-3.5 transition-transform duration-200 ${isLiked ? 'fill-current scale-110' : ''}`} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            <span className="flex items-center gap-1 text-xs text-stone-400"><MessageCircle className="w-3.5 h-3.5" />{post.comments?.[0]?.count ?? 0}</span>
            <span className="flex items-center gap-1 text-xs text-stone-400"><Eye className="w-3.5 h-3.5" />{post.views_count}</span>
          </div>
          {user && (
            <button onClick={toggleBookmark} className={`transition-all duration-200 ${isBookmarked ? 'text-stone-700' : 'text-stone-300 hover:text-stone-500'}`}>
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
