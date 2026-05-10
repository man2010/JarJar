import { BookOpen } from 'lucide-react';
import { navigate } from '../hooks/useRouter';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.15) 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 mb-5 group">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-colors duration-300">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">JarJar</span>
            </button>
            <p className="text-sm leading-relaxed text-stone-500">
              La discipline te construit, mais la confiance en soi te fait tenir.
              Chacun est la ou Allah lui a prescrit.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-widest mb-4">Navigation</h3>
            <ul className="space-y-2.5">
              <li><button onClick={() => navigate('/feed')} className="text-sm text-stone-500 hover:text-white transition-colors duration-200">Explorer</button></li>
              <li><button onClick={() => navigate('/new')} className="text-sm text-stone-500 hover:text-white transition-colors duration-200">Partager ton histoire</button></li>
              <li><button onClick={() => navigate('/bookmarks')} className="text-sm text-stone-500 hover:text-white transition-colors duration-200">Favoris</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-widest mb-4">Solidarite</h3>
            <ul className="space-y-2.5">
              <li><button onClick={() => navigate('/collectes')} className="text-sm text-stone-500 hover:text-white transition-colors duration-200">Collectes solidaires</button></li>
              <li><button onClick={() => navigate('/collecte')} className="text-sm text-stone-500 hover:text-white transition-colors duration-200">Demander de l'aide</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-widest mb-4">Thematiques</h3>
            <ul className="space-y-2.5">
              <li><button onClick={() => navigate('/feed?category=parcours-de-vie')} className="text-sm text-stone-500 hover:text-white transition-colors duration-200">Parcours de vie</button></li>
              <li><button onClick={() => navigate('/feed?category=confessions')} className="text-sm text-stone-500 hover:text-white transition-colors duration-200">Confessions</button></li>
              <li><button onClick={() => navigate('/feed?category=motivation')} className="text-sm text-stone-500 hover:text-white transition-colors duration-200">Motivation</button></li>
              <li><button onClick={() => navigate('/feed?category=sante')} className="text-sm text-stone-500 hover:text-white transition-colors duration-200">Sante</button></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-600">JarJar — Histoire, Parcours, Motivation. Partage, inspire.</p>
          <p className="text-xs text-stone-700">Nul n'est en retard, nul n'est en avance.</p>
        </div>
      </div>
    </footer>
  );
}
