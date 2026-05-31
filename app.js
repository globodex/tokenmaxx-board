import {
  COUNTRY_CODES,
  flagFromCountryCode,
  resolveCountry
} from "./scripts/profile-store.mjs";

const DATA_URL = "./data/profiles.json";

const fallbackProfiles = [
  {
    id: "ada-launch",
    name: "Ada Launch",
    handle: "@ada.launch",
    location: "San Francisco",
    country: "United States",
    countryCode: "US",
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
    country: "United States",
    countryCode: "US",
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
    country: "United Kingdom",
    countryCode: "GB",
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
    country: "Canada",
    countryCode: "CA",
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
const setupCommand = document.querySelector("#setupCommand");
const locationInput = document.querySelector("#locationInput");
const countryInput = document.querySelector("#countryInput");
const countryOptions = document.querySelector("#countryOptions");
const countryHint = document.querySelector("#countryHint");
const sortButtons = [...document.querySelectorAll(".sort-button")];
const updatedLabel = document.querySelector("#updatedLabel");

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
  const country = resolveCountry(profile.countryCode || profile.country);

  return {
    id,
    name,
    handle: profile.handle || `@${id}`,
    location: String(profile.location || "").trim(),
    country: country?.name || String(profile.country || "").trim(),
    countryCode: country?.code || String(profile.countryCode || "").trim().toUpperCase(),
    flag: String(profile.flag || country?.flag || "").trim(),
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

function formatUpdatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) return "Updated from Globodex data.";

  return `Updated ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date)}.`;
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
      <td data-label="Lifetime"><span class="metric metric-lifetime"><strong>${formatCompact(profile.lifetimeTokens)}</strong><span>Lifetime</span></span></td>
      <td data-label="Peak"><span class="metric"><strong>${formatCompact(profile.peakTokens)}</strong><span>Peak</span></span></td>
      <td data-label="Task"><span class="metric"><strong>${formatTask(profile.longestTaskMinutes)}</strong><span>Task</span></span></td>
      <td data-label="Current"><span class="metric"><strong>${profile.currentStreak} days</strong><span>Current</span></span></td>
      <td data-label="Longest"><span class="metric"><strong>${profile.longestStreak} days</strong><span>Longest</span></span></td>
    `;
    rows.append(row);
  });
}

function render() {
  if (updatedLabel) updatedLabel.textContent = formatUpdatedAt(sourceProfiles.updatedAt);
  renderRows();
}

function profileId(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function quoteArg(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function populateCountryOptions() {
  if (!countryOptions) return;

  const names = new Intl.DisplayNames(["en"], { type: "region" });
  countryOptions.innerHTML = COUNTRY_CODES
    .map((code) => ({
      code,
      flag: flagFromCountryCode(code),
      name: names.of(code) || code
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((country) => `<option value="${escapeHtml(country.name)}" label="${escapeHtml(`${country.flag} ${country.code}`)}"></option>`)
    .join("");
}

function updateSetupCommand() {
  if (!setupCommand) return;

  const parts = ["/update-stats setup"];
  const location = locationInput?.value.trim();
  const countryText = countryInput?.value.trim();
  const country = resolveCountry(countryText);

  if (location) parts.push("--location", quoteArg(location));
  if (country) parts.push("--country", quoteArg(country.name));
  else if (countryText) parts.push("--country", quoteArg(countryText));

  setupCommand.textContent = parts.join(" ");

  if (countryHint) {
    countryHint.textContent = country
      ? `${country.flag} ${country.name} will be saved with your profile.`
      : "Type a country name or two-letter code; the flag is added automatically.";
  }
}

populateCountryOptions();
locationInput?.addEventListener("input", updateSetupCommand);
countryInput?.addEventListener("input", updateSetupCommand);

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
