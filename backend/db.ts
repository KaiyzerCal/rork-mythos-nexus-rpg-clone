type DbRecord = Record<string, any>;

interface SupabaseKvRow {
  key: string;
  collection: string;
  item_id: string;
  value: DbRecord;
  updated_at?: string;
}

const getDbConfig = () => ({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  key: process.env.SUPABASE_API_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  namespace: process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE || process.env.EXPO_PUBLIC_PROJECT_ID || 'default',
  table: process.env.SUPABASE_KV_TABLE || 'app_kv',
});

function getBaseHeaders(): Record<string, string> {
  const { key } = getDbConfig();
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

function getStorageKey(collection: string, id: string): string {
  const { namespace } = getDbConfig();
  return `${namespace}:${collection}:${id}`;
}

function getTableUrl(query: string): string {
  const { url, table } = getDbConfig();
  return `${url}/rest/v1/${table}${query}`;
}

function normalizeValue(collection: string, id: string, data: DbRecord): DbRecord {
  return {
    ...data,
    _id: id,
    _collection: collection,
    _updatedAt: new Date().toISOString(),
  };
}

async function readErrorText(response: Response): Promise<string> {
  return response.text().catch(() => '');
}

async function fetchSingleRow(collection: string, id: string): Promise<SupabaseKvRow | null> {
  const key = getStorageKey(collection, id);
  const response = await fetch(getTableUrl(`?select=key,collection,item_id,value,updated_at&key=eq.${encodeURIComponent(key)}&limit=1`), {
    method: 'GET',
    headers: getBaseHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await readErrorText(response);
    throw new Error(`GET ${response.status} ${text}`);
  }

  const rows = (await response.json().catch(() => [])) as SupabaseKvRow[];
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function dbSet(collection: string, id: string, data: DbRecord): Promise<boolean> {
  const { url, key } = getDbConfig();
  if (!url || !key) {
    console.warn('[DB] Supabase config missing, skipping persist');
    return false;
  }

  const now = new Date().toISOString();
  const value = normalizeValue(collection, id, data);
  const payload = {
    key: getStorageKey(collection, id),
    collection,
    item_id: id,
    value,
    updated_at: now,
  };

  try {
    console.log(`[DB] SET ${collection}/${id}`);
    const response = await fetch(getTableUrl('?on_conflict=key'), {
      method: 'POST',
      headers: {
        ...getBaseHeaders(),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await readErrorText(response);
      console.error(`[DB] SET failed: ${response.status} - ${text}`);
      return false;
    }

    console.log(`[DB] SET success: ${collection}/${id}`);
    return true;
  } catch (error) {
    console.error(`[DB] SET error for ${collection}/${id}:`, error);
    return false;
  }
}

export async function dbGet(collection: string, id: string): Promise<DbRecord | null> {
  const { url, key } = getDbConfig();
  if (!url || !key) {
    return null;
  }

  try {
    console.log(`[DB] GET ${collection}/${id}`);
    const row = await fetchSingleRow(collection, id);
    return row?.value ?? null;
  } catch (error) {
    console.error(`[DB] GET error for ${collection}/${id}:`, error);
    return null;
  }
}

export async function dbList(collection: string): Promise<DbRecord[]> {
  const { url, key, namespace } = getDbConfig();
  if (!url || !key) {
    return [];
  }

  try {
    console.log(`[DB] LIST ${collection}`);
    const prefix = `${namespace}:${collection}:`;
    const response = await fetch(getTableUrl(`?select=value,key,updated_at&key=like.${encodeURIComponent(`${prefix}%`)}&order=updated_at.desc.nullslast`), {
      method: 'GET',
      headers: getBaseHeaders(),
    });

    if (!response.ok) {
      const text = await readErrorText(response);
      console.warn(`[DB] LIST returned ${response.status} for ${collection}: ${text}`);
      return [];
    }

    const rows = (await response.json().catch(() => [])) as Array<{ value?: DbRecord | null }>;
    return Array.isArray(rows)
      ? rows.map((row) => row?.value ?? null).filter((item): item is DbRecord => item !== null)
      : [];
  } catch (error) {
    console.error(`[DB] LIST error for ${collection}:`, error);
    return [];
  }
}

export async function dbDelete(collection: string, id: string): Promise<boolean> {
  const { url, key } = getDbConfig();
  if (!url || !key) {
    return false;
  }

  const storageKey = getStorageKey(collection, id);
  try {
    console.log(`[DB] DELETE ${collection}/${id}`);
    const response = await fetch(getTableUrl(`?key=eq.${encodeURIComponent(storageKey)}`), {
      method: 'DELETE',
      headers: {
        ...getBaseHeaders(),
        Prefer: 'return=minimal',
      },
    });

    if (!response.ok) {
      const text = await readErrorText(response);
      console.error(`[DB] DELETE failed: ${response.status} - ${text}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[DB] DELETE error for ${collection}/${id}:`, error);
    return false;
  }
}

export async function dbSetBulk(collection: string, items: { id: string; data: DbRecord }[]): Promise<boolean> {
  const { url, key } = getDbConfig();
  if (!url || !key) {
    return false;
  }

  try {
    console.log(`[DB] BULK SET ${collection} (${items.length} items)`);
    const now = new Date().toISOString();
    const payload = items.map((item) => ({
      key: getStorageKey(collection, item.id),
      collection,
      item_id: item.id,
      value: normalizeValue(collection, item.id, item.data),
      updated_at: now,
    }));

    const response = await fetch(getTableUrl('?on_conflict=key'), {
      method: 'POST',
      headers: {
        ...getBaseHeaders(),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await readErrorText(response);
      console.error(`[DB] BULK SET failed: ${response.status} - ${text}`);
      for (const item of items) {
        await dbSet(collection, item.id, item.data);
      }
    }

    console.log(`[DB] BULK SET success: ${collection}`);
    return true;
  } catch (error) {
    console.error(`[DB] BULK SET error for ${collection}:`, error);
    for (const item of items) {
      await dbSet(collection, item.id, item.data).catch(() => undefined);
    }
    return false;
  }
}
