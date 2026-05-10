import { NextResponse, type NextRequest } from 'next/server';
import { getSessionUser, isAdmin } from '@/server/auth';
import { ensureDefaults } from '@/server/defaults';
import { getDb } from '@/server/mongodb';

type Filter = { column: string; value: unknown };
type DataRequest = {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  filters?: Filter[];
  order?: { column: string; ascending?: boolean } | null;
  limit?: number | null;
  offset?: number | null;
  payload?: unknown;
  single?: boolean;
  count?: 'exact' | null;
  head?: boolean;
};

const tables = new Set([
  'profiles',
  'categories',
  'posts',
  'likes',
  'comment_likes',
  'bookmarks',
  'comments',
  'notifications',
  'collectes',
  'collecte_dons',
  'collecte_comments',
]);

function now() {
  return new Date().toISOString();
}

function cleanDoc<T extends Record<string, unknown>>(doc: T | null) {
  if (!doc) return null;
  const { _id, password_hash, email, ...rest } = doc;
  void _id;
  void password_hash;
  void email;
  return rest;
}

function queryFromFilters(filters: Filter[] = []) {
  return Object.fromEntries(filters.map((filter) => [filter.column, filter.value]));
}

function sanitizeAnonymousPost(post: any, adminView = false) {
  const safe = cleanDoc(post) as any;
  if (!safe) return safe;
  if (safe.is_anonymous) {
    safe.profiles = null;
    if (!adminView) delete safe.author_id;
  }
  return safe;
}

async function attachPostRelations(db: any, posts: any[], adminView = false) {
  const categories = await db.collection('categories').find({}, { projection: { _id: 0 } }).toArray();
  const categoryById = new Map(categories.map((category: any) => [category.id, category]));

  return Promise.all(posts.map(async (post) => {
    const safe = sanitizeAnonymousPost(post, adminView);
    safe.categories = post.category_id ? categoryById.get(post.category_id) || null : null;
    safe.likes = [{ count: await db.collection('likes').countDocuments({ post_id: post.id }) }];
    safe.comments = [{ count: await db.collection('comments').countDocuments({ post_id: post.id }) }];

    if (!post.is_anonymous && post.author_id) {
      safe.profiles = cleanDoc(await db.collection('profiles').findOne({ id: post.author_id }));
    }

    return safe;
  }));
}

async function attachCollecteRelations(db: any, collectes: any[]) {
  return Promise.all(collectes.map(async (collecte) => ({
    ...cleanDoc(collecte),
    profiles: cleanDoc(await db.collection('profiles').findOne({ id: collecte.requester_id })),
  })));
}

async function attachCommentRelations(db: any, comments: any[], currentUserId?: string, adminView = false) {
  return Promise.all(comments.map(async (comment) => {
    const safe = cleanDoc(comment) as any;
    safe.comment_likes = [{ count: await db.collection('comment_likes').countDocuments({ comment_id: comment.id }) }];
    safe.liked_by_me = currentUserId ? Boolean(await db.collection('comment_likes').findOne({ comment_id: comment.id, user_id: currentUserId })) : false;
    if (comment.is_anonymous) {
      safe.profiles = null;
      if (!adminView && currentUserId !== comment.author_id) delete safe.author_id;
      return safe;
    }
    safe.profiles = cleanDoc(await db.collection('profiles').findOne({ id: comment.author_id }));
    return safe;
  }));
}

