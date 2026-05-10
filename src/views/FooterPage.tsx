import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HandHeart,
  Heart,
  Lock,
  PenLine,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { navigate } from '../hooks/useRouter';
import { useAuth } from '../hooks/useAuth';

type Detail = {
  title: string;
  text: string;
};

type FooterPageConfig = {
  eyebrow: string;
  title: string;
  intro: string;
  details: Detail[];
  noteTitle: string;
  note: string;
  primaryLabel: string;
  primaryRoute: string;
  secondaryLabel?: string;
  secondaryRoute?: string;
  icon: React.ReactNode;
  accent: string;
};

const pages: Record<string, FooterPageConfig> = {
  explorer: {
    eyebrow: 'Explorer',
    title: 'Lire librement avant de rejoindre la communaute',
    intro: 'Sur JarJar, personne n est puni parce qu il decouvre la plateforme. Tu peux lire les publications, parcourir les themes et comprendre l esprit du lieu avant de creer un compte.',
    details: [
      { title: 'Lecture ouverte', text: 'Les histoires publiees restent accessibles aux visiteurs pour que chacun puisse trouver de l inspiration sans barriere inutile.' },
      { title: 'Compte au bon moment', text: 'Le compte devient utile quand tu veux aimer, commenter, sauvegarder, publier ou faire une demande de collecte.' },
      { title: 'Parcours naturel', text: 'On laisse d abord la personne recevoir quelque chose, puis on lui propose de participer quand elle est prete.' },
    ],
    noteTitle: 'Envie de participer ?',
    note: 'Pour partager ton histoire, commenter, aimer ou garder des publications en favoris, cree un compte. Si tu en as deja un, connecte-toi simplement.',
    primaryLabel: 'Lire les publications',
    primaryRoute: '/feed',
    secondaryLabel: 'Creer un compte',
    secondaryRoute: '/register',
    icon: <BookOpen className="w-5 h-5" />,
    accent: 'bg-blue-600',
  },
  partager: {
    eyebrow: 'Contribution',
    title: 'Transformer ton vecu en force pour quelqu un d autre',
    intro: 'Partager sur JarJar, ce n est pas publier pour remplir une page. C est poser une experience, une chute, une reprise ou une lecon qui peut aider une autre personne a tenir.',
    details: [
      { title: 'Choisir ton format', text: 'Article, audio, video ou confession: tu choisis la forme qui respecte le mieux ce que tu as a dire.' },
      { title: 'Rester maitre de ton recit', text: 'Tu peux signer ton histoire ou la publier anonymement quand le sujet demande plus de pudeur.' },
      { title: 'Ecrire utile', text: 'Un bon temoignage ne cherche pas a impressionner. Il donne des reperes, de la verite et parfois juste du courage.' },
    ],
    noteTitle: 'Compte requis',
    note: 'La publication demande un compte pour proteger les auteurs, gerer les modifications et garder un espace communautaire serieux.',
    primaryLabel: 'Commencer a ecrire',
    primaryRoute: '/new',
    secondaryLabel: 'Voir les histoires',
    secondaryRoute: '/feed',
    icon: <PenLine className="w-5 h-5" />,
    accent: 'bg-stone-900',
  },
  favoris: {
    eyebrow: 'Bibliotheque',
    title: 'Construire ton espace de lectures qui comptent',
    intro: 'Certaines histoires arrivent au bon moment. Les favoris permettent de garder pres de toi les recits, conseils et temoignages que tu veux relire plus tard.',
    details: [
      { title: 'Relire quand tu en as besoin', text: 'Sauvegarde les textes qui t ont parle pour y revenir dans une periode de doute ou de decision.' },
      { title: 'Garder une trace', text: 'Ton espace personnel rassemble les publications importantes sans les perdre dans le fil.' },
      { title: 'Avancer avec des reperes', text: 'Une collection de favoris peut devenir une petite reserve de force et de perspective.' },
    ],
    noteTitle: 'Compte requis',
    note: 'Les favoris sont lies a ton profil. Cree un compte ou connecte-toi pour les retrouver sur tous tes appareils.',
    primaryLabel: 'Ouvrir mes favoris',
    primaryRoute: '/bookmarks',
    secondaryLabel: 'Creer un compte',
    secondaryRoute: '/register',
    icon: <Heart className="w-5 h-5" />,
    accent: 'bg-rose-600',
  },
  'collectes-solidaires': {
    eyebrow: 'Solidarite',
    title: 'Un espace pour soutenir avec attention, pas dans la precipitation',
    intro: 'Les collectes solidaires accueillent des urgences et des projets qui ont besoin d aide concrete. L objectif est de rendre les demandes lisibles, humaines et verifiables.',
    details: [
      { title: 'Comprendre avant d aider', text: 'Chaque collecte presente le contexte, le besoin, le montant vise et les elements fournis pour suivre la situation.' },
      { title: 'Distinguer urgence et projet', text: 'Une urgence medicale ne se lit pas comme un projet de formation ou d entreprise. La page aide a aborder chaque cas avec justesse.' },
      { title: 'Donner de la dignite aux demandes', text: 'La solidarite ne doit pas humilier. Elle doit permettre a une personne d expliquer sa situation clairement et d etre ecoutee.' },
    ],
    noteTitle: 'Demandes validees',
    note: 'Les collectes publiees passent par une validation administrateur pour limiter les abus et proteger la confiance de la communaute.',
    primaryLabel: 'Voir les collectes',
    primaryRoute: '/collectes',
    secondaryLabel: 'Demander de l aide',
    secondaryRoute: '/footer/demander-aide',
    icon: <HandHeart className="w-5 h-5" />,
    accent: 'bg-emerald-600',
  },
  'demander-aide': {
    eyebrow: 'Demande',
    title: 'Demander de l aide avec clarte, pudeur et documents utiles',
    intro: 'Faire une demande peut etre difficile. Cette page prepare la personne a formuler son besoin sans se perdre, avec les informations qui aideront l equipe a comprendre et valider le dossier.',
    details: [
      { title: 'Expliquer la situation', text: 'Presente ce qui arrive, pourquoi l aide est necessaire et ce que la collecte permettra de regler ou de lancer.' },
      { title: 'Ajouter les preuves utiles', text: 'Documents medicaux, devis, justificatifs ou elements de projet aident a rendre la demande credible et comprehensible.' },
      { title: 'Attendre la validation', text: 'La demande est d abord examinee. Cette etape protege autant la personne qui demande que celles qui souhaitent soutenir.' },
    ],
    noteTitle: 'Compte requis',
    note: 'Pour creer une demande, il faut un compte. Cela permet de suivre le dossier, recevoir les notifications et echanger avec l administration.',
    primaryLabel: 'Creer une demande',
    primaryRoute: '/collecte',
    secondaryLabel: 'Voir les collectes',
    secondaryRoute: '/collectes',
    icon: <Users className="w-5 h-5" />,
    accent: 'bg-amber-600',
  },
  'parcours-de-vie': {
    eyebrow: 'Thematique',
    title: 'Des trajectoires vraies pour se sentir moins seul sur son chemin',
    intro: 'Les parcours de vie racontent les depart difficiles, les changements de cap, les pertes, les reprises et les choix qui finissent par construire une personne.',
    details: [
      { title: 'Comprendre les virages', text: 'Ces recits montrent comment une decision, une epreuve ou une rencontre peut reorienter toute une vie.' },
      { title: 'Apprendre sans se comparer', text: 'L objectif n est pas de mesurer qui avance plus vite, mais de voir comment chacun traverse ce qui lui est donne.' },
      { title: 'Trouver des reperes', text: 'Un parcours raconte avec honnetete peut aider une autre personne a nommer ce qu elle vit.' },
    ],
    noteTitle: 'Lire sans compte',
    note: 'Tu peux parcourir cette thematique librement. Le compte sert seulement si tu veux reagir, commenter ou sauvegarder une histoire.',
    primaryLabel: 'Lire les parcours',
    primaryRoute: '/feed?category=parcours-de-vie',
    icon: <Sparkles className="w-5 h-5" />,
    accent: 'bg-rose-600',
  },
  confessions: {
    eyebrow: 'Thematique',
    title: 'Un lieu pour deposer ce qui pese sans se montrer forcement',
    intro: 'Les confessions existent pour les mots difficiles a dire ailleurs: regrets, fatigue, peur, honte, comprehension tardive, besoin de se liberer.',
    details: [
      { title: 'Anonymat possible', text: 'Certains sujets demandent de la discretion. L anonymat permet de parler sans exposer toute son identite.' },
      { title: 'Ecoute avant jugement', text: 'Une confession n est pas une performance. C est souvent une tentative de respirer plus librement.' },
      { title: 'Sortir du silence', text: 'Mettre des mots sur une realite peut etre le premier pas vers une reconstruction.' },
    ],
    noteTitle: 'Lire avec respect',
    note: 'Les confessions peuvent etre sensibles. Pour commenter ou repondre, un compte est demande afin de garder un cadre plus responsable.',
    primaryLabel: 'Lire les confessions',
    primaryRoute: '/feed?category=confessions',
    icon: <Lock className="w-5 h-5" />,
    accent: 'bg-stone-900',
  },
  motivation: {
    eyebrow: 'Thematique',
    title: 'Une motivation ancree dans le reel, pas dans les slogans',
    intro: 'Ici, la motivation vient de personnes qui ont traverse quelque chose. Elle parle de discipline, de patience, de confiance et de reprise apres l echec.',
    details: [
      { title: 'Recommencer proprement', text: 'Les histoires montrent qu une chute peut devenir un point de depart si elle est comprise.' },
      { title: 'Tenir dans la duree', text: 'La motivation utile ne crie pas. Elle donne envie de poser le prochain acte, meme petit.' },
      { title: 'Voir des preuves vivantes', text: 'Lire un parcours concret peut rendre possible ce qui semblait trop loin.' },
    ],
    noteTitle: 'Inspiration ouverte',
    note: 'Tout le monde peut lire. Pour encourager un auteur, garder un texte ou publier ton propre parcours, cree un compte.',
    primaryLabel: 'Lire la motivation',
    primaryRoute: '/feed?category=motivation',
    icon: <Sparkles className="w-5 h-5" />,
    accent: 'bg-orange-600',
  },
  sante: {
    eyebrow: 'Thematique',
    title: 'Parler de sante avec humanite, pudeur et courage',
    intro: 'La sante touche au corps, a la peur, a la famille, aux moyens et a la foi. Cette thematique accueille les recits de maladie, de soin, de guerison et de fatigue invisible.',
    details: [
      { title: 'Mettre des mots sur l epreuve', text: 'Un temoignage peut aider une personne malade ou proche aidant a se sentir comprise.' },
      { title: 'Partager sans dramatiser', text: 'On peut raconter la difficulte avec dignite, sans chercher a choquer ni a minimiser.' },
      { title: 'Relier histoire et soutien', text: 'Certains recits peuvent aussi mener vers une collecte lorsque la situation demande une aide concrete.' },
    ],
    noteTitle: 'Soutien et lecture',
    note: 'Les publications sont lisibles sans compte. Les interactions et demandes de collecte demandent un profil pour garder un cadre fiable.',
    primaryLabel: 'Lire sur la sante',
    primaryRoute: '/feed?category=sante',
    secondaryLabel: 'Voir les collectes',
    secondaryRoute: '/collectes',
    icon: <Heart className="w-5 h-5" />,
    accent: 'bg-teal-600',
  },
  formats: {
    eyebrow: 'Formats',
    title: 'Choisir la forme qui respecte le mieux ton histoire',
    intro: 'Un parcours peut se lire, s ecouter ou se regarder. Le bon format est celui qui te permet d etre clair, vrai et a l aise.',
    details: [
      { title: 'Article', text: 'Pour developper une histoire, poser un contexte et transmettre une lecon avec precision.' },
      { title: 'Audio', text: 'Pour parler plus naturellement quand la voix porte mieux l emotion que le texte.' },
      { title: 'Video', text: 'Pour montrer une realite, un projet, un lieu ou un moment qui demande a etre vu.' },
    ],
    noteTitle: 'Compte requis',
    note: 'La creation de contenu demande un compte afin que tu puisses modifier, suivre et assumer ton espace de publication.',
    primaryLabel: 'Creer une publication',
    primaryRoute: '/new',
    secondaryLabel: 'Explorer les histoires',
    secondaryRoute: '/feed',
    icon: <BookOpen className="w-5 h-5" />,
    accent: 'bg-violet-600',
  },
};

