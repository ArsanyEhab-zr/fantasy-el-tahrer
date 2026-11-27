// Both the CLI bootstrap and staff clients use the same document shape and commit protocol.
export const sections = ['settings', 'bracket', 'broadcast', 'teams', 'players', 'groups', 'matches', 'penalties'];

const CONFIG_DOC_MAP = {
  settings: 'tournament',
  bracket: 'bracket',
  broadcast: 'broadcast',
};

// Map field order can vary between SDKs and reads of identical data.
function comparable(value) {
  return JSON.stringify(value, (_, item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    return Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]]));
  });
}

export async function publishSnapshot(db, sdk, changed = sections) {
  const ref = sdk.doc(db, 'public/live_snapshot');
  return sdk.runTransaction(db, async tx => {
    const stored = await tx.get(ref);
    const keys = stored.exists() ? changed : sections;
    const values = await Promise.all(keys.map(async key => {
      if (Object.hasOwn(CONFIG_DOC_MAP, key)) {
        const config = await tx.get(sdk.doc(db, 'config', CONFIG_DOC_MAP[key]));
        return config.data() || {};
      }
      const rows = await sdk.getDocs(sdk.collection(db, key));
      return rows.docs.map(d => ({ ...d.data(), id: d.id }));
    }));
    const patch = {};
    keys.forEach((key, i) => {
      if (comparable(stored.data()?.[key]) !== comparable(values[i])) patch[key] = values[i];
    });
    if (Object.keys(patch).length) tx.set(ref, { ...patch, updatedAt: sdk.serverTimestamp() }, { mergeFields: [...Object.keys(patch), 'updatedAt'] });
  });
}
