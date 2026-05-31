const DATA_URL = "./data/profiles.json";
const DAYS_IN_HEATMAP = 315;
const config = window.TOKENMAXX_CONFIG || {};

const fallbackProfiles = [
  {
    id: "ada-launch",
    name: "Ada Launch",
    handle: "@ada.launch",
    lifetimeTokens: 12400000000,
    peakTokens: 1300000000,
    longestTaskMinutes: 1062,
    currentStreak: 42,
    longestStreak: 58,
    activitySeed: 7
  },
  {
    id: "max-demo",
    name: "Max Demo",
    handle: "@max.demo",
    lifetimeTokens: 9800000000,
    peakTokens: 1100000000,
    longestTaskMinutes: 860,
    currentStreak: 35,
    longestStreak: 49,
    activitySeed: 13
  },
  {
    id: "jules-merge",
    name: "Jules Merge",
    handle: "@jules.merge",
    lifetimeTokens: 8100000000,
    peakTokens: 980000000,
    longestTaskMinutes: 965,
    currentStreak: 31,
    longestStreak: 44,
    activitySeed: 23
  },
  {
    id: "riley-triage",
    name: "Riley Triage",
    handle: "@riley.triage",
    lifetimeTokens: 6600000000,
    peakTokens: 760000000,
    longestTaskMinutes: 738,
    currentStreak: 28,
    longestStreak: 40,
    activitySeed: 31
  }
];

let profiles = fallbackProfiles;
let sourceProfiles = {
  updatedAt: "1970-01-01T00:00:00.000Z",
  profiles: fallbackProfiles
};
let sortKey = "score";
let activityMode = "daily";
let featuredProfileId = null;

const rows = document.querySelector("#leaderboardRows");
const resetButton = document.querySelector("#resetBoard");
const copyButton = document.querySelector("#copyCommand");
const joinCommand = document.querySelector("#joinCommand");
const sortButtons = [...document.querySelectorAll(".sort-button")];
const modeButtons = [...document.querySelectorAll(".mode-tabs button")];
const featuredAvatar = document.querySelector("#featuredAvatar");
const featuredName = document.querySelector("#featuredName");
const featuredHandle = document.querySelector("#featuredHandle");
const featuredLifetime = document.querySelector("#featuredLifetime");
const featuredPeak = document.querySelector("#featuredPeak");
const featuredTask = document.querySelector("#featuredTask");
const featuredCurrentStreak = document.querySelector("#featuredCurrentStreak");
const featuredLongestStreak = document.querySelector("#featuredLongestStreak");
const featuredHeatmap = document.querySelector("#featuredHeatmap");

async function loadProfiles() {
  sourceProfiles = await loadSourceProfiles();
  return sourceProfiles.profiles;
}