async function selectRows(db: any, body: DataRequest, user: Awaited<ReturnType<typeof getSessionUser>>) {
  await ensureDefaults(db);
  const adminView = isAdmin(user);
  const query = queryFromFilters(body.filters);

  if (body.table === 'posts' && !adminView) {
    query.$or = [{ published: true }, ...(user ? [{ author_id: user.id }] : [])];
    if (query.author_id && query.author_id !== user?.id) query.is_anonymous = false;
  }

  if (body.table === 'collectes' && query.status !== 'approved' && !adminView) {
    if (!user) {
      query.status = 'approved';
    } else if (query.requester_id === user.id) {
      // The requester may see their pending/rejected requests in their private space.
    } else if (query.id) {
      const requestedCollecte = await db.collection('collectes').findOne({ id: query.id });
      if (requestedCollecte?.requester_id !== user.id) query.status = 'approved';
    } else {
      query.status = 'approved';
    }
  }

  if (body.table === 'notifications') {
    if (!user) return { data: body.single ? null : [], count: 0 };
    query.user_id = user.id;
  }

  if ((body.table === 'collecte_dons' || body.table === 'collecte_comments') && query.collecte_id && !adminView) {
    const relatedCollecte = await db.collection('collectes').findOne({ id: query.collecte_id });
    if (!relatedCollecte || (relatedCollecte.status !== 'approved' && relatedCollecte.requester_id !== user?.id)) {
      return { data: body.single ? null : [], count: 0 };
    }
  }

  let cursor = db.collection(body.table).find(query, { projection: { _id: 0, password_hash: 0, email: 0 } });
  if (body.order) cursor = cursor.sort({ [body.order.column]: body.order.ascending === false ? -1 : 1 });
  if (body.offset) cursor = cursor.skip(body.offset);
  if (body.limit) cursor = cursor.limit(body.limit);

  const count = body.count === 'exact' ? await db.collection(body.table).countDocuments(query) : null;
  if (body.head) return { data: [], count };

  let rows = await cursor.toArray();

  if (body.table === 'posts') rows = await attachPostRelations(db, rows, adminView);
  if (body.table === 'collectes') rows = await attachCollecteRelations(db, rows);
  if (body.table === 'comments' || body.table === 'collecte_comments') rows = await attachCommentRelations(db, rows, user?.id, adminView);
  if (body.table === 'collecte_dons') {
    rows = await Promise.all(rows.map(async (don: any) => ({
      ...cleanDoc(don),
      profiles: adminView ? cleanDoc(await db.collection('profiles').findOne({ id: don.user_id })) : null,
    })));
  }
  if (body.table === 'bookmarks') {
    rows = await Promise.all(rows.map(async (bookmark: any) => ({
      ...cleanDoc(bookmark),
      posts: cleanDoc(await db.collection('posts').findOne({ id: bookmark.post_id, $or: [{ published: true }, { author_id: user?.id }] })),
    })));
    rows = await Promise.all(rows.map(async (bookmark: any) => ({
      ...bookmark,
      posts: bookmark.posts ? (await attachPostRelations(db, [bookmark.posts], adminView))[0] : null,
    })));
  }
  if (body.table === 'notifications') {
    if (!user) return { data: body.single ? null : [], count: 0 };
    rows = rows.map(cleanDoc);
  }

  return { data: body.single ? rows[0] || null : rows, count };
}

async function createNotification(db: any, params: {
  userId?: string;
  actorId?: string;
  type: string;
  title: string;
  message: string;
  link: string;
  postId?: string;
  commentId?: string;
  collecteId?: string;
}) {
  if (!params.userId || params.userId === params.actorId) return;
  await db.collection('notifications').insertOne({
    id: crypto.randomUUID(),
    user_id: params.userId,
    actor_id: params.actorId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
    post_id: params.postId,
    comment_id: params.commentId,
    collecte_id: params.collecteId,
    read_at: null,
    created_at: now(),
    updated_at: now(),
  });
}

