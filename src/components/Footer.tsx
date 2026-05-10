import { BookOpen } from 'lucide-react';
import { navigate } from '../hooks/useRouter';

const footerGroups = [
  {
    title: 'Navigation',
    links: [
      { label: 'Explorer', route: '/footer/explorer' },
      { label: 'Partager ton histoire', route: '/footer/partager' },
      { label: 'Favoris', route: '/footer/favoris' },
    ],
  },
  {
    title: 'Solidarite',
    links: [
      { label: 'Collectes solidaires', route: '/footer/collectes-solidaires' },
      { label: "Demander de l'aide", route: '/footer/demander-aide' },
    ],
  },
  {
    title: 'Thematiques',
    links: [
      { label: 'Parcours de vie', route: '/footer/parcours-de-vie' },
      { label: 'Confessions', route: '/footer/confessions' },
      { label: 'Motivation', route: '/footer/motivation' },
      { label: 'Sante', route: '/footer/sante' },
    ],
  },
  {
    title: 'Informations',
    links: [
      { label: 'A propos', route: '/footer/a-propos' },
      { label: "Guide d'utilisation", route: '/footer/guide' },
      { label: 'CGU', route: '/footer/cgu' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.15) 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div>
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 mb-5 group">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-colors duration-300">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">JaarJaar</span>
            </button>
            <p className="text-sm leading-relaxed text-stone-500">
              La discipline te construit, mais la confiance en soi te fait tenir.
              Chacun est la ou Allah lui a prescrit.
            </p>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-stone-300 uppercase tracking-widest mb-4">{group.title}</h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.route}>
                    <button onClick={() => navigate(link.route)} className="text-sm text-stone-500 hover:text-white transition-colors duration-200">
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-600">JaarJaar — Histoire, Parcours, Motivation. Partage, inspire.</p>
          <p className="text-xs text-stone-700">Nul n'est en retard, nul n'est en avance.</p>
        </div>
      </div>
    </footer>
  );
}
