import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../hooks/useRouter';
import { ArrowLeft, AlertTriangle, Rocket, Heart, Plus, Clock, XCircle, Users } from 'lucide-react';

interface Collecte {
  id: string;
  title: string;
  description: string;
  collecte_type: string;
  urgency_details: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  documents: Array<string | { url: string; name?: string }>;
  video_url: string;
  status: string;
  created_at: string;
  profiles: { username: string; full_name: string } | null;
}

export default function Collectes() {
  const { user } = useAuth();
  const [collectes, setCollectes] = useState<Collecte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgence' | 'projet' | 'my'>('all');

  useEffect(() => { fetchCollectes(); }, [filter, user]);

  async function fetchCollectes() {
    setLoading(true);

    let query = supabase
      .from('collectes')
      .select(`
        id, title, description, collecte_type, urgency_details,
        target_amount, current_amount, currency, documents, video_url,
        status, created_at,
        profiles!requester_id (username, full_name)
      `)
      .order('created_at', { ascending: false });

    if (filter === 'my') {
      if (!user) {
        navigate('/login');
        return;
      }
      query = query.eq('requester_id', user.id);
    } else {
      query = query.eq('status', 'approved');
      if (filter === 'urgence' || filter === 'projet') {
        query = query.eq('collecte_type', filter);
      }
    }

    const { data, error } = await query;
    if (error) console.error('Erreur Collectes:', error);
    else setCollectes((data || []) as unknown as Collecte[]);

    setLoading(false);
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat('fr-FR').format(amount);
  }

  function getProgress(current: number, target: number) {
    return target === 0 ? 0 : Math.min(Math.round((current / target) * 100), 100);
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate('/feed')} className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Retour
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">Collectes solidaires</h1>
            <p className="mt-2 text-stone-500">Soutiens ceux qui en ont besoin. Chaque contribution compte.</p>
          </div>
          <button onClick={() => navigate('/collecte')} className="btn-primary px-5 py-3 flex-shrink-0 group">
            <Plus className="w-4 h-4" /> Demander une collecte
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: 'all', label: 'Toutes les collectes' },
            { key: 'urgence', label: 'Urgences' },
            { key: 'projet', label: 'Projets' },
            { key: 'my', label: 'Mes demandes' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                filter === f.key ? 'bg-stone-900 text-white shadow-sm' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl border border-stone-200/60 animate-pulse" />)}
          </div>
        ) : collectes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/60">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {filter === 'my' ? <Clock className="w-8 h-8 text-amber-400" /> : <Heart className="w-8 h-8 text-stone-300" />}
            </div>
            <h3 className="text-lg font-semibold text-stone-700 mb-2">
              {filter === 'my' ? "Aucune demande pour le moment" : "Aucune collecte trouvee"}
            </h3>
            <button onClick={() => navigate('/collecte')} className="btn-primary px-5 py-2.5 mt-4">
              Creer une collecte
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
            {collectes.map((collecte) => {
              const progress = getProgress(collecte.current_amount, collecte.target_amount);
              const isUrgence = collecte.collecte_type === 'urgence';
              const isPending = collecte.status === 'pending';
              const isRejected = collecte.status === 'rejected';

              return (
                <article key={collecte.id} className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden card-hover">
                  <div className={`px-6 pt-6 pb-4 ${isUrgence ? 'bg-red-50/70' : 'bg-blue-50/70'}`}>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`badge ${isUrgence ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isUrgence ? <AlertTriangle className="w-3 h-3" /> : <Rocket className="w-3 h-3" />}
                        {isUrgence ? 'Urgence' : 'Projet'}
                      </span>
                      {isPending && <span className="badge bg-amber-100 text-amber-700">En attente</span>}
                      {isRejected && <span className="badge bg-red-100 text-red-700 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejetee</span>}
                      {collecte.profiles && <span className="text-xs text-stone-400">par @{collecte.profiles.username}</span>}
                    </div>

                    <h3 className="text-lg font-semibold text-stone-900 mb-2">{collecte.title}</h3>
                    <p className="text-sm text-stone-500 line-clamp-3 mb-4">{collecte.description}</p>
                  </div>

                  <div className="px-6 py-5 border-t">
                    <div className="mb-5">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-semibold">{formatAmount(collecte.current_amount)} XOF</span>
                        <span className="text-stone-400">sur {formatAmount(collecte.target_amount)}</span>
                      </div>
                      <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isUrgence ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/collecte/${collecte.id}`)}
                      className={`w-full py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all ${isPending ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : isRejected ? 'bg-stone-100 text-stone-500 hover:bg-stone-200' : 'bg-stone-900 hover:bg-black text-white'}`}
                    >
                      <Users className="w-4 h-4" /> {isPending ? 'Voir ma demande' : isRejected ? 'Voir le retour' : 'Participer maintenant'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