async function insertRows(db: any, body: DataRequest, user: Awaited<ReturnType<typeof getSessionUser>>) {
  if (!user) return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
  if (user.status === 'suspended' || user.status === 'blocked') return NextResponse.json({ error: 'Compte suspendu' }, { status: 403 });

  const list = Array.isArray(body.payload) ? body.payload as any[] : [body.payload as any];
  const documents = list.map((item) => ({ ...item, id: crypto.randomUUID(), created_at: now(), updated_at: now() }));

  if (body.table === 'notifications') {
    return NextResponse.json({ error: 'Creation de notification reservee au serveur' }, { status: 403 });
  }

  for (const doc of documents) {
    if (body.table === 'collecte_dons' || body.table === 'collecte_comments') {
      const collecte = await db.collection('collectes').findOne({ id: doc.collecte_id });
      if (!collecte || collecte.status !== 'approved') {
        return NextResponse.json({ error: 'Cette collecte n est pas encore ouverte au public' }, { status: 403 });
      }
    }
    if (body.table === 'posts') {
      doc.author_id = user.id;
      doc.views_count = 0;
      doc.is_anonymous = doc.post_type === 'confession' ? true : !!doc.is_anonymous;
    }
    if (body.table === 'comments' || body.table === 'collecte_comments') doc.author_id = user.id;
    if (body.table === 'likes' || body.table === 'comment_likes' || body.table === 'bookmarks') doc.user_id = user.id;
    if (body.table === 'collectes') {
      doc.requester_id = user.id;
      doc.status = 'pending';
      doc.current_amount = 0;
      doc.currency = 'XOF';
    }
    if (body.table === 'collecte_dons') doc.user_id = user.id;
  }

  if (body.table === 'likes' || body.table === 'comment_likes' || body.table === 'bookmarks') {
    const doc = documents[0];
    const unique = body.table === 'comment_likes'
      ? { comment_id: doc.comment_id, user_id: user.id }
      : { post_id: doc.post_id, user_id: user.id };
    const existing = await db.collection(body.table).findOne(unique);
    if (existing) return NextResponse.json({ data: cleanDoc(existing) });
  }

  await db.collection(body.table).insertMany(documents);

  if (body.table === 'likes') {
    const doc = documents[0];
    const post = await db.collection('posts').findOne({ id: doc.post_id });
    await createNotification(db, {
      userId: post?.author_id,
      actorId: user.id,
      type: 'post_like',
      title: 'Nouveau like',
      message: `Votre publication "${post?.title || 'Sans titre'}" a ete likee.`,
      link: `/post/${doc.post_id}`,
      postId: doc.post_id,
    });
  }

  if (body.table === 'comment_likes') {
    const doc = documents[0];
    const comment = await db.collection('comments').findOne({ id: doc.comment_id });
    if (comment) {
      await createNotification(db, {
        userId: comment.author_id,
        actorId: user.id,
        type: 'comment_like',
        title: 'Nouveau like sur un commentaire',
        message: 'Votre commentaire a ete like.',
        link: `/post/${comment.post_id}`,
        postId: comment.post_id,
        commentId: comment.id,
      });
    }
  }

  if (body.table === 'comments') {
    const doc = documents[0];
    const post = await db.collection('posts').findOne({ id: doc.post_id });
    const parent = doc.parent_id ? await db.collection('comments').findOne({ id: doc.parent_id }) : null;
    await createNotification(db, {
      userId: parent?.author_id || post?.author_id,
      actorId: user.id,
      type: parent ? 'comment_reply' : 'post_comment',
      title: parent ? 'Nouvelle reponse' : 'Nouveau commentaire',
      message: parent ? 'Votre commentaire a recu une reponse.' : `Votre publication "${post?.title || 'Sans titre'}" a ete commentee.`,
      link: `/post/${doc.post_id}`,
      postId: doc.post_id,
      commentId: doc.id,
    });
    if (parent && post?.author_id && post.author_id !== parent.author_id) {
      await createNotification(db, {
        userId: post.author_id,
        actorId: user.id,
        type: 'post_comment',
        title: 'Nouvelle reponse sur votre publication',
        message: `Une discussion avance sous "${post.title || 'Sans titre'}".`,
        link: `/post/${doc.post_id}`,
        postId: doc.post_id,
        commentId: doc.id,
      });
    }
  }

  if (body.table === 'collecte_dons') {
    const doc = documents[0];
    await db.collection('collectes').updateOne({ id: doc.collecte_id }, { $inc: { current_amount: Number(doc.amount || 0) } });
  }

  const data = body.single || documents.length === 1 ? cleanDoc(documents[0]) : documents.map(cleanDoc);
  return NextResponse.json({ data });
}

