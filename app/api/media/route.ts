import { NextResponse, type NextRequest } from 'next/server';
import { getSessionUser } from '@/server/auth';
import { getDb } from '@/server/mongodb';
import { isS3Configured, uploadMediaToS3 } from '@/server/s3';

const allowedMedia = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/webm',
  'video/mp4',
  'video/ogg',
  'video/quicktime',
]);

const allowedDocuments = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const allowedAvatars = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file');
  const kind = form.get('kind') === 'audio' ? 'audio' : form.get('kind') === 'video' ? 'video' : form.get('kind') === 'document' ? 'document' : form.get('kind') === 'avatar' ? 'avatar' : null;
  if (!(file instanceof File)) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
  const contentType = normalizeContentType(file.type, file.name, kind);
  const allowed = kind === 'avatar' ? allowedAvatars : kind === 'document' ? allowedDocuments : allowedMedia;
  if (!allowed.has(contentType)) {
    return NextResponse.json({ error: `Format media non supporte: ${file.type || file.name}` }, { status: 400 });
  }

  const maxSize = kind === 'avatar' ? 2 * 1024 * 1024 : kind === 'document' ? 15 * 1024 * 1024 : contentType.startsWith('audio/') ? 35 * 1024 * 1024 : 120 * 1024 * 1024;
  if (file.size > maxSize) return NextResponse.json({ error: 'Fichier trop volumineux' }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const mediaId = crypto.randomUUID();

  if (isS3Configured()) {
    try {
      const uploaded = await uploadMediaToS3({
        buffer,
        contentType,
        filename: file.name,
        ownerId: user.id,
      });
      const db = await getDb();
      await db.collection('media_assets').insertOne({
        id: crypto.randomUUID(),
        owner_id: user.id,
        storage: 's3',
        key: uploaded.key,
        url: uploaded.url,
        original_name: file.name,
        content_type: contentType,
        size: file.size,
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ data: { url: uploaded.url, id: uploaded.key, storage: 's3', name: file.name, content_type: contentType } });
    } catch (error) {
      console.error('S3 upload failed, falling back to MongoDB media storage:', error);
    }
  }

  const db = await getDb();

  await db.collection('media_blobs').insertOne({
    id: mediaId,
    owner_id: user.id,
    original_name: file.name,
    content_type: contentType,
    size: file.size,
    data: buffer,
    created_at: new Date().toISOString(),
  });
  await db.collection('media_assets').insertOne({
    id: crypto.randomUUID(),
    owner_id: user.id,
    storage: 'mongodb',
    key: mediaId,
    url: `/api/media/${mediaId}`,
    original_name: file.name,
    content_type: contentType,
    size: file.size,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ data: { url: `/api/media/${mediaId}`, id: mediaId, storage: 'mongodb', name: file.name, content_type: contentType } });
}

function normalizeContentType(type: string, filename: string, kind: 'audio' | 'video' | 'document' | 'avatar' | null) {
  const clean = type.split(';')[0].trim().toLowerCase();
  if (clean) return clean;

  const extension = filename.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
  if (extension === '.webm') return `${kind || 'video'}/webm`;
  if (extension === '.mp4') return 'video/mp4';
  if (extension === '.mov') return 'video/quicktime';
  if (extension === '.ogg' || extension === '.oga') return 'audio/ogg';
  if (extension === '.mp3') return 'audio/mpeg';
  if (extension === '.wav') return 'audio/wav';
  if (extension === '.pdf') return 'application/pdf';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.doc') return 'application/msword';
  if (extension === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
}
