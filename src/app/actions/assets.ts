'use server'

import { db } from '@/db'
import { asset } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getAssets() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const assets = await db
    .select()
    .from(asset)
    .where(eq(asset.userId, session.user.id));

  return assets;
}

export async function createAsset(data: {
  name: string;
  type: string;
  quantity: string;
  averagePrice: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const id = crypto.randomUUID();

  await db.insert(asset).values({
    id,
    userId: session.user.id,
    name: data.name,
    type: data.type,
    quantity: data.quantity,
    averagePrice: data.averagePrice,
  });

  revalidatePath('/dashboard/ativos');
  return id;
}

export async function updateAsset(
  id: string,
  data: {
    name: string;
    type: string;
    quantity: string;
    averagePrice: string;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await db
    .update(asset)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(asset.id, id), eq(asset.userId, session.user.id)));

  revalidatePath('/dashboard/ativos');
}

export async function deleteAsset(id: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await db
    .delete(asset)
    .where(and(eq(asset.id, id), eq(asset.userId, session.user.id)));

  revalidatePath('/dashboard/ativos');
}
