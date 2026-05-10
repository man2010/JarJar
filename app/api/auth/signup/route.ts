import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createSessionCookie, adminEmails } from '@/server/auth';
import { getDb } from '@/server/mongodb';

export async function POST(request: Request) {
  const { email, password, username, fullName } = await request.json();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanUsername = String(username || '').trim().toLowerCase();

  if (!cleanEmail || !password || cleanUsername.length < 3) {
    return NextResponse.json({ error: 'Email, mot de passe et pseudo sont requis' }, { status: 400 });
  }

  const db = await getDb();
  const exists = await db.collection('users').findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] });
  if (exists) return NextResponse.json({ error: 'Cet email ou pseudo existe deja' }, { status: 409 });

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const role = adminEmails().includes(cleanEmail) ? 'admin' : 'user';
  const passwordHash = await bcrypt.hash(String(password), 12);

  await db.collection('users').insertOne({ id, email: cleanEmail, username: cleanUsername, password_hash: passwordHash, role, status: 'active', created_at: now });
  await db.collection('profiles').insertOne({
    id,
    username: cleanUsername,
    full_name: String(fullName || '').trim(),
    bio: '',
    avatar_url: '',
    role,
    status: 'active',
    created_at: now,
    updated_at: now,
  });

  const response = NextResponse.json({ data: { user: { id, email: cleanEmail } } });
  await createSessionCookie(response, { id, email: cleanEmail, role });
  return response;
}
