import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  HandHeart,
  Heart,
  HelpCircle,
  Info,
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
  sections?: Detail[];
};

const pages: Record<string, FooterPageConfig> = {
  explorer: {
    eyebrow: 'Explorer',
    title: 'Lire librement avant de rejoindre la communauté',
    intro: 'Sur JaarJaar, personne n’est puni parce qu’il découvre la plateforme. Tu peux lire les publications, parcourir les thèmes et comprendre l’esprit du lieu avant de créer un compte.',
    details: [
      { title: 'Lecture ouverte', text: 'Les histoires publiées restent accessibles aux visiteurs pour que chacun puisse trouver de l’inspiration sans barrière inutile.' },
      { title: 'Compte au bon moment', text: 'Le compte devient utile quand tu veux aimer, commenter, sauvegarder, publier ou faire une demande de collecte.' },
      { title: 'Parcours naturel', text: 'On laisse d’abord la personne recevoir quelque chose, puis on lui propose de participer quand elle est prête.' },
    ],
    noteTitle: 'Envie de participer ?',
    note: 'Pour partager ton histoire, commenter, aimer ou garder des publications en favoris, crée un compte. Si tu en as déjà un, connecte-toi simplement.',
    primaryLabel: 'Lire les publications',
    primaryRoute: '/feed',
    secondaryLabel: 'Créer un compte',
    secondaryRoute: '/register',
    icon: <BookOpen className="w-5 h-5" />,
    accent: 'bg-blue-600',
  },
  partager: {
    eyebrow: 'Contribution',
    title: 'Transformer ton vécu en force pour quelqu’un d’autre',
    intro: 'Partager sur JaarJaar, ce n’est pas publier pour remplir une page. C’est poser une expérience, une chute, une reprise ou une leçon qui peut aider une autre personne à tenir.',
    details: [
      { title: 'Choisir ton format', text: 'Article, audio, vidéo ou confession: tu choisis la forme qui respecte le mieux ce que tu as à dire.' },
      { title: 'Rester maître de ton récit', text: 'Tu peux signer ton histoire ou la publier anonymement quand le sujet demande plus de pudeur.' },
      { title: 'Écrire utile', text: 'Un bon témoignage ne cherche pas à impressionner. Il donne des repères, de la vérité et parfois juste du courage.' },
    ],
    noteTitle: 'Compte requis',
    note: 'La publication demande un compte pour protéger les auteurs, gérer les modifications et garder un espace communautaire sérieux.',
    primaryLabel: 'Commencer à écrire',
    primaryRoute: '/new',
    secondaryLabel: 'Voir les histoires',
    secondaryRoute: '/feed',
    icon: <PenLine className="w-5 h-5" />,
    accent: 'bg-stone-900',
  },
  favoris: {
    eyebrow: 'Bibliothèque',
    title: 'Construire ton espace de lectures qui comptent',
    intro: 'Certaines histoires arrivent au bon moment. Les favoris permettent de garder près de toi les récits, conseils et témoignages que tu veux relire plus tard.',
    details: [
      { title: 'Relire quand tu en as besoin', text: 'Sauvegarde les textes qui t’ont parlé pour y revenir dans une période de doute ou de décision.' },
      { title: 'Garder une trace', text: 'Ton espace personnel rassemble les publications importantes sans les perdre dans le fil.' },
      { title: 'Avancer avec des repères', text: 'Une collection de favoris peut devenir une petite réserve de force et de perspective.' },
    ],
    noteTitle: 'Compte requis',
    note: 'Les favoris sont liés à ton profil. Crée un compte ou connecte-toi pour les retrouver sur tous tes appareils.',
    primaryLabel: 'Ouvrir mes favoris',
    primaryRoute: '/bookmarks',
    secondaryLabel: 'Créer un compte',
    secondaryRoute: '/register',
    icon: <Heart className="w-5 h-5" />,
    accent: 'bg-rose-600',
  },
  'collectes-solidaires': {
    eyebrow: 'Solidarité',
    title: 'Un espace pour soutenir avec attention, pas dans la précipitation',
    intro: 'Les collectes solidaires accueillent des urgences et des projets qui ont besoin d’aide concrète. L’objectif est de rendre les demandes lisibles, humaines et vérifiables.',
    details: [
      { title: 'Comprendre avant d’aider', text: 'Chaque collecte présente le contexte, le besoin, le montant visé et les éléments fournis pour suivre la situation.' },
      { title: 'Distinguer urgence et projet', text: 'Une urgence médicale ne se lit pas comme un projet de formation ou d’entreprise. La page aide à aborder chaque cas avec justesse.' },
      { title: 'Donner de la dignité aux demandes', text: 'La solidarité ne doit pas humilier. Elle doit permettre à une personne d’expliquer sa situation clairement et d’être écoutée.' },
    ],
    noteTitle: 'Demandes validées',
    note: 'Les collectes publiées passent par une validation administrateur pour limiter les abus et protéger la confiance de la communauté.',
    primaryLabel: 'Voir les collectes',
    primaryRoute: '/collectes',
    secondaryLabel: 'Demander de l’aide',
    secondaryRoute: '/footer/demander-aide',
    icon: <HandHeart className="w-5 h-5" />,
    accent: 'bg-emerald-600',
  },
  'demander-aide': {
    eyebrow: 'Demande',
    title: 'Demander de l’aide avec clarté, pudeur et documents utiles',
    intro: 'Faire une demande peut être difficile. Cette page prépare la personne à formuler son besoin sans se perdre, avec les informations qui aideront l’équipe à comprendre et valider le dossier.',
    details: [
      { title: 'Expliquer la situation', text: 'Présente ce qui arrive, pourquoi l’aide est nécessaire et ce que la collecte permettra de régler ou de lancer.' },
      { title: 'Ajouter les preuves utiles', text: 'Documents médicaux, devis, justificatifs ou éléments de projet aident à rendre la demande crédible et compréhensible.' },
      { title: 'Attendre la validation', text: 'La demande est d’abord examinée. Cette étape protège autant la personne qui demande que celles qui souhaitent soutenir.' },
    ],
    noteTitle: 'Compte requis',
    note: 'Pour créer une demande, il faut un compte. Cela permet de suivre le dossier, recevoir les notifications et échanger avec l’administration.',
    primaryLabel: 'Créer une demande',
    primaryRoute: '/collecte',
    secondaryLabel: 'Voir les collectes',
    secondaryRoute: '/collectes',
    icon: <Users className="w-5 h-5" />,
    accent: 'bg-amber-600',
  },
  'parcours-de-vie': {
    eyebrow: 'Thématique',
    title: 'Des trajectoires vraies pour se sentir moins seul sur son chemin',
    intro: 'Les parcours de vie racontent les départs difficiles, les changements de cap, les pertes, les reprises et les choix qui finissent par construire une personne.',
    details: [
      { title: 'Comprendre les virages', text: 'Ces récits montrent comment une décision, une épreuve ou une rencontre peut réorienter toute une vie.' },
      { title: 'Apprendre sans se comparer', text: 'L’objectif n’est pas de mesurer qui avance plus vite, mais de voir comment chacun traverse ce qui lui est donné.' },
      { title: 'Trouver des repères', text: 'Un parcours raconté avec honnêteté peut aider une autre personne à nommer ce qu’elle vit.' },
    ],
    noteTitle: 'Lire sans compte',
    note: 'Tu peux parcourir cette thématique librement. Le compte sert seulement si tu veux réagir, commenter ou sauvegarder une histoire.',
    primaryLabel: 'Lire les parcours',
    primaryRoute: '/feed?category=parcours-de-vie',
    icon: <Sparkles className="w-5 h-5" />,
    accent: 'bg-rose-600',
  },
  confessions: {
    eyebrow: 'Thématique',
    title: 'Un lieu pour déposer ce qui pèse sans se montrer forcément',
    intro: 'Les confessions existent pour les mots difficiles à dire ailleurs: regrets, fatigue, peur, honte, compréhension tardive, besoin de se libérer.',
    details: [
      { title: 'Anonymat possible', text: 'Certains sujets demandent de la discrétion. L’anonymat permet de parler sans exposer toute son identité.' },
      { title: 'Écoute avant jugement', text: 'Une confession n’est pas une performance. C’est souvent une tentative de respirer plus librement.' },
      { title: 'Sortir du silence', text: 'Mettre des mots sur une réalité peut être le premier pas vers une reconstruction.' },
    ],
    noteTitle: 'Lire avec respect',
    note: 'Les confessions peuvent être sensibles. Pour commenter ou répondre, un compte est demandé afin de garder un cadre plus responsable.',
    primaryLabel: 'Lire les confessions',
    primaryRoute: '/feed?category=confessions',
    icon: <Lock className="w-5 h-5" />,
    accent: 'bg-stone-900',
  },
  motivation: {
    eyebrow: 'Thématique',
    title: 'Une motivation ancrée dans le réel, pas dans les slogans',
    intro: 'Ici, la motivation vient de personnes qui ont traversé quelque chose. Elle parle de discipline, de patience, de confiance et de reprise après l’échec.',
    details: [
      { title: 'Recommencer proprement', text: 'Les histoires montrent qu’une chute peut devenir un point de départ si elle est comprise.' },
      { title: 'Tenir dans la durée', text: 'La motivation utile ne crie pas. Elle donne envie de poser le prochain acte, même petit.' },
      { title: 'Voir des preuves vivantes', text: 'Lire un parcours concret peut rendre possible ce qui semblait trop loin.' },
    ],
    noteTitle: 'Inspiration ouverte',
    note: 'Tout le monde peut lire. Pour encourager un auteur, garder un texte ou publier ton propre parcours, crée un compte.',
    primaryLabel: 'Lire la motivation',
    primaryRoute: '/feed?category=motivation',
    icon: <Sparkles className="w-5 h-5" />,
    accent: 'bg-orange-600',
  },
  sante: {
    eyebrow: 'Thématique',
    title: 'Parler de santé avec humanité, pudeur et courage',
    intro: 'La santé touche au corps, à la peur, à la famille, aux moyens et à la foi. Cette thématique accueille les récits de maladie, de soin, de guérison et de fatigue invisible.',
    details: [
      { title: 'Mettre des mots sur l’épreuve', text: 'Un témoignage peut aider une personne malade ou proche aidant à se sentir comprise.' },
      { title: 'Partager sans dramatiser', text: 'On peut raconter la difficulté avec dignité, sans chercher à choquer ni à minimiser.' },
      { title: 'Relier histoire et soutien', text: 'Certains récits peuvent aussi mener vers une collecte lorsque la situation demande une aide concrète.' },
    ],
    noteTitle: 'Soutien et lecture',
    note: 'Les publications sont lisibles sans compte. Les interactions et demandes de collecte demandent un profil pour garder un cadre fiable.',
    primaryLabel: 'Lire sur la santé',
    primaryRoute: '/feed?category=sante',
    secondaryLabel: 'Voir les collectes',
    secondaryRoute: '/collectes',
    icon: <Heart className="w-5 h-5" />,
    accent: 'bg-teal-600',
  },
  formats: {
    eyebrow: 'Formats',
    title: 'Choisir la forme qui respecte le mieux ton histoire',
    intro: 'Un parcours peut se lire, s’écouter ou se regarder. Le bon format est celui qui te permet d’être clair, vrai et à l’aise.',
    details: [
      { title: 'Article', text: 'Pour développer une histoire, poser un contexte et transmettre une leçon avec précision.' },
      { title: 'Audio', text: 'Pour parler plus naturellement quand la voix porte mieux l’émotion que le texte.' },
      { title: 'Vidéo', text: 'Pour montrer une réalité, un projet, un lieu ou un moment qui demande à être vu.' },
    ],
    noteTitle: 'Compte requis',
    note: 'La création de contenu demande un compte afin que tu puisses modifier, suivre et assumer ton espace de publication.',
    primaryLabel: 'Créer une publication',
    primaryRoute: '/new',
    secondaryLabel: 'Explorer les histoires',
    secondaryRoute: '/feed',
    icon: <BookOpen className="w-5 h-5" />,
    accent: 'bg-violet-600',
  },
  'a-propos': {
    eyebrow: 'A propos',
    title: 'JaarJaar, un espace pour raconter ce qui construit vraiment une personne',
    intro: 'JaarJaar veut donner une place aux parcours réels: ceux qui avancent vite, ceux qui recommencent, ceux qui doutent, ceux qui traversent une maladie, une épreuve, une reconversion ou une prise de conscience.',
    details: [
      { title: 'Une plateforme de récits', text: 'On y publie des histoires, articles, audios, vidéos et confessions pour transmettre une expérience utile.' },
      { title: 'Une communauté responsable', text: 'Lire est ouvert. Participer demande un compte pour garder un cadre sérieux et protéger les interactions.' },
      { title: 'Un volet solidaire', text: 'Les collectes donnent de la visibilité à des urgences et projets vérifiés avant publication.' },
    ],
    sections: [
      { title: 'Pourquoi JaarJaar existe', text: 'Beaucoup de personnes vivent des choses fortes sans avoir d’espace juste pour les raconter. JaarJaar part d’une idée simple: une histoire sincère peut devenir une aide pour quelqu’un d’autre. Elle peut donner du courage, éviter à une personne de se sentir seule, ou lui permettre de comprendre une situation qu’elle traverse.' },
      { title: 'Ce que la plateforme accueille', text: 'JaarJaar accueille les parcours de vie, les confessions anonymes, les témoignages de santé, les histoires de motivation, les projets, les reprises après l’échec et les récits de transformation. Le but n’est pas de montrer une vie parfaite, mais de partager ce qui a été appris sur le chemin.' },
      { title: 'Notre exigence', text: 'La plateforme cherche un équilibre entre liberté de parole et responsabilité. Les contenus anonymes sont possibles, mais le respect, la dignité des personnes et la sécurité de la communauté restent essentiels. Les collectes passent par une validation afin de protéger la confiance.' },
    ],
    noteTitle: 'Esprit de JaarJaar',
    note: 'Lire, comprendre, raconter, soutenir. La plateforme met l’humain avant la performance.',
    primaryLabel: 'Explorer les histoires',
    primaryRoute: '/feed',
    secondaryLabel: 'Créer un compte',
    secondaryRoute: '/register',
    icon: <Info className="w-5 h-5" />,
    accent: 'bg-blue-700',
  },
  guide: {
    eyebrow: 'Guide d’utilisation',
    title: 'Comprendre JaarJaar pas à pas, de la lecture à la publication',
    intro: 'Ce guide explique précisément comment utiliser la plateforme: lire, créer un compte, publier, commenter, sauvegarder, demander une collecte et gérer ton espace.',
    details: [
      { title: 'Lire sans compte', text: 'Tu peux parcourir les publications, les thèmes et les formats sans inscription.' },
      { title: 'Compte pour participer', text: 'Le compte est nécessaire pour publier, commenter, aimer, sauvegarder ou demander une collecte.' },
      { title: 'Actions claires', text: 'Chaque espace indique ce que tu peux faire et ce qui demande une connexion.' },
    ],
    sections: [
      { title: '1. Explorer les histoires', text: 'Va dans Explorer pour lire les publications. Tu peux filtrer par thématique, par format, ou ouvrir une publication pour lire le détail. La lecture reste accessible sans compte afin de ne pas bloquer les visiteurs.' },
      { title: '2. Créer un compte', text: 'L’inscription demande un nom, un pseudo, un email, un mot de passe et l’acceptation des CGU. Le pseudo sert à identifier ton profil public lorsque tu publies sans anonymat.' },
      { title: '3. Publier une histoire', text: 'Depuis Écrire, choisis le type de publication: article, vidéo, audio ou confession. Ajoute un titre, ton texte, un extrait si besoin, une image de couverture par lien ou upload local, puis choisis la thématique. Tu peux publier directement ou enregistrer en brouillon.' },
      { title: '4. Publier anonymement', text: 'Tu peux activer l’anonymat sur une publication. Les confessions sont anonymes par défaut. Le profil auteur n’est pas exposé publiquement sur ces contenus.' },
      { title: '5. Interagir avec les contenus', text: 'Pour aimer, commenter, répondre ou sauvegarder une histoire en favori, il faut être connecté. Cela permet de limiter les abus et de garder des interactions plus responsables.' },
      { title: '6. Gérer tes histoires', text: 'Dans ton profil, la section Mes histoires affiche tes publications par page de 5. Tu peux modifier ou supprimer tes contenus. Les brouillons restent visibles dans ton espace.' },
      { title: '7. Utiliser les collectes', text: 'Tu peux consulter les collectes validées. Pour demander de l’aide, crée une demande avec le contexte, les documents justificatifs et le montant cible. La demande est examinée avant publication.' },
      { title: '8. Notifications et favoris', text: 'Les notifications t’informent des interactions importantes. Les favoris te permettent de garder les histoires que tu veux relire plus tard.' },
    ],
    noteTitle: 'Principe important',
    note: 'JaarJaar laisse lire librement. Le compte intervient seulement quand l’utilisateur veut agir ou contribuer.',
    primaryLabel: 'Commencer à explorer',
    primaryRoute: '/feed',
    secondaryLabel: 'Créer mon compte',
    secondaryRoute: '/register',
    icon: <HelpCircle className="w-5 h-5" />,
    accent: 'bg-emerald-700',
  },
  cgu: {
    eyebrow: 'CGU',
    title: 'Conditions générales d’utilisation de JaarJaar',
    intro: 'Ces conditions expliquent les règles d’utilisation de la plateforme, les responsabilités des utilisateurs et le cadre appliqué aux contenus, interactions et collectes.',
    details: [
      { title: 'Respect', text: 'Les contenus haineux, humiliants, menaçants, frauduleux ou portant atteinte à autrui ne sont pas acceptés.' },
      { title: 'Responsabilité', text: 'Chaque utilisateur reste responsable des contenus, documents et informations qu’il publie.' },
      { title: 'Modération', text: 'JaarJaar peut retirer un contenu, suspendre un compte ou refuser une collecte en cas de risque ou d’abus.' },
    ],
    sections: [
      { title: '1. Acceptation des conditions', text: 'En créant un compte ou en utilisant les fonctionnalités participatives de JaarJaar, l’utilisateur accepte les présentes conditions. La lecture des contenus publics peut rester ouverte, mais la participation demande le respect de ces règles.' },
      { title: '2. Compte utilisateur', text: 'L’utilisateur s’engage à fournir des informations exactes, à protéger son mot de passe et à ne pas utiliser le compte d’une autre personne. JaarJaar peut suspendre un compte en cas d’usage abusif.' },
      { title: '3. Publications et commentaires', text: 'L’utilisateur est responsable des histoires, commentaires, audios, vidéos, images et documents qu’il publie. Les contenus diffamatoires, violents, discriminatoires, harcelants, pornographiques, frauduleux ou contraires à la loi peuvent être retirés.' },
      { title: '4. Anonymat', text: 'L’anonymat permet de protéger l’identité publique d’un auteur, mais il ne doit pas servir à nuire, mentir, harceler ou contourner les règles. JaarJaar peut modérer un contenu anonyme comme tout autre contenu.' },
      { title: '5. Collectes solidaires', text: 'Les demandes de collecte doivent être sincères, documentées et conformes à leur objet. L’utilisateur qui demande de l’aide doit fournir des informations utiles et authentiques. JaarJaar peut refuser, suspendre ou retirer une collecte si elle paraît incomplète, trompeuse ou abusive.' },
      { title: '6. Médias et documents', text: 'Les images, audios, vidéos et documents envoyés doivent appartenir à l’utilisateur ou être utilisés avec autorisation. L’utilisateur ne doit pas publier de données sensibles d’une autre personne sans consentement.' },
      { title: '7. Modération et administration', text: 'Les administrateurs peuvent examiner les contenus, collectes et comptes lorsque cela est nécessaire au bon fonctionnement de la plateforme. Des actions de modération peuvent être appliquées sans préavis en cas d’urgence ou de risque.' },
      { title: '8. Disponibilité du service', text: 'JaarJaar fait de son mieux pour maintenir l’accès à la plateforme, mais ne garantit pas une disponibilité permanente. Des interruptions peuvent arriver pour maintenance, incident technique ou problème de service externe.' },
      { title: '9. Évolution des conditions', text: 'Ces conditions peuvent évoluer pour accompagner la plateforme. Les utilisateurs seront invités à consulter la version disponible sur cette page.' },
    ],
    noteTitle: 'Acceptation',
    note: 'L’inscription exige l’acceptation des CGU afin que chaque membre rejoigne la communauté avec les mêmes règles de base.',
    primaryLabel: 'Créer un compte',
    primaryRoute: '/register',
    secondaryLabel: 'Retour à l’accueil',
    secondaryRoute: '/',
    icon: <FileText className="w-5 h-5" />,
    accent: 'bg-stone-900',
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
          Retour à l’accueil
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

              {page.sections && (
                <div className="mt-10 space-y-5">
                  {page.sections.map((section) => (
                    <section key={section.title} className="border-t border-stone-100 pt-5">
                      <h2 className="text-lg font-bold text-stone-900 mb-2">{section.title}</h2>
                      <p className="text-sm sm:text-base text-stone-500 leading-relaxed">{section.text}</p>
                    </section>
                  ))}
                </div>
              )}

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
