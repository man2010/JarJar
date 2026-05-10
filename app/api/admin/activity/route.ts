import { NextResponse, type NextRequest } from 'next/server';
import { getSessionUser, isAdmin } from '@/server/auth';
import { getDb } from '@/server/mongodb';

type AnyDoc = Record<string, any>;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!isAdmin(user)) return NextResponse.json({ error: 'Action admin requise' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') === 'comments' ? 'comments' : 'posts';
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const page = clampNumber(Number(searchParams.get('page') || 1), 1, 10000);
  const pageSize = clampNumber(Number(searchParams.get('pageSize') || 10), 5, 50);

  if (!start || !end || Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) {
    return NextResponse.json({ error: 'Plage de date invalide' }, { status: 400 });
  }

  const db = await getDb();
  const query = { created_at: { $gte: start, $lt: end } };
  const collection = db.collection(type);
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    collection.find(query, { projection: { _id: 0 } }).sort({ created_at: -1 }).skip(skip).limit(pageSize).toArray(),
    collection.countDocuments(query),
  ]);

  const profiles = await db.collection('profiles').find(
    { id: { $in: Array.from(new Set(items.map((item) => item.author_id).filter(Boolean))) } },
    { projection: { _id: 0, id: 1, username: 1, full_name: 1, role: 1 } },
  ).toArray();
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  if (type === 'posts') {
    const postIds = items.map((post) => post.id);
    const [likes, comments] = await Promise.all([
      db.collection('likes').aggregate([{ $match: { post_id: { $in: postIds } } }, { $group: { _id: '$post_id', count: { $sum: 1 } } }]).toArray(),
      db.collection('comments').aggregate([{ $match: { post_id: { $in: postIds } } }, { $group: { _id: '$post_id', count: { $sum: 1 } } }]).toArray(),
    ]);
    const likesByPost = new Map(likes.map((item) => [item._id, item.count]));
    const commentsByPost = new Map(comments.map((item) => [item._id, item.count]));

    return NextResponse.json({
      data: {
        items: items.map((post) => safePost(post, profileById, Number(likesByPost.get(post.id) || 0), Number(commentsByPost.get(post.id) || 0))),
        total,
        page,
        pageSize,
      },
    });
  }

  const postIds = Array.from(new Set(items.map((comment) => comment.post_id).filter(Boolean)));
  const posts = await db.collection('posts').find(
    { id: { $in: postIds } },
    { projection: { _id: 0, id: 1, title: 1 } },
  ).toArray();
  const postById = new Map(posts.map((post) => [post.id, post]));

  return NextResponse.json({
    data: {
      items: items.map((comment) => safeComment(comment, profileById, postById)),
      total,
      page,
      pageSize,
    },
  });
}

function safeProfile(profile?: AnyDoc) {
  if (!profile) return null;
  return {
    id: profile.id,
    username: profile.username,
    full_name: profile.full_name,
    role: profile.role,
  };
}

function safePost(post: AnyDoc, profileById: Map<string, AnyDoc>, likesCount: number, commentsCount: number) {
  return {
    id: post.id,
    title: post.title,
    post_type: post.post_type,
    published: !!post.published,
    is_anonymous: !!post.is_anonymous,
    views_count: Number(post.views_count || 0),
    likes_count: likesCount,
    comments_count: commentsCount,
    engagement_score: Number(post.views_count || 0) + likesCount * 3 + commentsCount * 5,
    created_at: post.created_at,
    has_audio: Boolean(post.audio_url),
    has_video: Boolean(post.video_url),
    profiles: post.is_anonymous ? null : safeProfile(profileById.get(post.author_id)),
  };
}

function safeComment(comment: AnyDoc, profileById: Map<string, AnyDoc>, postById: Map<string, AnyDoc>) {
  return {
    id: comment.id,
    content: comment.content,
    is_anonymous: !!comment.is_anonymous,
    created_at: comment.created_at,
    post_id: comment.post_id,
    post_title: postById.get(comment.post_id)?.title || 'Publication inconnue',
    profiles: comment.is_anonymous ? null : safeProfile(profileById.get(comment.author_id)),
  };
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}
