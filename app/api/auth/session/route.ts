import { NextResponse, type NextRequest } from 'next/server';
import { getSessionUser } from '@/server/auth';
import { getDb } from '@/server/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { data: { session: null } },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } },
      );
    }

    const db = await getDb();
    const profile = await db.collection('profiles').findOne({ id: user.id }, { projection: { _id: 0, password_hash: 0, email: 0 } });
    return NextResponse.json(
      {
        data: {
          session: {
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              status: user.status,
            },
          },
          profile,
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (error) {
    console.error('[api/auth/session] MongoDB unavailable:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { data: { session: null }, error: 'Base de donnees momentanement indisponible.' },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
