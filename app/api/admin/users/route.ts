import { NextResponse, type NextRequest } from 'next/server';
import { getSessionUser, isAdmin } from '@/server/auth';
import { getDb } from '@/server/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await getSessionUser(request);
  if (!isAdmin(admin)) return NextResponse.json({ error: 'Action admin requise' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const status = searchParams.get('status') || 'all';
  const page = clampNumber(Number(searchParams.get('page') || 1), 1, 10000);
  const pageSize = clampNumber(Number(searchParams.get('pageSize') || 5), 5, 50);

  const query: Record<string, any> = {};
  if (start && end && !Number.isNaN(Date.parse(start)) && !Number.isNaN(Date.parse(end))) {
    query.created_at = { $gte: start, $lt: end };
  }
  if (status === 'active') query.$or = [{ status: 'active' }, { status: null }, { status: { $exists: false } }];
  if (status === 'inactive') query.status = { $exists: true, $nin: ['active', null] };

  const db = await getDb();
  const skip = (page - 1) * pageSize;

  const [users, total] = await Promise.all([
    db.collection('users').find(query, { projection: { _id: 0, password_hash: 0 } }).sort({ created_at: -1 }).skip(skip).limit(pageSize).toArray(),
    db.collection('users').countDocuments(query),
  ]);

  const userIds = users.map((user) => user.id).filter(Boolean);
  const [profiles, postCounts] = await Promise.all([
    db.collection('profiles').find({ id: { $in: userIds } }, { projection: { _id: 0, id: 1, username: 1, full_name: 1, role: 1, status: 1 } }).toArray(),
    db.collection('posts').aggregate([
      { $match: { author_id: { $in: userIds } } },
      { $group: { _id: '$author_id', count: { $sum: 1 } } },
    ]).toArray(),
  ]);

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const postCountById = new Map(postCounts.map((item) => [item._id, item.count]));

  return NextResponse.json({
    data: {
      items: users.map((user) => {
        const profile = profileById.get(user.id);
        return {
          id: user.id,
          email: user.email,
          username: profile?.username || user.username || user.email,
          role: profile?.role || user.role || 'user',
          status: user.status || profile?.status || 'active',
          created_at: user.created_at,
          posts_count: Number(postCountById.get(user.id) || 0),
        };
      }),
      total,
      page,
      pageSize,
    },
  });
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}
