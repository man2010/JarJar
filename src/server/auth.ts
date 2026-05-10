import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from './mongodb';

const cookieName = 'jarjar_session';
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'jarjar-dev-secret-change-me');

export type ServerUser = { id: string; email: string; role?: string; status?: string };

export function adminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function createSessionCookie(response: NextResponse, user: ServerUser) {
  const token = await new SignJWT({ email: user.email, role: user.role || 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(cookieName, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}

export async function getSessionUser(request?: NextRequest): Promise<ServerUser | null> {
  const token = request?.cookies.get(cookieName)?.value || cookies().get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || !payload.email) return null;
    const db = await getDb();
    const [profile, account] = await Promise.all([
      db.collection('profiles').findOne({ id: payload.sub }),
      db.collection('users').findOne({ id: payload.sub }),
    ]);
    return {
      id: payload.sub,
      email: String(payload.email),
      role: profile?.role || account?.role || String(payload.role || 'user'),
      status: account?.status || profile?.status || 'active',
    };
  } catch {
    return null;
  }
}

export function isAdmin(user: ServerUser | null) {
  return !!user && (user.role === 'admin' || adminEmails().includes(user.email.toLowerCase()));
}
