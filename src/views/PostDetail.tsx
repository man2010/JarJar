import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../hooks/useRouter';
import { Heart, MessageCircle, Eye, Lock, Bookmark, ArrowLeft, Send, BookOpen, Headphones, Share2, ExternalLink, Video, Reply, ChevronDown, ChevronUp } from 'lucide-react';

interface PostData {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  cover_image_url: string;
  video_url: string;
  audio_url: string;
  post_type: string;
  is_anonymous: boolean;
  views_count: number;
  created_at: string;
  category_id: string;
  subcategory: string;
  categories: { name: string; slug: string } | null;
  profiles: { id: string; username: string; full_name: string; avatar_url: string } | null;
  likes: { count: number }[];
  comments: { count: number }[];
}

interface Comment {
  id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  author_id: string;
  parent_id: string | null;
  profiles: { username: string; full_name: string; avatar_url: string } | null;
  comment_likes?: { count: number }[];
  liked_by_me?: boolean;
}

type ProfileSummary = {
  username: string;
  full_name: string;
  avatar_url: string;
};

const typeConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  article: { label: 'Article', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/50' },
  video: { label: 'Video', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/50' },
  audio: { label: 'Audio', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200/50' },
  confession: { label: 'Confession', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/50' },
};

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const patterns: RegExp[] = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}?rel=0`;
  }
  return null;
}

function isDirectVideoUrl(url: string): boolean {
  return isInternalMediaUrl(url) || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function isDirectAudioUrl(url: string): boolean {
  return isInternalMediaUrl(url) || /\.(mp3|wav|ogg|m4a|aac|flac|wma)(\?.*)?$/i.test(url);
}

function isInternalMediaUrl(url: string): boolean {
  return /^\/api\/media\//.test(url) || /^https?:\/\/[^/]+\/api\/media\//.test(url);
}

function isSpotifyUrl(url: string): boolean {
  return /spotify\.com/.test(url);
}

function getSpotifyEmbedUrl(url: string): string | null {
  const match = url.match(/spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
  if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`;
  return null;
}

export default function PostDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileModal, setProfileModal] = useState<ProfileSummary | null>(null);

  useEffect(() => { fetchPost(); fetchComments(); }, [id]);
  useEffect(() => { if (user && post) { checkLiked(); checkBookmarked(); incrementViews(); } }, [user, post]);

  async function fetchPost() {
    const { data } = await supabase
      .from('posts')
      .select(`id, title, content, excerpt, cover_image_url, video_url, audio_url, post_type, is_anonymous, views_count, created_at, category_id, subcategory, categories ( name, slug ), profiles ( id, username, full_name, avatar_url ), likes ( count ), comments ( count )`)
      .eq('id', id).maybeSingle();
    if (data) { setPost(data as unknown as PostData); setLikeCount(data.likes?.[0]?.count ?? 0); }
    setLoading(false);
  }

  async function fetchComments() {
    const { data } = await supabase.from('comments').select(`id, content, is_anonymous, created_at, author_id, parent_id, profiles ( username, full_name, avatar_url ), comment_likes ( count )`).eq('post_id', id).order('created_at', { ascending: true });
    if (data) setComments(data as unknown as Comment[]);
  }

  async function incrementViews() {
    await supabase.from('posts').update({ views_count: (post?.views_count ?? 0) + 1 }).eq('id', id);
  }

  async function checkLiked() {
    const { data } = await supabase.from('likes').select('id').eq('post_id', id).eq('user_id', user!.id).maybeSingle();
    setIsLiked(!!data);
  }

  async function checkBookmarked() {
    const { data } = await supabase.from('bookmarks').select('id').eq('post_id', id).eq('user_id', user!.id).maybeSingle();
    setIsBookmarked(!!data);
  }

  async function toggleLike() {
    if (!user) { navigate('/login'); return; }
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', user.id);
      setLikeCount(c => c - 1); setIsLiked(false);
    } else {
      await supabase.from('likes').insert({ post_id: id, user_id: user.id });
      setLikeCount(c => c + 1); setIsLiked(true);
    }
  }

  async function toggleBookmark() {
    if (!user) { navigate('/login'); return; }
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('post_id', id).eq('user_id', user.id);
      setIsBookmarked(false);
    } else {
      await supabase.from('bookmarks').insert({ post_id: id, user_id: user.id });
      setIsBookmarked(true);
    }
  }

  async function submitComment() {
    if (!user || !commentText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({ content: commentText.trim(), post_id: id, author_id: user.id, is_anonymous: commentAnonymous });
    if (!error) { setCommentText(''); setCommentAnonymous(false); fetchComments(); }
    setSubmitting(false);
  }

  async function submitReply() {
    if (!user || !replyTo || !replyText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({ content: replyText.trim(), post_id: id, parent_id: replyTo.id, author_id: user.id, is_anonymous: replyAnonymous });
    if (!error) {
      setReplyText('');
      setReplyAnonymous(false);
      setReplyTo(null);
      fetchComments();
    }
    setSubmitting(false);
  }

  async function toggleCommentLike(comment: Comment) {
    if (!user) { navigate('/login'); return; }
    if (comment.liked_by_me) {
      await supabase.from('comment_likes').delete().eq('comment_id', comment.id);
    } else {
      await supabase.from('comment_likes').insert({ comment_id: comment.id });
    }
    fetchComments();
  }

  function toggleReplies(commentId: string) {
    setExpandedReplies((current) => {
      const next = new Set(current);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }

  function startReply(comment: Comment) {
    if (!user) {
      navigate('/login');
      return;
    }
    setReplyTo(comment);
    setExpandedReplies((current) => new Set(current).add(comment.id));
  }

  async function deleteComment(commentId: string) {
    await supabase.from('comments').delete().eq('id', commentId);
    fetchComments();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
          <p className="text-sm text-stone-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-stone-300" />
          </div>
          <h2 className="text-lg font-semibold text-stone-700 mb-2">Histoire introuvable</h2>
          <button onClick={() => navigate('/feed')} className="text-sm text-stone-500 hover:text-stone-700 transition-colors">Retour a l'exploration</button>
        </div>
      </div>
    );
  }

  const badge = typeConfig[post.post_type] || typeConfig.article;
  const youtubeEmbed = getYouTubeEmbedUrl(post.video_url);
  const isDirectVideo = post.video_url && isDirectVideoUrl(post.video_url);
  const isDirectAudio = post.audio_url && isDirectAudioUrl(post.audio_url);
  const spotifyEmbed = post.audio_url && isSpotifyUrl(post.audio_url) ? getSpotifyEmbedUrl(post.audio_url) : null;
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((groups, comment) => {
    if (comment.parent_id) groups[comment.parent_id] = [...(groups[comment.parent_id] || []), comment];
    return groups;
  }, {});
  const commentIds = new Set(comments.map((comment) => comment.id));
  const rootComments = comments.filter((comment) => !comment.parent_id || !commentIds.has(comment.parent_id));

  function renderComment(comment: Comment, depth = 0) {
    const replies = repliesByParent[comment.id] || [];
    const likeCount = comment.comment_likes?.[0]?.count ?? 0;
    const repliesOpen = expandedReplies.has(comment.id);
    return (
      <div key={comment.id} className={depth === 1 ? 'ml-4 sm:ml-8 pl-4 border-l border-stone-100' : depth > 1 ? 'pl-3 border-l border-stone-100' : ''}>
        <div className="bg-white rounded-xl border border-stone-200/60 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {comment.is_anonymous ? (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center"><Lock className="w-3 h-3 text-amber-500" /></div>
                  <span className="text-xs text-stone-400 italic">Anonyme</span>
                </div>
              ) : comment.profiles ? (
                <button onClick={() => setProfileModal(comment.profiles!)} className="flex items-center gap-2 hover:underline min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center text-[10px] font-bold text-stone-600 flex-shrink-0">
                    {comment.profiles.avatar_url ? <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-full" /> : (comment.profiles.full_name?.[0] || comment.profiles.username?.[0])}
                  </div>
                  <span className="text-xs font-medium text-stone-600 truncate">@{comment.profiles.username}</span>
                </button>
              ) : null}
              <span className="text-xs text-stone-400 flex-shrink-0">{formatDate(comment.created_at)}</span>
            </div>
            {user && user.id === comment.author_id && (
              <button onClick={() => deleteComment(comment.id)} className="text-xs text-stone-400 hover:text-red-500 transition-colors flex-shrink-0">Supprimer</button>
            )}
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">{comment.content}</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-stone-100">
            <button onClick={() => toggleCommentLike(comment)} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${comment.liked_by_me ? 'text-rose-500' : 'text-stone-400 hover:text-rose-400'}`}>
              <Heart className={`w-3.5 h-3.5 ${comment.liked_by_me ? 'fill-current' : ''}`} />
              {likeCount}
            </button>
            <button onClick={() => startReply(comment)} className="flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-stone-700 transition-colors">
              <Reply className="w-3.5 h-3.5" />
              Repondre
            </button>
            {replies.length > 0 && (
              <button onClick={() => toggleReplies(comment.id)} className="flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-stone-700 transition-colors">
                {repliesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {repliesOpen ? 'Masquer' : 'Afficher'} {replies.length} reponse{replies.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
        {replyTo?.id === comment.id && (
          <div className="mt-3 ml-4 sm:ml-8 bg-stone-50 rounded-xl border border-stone-200/70 p-4">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Repondre a ce commentaire..."
              rows={2}
              className="w-full resize-none border-0 text-sm text-stone-700 placeholder:text-stone-400 focus:ring-0 focus:outline-none bg-transparent"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={replyAnonymous} onChange={(e) => setReplyAnonymous(e.target.checked)} className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500" />
                <Lock className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-500 transition-colors" />
                <span className="text-xs text-stone-500">Anonyme</span>
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => { setReplyTo(null); setReplyText(''); }} className="px-3 py-2 text-xs font-medium text-stone-500 hover:bg-stone-100 rounded-lg">Annuler</button>
                <button onClick={submitReply} disabled={!replyText.trim() || submitting} className="btn-primary px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                  <Send className="w-3.5 h-3.5" />
                  Repondre
                </button>
              </div>
            </div>
          </div>
        )}
        {replies.length > 0 && repliesOpen && <div className="mt-3 space-y-3">{replies.map((reply) => renderComment(reply, depth + 1))}</div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in-up">
        {/* Back */}
        <button onClick={() => navigate('/feed')} className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 mb-8 transition-colors duration-200 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
          Retour
        </button>

        {/* Cover */}
        {post.cover_image_url && (
          <div className="rounded-2xl overflow-hidden mb-8 bg-stone-100 shadow-xl shadow-stone-200/30">
            <img src={post.cover_image_url} alt="" className="w-full h-64 sm:h-80 object-cover" />
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className={`badge ${badge.bg} ${badge.text} ${badge.border} border`}>{badge.label}</span>
          {post.categories && <span className="badge bg-stone-100 text-stone-500">{post.categories.name}</span>}
          {post.subcategory && <span className="badge bg-stone-50 text-stone-400 border border-stone-100">{post.subcategory}</span>}
          <span className="text-xs text-stone-400 ml-1">{formatDate(post.created_at)}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-tight mb-6">{post.title}</h1>

        {/* Author */}
        <div className="flex items-center gap-3 mb-8 pb-8 border-b border-stone-200/60">
          {post.is_anonymous ? (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center"><Lock className="w-5 h-5 text-amber-500" /></div>
              <div>
                <p className="text-sm font-medium text-stone-700 italic">Anonyme</p>
                <p className="text-xs text-stone-400">L'auteur a choisi de rester anonyme</p>
              </div>
            </div>
          ) : post.profiles ? (
            <button onClick={() => setProfileModal(post.profiles!)} className="flex items-center gap-3 hover:bg-stone-100 rounded-xl px-2 py-1 -mx-2 transition-all duration-200">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center text-sm font-bold text-stone-600 overflow-hidden">
                {post.profiles.avatar_url ? <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : (post.profiles.full_name?.[0] || post.profiles.username?.[0])}
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700">{post.profiles.full_name || post.profiles.username}</p>
                <p className="text-xs text-stone-400">@{post.profiles.username}</p>
              </div>
            </button>
          ) : null}
        </div>

        {/* Video - YouTube embed */}
        {post.video_url && youtubeEmbed && (
          <div className="mb-8 rounded-2xl overflow-hidden bg-stone-900 shadow-xl shadow-stone-200/30">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={youtubeEmbed}
                title={post.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Video - Direct file */}
        {post.video_url && isDirectVideo && !youtubeEmbed && (
          <div className="mb-8 rounded-2xl overflow-hidden bg-stone-900 shadow-xl shadow-stone-200/30">
            <video controls className="w-full" src={post.video_url} />
          </div>
        )}

        {/* Video - Fallback link for other URLs */}
        {post.video_url && !youtubeEmbed && !isDirectVideo && (
          <div className="mb-8 bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-700">Regarder la video</p>
                <p className="text-xs text-stone-400">{post.title}</p>
              </div>
            </div>
            <a href={post.video_url} target="_blank" rel="noopener noreferrer"
              className="btn-primary px-4 py-2.5 text-sm w-full group">
              <ExternalLink className="w-4 h-4" />
              Ouvrir la video
            </a>
          </div>
        )}

        {/* Audio - Direct file */}
        {post.audio_url && isDirectAudio && (
          <div className="mb-8 bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center">
                <Headphones className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-700">Ecouter l'audio</p>
                <p className="text-xs text-stone-400">{post.title}</p>
              </div>
            </div>
            <audio controls className="w-full" src={post.audio_url} />
          </div>
        )}

        {/* Audio - Spotify embed */}
        {post.audio_url && spotifyEmbed && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-sm">
            <iframe
              src={spotifyEmbed}
              width="100%"
              height="152"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ borderRadius: '12px' }}
            />
          </div>
        )}

        {/* Audio - Fallback link for other URLs */}
        {post.audio_url && !isDirectAudio && !spotifyEmbed && (
          <div className="mb-8 bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center">
                <Headphones className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-700">Ecouter l'audio</p>
                <p className="text-xs text-stone-400">{post.title}</p>
              </div>
            </div>
            <a href={post.audio_url} target="_blank" rel="noopener noreferrer"
              className="btn-primary px-4 py-2.5 text-sm w-full group">
              <ExternalLink className="w-4 h-4" />
              Ouvrir l'audio
            </a>
          </div>
        )}

        {/* Content */}
        <div className="mb-12">
          {post.content.split('\n').map((paragraph, i) => (
            <p key={i} className="text-stone-600 leading-[1.8] mb-5 text-[15px]">{paragraph}</p>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between py-5 px-1 border-t border-b border-stone-200/60 mb-12">
          <div className="flex items-center gap-5">
            <button onClick={toggleLike} className={`flex items-center gap-2 transition-all duration-200 ${isLiked ? 'text-rose-500' : 'text-stone-400 hover:text-rose-400'}`}>
              <Heart className={`w-5 h-5 transition-transform duration-200 ${isLiked ? 'fill-current scale-110' : ''}`} />
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            <span className="flex items-center gap-2 text-stone-400">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{comments.length}</span>
            </span>
            <span className="flex items-center gap-2 text-stone-400">
              <Eye className="w-5 h-5" />
              <span className="text-sm font-medium">{post.views_count}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all duration-200">
              <Share2 className="w-4 h-4" />
            </button>
            {user && (
              <button onClick={toggleBookmark} className={`p-2 rounded-xl transition-all duration-200 ${isBookmarked ? 'text-stone-700 bg-stone-100' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}>
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Comments */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-bold text-stone-900 mb-6">Commentaires ({comments.length})</h2>

          {user ? (
            <div className="bg-white rounded-2xl border border-stone-200/60 p-5 mb-8 shadow-sm">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Partage ton ressenti..."
                rows={3}
                className="w-full resize-none border-0 text-sm text-stone-700 placeholder:text-stone-400 focus:ring-0 focus:outline-none bg-transparent"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={commentAnonymous} onChange={(e) => setCommentAnonymous(e.target.checked)} className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500" />
                  <Lock className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-500 transition-colors" />
                  <span className="text-xs text-stone-500">Anonyme</span>
                </label>
                <button onClick={submitComment} disabled={!commentText.trim() || submitting} className="btn-primary px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                  <Send className="w-3.5 h-3.5" />
                  Publier
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-stone-100/80 rounded-2xl p-6 mb-8 text-center">
              <p className="text-sm text-stone-500 mb-3">Connecte-toi pour commenter</p>
              <button onClick={() => navigate('/login')} className="text-sm font-semibold text-stone-900 hover:underline">Connexion</button>
            </div>
          )}

          <div className="space-y-3 stagger">
            {rootComments.map((comment) => renderComment(comment))}
          </div>
        </section>
      </article>
      {profileModal && <ProfileModal profile={profileModal} onClose={() => setProfileModal(null)} />}
    </div>
  );
}

function ProfileModal({ profile, onClose }: { profile: ProfileSummary; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl border border-stone-200/70 shadow-2xl p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-200 flex items-center justify-center text-2xl font-bold text-stone-600 overflow-hidden">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : (profile.full_name?.[0] || profile.username?.[0])}
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">{profile.full_name || profile.username}</h2>
              <p className="text-sm text-stone-400">@{profile.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-stone-100 text-sm text-stone-500 hover:bg-stone-200">Fermer</button>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
          <Lock className="w-4 h-4 text-amber-600 mb-2" />
          <p className="text-sm text-amber-800 leading-relaxed">
            Pour proteger les publications anonymes, cette fiche n'affiche pas les contenus de l'utilisateur.
          </p>
        </div>
      </div>
    </div>
  );
}
