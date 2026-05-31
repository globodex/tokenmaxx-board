export function parseTokenCount(value) {
  const match = String(value).trim().match(/^([\d.]+)\s*([kmbt])?$/i);
  if (!match) throw new Error(`Invalid token count: ${value}`);

  const amount = Number(match[1]);
  const multipliers = { k: 1000, m: 1000000, b: 1000000000, t: 1000000000000 };
  return Math.round(amount * (multipliers[match[2]?.toLowerCase()] || 1));
}

export function parseDuration(value) {
  const text = String(value).trim().toLowerCase();
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*m/);

  if (!hourMatch && !minuteMatch && !Number.isNaN(Number(text))) {
    return Math.round(Number(text) * 60);
  }

  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  return Math.round(hours * 60 + minutes);
}

export function parseDays(value) {
  const match = String(value).trim().match(/^(\d+)/);
  if (!match) throw new Error(`Invalid day count: ${value}`);
  return Number(match[1]);
}

export function normalizeHandle(value) {
  const handle = String(value).trim();
  return handle.startsWith("@") ? handle : `@${handle}`;
}

export function profileId(name) {
  return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function seedFromText(text) {
  return [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function normalizeProfile(profile) {
  const id = profile.id || profileId(profile.name);
  return {
    id,
    name: String(profile.name).trim(),
    handle: normalizeHandle(profile.handle || id),
    location: String(profile.location || "").trim(),
    flag: String(profile.flag || "").trim(),
    lifetimeTokens: Number(profile.lifetimeTokens),
    peakTokens: Number(profile.peakTokens),
    longestTaskMinutes: Number(profile.longestTaskMinutes),
    currentStreak: Number(profile.currentStreak),
    longestStreak: Number(profile.longestStreak),
    activitySeed: Number(profile.activitySeed || seedFromText(id))
  };
}

export function upsertProfile(database, profile, updatedAt = new Date().toISOString()) {
  const normalizedProfile = normalizeProfile(profile);
  const existingProfiles = Array.isArray(database.profiles) ? database.profiles.map(normalizeProfile) : [];
  const profiles = existingProfiles.filter((item) => item.id !== normalizedProfile.id);
  profiles.push(normalizedProfile);
  profiles.sort((a, b) => b.lifetimeTokens - a.lifetimeTokens || a.name.localeCompare(b.name));

  return {
    version: 1,
    updatedAt,
    profiles
  };
}
