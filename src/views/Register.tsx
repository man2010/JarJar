import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../hooks/useRouter';
import { BookOpen, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Register() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (username.length < 3) { setError('Le pseudo doit avoir au moins 3 caracteres'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Le pseudo ne peut contenir que des lettres, chiffres et _'); return; }
    if (password.length < 6) { setError('Le mot de passe doit avoir au moins 6 caracteres'); return; }
    if (!acceptedTerms) { setError('Tu dois lire et accepter les CGU pour creer un compte'); return; }
    setLoading(true);
    const { error: authError } = await signUp(email, password, username, fullName);
    if (authError) { setError(authError); setLoading(false); }
    else navigate('/feed');
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-stone-200/20 rounded-full blur-3xl translate-y-1/3" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2.5 mb-6 group">
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-stone-900 tracking-tight">JaarJaar</span>
          </button>
          <h1 className="text-2xl font-bold text-stone-900">Rejoins la communaute</h1>
          <p className="mt-2 text-sm text-stone-500">Ton histoire merite d'etre racontee</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-xl shadow-stone-200/20 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200/60 rounded-xl text-sm text-red-600 animate-fade-in">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Nom complet</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ton nom" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Pseudo</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} required placeholder="mon_pseudo" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ton@email.com" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Au moins 6 caracteres" className="input pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
              />
              <span className="text-xs text-stone-500 leading-relaxed">
                J’ai lu et j’accepte les{' '}
                <button type="button" onClick={() => navigate('/footer/cgu')} className="font-semibold text-stone-900 hover:underline">
                  conditions générales d’utilisation
                </button>
                .
              </span>
            </label>
            <button type="submit" disabled={loading || !acceptedTerms} className="btn-primary w-full py-3.5 text-base disabled:opacity-40">
              {loading ? 'Creation...' : 'Creer mon compte'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          Deja un compte ?{' '}
          <button onClick={() => navigate('/login')} className="font-semibold text-stone-900 hover:underline inline-flex items-center gap-1 group">
            Se connecter <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </p>
      </div>
    </div>
  );
}
