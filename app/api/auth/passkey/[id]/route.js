import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';

/**
 * Remove one of the signed-in account's passkeys.
 *
 * Owning the credential is checked, not assumed: the id arrives in the URL, so
 * without the `accountId` comparison below any signed-in user could delete any
 * other user's passkey by guessing an id — and credential ids travel in every
 * assertion the browser makes, so they are not secret.
 */
export async function DELETE(req, { params }) {
  const me = await currentUser(req);
  if (!me) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const id = decodeURIComponent(params.id);

  const db = await readDb();
  const before = (db.passkeys || []).length;
  db.passkeys = (db.passkeys || []).filter(
    (p) => !(p.id === id && p.accountId === me.account.id),
  );

  if (db.passkeys.length === before) {
    return NextResponse.json({ error: 'No such passkey on this account.' }, { status: 404 });
  }

  await writeDb(db);
  return NextResponse.json({ ok: true });
}
