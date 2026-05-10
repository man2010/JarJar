import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/server/auth';

export async function POST() {
  const response = NextResponse.json({ data: true });
  clearSessionCookie(response);
  return response;
}