async function updateRows(db: any, body: DataRequest, user: Awaited<ReturnType<typeof getSessionUser>>) {
  if (!user) return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });

  const query = queryFromFilters(body.filters);
  const payload: Record<string, unknown> = { ...(body.payload as Record<string, unknown>), updated_at: now() };
  const adminView = isAdmin(user);

  if (body.table === 'profiles') {
    query.id = user.id;
    for (const key of Object.keys(payload)) {
      if (!['full_name', 'bio', 'avatar_url', 'updated_at'].includes(key)) delete payload[key];
    }
  }
  if (body.table === 'notifications') {
    query.user_id = user.id;
    for (const key of Object.keys(payload)) {
      if (key !== 'read_at' && key !== 'updated_at') delete payload[key];
    }
  }
  if (body.table === 'posts' && !adminView) query.author_id = user.id;
  if (body.table === 'collectes' && !adminView) query.requester_id = user.id;
  if (body.table === 'collectes' && (payload.status || payload.reviewed_by) && !adminView) {
    return NextResponse.json({ error: 'Action admin requise' }, { status: 403 });
  }

  await db.collection(body.table).updateMany(query, { $set: payload });
  if (body.table === 'collectes' && adminView && (payload.status === 'approved' || payload.status === 'rejected')) {
    const updatedCollectes = await db.collection('collectes').find(query, { projection: { _id: 0 } }).toArray();
    await Promise.all(updatedCollectes.map((collecte: any) => createNotification(db, {
      userId: collecte.requester_id,
      actorId: user.id,
      type: payload.status === 'approved' ? 'collecte_approved' : 'collecte_rejected',
      title: payload.status === 'approved' ? 'Collecte validee' : 'Collecte rejetee',
      message: `Votre demande "${collecte.title || 'Sans titre'}" a ete ${payload.status === 'approved' ? 'validee' : 'rejetee'}.`,
      link: `/collecte/${collecte.id}`,
      collecteId: collecte.id,
    })));
  }
  const updated = await db.collection(body.table).find(query, { projection: { _id: 0 } }).toArray();
  return NextResponse.json({ data: body.single ? updated[0] || null : updated });
}

async function deleteRows(db: any, body: DataRequest, user: Awaited<ReturnType<typeof getSessionUser>>) {
  if (!user) return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });

  const query = queryFromFilters(body.filters);
  const adminView = isAdmin(user);
  if (body.table === 'comments' || body.table === 'collecte_comments') {
    if (!adminView) query.author_id = user.id;
  } else if (body.table === 'bookmarks' || body.table === 'likes' || body.table === 'comment_likes') {
    query.user_id = user.id;
  } else if (body.table === 'notifications') {
    query.user_id = user.id;
  } else if (body.table === 'posts' && !adminView) {
    query.author_id = user.id;
  } else if (!adminView) {
    return NextResponse.json({ error: 'Action admin requise' }, { status: 403 });
  }

  await db.collection(body.table).deleteMany(query);
  return NextResponse.json({ data: true });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as DataRequest;
  if (!tables.has(body.table)) return NextResponse.json({ error: 'Table inconnue' }, { status: 400 });

  const db = await getDb();
  const user = await getSessionUser(request);

  if (body.operation === 'select') {
    const result = await selectRows(db, body, user);
    return NextResponse.json(result);
  }
  if (body.operation === 'insert') return insertRows(db, body, user);
  if (body.operation === 'update') return updateRows(db, body, user);
  if (body.operation === 'delete') return deleteRows(db, body, user);

  return NextResponse.json({ error: 'Operation inconnue' }, { status: 400 });
}
