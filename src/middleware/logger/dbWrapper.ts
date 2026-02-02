

/**
 * Enhanced trackDb: This is used inside your 100+ API controllers
 */
export async function trackDb<T>(req: any, tableName: string, dbPromise: Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await dbPromise;
  } finally {
    const duration = (performance.now() - start) / 1000;
    if (!req.dbTimings) req.dbTimings = {};
    // Sums up time if same table is called multiple times in one request
    req.dbTimings[tableName] = (req.dbTimings[tableName] || 0) + duration;
  }
}

