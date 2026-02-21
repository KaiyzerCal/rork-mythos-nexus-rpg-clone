const getDbConfig = () => ({
  endpoint: process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT || '',
  namespace: process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE || 'default',
  token: process.env.EXPO_PUBLIC_RORK_DB_TOKEN || '',
});

function getHeaders(): Record<string, string> {
  const { token, namespace } = getDbConfig();
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(namespace ? { 'db-namespace': namespace } : {}),
  };
}

export async function dbSet(collection: string, id: string, data: Record<string, any>): Promise<boolean> {
  const { endpoint, namespace } = getDbConfig();
  if (!endpoint) {
    console.warn('[DB] No endpoint configured, skipping persist');
    return false;
  }

  const key = `${namespace}:${collection}:${id}`;
  try {
    console.log(`[DB] SET ${collection}/${id}`);
    const response = await fetch(`${endpoint}/api/storage/set`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        key,
        value: JSON.stringify({
          ...data,
          _id: id,
          _collection: collection,
          _updatedAt: new Date().toISOString(),
        }),
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
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

export async function dbGet(collection: string, id: string): Promise<any | null> {
  const { endpoint, namespace } = getDbConfig();
  if (!endpoint) return null;

  const key = `${namespace}:${collection}:${id}`;
  try {
    console.log(`[DB] GET ${collection}/${id}`);
    const response = await fetch(`${endpoint}/api/storage/get`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      console.warn(`[DB] GET returned ${response.status} for ${collection}/${id}`);
      return null;
    }

    const result = await response.json();
    if (result && result.value) {
      try {
        return JSON.parse(result.value);
      } catch {
        return result.value;
      }
    }
    if (result && typeof result === 'object' && result._id) {
      return result;
    }
    return result || null;
  } catch (error) {
    console.error(`[DB] GET error for ${collection}/${id}:`, error);
    return null;
  }
}

export async function dbList(collection: string): Promise<any[]> {
  const { endpoint, namespace } = getDbConfig();
  if (!endpoint) return [];

  const prefix = `${namespace}:${collection}:`;
  try {
    console.log(`[DB] LIST ${collection}`);
    const response = await fetch(`${endpoint}/api/storage/list`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prefix }),
    });

    if (!response.ok) {
      console.warn(`[DB] LIST returned ${response.status} for ${collection}`);
      return [];
    }

    const result = await response.json();
    if (Array.isArray(result)) {
      return result.map(item => {
        if (item && item.value && typeof item.value === 'string') {
          try { return JSON.parse(item.value); } catch { return item; }
        }
        return item;
      });
    }
    if (result && result.items && Array.isArray(result.items)) {
      return result.items.map((item: any) => {
        if (item && item.value && typeof item.value === 'string') {
          try { return JSON.parse(item.value); } catch { return item; }
        }
        return item;
      });
    }
    return [];
  } catch (error) {
    console.error(`[DB] LIST error for ${collection}:`, error);
    return [];
  }
}

export async function dbDelete(collection: string, id: string): Promise<boolean> {
  const { endpoint, namespace } = getDbConfig();
  if (!endpoint) return false;

  const key = `${namespace}:${collection}:${id}`;
  try {
    console.log(`[DB] DELETE ${collection}/${id}`);
    const response = await fetch(`${endpoint}/api/storage/delete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ key }),
    });
    return response.ok;
  } catch (error) {
    console.error(`[DB] DELETE error for ${collection}/${id}:`, error);
    return false;
  }
}

export async function dbSetBulk(collection: string, items: { id: string; data: Record<string, any> }[]): Promise<boolean> {
  const { endpoint, namespace } = getDbConfig();
  if (!endpoint) return false;

  try {
    console.log(`[DB] BULK SET ${collection} (${items.length} items)`);
    const entries = items.map(item => ({
      key: `${namespace}:${collection}:${item.id}`,
      value: JSON.stringify({
        ...item.data,
        _id: item.id,
        _collection: collection,
        _updatedAt: new Date().toISOString(),
      }),
    }));

    const response = await fetch(`${endpoint}/api/storage/set-bulk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ entries }),
    });

    if (!response.ok) {
      for (const item of items) {
        await dbSet(collection, item.id, item.data);
      }
    }

    console.log(`[DB] BULK SET success: ${collection}`);
    return true;
  } catch (error) {
    console.error(`[DB] BULK SET error for ${collection}:`, error);
    for (const item of items) {
      await dbSet(collection, item.id, item.data).catch(() => {});
    }
    return false;
  }
}
