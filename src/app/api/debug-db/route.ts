import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const url = process.env.DATABASE_URL ?? 'NOT SET';
  const maskedUrl = url.length > 20 ? url.slice(0, 30) + '...' : url;
  const models = Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'));
  return NextResponse.json({ maskedUrl, models });
}
