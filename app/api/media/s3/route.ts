import { NextResponse, type NextRequest } from 'next/server';
import { getS3Media, isS3Configured } from '@/server/s3';

export async function GET(request: NextRequest) {
  if (!isS3Configured()) return NextResponse.json({ error: 'S3 non configure' }, { status: 503 });

  const key = request.nextUrl.searchParams.get('key');
  if (!key || (!key.startsWith('media/') && !key.startsWith('documents/'))) return NextResponse.json({ error: 'Cle media invalide' }, { status: 400 });

  const object = await getS3Media(key);
  const bytes = await object.Body?.transformToByteArray();
  if (!bytes) return NextResponse.json({ error: 'Media introuvable' }, { status: 404 });

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': object.ContentType || 'application/octet-stream',
      'Cache-Control': 'private, max-age=86400',
    },
  });
}
