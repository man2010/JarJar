import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../hooks/useRouter';
import { ArrowLeft, AlertTriangle, Rocket, CheckCircle } from 'lucide-react';
import DocumentUploadField, { type UploadedDocument } from '../components/DocumentUploadField';

export default function Collecte() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [collecteType, setCollecteType] = useState<'urgence' | 'projet'>('urgence');
  const [urgencyDetails, setUrgencyDetails] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!user) { navigate('/login'); return; } }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || uploadingDocument || !title.trim() || !description.trim() || !targetAmount || documents.length === 0) return;
    setError('');
    setSubmitting(true);
    const { error: insertError } = await supabase.from('collectes').insert({
      title: title.trim(), description: description.trim(), collecte_type: collecteType,
      urgency_details: urgencyDetails.trim(), target_amount: parseFloat(targetAmount),
      documents, video_url: videoUrl.trim(), requester_id: user.id, status: 'pending',
    });
    if (insertError) { setError(insertError.message); }
    else setSuccess(true);
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center px-4">
        <div className="max-w-md text-center animate-scale-in">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Demande envoyee</h2>
          <p className="text-stone-500 mb-8 leading-relaxed">
            Ta demande de collecte est en attente de validation par un administrateur.
            Tu seras notifie des qu'elle sera approuvee.
          </p>
          <button onClick={() => navigate('/feed')} className="btn-primary px-6 py-3">
            Retour a l'exploration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate('/feed')} className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Retour
        </button>

        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-2">Demande de collecte</h1>
          <p className="text-stone-500 mb-8">
            Tu as un projet a financer ou une urgence medicale ? Soumets ta demande, elle sera examinee par un administrateur.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200/60 rounded-xl text-sm text-red-600 animate-fade-in">
              {error}
            </div>
          )}
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">Type de collecte</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setCollecteType('urgence')}
                className={`flex items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 ${
                  collecteType === 'urgence' ? 'border-red-500 bg-red-50 text-red-700 shadow-lg shadow-red-100' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}>
                <AlertTriangle className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Urgence</p>
                  <p className="text-xs opacity-70 mt-0.5">Maladie, sante, urgence vitale</p>
                </div>
              </button>
              <button type="button" onClick={() => setCollecteType('projet')}
                className={`flex items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 ${
                  collecteType === 'projet' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg shadow-blue-100' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}>
                <Rocket className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Projet</p>
                  <p className="text-xs opacity-70 mt-0.5">Entreprise, etudes, formation</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Titre de la collecte</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={collecteType === 'urgence' ? 'Ex: Aide medicale urgente pour...' : 'Ex: Financement de mon projet...'}
              required className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Description detaillee</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Decris ta situation ou ton projet en detail..." required rows={6} className="input resize-none" />
          </div>

          {collecteType === 'urgence' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Details de l'urgence medicale</label>
              <textarea value={urgencyDetails} onChange={(e) => setUrgencyDetails(e.target.value)}
                placeholder="Decris la maladie, le traitement necessaire, les hopitaux concernes..." rows={4} className="input resize-none" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Montant cible (XOF)</label>
            <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="Ex: 500000" required min="1000" className="input" />
          </div>

          <div>
            <DocumentUploadField value={documents} onChange={setDocuments} onUploadingChange={setUploadingDocument} />
          </div>

          {collecteType === 'projet' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Video d'avancement du projet <span className="text-stone-400 font-normal">(optionnel)</span>
              </label>
              <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://exemple.com/video-projet.mp4" className="input" />
              <p className="text-xs text-stone-400 mt-1">Montre l'avancement de ton projet en video</p>
            </div>
          )}

          <div className="bg-amber-50/80 border border-amber-200/50 rounded-2xl p-5">
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Important :</strong> Ta demande sera mise en attente et ne sera pas publiee immediatement.
              Un administrateur examinera tes documents et validera ta demande avant sa publication.
              Assure-toi que les documents fournis sont authentiques.
            </p>
          </div>

          <button type="submit" disabled={submitting || uploadingDocument || !title.trim() || !description.trim() || !targetAmount || documents.length === 0}
            className="btn-primary w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed">
            {uploadingDocument ? 'Upload des documents...' : submitting ? 'Envoi en cours...' : 'Soumettre la demande'}
          </button>
        </form>
      </div>
    </div>
  );
}
