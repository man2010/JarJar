import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createSessionCookie, adminEmails } from '@/server/auth';
import { getDb } from '@/server/mongodb';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const db = await getDb();
  const user = await db.collection('users').findOne({ email: cleanEmail });
  if (!user || !(await bcrypt.compare(String(password || ''), user.password_hash))) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
  }
  if (user.status === 'suspended' || user.status === 'blocked') {
    return NextResponse.json({ error: 'Compte suspendu. Contacte un administrateur.' }, { status: 403 });
  }

  const role = adminEmails().includes(cleanEmail) ? 'admin' : user.role || 'user';
  if (role !== user.role) {
    await db.collection('users').updateOne({ id: user.id }, { $set: { role } });
    await db.collection('profiles').updateOne({ id: user.id }, { $set: { role } });
  }

  const response = NextResponse.json({ data: { user: { id: user.id, email: user.email } } });
  await createSessionCookie(response, { id: user.id, email: user.email, role });
  return response;
}
