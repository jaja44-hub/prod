export function getOdooDbCandidates(rawDb) {
  if (!rawDb) return [];

  const candidates = [rawDb];
  // Hugging Face Odoo image registers the DB under the env-var literal, not PGDATABASE.
  if (rawDb === 'neondb') candidates.push('POSTGRES_DATABASE=neondb');
  else if (rawDb === 'POSTGRES_DATABASE=neondb') candidates.push('neondb');

  return candidates;
}

export function authenticateOdooDb(client, rawDb, user, apiKey) {
  const candidates = getOdooDbCandidates(rawDb);

  return new Promise((resolve, reject) => {
    let index = 0;

    const tryNext = () => {
      if (index >= candidates.length) {
        resolve(null);
        return;
      }

      const db = candidates[index++];
      client.methodCall('authenticate', [db, user, apiKey, {}], (error, uid) => {
        if (error) {
          reject(error);
          return;
        }
        if (uid) {
          resolve({ uid, db });
          return;
        }
        tryNext();
      });
    };

    tryNext();
  });
}
