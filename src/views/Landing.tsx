import { navigate } from '../hooks/useRouter';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, Heart, Shield, Users, ArrowRight, Flame, SquarePen as PenSquare, Lock, Headphones, Video, Sparkles } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-white to-amber-50/20" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse-soft" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-stone-200/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.2) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50/80 border border-amber-200/50 rounded-full text-amber-700 text-xs font-medium mb-8 animate-fade-in backdrop-blur-sm">
              <Flame className="w-3.5 h-3.5" />
              La discipline te construit, la confiance te fait tenir
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[5rem] font-extrabold tracking-tight leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Chaque histoire
              <br />
              <span className="gradient-text">merite d'etre</span>
              <br />
              racontee.
            </h1>

            <p className="mt-7 text-lg sm:text-xl text-stone-500 leading-relaxed max-w-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              JaarJaar signifie <em className="text-stone-700 font-semibold not-italic">Histoire</em> en Wolof.
              Ici, on partage les hauts et les bas de nos parcours. Parce que nul n'est en retard,
              nul n'est en avance — chacun est la ou Allah lui a prescrit.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {user ? (
                <button onClick={() => navigate('/feed')} className="btn-primary px-7 py-4 text-base group">
                  Explorer les histoires
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              ) : (
                <>
                  <button onClick={() => navigate('/register')} className="btn-primary px-7 py-4 text-base group">
                    Commencer a ecrire
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                  <button onClick={() => navigate('/feed')} className="btn-secondary px-7 py-4 text-base">
                    Lire les histoires
                  </button>
                </>
              )}
            </div>

            <div className="mt-16 flex items-center gap-8 text-sm text-stone-400 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-stone-500" />
                </div>
                <span>Communaute grandissante</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-amber-600" />
                </div>
                <span>Confessions anonymes</span>
              </div>
            </div>
          </div>

          {/* Floating decorative elements */}
          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-72 h-72 rounded-3xl bg-gradient-to-br from-stone-100 to-stone-50 border border-stone-200/40 p-6 rotate-3 animate-float shadow-xl shadow-stone-200/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-stone-200/60 rounded-full w-4/5" />
                  <div className="h-3 bg-stone-200/40 rounded-full w-full" />
                  <div className="h-3 bg-stone-200/40 rounded-full w-3/4" />
                  <div className="h-8 bg-amber-100/60 rounded-lg w-1/2 mt-4" />
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 w-48 h-48 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/30 p-4 -rotate-6 animate-float shadow-lg" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <div className="h-2 bg-amber-200/60 rounded-full w-2/3" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-amber-200/40 rounded-full" />
                  <div className="h-2 bg-amber-200/40 rounded-full w-4/5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Types */}
      <section className="section bg-white relative">
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.3) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full text-stone-500 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Multi-formats
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Raconte a ta facon
            </h2>
            <p className="mt-4 text-stone-500 text-lg max-w-2xl mx-auto">
              Articles, videos, audios ou confessions anonymes — choisis le format qui te correspond.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
            <div className="group p-6 bg-white border border-stone-200/60 rounded-2xl card-hover cursor-pointer" onClick={() => navigate('/feed?type=article')}>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-1">Articles</h3>
              <p className="text-xs text-stone-500 leading-relaxed">Ecris ton parcours en profondeur</p>
            </div>
            <div className="group p-6 bg-white border border-stone-200/60 rounded-2xl card-hover cursor-pointer" onClick={() => navigate('/feed?type=video')}>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-1">Videos</h3>
              <p className="text-xs text-stone-500 leading-relaxed">Montre ton histoire en images</p>
            </div>
            <div className="group p-6 bg-white border border-stone-200/60 rounded-2xl card-hover cursor-pointer" onClick={() => navigate('/feed?type=audio')}>
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-1">Audios</h3>
              <p className="text-xs text-stone-500 leading-relaxed">Parle, ta voix compte</p>
            </div>
            <div className="group p-6 bg-white border border-stone-200/60 rounded-2xl card-hover cursor-pointer" onClick={() => navigate('/feed?type=confession')}>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-1">Confessions</h3>
              <p className="text-xs text-stone-500 leading-relaxed">Libere-toi en anonymat</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section bg-stone-50 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Pourquoi JaarJaar ?
            </h2>
            <p className="mt-4 text-stone-500 text-lg max-w-2xl mx-auto">
              Des gens sortent du cancer et reussissent dans leur carriere.
              Des gens partent de rien et construisent des empires.
              Chaque parcours est une lecon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
            <FeatureCard
              icon={<PenSquare className="w-6 h-6" />}
              title="Partage ton parcours"
              description="Articles, videos, confessions — raconte les hauts et les bas qui t'ont construit. Ton histoire peut etre la cle pour quelqu'un d'autre."
              accent="bg-stone-900"
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6" />}
              title="Confessions anonymes"
              description="Parfois, se livrer fait du bien. Partage tes pensees les plus profondes en toute anonymat. Ce qui est en toi merite de sortir."
              accent="bg-amber-600"
            />
            <FeatureCard
              icon={<Heart className="w-6 h-6" />}
              title="Inspire et sois inspire"
              description="Decouvre des histoires de resilience, de foi, de combat. La motivation vient de ceux qui ont traverse avant toi."
              accent="bg-rose-600"
            />
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="section bg-stone-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-amber-500/10 flex items-center justify-center animate-float">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <blockquote className="text-2xl sm:text-3xl lg:text-[2.75rem] font-bold leading-snug tracking-tight">
            "Nul n'est en retard et nul n'est en avance,
            parce que chacun est la ou Je lui ai prescrit."
          </blockquote>
          <p className="mt-6 text-stone-500 text-lg">— La sagesse divine</p>
          <div className="mt-10">
            <button
              onClick={() => navigate(user ? '/new' : '/register')}
              className="inline-flex items-center gap-2 px-7 py-4 bg-white text-stone-900 rounded-xl font-semibold hover:bg-stone-100 transition-all duration-300 group shadow-lg shadow-white/10"
            >
              Partager mon histoire
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="section bg-white relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Explore par theme
            </h2>
            <p className="mt-3 text-stone-500">Trouve les histoires qui resonent avec toi</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger">
            <CategoryLink name="Parcours de vie" slug="parcours-de-vie" icon={<Heart className="w-5 h-5" />} bg="bg-rose-50" text="text-rose-700" border="border-rose-200/50" hoverBg="hover:bg-rose-100" />
            <CategoryLink name="Carriere" slug="carriere" icon={<BookOpen className="w-5 h-5" />} bg="bg-blue-50" text="text-blue-700" border="border-blue-200/50" hoverBg="hover:bg-blue-100" />
            <CategoryLink name="Sante" slug="sante" icon={<Flame className="w-5 h-5" />} bg="bg-emerald-50" text="text-emerald-700" border="border-emerald-200/50" hoverBg="hover:bg-emerald-100" />
            <CategoryLink name="Confessions" slug="confessions" icon={<Lock className="w-5 h-5" />} bg="bg-amber-50" text="text-amber-700" border="border-amber-200/50" hoverBg="hover:bg-amber-100" />
            <CategoryLink name="Motivation" slug="motivation" icon={<Flame className="w-5 h-5" />} bg="bg-orange-50" text="text-orange-700" border="border-orange-200/50" hoverBg="hover:bg-orange-100" />
            <CategoryLink name="Spiritualite" slug="spiritualite" icon={<BookOpen className="w-5 h-5" />} bg="bg-teal-50" text="text-teal-700" border="border-teal-200/50" hoverBg="hover:bg-teal-100" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-stone-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 animate-gradient-x" style={{ backgroundSize: '200% 100%' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Pret a partager ?</h2>
          <p className="text-stone-400 text-lg mb-8">Ton histoire merite d'etre entendue. Rejoins la communaute JaarJaar.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(user ? '/new' : '/register')}
              className="btn-primary px-8 py-4 text-base bg-white text-stone-900 hover:bg-stone-100 shadow-white/10 group"
            >
              {user ? 'Ecrire mon histoire' : 'Rejoindre JaarJaar'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            <button
              onClick={() => navigate('/collectes')}
              className="btn-secondary px-8 py-4 text-base border-stone-600 text-stone-300 hover:bg-stone-800 hover:text-white"
            >
              Voir les collectes
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, accent }: { icon: React.ReactNode; title: string; description: string; accent: string }) {
  return (
    <div className="group p-7 bg-white border border-stone-200/60 rounded-2xl card-hover relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-0.5 ${accent} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
      <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 mb-5 group-hover:bg-stone-900 group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-stone-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function CategoryLink({ name, slug, icon, bg, text, border, hoverBg }: { name: string; slug: string; icon: React.ReactNode; bg: string; text: string; border: string; hoverBg: string }) {
  return (
    <button
      onClick={() => navigate(`/feed?category=${slug}`)}
      className={`flex items-center gap-3 p-5 border rounded-2xl transition-all duration-300 card-hover ${bg} ${text} ${border} ${hoverBg}`}
    >
      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="font-semibold text-sm">{name}</span>
    </button>
  );
}