export default function FooterPage({ slug }: { slug?: string }) {
  const { user } = useAuth();
  const page = pages[slug || ''] || pages.explorer;
  const requiresAccount = ['/new', '/bookmarks', '/collecte'].includes(page.primaryRoute);
  const primaryRoute = !user && requiresAccount ? '/register' : page.primaryRoute;

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 mb-10 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Retour a l accueil
        </button>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          <div className="space-y-6">
            <div className="bg-white border border-stone-200/70 rounded-2xl p-7 sm:p-10 shadow-sm shadow-stone-900/5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full text-stone-500 text-xs font-semibold uppercase tracking-wider mb-6">
                {page.icon}
                {page.eyebrow}
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold text-stone-900 tracking-tight leading-tight">
                {page.title}
              </h1>
              <p className="mt-5 text-lg text-stone-500 leading-relaxed max-w-3xl">
                {page.intro}
              </p>

              <div className="mt-9 grid md:grid-cols-3 gap-4">
                {page.details.map((detail) => (
                  <article key={detail.title} className="rounded-2xl bg-stone-50 border border-stone-200/60 p-5">
                    <div className={`w-9 h-9 rounded-xl ${page.accent} text-white flex items-center justify-center mb-4`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-stone-900 mb-2">{detail.title}</h2>
                    <p className="text-sm text-stone-500 leading-relaxed">{detail.text}</p>
                  </article>
                ))}
              </div>

              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <button onClick={() => navigate(primaryRoute)} className="btn-primary px-6 py-3 group">
                  {page.primaryLabel}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                {page.secondaryLabel && page.secondaryRoute && (
                  <button onClick={() => navigate(page.secondaryRoute!)} className="btn-secondary px-6 py-3">
                    {page.secondaryLabel}
                  </button>
                )}
              </div>
            </div>

            {!user && (
              <div className="bg-white border border-stone-200/70 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div>
                  <p className="text-sm font-bold text-stone-900">Tu peux lire sans compte.</p>
                  <p className="mt-1 text-sm text-stone-500 leading-relaxed">
                    Pour publier, commenter, aimer ou garder une histoire, cree ton compte ou connecte-toi.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <button onClick={() => navigate('/register')} className="btn-primary px-4 py-2.5 text-sm">Creer un compte</button>
                  <button onClick={() => navigate('/login')} className="btn-secondary px-4 py-2.5 text-sm">Se connecter</button>
                </div>
              </div>
            )}
          </div>

          <aside className="bg-stone-900 text-white rounded-2xl p-6 sticky top-24">
            <div className={`w-12 h-12 rounded-2xl ${page.accent} flex items-center justify-center mb-6`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">{page.noteTitle}</p>
            <p className="text-2xl font-bold leading-snug">{page.note}</p>
            <div className="mt-6 pt-6 border-t border-white/10">
              <button onClick={() => navigate('/feed')} className="text-sm font-semibold text-white hover:text-stone-300 transition-colors">
                Continuer vers les publications
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
