function parseIds(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map(Number).filter(id => Number.isInteger(id) && id > 0);
  } catch {
    return String(value).split(/[\s,;]+/).map(Number).filter(id => Number.isInteger(id) && id > 0);
  }
}

export async function getPlayerRole(db, playerId) {
  const id = Number(playerId);
  if (!Number.isInteger(id) || id < 1) return 'user';
  const [rows] = await db.query(
    "SELECT setting_key, setting_value FROM site_settings WHERE section='access' AND setting_key IN ('admin_player_ids','moderator_player_ids')",
  );
  const settings = Object.fromEntries(rows.map(row => [row.setting_key, row.setting_value]));
  if (parseIds(settings.admin_player_ids).includes(id)) return 'admin';
  if (parseIds(settings.moderator_player_ids).includes(id)) return 'moderator';
  return 'user';
}

export async function requireAdmin(db, actorId) {
  return (await getPlayerRole(db, actorId)) === 'admin';
}
