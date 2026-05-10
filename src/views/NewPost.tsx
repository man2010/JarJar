import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../hooks/useRouter';
import { Lock, BookOpen, Video, Eye, EyeOff, ArrowLeft, Headphones, Upload, X } from 'lucide-react';
import MediaRecorderField from '../components/MediaRecorderField';

interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories: string[];
}

export default function NewPost({ editId }: { editId?: string }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [postType, setPostType] = useState<'article' | 'video' | 'audio' | 'confession'>('article');
  const [confessionMediaKind, setConfessionMediaKind] = useState<'none' | 'audio' | 'video'>('none');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState('');
  const [published, setPublished] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState('');

  useEffect(() => { if (!user) { navigate('/login'); return; } fetchCategories(); }, [user]);
  useEffect(() => { if (user && editId) fetchPostForEdit(); }, [user, editId]);
  useEffect(() => { if (postType === 'confession') setIsAnonymous(true); }, [postType]);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('id, name, slug, subcategories').order('name');
    if (data) setCategories(data as unknown as Category[]);
  }

  const selectedCategory = categories.find(c => c.id === categoryId);

  async function fetchPostForEdit() {
    const { data } = await supabase
      .from('posts')
      .select('id, title, content, excerpt, cover_image_url, video_url, audio_url, post_type, is_anonymous, category_id, subcategory, published')
      .eq('id', editId)
      .maybeSingle();
    if (!data) return;
    setTitle(data.title || '');
    setContent(data.content || '');
    setExcerpt(data.excerpt || '');
    setCoverImageUrl(data.cover_image_url || '');
    setVideoUrl(data.video_url || '');
    setAudioUrl(data.audio_url || '');
    setPostType(data.post_type || 'article');
    if (data.post_type === 'confession') {
      setConfessionMediaKind(data.audio_url ? 'audio' : data.video_url ? 'video' : 'none');
    }
    setIsAnonymous(!!data.is_anonymous);
    setCategoryId(data.category_id || null);
    setSubcategory(data.subcategory || '');
    setPublished(!!data.published);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mediaUploading || coverUploading) return;
    if (!user || !title.trim() || (!content.trim() && !audioUrl && !videoUrl)) return;
    setSubmitting(true);
    const payload = {
      title: title.trim(), content: content.trim(),
      excerpt: excerpt.trim() || content.trim().slice(0, 200),
      cover_image_url: coverImageUrl.trim(), video_url: videoUrl.trim(),
      audio_url: audioUrl.trim(), post_type: postType,
      is_anonymous: isAnonymous, category_id: categoryId,
      subcategory, author_id: user.id, published,
    };
    const { data, error } = editId
      ? await supabase.from('posts').update(payload).eq('id', editId).select('id').maybeSingle()
      : await supabase.from('posts').insert(payload).select('id').maybeSingle();
    if (!error && data) navigate(`/post/${data.id}`);
    setSubmitting(false);
  }

  const postTypes = [
    { key: 'article' as const, label: 'Article', icon: <BookOpen className="w-5 h-5" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-500' },
    { key: 'video' as const, label: 'Video', icon: <Video className="w-5 h-5" />, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-500' },
    { key: 'audio' as const, label: 'Audio', icon: <Headphones className="w-5 h-5" />, bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-500' },
    { key: 'confession' as const, label: 'Confession', icon: <Lock className="w-5 h-5" />, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-500' },
  ];

  function selectConfessionMedia(kind: 'none' | 'audio' | 'video') {
    setConfessionMediaKind(kind);
    if (kind !== 'audio') setAudioUrl('');
    if (kind !== 'video') setVideoUrl('');
  }

  async function uploadCoverImage(file: File | null) {
    if (!file) return;
    setCoverUploading(true);
    setCoverUploadError('');

    try {
      const data = new FormData();
      data.append('file', file, file.name);
      data.append('kind', 'image');
      const response = await fetch('/api/media', { method: 'POST', body: data, credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Upload de l image impossible');
      setCoverImageUrl(payload.data.url);
    } catch (error) {
      setCoverUploadError(error instanceof Error ? error.message : 'Upload de l image impossible');
    } finally {
      setCoverUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate('/feed')} className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Retour
        </button>

        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-2">{editId ? 'Modifier ta publication' : 'Partage ton histoire'}</h1>
          <p className="text-stone-500 mb-8">{editId ? 'Mets a jour ton contenu, son media ou son statut.' : "Ton parcours peut etre la cle pour quelqu'un d'autre. Ecris librement."}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Post Type */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">Type de publication</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {postTypes.map(({ key, label, icon, bg, text, border }) => (
                <button key={key} type="button" onClick={() => setPostType(key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
                    postType === key ? `${border} ${bg} ${text} shadow-lg` : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                  }`}>
                  {icon}
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Titre</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={postType === 'confession' ? 'Ce que tu as sur le coeur...' : 'Le titre de ton histoire'}
              required className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Ton histoire</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Raconte les hauts et les bas de ton parcours..." rows={12} className="input resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Extrait <span className="text-stone-400 font-normal">(optionnel)</span></label>
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Un court resume qui apparaitra dans la liste..." rows={2} className="input resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Image de couverture <span className="text-stone-400 font-normal">(lien ou fichier)</span></label>
            <div className="flex gap-2">
              <input type="text" value={coverImageUrl} onChange={(e) => { setCoverImageUrl(e.target.value); setCoverUploadError(''); }}
                placeholder="https://example.com/image.jpg ou /api/media/..." className="input flex-1" />
              <label className={`btn-secondary w-12 px-0 flex-shrink-0 cursor-pointer ${coverUploading ? 'opacity-60 cursor-wait' : ''}`} title="Uploader une image locale">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  disabled={coverUploading}
                  onChange={(event) => {
                    void uploadCoverImage(event.target.files?.[0] || null);
                    event.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
              {coverImageUrl && (
                <button type="button" onClick={() => { setCoverImageUrl(''); setCoverUploadError(''); }} className="btn-secondary w-12 px-0 flex-shrink-0" title="Retirer l'image">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="mt-2 min-h-[18px]">
              {coverUploading && <p className="text-xs text-stone-400">Upload de l image...</p>}
              {coverUploadError && <p className="text-xs text-red-600">{coverUploadError}</p>}
              {!coverUploading && !coverUploadError && coverImageUrl && (
                <p className="text-xs text-stone-400 truncate">Image selectionnee : {coverImageUrl}</p>
              )}
            </div>
            {coverImageUrl && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                <img src={coverImageUrl} alt="" className="h-40 w-full object-cover" />
              </div>
            )}
          </div>

          {postType === 'video' && (
            <div className="animate-fade-in">
              <MediaRecorderField kind="video" value={videoUrl} onChange={setVideoUrl} onUploadingChange={setMediaUploading} />
            </div>
          )}

          {postType === 'audio' && (
            <div className="animate-fade-in">
              <MediaRecorderField kind="audio" value={audioUrl} onChange={setAudioUrl} onUploadingChange={setMediaUploading} />
            </div>
          )}

          {postType === 'confession' && (
            <div className="animate-fade-in bg-white border border-stone-200/60 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Media de confession <span className="text-stone-400 font-normal">(optionnel)</span></label>
                <p className="text-xs text-stone-400">Ajoute un audio ou une video tout en gardant la confession anonyme.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'none' as const, label: 'Aucun', icon: <Lock className="w-4 h-4" /> },
                  { key: 'audio' as const, label: 'Audio', icon: <Headphones className="w-4 h-4" /> },
                  { key: 'video' as const, label: 'Video', icon: <Video className="w-4 h-4" /> },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectConfessionMedia(key)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                      confessionMediaKind === key
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
              {confessionMediaKind === 'audio' && (
                <MediaRecorderField kind="audio" value={audioUrl} onChange={setAudioUrl} onUploadingChange={setMediaUploading} privacyMode />
              )}
              {confessionMediaKind === 'video' && (
                <MediaRecorderField kind="video" value={videoUrl} onChange={setVideoUrl} onUploadingChange={setMediaUploading} privacyMode />
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Thematique</label>
            <select value={categoryId || ''} onChange={(e) => { setCategoryId(e.target.value || null); setSubcategory(''); }} className="input">
              <option value="">Choisir une thematique</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          {selectedCategory && selectedCategory.subcategories?.length > 0 && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Sous-thematique</label>
              <div className="flex flex-wrap gap-2">
                {selectedCategory.subcategories.map((sub: string) => (
                  <button key={sub} type="button" onClick={() => setSubcategory(subcategory === sub ? '' : sub)}
                    className={`badge transition-all duration-200 ${subcategory === sub ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Anonymous toggle */}
          <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
            isAnonymous ? 'bg-amber-50/80 border-amber-200/50' : 'bg-white border-stone-200/60'
          }`}>
            <div className="flex items-center gap-3">
              {isAnonymous ? <EyeOff className="w-5 h-5 text-amber-600" /> : <Eye className="w-5 h-5 text-stone-400" />}
              <div>
                <p className="text-sm font-medium text-stone-700">Publier anonymement</p>
                <p className="text-xs text-stone-400">Ton identite ne sera pas visible publiquement</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsAnonymous(!isAnonymous)} disabled={postType === 'confession'}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${isAnonymous ? 'bg-amber-500' : 'bg-stone-200'} ${postType === 'confession' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${isAnonymous ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {isAnonymous && (
            <div className="bg-stone-900 text-stone-100 rounded-2xl p-5">
              <p className="text-sm font-semibold mb-1">Anonymat verrouille cote serveur</p>
              <p className="text-xs text-stone-400 leading-relaxed">
                Pour une confession ou une publication anonyme, l'API ne renvoie jamais le profil auteur dans le fil, le detail ou les commentaires publics.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button type="submit" disabled={submitting || mediaUploading || coverUploading || !title.trim() || (!content.trim() && !audioUrl && !videoUrl)}
              className="btn-primary flex-1 py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed">
              {coverUploading ? 'Envoi de l image...' : mediaUploading ? 'Envoi du media...' : submitting ? 'Enregistrement...' : editId ? 'Enregistrer' : 'Publier'}
            </button>
            <button type="button" onClick={async () => {
              if (mediaUploading || coverUploading || !title.trim() || (!content.trim() && !audioUrl && !videoUrl)) return;
              setPublished(false); setSubmitting(true);
              const draftPayload = {
                title: title.trim(), content: content.trim(),
                excerpt: excerpt.trim() || content.trim().slice(0, 200),
                cover_image_url: coverImageUrl.trim(), video_url: videoUrl.trim(),
                audio_url: audioUrl.trim(), post_type: postType,
                is_anonymous: isAnonymous, category_id: categoryId,
                subcategory, author_id: user!.id, published: false,
              };
              const { data } = editId
                ? await supabase.from('posts').update(draftPayload).eq('id', editId).select('id').maybeSingle()
                : await supabase.from('posts').insert(draftPayload).select('id').maybeSingle();
              setSubmitting(false);
              if (data) navigate(`/post/${data.id}`);
            }} disabled={submitting || mediaUploading || coverUploading} className="btn-secondary px-6 py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed">
              Brouillon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