async function loadSourceProfiles() {
  const persistentProfiles = await loadSupabaseProfiles();
  if (persistentProfiles) return persistentProfiles;

  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${DATA_URL}`);
    const parsed = await response.json();

    return {
      updatedAt: parsed.updatedAt || "1970-01-01T00:00:00.000Z",
      profiles: Array.isArray(parsed.profiles) && parsed.profiles.length > 0
        ? parsed.profiles.map(normalizeProfile)
        : fallbackProfiles
    };
  } catch {
    return {
      updatedAt: "1970-01-01T00:00:00.000Z",
      profiles: fallbackProfiles
    };
  }
}

async function loadSupabaseProfiles() {
  if (!config.supabaseUrl || !config.supabaseAnonKey) return null;

  const url = `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/profiles?select=*&order=lifetime_tokens.desc`;

  try {
    const response = await fetch(url, {
      headers: {
        apikey: config.supabaseAnonKey,
        authorization: `Bearer ${config.supabaseAnonKey}`
      }
    });

    if (!response.ok) throw new Error("Unable to load persistent profiles");
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    return {
      updatedAt: rows.reduce((latest, row) => row.updated_at > latest ? row.updated_at : latest, "1970-01-01T00:00:00.000Z"),
      profiles: rows.map(profileFromSupabase)
    };
  } catch {
    return null;
  }
}

function profileFromSupabase(row) {
  return normalizeProfile({
    id: row.id,
    name: row.name,
    handle: row.handle,
    lifetimeTokens: row.lifetime_tokens,
    peakTokens: row.peak_tokens,
    longestTaskMinutes: row.longest_task_minutes,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    activitySeed: row.activity_seed
  });
}

function normalizeProfile(profile) {
  const name = String(profile.name || "Unnamed profile").trim();
  const id = profile.id || profileId(name);
  const lifetimeTokens = Number(profile.lifetimeTokens ?? profile.tokens ?? 0);
  const longestTaskMinutes = Number(profile.longestTaskMinutes ?? Math.round((profile.longest || 0) * 60));

  return {
    id,
    name,
    handle: profile.handle || `@${id}`,
    lifetimeTokens,
    peakTokens: Number(profile.peakTokens ?? Math.round(lifetimeTokens * 0.12)),
    longestTaskMinutes,
    currentStreak: Number(profile.currentStreak ?? profile.streak ?? 0),
    longestStreak: Number(profile.longestStreak ?? profile.streak ?? 0),
    activitySeed: Number(profile.activitySeed ?? seedFromText(id))
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCompact(value) {
  if (value >= 1000000000) return `${trimNumber(value / 1000000000)}B`;
  if (value >= 1000000) return `${trimNumber(value / 1000000)}M`;
  if (value >= 1000) return `${trimNumber(value / 1000)}K`;
  return new Intl.NumberFormat("en-US").format(value);
}

function trimNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function formatTask(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function seedFromText(text) {
  return [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function scoreFor(profile) {
  const lifetimeScore = profile.lifetimeTokens / 10000000;
  const peakScore = profile.peakTokens / 5000000;
  const taskScore = profile.longestTaskMinutes * 0.65;
  const streakScore = profile.currentStreak * 18 + profile.longestStreak * 10;
  return Math.round(lifetimeScore + peakScore + taskScore + streakScore);
}

function sortedProfiles() {
  return [...profiles].sort((a, b) => {
    const values = {
      score: scoreFor(b) - scoreFor(a),
      lifetimeTokens: b.lifetimeTokens - a.lifetimeTokens,
      peakTokens: b.peakTokens - a.peakTokens,
      currentStreak: b.currentStreak - a.currentStreak
    };

    return values[sortKey] || a.name.localeCompare(b.name);
  });
}

function activityLevel(profile, index) {
  const wave = Math.sin((index + profile.activitySeed) / 8) + Math.cos((index + profile.activitySeed) / 19);
  const recentBias = index > 210 ? 1 : 0;
  const activeStreak = index > DAYS_IN_HEATMAP - profile.currentStreak ? 2 : 0;
  const pulse = (index * profile.activitySeed) % 17 === 0 ? 2 : 0;
  const rawLevel = Math.round(wave + recentBias + activeStreak + pulse + 2);
  const level = {
    daily: rawLevel,
    weekly: Math.round((rawLevel + activityLevelBase(profile, index - 1) + activityLevelBase(profile, index - 2)) / 3),
    cumulative: Math.round((rawLevel + index / 90) / 1.3)
  }[activityMode];
  return Math.max(0, Math.min(level, 6));
}

function activityLevelBase(profile, index) {
  if (index < 0) return 0;
  const wave = Math.sin((index + profile.activitySeed) / 8) + Math.cos((index + profile.activitySeed) / 19);
  const recentBias = index > 210 ? 1 : 0;
  const activeStreak = index > DAYS_IN_HEATMAP - profile.currentStreak ? 2 : 0;
  const pulse = (index * profile.activitySeed) % 17 === 0 ? 2 : 0;
  return Math.round(wave + recentBias + activeStreak + pulse + 2);
}

function renderFeatured(profile) {
  featuredProfileId = profile.id;
  if (featuredAvatar) {
    featuredAvatar.textContent = profile.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  featuredName.textContent = profile.name;
  featuredHandle.textContent = profile.handle;
  featuredLifetime.textContent = formatCompact(profile.lifetimeTokens);
  featuredPeak.textContent = formatCompact(profile.peakTokens);
  featuredTask.textContent = formatTask(profile.longestTaskMinutes);
  featuredCurrentStreak.textContent = `${profile.currentStreak} days`;
  featuredLongestStreak.textContent = `${profile.longestStreak} days`;
  renderHeatmap(profile);
}

function renderHeatmap(profile) {
  featuredHeatmap.innerHTML = "";

  Array.from({ length: DAYS_IN_HEATMAP }, (_, index) => {
    const cell = document.createElement("span");
    const level = activityLevel(profile, index);
    cell.className = `level-${level}`;
    cell.title = `${level} activity level`;
    featuredHeatmap.append(cell);
  });
}

function renderRows() {
  rows.innerHTML = "";

  sortedProfiles().forEach((profile, index) => {
    const row = document.createElement("tr");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <td><span class="rank">${index + 1}</span></td>
      <td>
        <button class="person" type="button" data-feature="${escapeHtml(profile.id)}" aria-label="Feature ${escapeHtml(profile.name)}">
          <span class="mini-avatar" aria-hidden="true">${escapeHtml(initialsFor(profile.name))}</span>
          <span>
            <strong>${escapeHtml(profile.name)}</strong>
            <small>${escapeHtml(profile.handle)}</small>
          </span>
        </button>
      </td>
      <td>${formatCompact(profile.lifetimeTokens)}</td>
      <td>${formatCompact(profile.peakTokens)}</td>
      <td>${formatTask(profile.longestTaskMinutes)}</td>
      <td>${profile.currentStreak} days</td>
      <td>${profile.longestStreak} days</td>
      <td class="score">${new Intl.NumberFormat("en-US").format(scoreFor(profile))}</td>
    `;
    rows.append(row);
  });
}

function initialsFor(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function render() {
  const leaders = sortedProfiles();
  const featuredProfile = profiles.find((profile) => profile.id === featuredProfileId) || leaders[0];
  if (featuredProfile) renderFeatured(featuredProfile);
  renderRows();
}

function profileId(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

rows.addEventListener("click", (event) => {
  const featureButton = event.target.closest("[data-feature]");
  if (!featureButton) return;

  const profile = profiles.find((item) => item.id === featureButton.dataset.feature);
  if (profile) renderFeatured(profile);
});

resetButton.addEventListener("click", () => {
  profiles = sourceProfiles.profiles;
  featuredProfileId = null;
  render();
});

sortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    sortKey = button.dataset.sort;
    sortButtons.forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activityMode = button.dataset.mode;
    modeButtons.forEach((item) => item.classList.toggle("active", item === button));
    const featuredProfile = profiles.find((profile) => profile.id === featuredProfileId) || sortedProfiles()[0];
    if (featuredProfile) renderHeatmap(featuredProfile);
  });
});

copyButton.addEventListener("click", async () => {
  const command = joinCommand.textContent.trim();

  try {
    await navigator.clipboard.writeText(command);
    copyButton.textContent = "Copied";
  } catch {
    copyButton.textContent = "Select";
  }

  window.setTimeout(() => {
    copyButton.textContent = "Copy";
  }, 1600);
});

loadProfiles().then((loadedProfiles) => {
  profiles = loadedProfiles;
  render();
});
