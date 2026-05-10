import { NextResponse, type NextRequest } from 'next/server';
import { getSessionUser, isAdmin } from '@/server/auth';
import { getDb } from '@/server/mongodb';
import { isS3Configured } from '@/server/s3';

type AnyDoc = Record<string, any>;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!isAdmin(user)) return NextResponse.json({ error: 'Action admin requise' }, { status: 403 });

  const db = await getDb();
  const [
    users,
    profiles,
    posts,
    likes,
    bookmarks,
    comments,
    collectes,
    dons,
    collecteComments,
    mediaAssets,
    mediaBlobsCount,
  ] = await Promise.all([
    db.collection('users').find({}, { projection: { _id: 0, password_hash: 0 } }).toArray(),
    db.collection('profiles').find({}, { projection: { _id: 0 } }).toArray(),
    db.collection('posts').find({}, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray(),
    db.collection('likes').find({}, { projection: { _id: 0 } }).toArray(),
    db.collection('bookmarks').find({}, { projection: { _id: 0 } }).toArray(),
    db.collection('comments').find({}, { projection: { _id: 0 } }).toArray(),
    db.collection('collectes').find({}, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray(),
    db.collection('collecte_dons').find({}, { projection: { _id: 0 } }).toArray(),
    db.collection('collecte_comments').find({}, { projection: { _id: 0 } }).toArray(),
    db.collection('media_assets').find({}, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray(),
    db.collection('media_blobs').countDocuments(),
  ]);

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const postMetrics = posts.map((post) => {
    const postLikes = likes.filter((like) => like.post_id === post.id).length;
    const postComments = comments.filter((comment) => comment.post_id === post.id).length;
    return {
      ...safePost(post, profileById),
      likes_count: postLikes,
      comments_count: postComments,
      engagement_score: Number(post.views_count || 0) + postLikes * 3 + postComments * 5,
    };
  });

  const mediaSize = mediaAssets.reduce((sum, item) => sum + Number(item.size || 0), 0);
  const totalDonationAmount = dons.reduce((sum, don) => sum + Number(don.amount || 0), 0);
  const totalTargetAmount = collectes.reduce((sum, collecte) => sum + Number(collecte.target_amount || 0), 0);
  const currentCollectedAmount = collectes.reduce((sum, collecte) => sum + Number(collecte.current_amount || 0), 0);
  const anonymousPosts = posts.filter((post) => post.is_anonymous).length;
  const anonymousComments = comments.filter((comment) => comment.is_anonymous).length + collecteComments.filter((comment) => comment.is_anonymous).length;
  const publishedPosts = posts.filter((post) => post.published).length;
  const draftPosts = posts.length - publishedPosts;
  const pendingCollectes = collectes.filter((collecte) => collecte.status === 'pending').length;

  const report = {
    generated_at: new Date().toISOString(),
    overview: {
      users: users.length,
      admins: profiles.filter((profile) => profile.role === 'admin').length,
      posts: posts.length,
      published_posts: publishedPosts,
      draft_posts: draftPosts,
      views: posts.reduce((sum, post) => sum + Number(post.views_count || 0), 0),
      likes: likes.length,
      bookmarks: bookmarks.length,
      comments: comments.length + collecteComments.length,
      collectes: collectes.length,
      pending_collectes: pendingCollectes,
      media_assets: mediaAssets.length || mediaBlobsCount,
    },
    content: {
      by_type: countBy(posts, 'post_type'),
      by_publication: { published: publishedPosts, drafts: draftPosts },
      anonymous_posts: anonymousPosts,
      media_posts: posts.filter((post) => post.audio_url || post.video_url).length,
      top_posts: postMetrics.sort((a, b) => b.engagement_score - a.engagement_score).slice(0, 8),
      recent_posts: postMetrics.slice(0, 10),
    },
    users: {
      recent: users
        .sort((a, b) => dateValue(b.created_at) - dateValue(a.created_at))
        .slice(0, 10)
        .map((item) => ({
          id: item.id,
          email: item.email,
          username: item.username,
          role: item.role,
          status: item.status || 'active',
          created_at: item.created_at,
          posts_count: posts.filter((post) => post.author_id === item.id).length,
        })),
      most_active: profiles
        .map((profile) => ({
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          role: profile.role,
          status: profile.status || 'active',
          posts_count: posts.filter((post) => post.author_id === profile.id).length,
          comments_count: comments.filter((comment) => comment.author_id === profile.id).length,
          donations_count: dons.filter((don) => don.user_id === profile.id).length,
        }))
        .sort((a, b) => (b.posts_count + b.comments_count + b.donations_count) - (a.posts_count + a.comments_count + a.donations_count))
        .slice(0, 10),
    },
    collectes: {
      by_status: countBy(collectes, 'status'),
      by_type: countBy(collectes, 'collecte_type'),
      total_target_amount: totalTargetAmount,
      current_collected_amount: currentCollectedAmount,
      total_donation_amount: totalDonationAmount,
      donations_count: dons.length,
      recent: collectes.slice(0, 10).map((collecte) => ({
        ...collecte,
        profiles: safeProfile(profileById.get(collecte.requester_id)),
      })),
    },
    moderation: {
      pending_collectes: pendingCollectes,
      draft_posts: draftPosts,
      rejected_collectes: collectes.filter((collecte) => collecte.status === 'rejected').length,
      anonymous_posts: anonymousPosts,
      anonymous_comments: anonymousComments,
      recent_comments: comments
        .sort((a, b) => dateValue(b.created_at) - dateValue(a.created_at))
        .slice(0, 10)
        .map((comment) => ({
          ...comment,
          profiles: comment.is_anonymous ? null : safeProfile(profileById.get(comment.author_id)),
        })),
    },
    media: {
      s3_configured: isS3Configured(),
      total_assets: mediaAssets.length || mediaBlobsCount,
      total_size: mediaSize,
      by_storage: countBy(mediaAssets, 'storage'),
      by_type: countMediaTypes(mediaAssets),
      recent: mediaAssets.slice(0, 10),
    },
    activity: activitySeries({ users, posts, comments, collectes, mediaAssets }),
    alerts: buildAlerts({ pendingCollectes, draftPosts, mediaAssets, mediaBlobsCount, s3Configured: isS3Configured() }),
  };

  return NextResponse.json(
    { data: report },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
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

function safePost(post: AnyDoc, profileById: Map<string, AnyDoc>) {
  return {
    id: post.id,
    title: post.title,
    post_type: post.post_type,
    published: !!post.published,
    is_anonymous: !!post.is_anonymous,
    views_count: Number(post.views_count || 0),
    created_at: post.created_at,
    has_audio: Boolean(post.audio_url),
    has_video: Boolean(post.video_url),
    profiles: post.is_anonymous ? null : safeProfile(profileById.get(post.author_id)),
  };
}

function countBy(items: AnyDoc[], key: string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key] || 'unknown');
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function countMediaTypes(items: AnyDoc[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const kind = String(item.content_type || '').startsWith('audio/') ? 'audio' : String(item.content_type || '').startsWith('video/') ? 'video' : 'autre';
    acc[kind] = (acc[kind] || 0) + 1;
    return acc;
  }, {});
}

function activitySeries(data: { users: AnyDoc[]; posts: AnyDoc[]; comments: AnyDoc[]; collectes: AnyDoc[]; mediaAssets: AnyDoc[] }) {
  return Array.from({ length: 14 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      users: data.users.filter((item) => isSameDay(item.created_at, key)).length,
      posts: data.posts.filter((item) => isSameDay(item.created_at, key)).length,
      comments: data.comments.filter((item) => isSameDay(item.created_at, key)).length,
      collectes: data.collectes.filter((item) => isSameDay(item.created_at, key)).length,
      media: data.mediaAssets.filter((item) => isSameDay(item.created_at, key)).length,
    };
  });
}

function buildAlerts(params: { pendingCollectes: number; draftPosts: number; mediaAssets: AnyDoc[]; mediaBlobsCount: number; s3Configured: boolean }) {
  const alerts = [];
  if (params.pendingCollectes > 0) alerts.push({ level: 'high', label: `${params.pendingCollectes} collecte(s) en attente de validation` });
  if (params.draftPosts > 0) alerts.push({ level: 'medium', label: `${params.draftPosts} contenu(s) en brouillon` });
  if (!params.s3Configured) alerts.push({ level: 'medium', label: 'S3 non configure, stockage media local MongoDB actif' });
  if (params.s3Configured && params.mediaAssets.some((item) => item.storage === 'mongodb')) alerts.push({ level: 'medium', label: 'Des medias utilisent encore le fallback MongoDB' });
  if (params.mediaBlobsCount > 0 && params.mediaAssets.length === 0) alerts.push({ level: 'low', label: 'Anciens medias MongoDB detectes sans index media_assets' });
  return alerts;
}

function isSameDay(value: string | undefined, day: string) {
  return typeof value === 'string' && value.slice(0, 10) === day;
}

function dateValue(value: string | undefined) {
  return value ? new Date(value).getTime() : 0;
}
