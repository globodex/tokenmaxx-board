const DATA_URL = "./data/profiles.json";

const fallbackProfiles = [
  {
    id: "ada-launch",
    name: "Ada Launch",
    handle: "@ada.launch",
    location: "San Francisco",
    flag: "🇺🇸",
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
    location: "New York",
    flag: "🇺🇸",
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
    location: "London",
    flag: "🇬🇧",
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
    location: "Toronto",
    flag: "🇨🇦",
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
let sortKey = "lifetimeTokens";

const rows = document.querySelector("#leaderboardRows");
const copyButton = document.querySelector("#copyCommand");
const joinCommand = document.querySelector("#joinCommand");
const sortButtons = [...document.querySelectorAll(".sort-button")];

async function loadProfiles() {
  sourceProfiles = await loadSourceProfiles();
  return sourceProfiles.profiles;
}

async function loadSourceProfiles() {
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

function normalizeProfile(profile) {
  const name = String(profile.name || "Unnamed profile").trim();
  const id = profile.id || profileId(name);
  const lifetimeTokens = Number(profile.lifetimeTokens ?? profile.tokens ?? 0);
  const longestTaskMinutes = Number(profile.longestTaskMinutes ?? Math.round((profile.longest || 0) * 60));

  return {
    id,
    name,
    handle: profile.handle || `@${id}`,
    location: String(profile.location || "").trim(),
    flag: String(profile.flag || "").trim(),
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

function sortedProfiles() {
  return [...profiles].sort((a, b) => {
    const values = {
      lifetimeTokens: b.lifetimeTokens - a.lifetimeTokens,
      peakTokens: b.peakTokens - a.peakTokens,
      currentStreak: b.currentStreak - a.currentStreak,
      longestTaskMinutes: b.longestTaskMinutes - a.longestTaskMinutes,
      longestStreak: b.longestStreak - a.longestStreak
    };

    return values[sortKey] || a.name.localeCompare(b.name);
  });
}

function renderRows() {
  rows.innerHTML = "";
  rows.dataset.sort = sortKey;

  sortedProfiles().forEach((profile, index) => {
    const row = document.createElement("tr");
    const locationText = [profile.flag, profile.location].filter(Boolean).join(" ");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <td data-label="Rank"><span class="rank">${index + 1}</span></td>
      <td data-label="Ambassador">
        <div class="person">
          <span>
            <strong>${escapeHtml(profile.name)}</strong>
            <small>${escapeHtml(profile.handle)}</small>
            ${locationText ? `<small class="location">${escapeHtml(locationText)}</small>` : ""}
          </span>
        </div>
      </td>
      <td data-label="Lifetime">${formatCompact(profile.lifetimeTokens)}</td>
      <td data-label="Peak">${formatCompact(profile.peakTokens)}</td>
      <td data-label="Task">${formatTask(profile.longestTaskMinutes)}</td>
      <td data-label="Current">${profile.currentStreak} days</td>
      <td data-label="Longest">${profile.longestStreak} days</td>
    `;
    rows.append(row);
  });
}

function render() {
  renderRows();
}

function profileId(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

sortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    sortKey = button.dataset.sort;
    sortButtons.forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", () => copyCommand(button));
});

copyButton.addEventListener("click", () => copyCommand(copyButton));

async function copyCommand(button) {
  const targetSelector = button.dataset.copyTarget;
  const target = targetSelector ? document.querySelector(targetSelector) : joinCommand;
  const command = target.textContent.trim();

  try {
    await navigator.clipboard.writeText(command);
    button.textContent = "Copied";
  } catch {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
    button.textContent = "Selected";
  }

  window.setTimeout(() => {
    button.textContent = "Copy";
  }, 1600);
}

loadProfiles().then((loadedProfiles) => {
  profiles = loadedProfiles;
  render();
});
