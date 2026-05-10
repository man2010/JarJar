import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../hooks/useRouter';
import { ArrowLeft, Users, AlertTriangle, Rocket, Lock, Send, Shield, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function CollecteDetail({ id }: { id: string }) {
  const { user, isAdmin } = useAuth();
  const [collecte, setCollecte] = useState<any>(null);
  const [dons, setDons] = useState<any[]>([]);
  const [donsCount, setDonsCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [operator, setOperator] = useState<'wave' | 'om'>('wave');
  const [phone, setPhone] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isAnonymousComment, setIsAnonymousComment] = useState(false);
  const [submittingDon, setSubmittingDon] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchCollecte();
    fetchDonsCount();
    if (isAdmin) fetchDons();
    fetchComments();
  }, [id, isAdmin]);

  async function fetchCollecte() {
    const { data } = await supabase
      .from('collectes')
      .select('*, profiles!requester_id(username, full_name)')
      .eq('id', id)
      .single();
    setCollecte(data);
    setLoading(false);
  }

  async function fetchDons() {
    const { data } = await supabase
      .from('collecte_dons')
      .select('*, profiles(username, full_name)')
      .eq('collecte_id', id)
      .order('created_at', { ascending: false });
    setDons(data || []);
  }

  async function fetchDonsCount() {
    const { count } = await supabase
      .from('collecte_dons')
      .select('id', { count: 'exact', head: true })
      .eq('collecte_id', id);
    setDonsCount(count || 0);
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('collecte_comments')
      .select('*, profiles(username, full_name)')
      .eq('collecte_id', id)
      .order('created_at', { ascending: true });
    setComments(data || []);
  }

  async function handleDonate() {
    if (!user || !amount || collecte?.status !== 'approved') return;
    setSubmittingDon(true);
    const { error } = await supabase.from('collecte_dons').insert({
      collecte_id: id,
      user_id: user.id,
      amount: parseFloat(amount),
      operator,
      phone_number: phone,
    });
    if (!error) {
      fetchCollecte();
      fetchDonsCount();
      if (isAdmin) fetchDons();
      setAmount('');
      setPhone('');
    }
    setSubmittingDon(false);
  }

  async function handleComment() {
    if (!user || !commentText.trim() || collecte?.status !== 'approved') return;
    setSubmittingComment(true);
    const { error } = await supabase.from('collecte_comments').insert({
      collecte_id: id,
      author_id: user.id,
      content: commentText,
      is_anonymous: isAnonymousComment,
    });
    if (!error) {
      setCommentText('');
      setIsAnonymousComment(false);
      fetchComments();
    }
    setSubmittingComment(false);
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat('fr-FR').format(amount);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  async function approveCollecte() {
    await supabase.from('collectes').update({ status: 'approved', reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq('id', id);
    fetchCollecte();
  }

  async function rejectCollecte() {
    await supabase.from('collectes').update({ status: 'rejected', reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq('id', id);
    fetchCollecte();
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

  if (!collecte) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-stone-700 mb-2">Collecte indisponible</h2>
          <p className="text-sm text-stone-400 mb-5">Cette demande n'est pas publique ou n'existe pas.</p>
          <button onClick={() => navigate('/collectes')} className="btn-primary px-5 py-2.5 text-sm">Retour aux collectes</button>
        </div>
      </div>
    );
  }

  const progress = Math.min(Math.round((collecte.current_amount / collecte.target_amount) * 100), 100);
  const isUrgence = collecte.collecte_type === 'urgence';
  const isApproved = collecte.status === 'approved';
  const canReview = isAdmin && collecte.status === 'pending';
  const visibleDocuments = Array.isArray(collecte.documents) ? collecte.documents : [];

  return (
    <div className="min-h-screen bg-stone-50 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <button onClick={() => navigate('/collectes')} className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Retour aux collectes
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 sm:p-8 animate-fade-in-up">
          {/* Badges */}
          <div className="flex gap-2 mb-6">
            <span className={`badge ${isUrgence ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {isUrgence ? <AlertTriangle className="w-3 h-3" /> : <Rocket className="w-3 h-3" />}
              {isUrgence ? 'Urgence' : 'Projet'}
            </span>
            <span className={`badge ${isApproved ? 'bg-emerald-100 text-emerald-700' : collecte.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {isApproved ? 'Approuvee' : collecte.status === 'pending' ? 'En attente' : 'Rejetee'}
            </span>
          </div>

          {/* Title & description */}
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">{collecte.title}</h1>
          <p className="text-stone-600 leading-relaxed mb-8">{collecte.description}</p>

          {collecte.urgency_details && (
            <div className="bg-red-50 border border-red-200/50 rounded-2xl p-4 mb-8">
              <p className="text-sm text-red-700 font-medium mb-1">Details de l'urgence</p>
              <p className="text-sm text-red-600">{collecte.urgency_details}</p>
            </div>
          )}

          {!isApproved && (
            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 mb-8">
              <p className="text-sm font-semibold text-amber-800 mb-1">Collecte non publique</p>
              <p className="text-sm text-amber-700">Cette demande est visible uniquement par son demandeur et les administrateurs tant qu'elle n'est pas approuvee.</p>
            </div>
          )}

          {/* Author */}
          {collecte.profiles && (
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-stone-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center text-sm font-bold text-stone-600">
                {collecte.profiles.full_name?.[0] || collecte.profiles.username?.[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700">{collecte.profiles.full_name || collecte.profiles.username}</p>
                <p className="text-xs text-stone-400">@{collecte.profiles.username}</p>
              </div>
            </div>
          )}

          {(isAdmin || collecte.status !== 'approved') && visibleDocuments.length > 0 && (
            <div className="mb-8 pb-6 border-b border-stone-100">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-stone-900">Documents justificatifs</h3>
              </div>
              <div className="space-y-2">
                {visibleDocuments.map((doc: any, index: number) => {
                  const url = typeof doc === 'string' ? doc : doc.url;
                  const name = typeof doc === 'string' ? `Document ${index + 1}` : doc.name || `Document ${index + 1}`;
                  return (
                    <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-stone-50 border border-stone-200/60 rounded-xl px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-100">
                      <FileText className="w-4 h-4 text-stone-400" />
                      <span className="truncate">{name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {canReview && (
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button onClick={approveCollecte} className="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-medium flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Approuver
              </button>
              <button onClick={rejectCollecte} className="px-5 py-3 bg-red-600 text-white rounded-2xl font-medium flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" /> Rejeter
              </button>
            </div>
          )}

          {/* Progress */}
          <div className="mb-10">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-stone-900">{formatAmount(collecte.current_amount)} XOF</span>
              <span className="text-stone-500">Objectif : {formatAmount(collecte.target_amount)} XOF</span>
            </div>
            <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-emerald-600 font-medium">{progress}% collecte</p>
              <p className="text-xs text-stone-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {isAdmin ? donsCount : donsCount} participant{donsCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Participer */}
          {user && isApproved && (
            <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-6 mb-10">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-stone-900">
                <Users className="w-5 h-5" /> Participer a cette collecte
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setOperator('wave')}
                  className={`p-4 rounded-2xl border-2 text-sm font-semibold transition-all ${
                    operator === 'wave' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                  }`}
                >
                  Wave
                </button>
                <button
                  onClick={() => setOperator('om')}
                  className={`p-4 rounded-2xl border-2 text-sm font-semibold transition-all ${
                    operator === 'om' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                  }`}
                >
                  Orange Money
                </button>
              </div>

              <input
                type="tel"
                placeholder="Numero de telephone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input mb-3"
              />
              <input
                type="number"
                placeholder="Montant (XOF)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input mb-4"
              />

              <button
                onClick={handleDonate}
                disabled={!amount || submittingDon}
                className="btn-primary w-full py-3.5 text-base disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submittingDon ? 'Envoi...' : 'Confirmer le don'}
              </button>
            </div>
          )}

          {user && !isApproved && (
            <div className="bg-stone-100/80 rounded-2xl p-6 mb-10 text-center">
              <p className="text-sm text-stone-500">La participation sera ouverte apres validation admin.</p>
            </div>
          )}

          {!user && isApproved && (
            <div className="bg-stone-100/80 rounded-2xl p-6 mb-10 text-center">
              <p className="text-sm text-stone-500 mb-3">Connecte-toi pour participer a cette collecte</p>
              <button onClick={() => navigate('/login')} className="text-sm font-semibold text-stone-900 hover:underline">Connexion</button>
            </div>
          )}

          {/* Liste des dons - ADMIN ONLY */}
          {isAdmin && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-stone-900">Participants et montants ({dons.length})</h3>
              </div>
              {dons.length > 0 ? (
                <div className="space-y-2">
                  {dons.map((don) => (
                    <div key={don.id} className="flex justify-between items-center py-3 border-b border-stone-100">
                      <div>
                        <span className="font-medium text-sm text-stone-700">@{don.profiles?.username || 'Anonyme'}</span>
                        <span className="text-xs text-stone-400 ml-2">via {don.operator.toUpperCase()}</span>
                      </div>
                      <span className="font-semibold text-emerald-600 text-sm">+{formatAmount(don.amount)} XOF</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 text-sm">Aucun participant pour le moment</p>
              )}
            </div>
          )}

          {/* Commentaires */}
          <div>
            <h3 className="font-semibold text-stone-900 mb-4">Commentaires ({comments.length})</h3>

            {/* Formulaire commentaire */}
            {user && isApproved ? (
              <div className="bg-white border border-stone-200/60 rounded-2xl p-4 mb-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Laissez un message de soutien..."
                  rows={3}
                  className="w-full resize-none border-0 text-sm text-stone-700 placeholder:text-stone-400 focus:ring-0 focus:outline-none bg-transparent"
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isAnonymousComment}
                      onChange={(e) => setIsAnonymousComment(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                    />
                    <Lock className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-500 transition-colors" />
                    <span className="text-xs text-stone-500">Anonyme</span>
                  </label>
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Publier
                  </button>
                </div>
              </div>
            ) : !isApproved ? (
              <div className="bg-stone-100/80 rounded-2xl p-5 mb-6 text-center">
                <p className="text-sm text-stone-500">Les commentaires seront ouverts apres validation.</p>
              </div>
            ) : (
              <div className="bg-stone-100/80 rounded-2xl p-5 mb-6 text-center">
                <p className="text-sm text-stone-500 mb-2">Connecte-toi pour commenter</p>
                <button onClick={() => navigate('/login')} className="text-sm font-semibold text-stone-900 hover:underline">Connexion</button>
              </div>
            )}

            {/* Liste commentaires */}
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="bg-white border border-stone-100 p-4 rounded-2xl">
                  <div className="flex justify-between text-xs text-stone-400 mb-2">
                    <span className="font-medium">
                      {c.is_anonymous ? (
                        <span className="italic text-stone-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Anonyme
                        </span>
                      ) : (
                        <span>@{c.profiles?.username}</span>
                      )}
                    </span>
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
