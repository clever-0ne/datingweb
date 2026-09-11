import { NextResponse } from 'next/server';
import { pushPublicKey } from '@/lib/push';

// Resolved per request: a prerendered copy would bake in whatever the key was
// at build time — usually nothing.
export const dynamic = 'force-dynamic';

// GET /api/push/config — the VAPID public key the browser needs to subscribe.
// Served over the API rather than read from a NEXT_PUBLIC_ env var so the key
// is resolved at runtime: a build made without it still works once it is set.
export async function GET() {
  return NextResponse.json({ key: pushPublicKey() });
}
