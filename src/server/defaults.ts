import type { Db } from 'mongodb';

const categories = [
  { name: 'Parcours de vie', slug: 'parcours-de-vie', icon: 'heart', subcategories: ['Enfance', 'Famille', 'Resilience', 'Reconstruction'] },
  { name: 'Carriere', slug: 'carriere', icon: 'briefcase', subcategories: ['Entrepreneuriat', 'Etudes', 'Reconversion', 'Leadership'] },
  { name: 'Sante', slug: 'sante', icon: 'activity', subcategories: ['Cancer', 'Guerison', 'Mental', 'Handicap'] },
  { name: 'Confessions', slug: 'confessions', icon: 'lock', subcategories: ['Secrets', 'Relations', 'Peurs', 'Pardon'] },
  { name: 'Motivation', slug: 'motivation', icon: 'flame', subcategories: ['Discipline', 'Confiance', 'Foi', 'Objectifs'] },
  { name: 'Spiritualite', slug: 'spiritualite', icon: 'book-open', subcategories: ['Foi', 'Patience', 'Gratitude', 'Sagesse'] },
];

export async function ensureDefaults(db: Db) {
  const count = await db.collection('categories').countDocuments();
  if (count > 0) return;

  await db.collection('categories').insertMany(
    categories.map((category) => ({
      id: crypto.randomUUID(),
      ...category,
      created_at: new Date().toISOString(),
    })),
  );
}
