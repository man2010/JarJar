import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/server/mongodb';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const db = await getDb();
  const media = await db.collection('media_blobs').findOne({ id: params.id });
  if (!media) return NextResponse.json({ error: 'Media introuvable' }, { status: 404 });

  return new NextResponse(media.data.buffer, {
    headers: {
      'Content-Type': media.content_type || 'application/octet-stream',
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
}
