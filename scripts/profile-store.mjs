export const COUNTRY_CODES = [
  "AC", "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ",
  "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CP", "CR", "CU", "CV", "CW", "CX", "CY", "CZ",
  "DE", "DG", "DJ", "DK", "DM", "DO", "DZ", "EA", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "EU", "FI", "FJ", "FK", "FM", "FO", "FR",
  "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY",
  "HK", "HM", "HN", "HR", "HT", "HU", "IC", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN",
  "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR",
  "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU",
  "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ",
  "TA", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "UM", "UN", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM", "ZW"
];

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryAliases = new Map([
  ["america", "US"],
  ["britain", "GB"],
  ["czechia", "CZ"],
  ["england", "GB"],
  ["great britain", "GB"],
  ["holland", "NL"],
  ["south korea", "KR"],
  ["north korea", "KP"],
  ["taiwan", "TW"],
  ["uk", "GB"],
  ["u.k.", "GB"],
  ["united kingdom", "GB"],
  ["united states", "US"],
  ["united states of america", "US"],
  ["us", "US"],
  ["u.s.", "US"],
  ["usa", "US"],
  ["u.s.a.", "US"],
  ["uae", "AE"],
  ["united arab emirates", "AE"]
]);

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

export function flagFromCountryCode(value) {
  const code = String(value || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return [...code].map((char) => String.fromCodePoint(127397 + char.charCodeAt(0))).join("");
}

export function resolveCountry(value) {
  const input = String(value || "").trim();
  if (!input) return null;

  const normalized = input.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const aliasCode = countryAliases.get(normalized);
  const directCode = input.length === 2 ? input.toUpperCase() : "";
  const code = aliasCode || (COUNTRY_CODES.includes(directCode) ? directCode : countryCodeFromName(normalized));
  if (!code) return null;

  return {
    code,
    name: countryNames.of(code) || code,
    flag: flagFromCountryCode(code)
  };
}

function countryCodeFromName(normalizedInput) {
  return COUNTRY_CODES.find((code) => {
    const normalizedName = String(countryNames.of(code) || code)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
    return normalizedName === normalizedInput;
  });
}

export function normalizeProfile(profile) {
  const id = profile.id || profileId(profile.name);
  const country = resolveCountry(profile.countryCode || profile.country);
  return {
    id,
    name: String(profile.name).trim(),
    handle: normalizeHandle(profile.handle || id),
    location: String(profile.location || "").trim(),
    country: country?.name || String(profile.country || "").trim(),
    countryCode: country?.code || String(profile.countryCode || "").trim().toUpperCase(),
    flag: String(profile.flag || country?.flag || "").trim(),
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
