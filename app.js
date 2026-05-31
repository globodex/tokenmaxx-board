const STORAGE_KEY = "tokenmaxx-board-profiles";
const DAYS_IN_HEATMAP = 315;

const seedProfiles = [
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

let profiles = loadProfiles();
let sortKey = "score";
let activityMode = "daily";

const form = document.querySelector("#profileForm");
const rows = document.querySelector("#leaderboardRows");
const resetButton = document.querySelector("#resetBoard");
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

function loadProfiles() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return seedProfiles;

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.some((profile) => !("lifetimeTokens" in profile))) {
      return seedProfiles;
    }
    return Array.isArray(parsed) && parsed.length > 0 ? parsed.map(normalizeProfile) : seedProfiles;
  } catch {
    return seedProfiles;
  }
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

function saveProfiles() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
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
  featuredAvatar.textContent = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
      <td>
        <button class="delete-button" type="button" aria-label="Remove ${escapeHtml(profile.name)}" data-remove="${escapeHtml(profile.id)}">×</button>
      </td>
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
  renderFeatured(leaders[0]);
  renderRows();
}

function profileId(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name")).trim();
  const id = profileId(name);
  const longestTaskHours = Number(data.get("longestTaskHours"));
  const nextProfile = {
    id,
    name,
    handle: String(data.get("handle")).trim(),
    lifetimeTokens: Number(data.get("lifetimeTokens")),
    peakTokens: Number(data.get("peakTokens")),
    longestTaskMinutes: Math.round(longestTaskHours * 60),
    currentStreak: Number(data.get("currentStreak")),
    longestStreak: Number(data.get("longestStreak")),
    activitySeed: seedFromText(id)
  };

  profiles = profiles.filter((profile) => profile.id !== id).concat(nextProfile);
  saveProfiles();
  form.reset();
  render();
});

rows.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    profiles = profiles.filter((profile) => profile.id !== removeButton.dataset.remove);
    saveProfiles();
    render();
    return;
  }

  const featureButton = event.target.closest("[data-feature]");
  if (!featureButton) return;

  const profile = profiles.find((item) => item.id === featureButton.dataset.feature);
  if (profile) renderFeatured(profile);
});

resetButton.addEventListener("click", () => {
  profiles = seedProfiles;
  saveProfiles();
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
    renderHeatmap(sortedProfiles()[0]);
  });
});

render();
