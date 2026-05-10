import { NextResponse, type NextRequest } from 'next/server';
import { getSessionUser, isAdmin } from '@/server/auth';
import { getDb } from '@/server/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getSessionUser(request);
  if (!isAdmin(admin)) return NextResponse.json({ error: 'Action admin requise' }, { status: 403 });

  const db = await getDb();
  const [user, profile, postsCount, commentsCount, collectesCount, donationsCount] = await Promise.all([
    db.collection('users').findOne({ id: params.id }, { projection: { _id: 0, password_hash: 0 } }),
    db.collection('profiles').findOne({ id: params.id }, { projection: { _id: 0 } }),
    db.collection('posts').countDocuments({ author_id: params.id }),
    db.collection('comments').countDocuments({ author_id: params.id }),
    db.collection('collectes').countDocuments({ requester_id: params.id }),
    db.collection('collecte_dons').countDocuments({ user_id: params.id }),
  ]);

  if (!user && !profile) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  return NextResponse.json({
    data: {
      user,
      profile,
      stats: { posts_count: postsCount, comments_count: commentsCount, collectes_count: collectesCount, donations_count: donationsCount },
    },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getSessionUser(request);
  if (!isAdmin(admin)) return NextResponse.json({ error: 'Action admin requise' }, { status: 403 });
  if (admin?.id === params.id) return NextResponse.json({ error: 'Tu ne peux pas suspendre ton propre compte' }, { status: 400 });

  const body = await request.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status === 'active' || body.status === 'suspended') update.status = body.status;
  if (body.role === 'user' || body.role === 'admin') update.role = body.role;
  if (Object.keys(update).length === 1) return NextResponse.json({ error: 'Aucune modification valide' }, { status: 400 });

  const db = await getDb();
  await Promise.all([
    db.collection('users').updateOne({ id: params.id }, { $set: update }),
    db.collection('profiles').updateOne({ id: params.id }, { $set: update }),
  ]);

  return NextResponse.json({ data: true });
}
