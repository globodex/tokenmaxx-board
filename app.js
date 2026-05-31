import {
  COUNTRY_CODES,
  flagFromCountryCode,
  resolveCountry
} from "./scripts/profile-store.mjs";

const DATA_URL = "./data/profiles.json";
const AMBASSADORS_URL = "./data/ambassadors.json";

let profiles = [];
let ambassadors = [];
let ambassadorSource = {
  source: "",
  sourceLabel: "Public Codex Ambassador directory"
};
let sourceProfiles = {
  updatedAt: "1970-01-01T00:00:00.000Z",
  profiles: []
};
let sortKey = "lifetimeTokens";

const rows = document.querySelector("#leaderboardRows");
const copyButton = document.querySelector("#copyCommand");
const joinCommand = document.querySelector("#joinCommand");
const setupCommand = document.querySelector("#setupCommand");
const setupCommandPreview = document.querySelector("#setupCommandPreview");
const locationInput = document.querySelector("#locationInput");
const countryInput = document.querySelector("#countryInput");
const countryOptions = document.querySelector("#countryOptions");
const countryHint = document.querySelector("#countryHint");
const sortButtons = [...document.querySelectorAll(".sort-button")];
const updatedLabel = document.querySelector("#updatedLabel");
const footerUpdatedLabel = document.querySelector("#footerUpdatedLabel");
const ambassadorDirectory = document.querySelector("#ambassadorDirectory");
const ambassadorSearch = document.querySelector("#ambassadorSearch");
const ambassadorSourceLabel = document.querySelector("#ambassadorSourceLabel");
const directorySection = document.querySelector("#ambassadors");
const directoryToggle = document.querySelector("#directoryToggle");
const directoryToggleLabel = document.querySelector("#directoryToggleLabel");
const directoryBody = document.querySelector("#directoryBody");
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = themeToggle?.querySelector(".theme-label");

async function loadProfiles() {
  sourceProfiles = await loadSourceProfiles();
  return sourceProfiles.profiles;
}

async function loadAmbassadors() {
  try {
    const response = await fetch(AMBASSADORS_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${AMBASSADORS_URL}`);
    const parsed = await response.json();
    ambassadorSource = {
      source: parsed.source || "",
      sourceLabel: parsed.sourceLabel || "Public Codex Ambassador directory"
    };
    return Array.isArray(parsed.ambassadors) ? parsed.ambassadors.map(normalizeAmbassador) : [];
  } catch {
    return [];
  }
}

async function loadSourceProfiles() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${DATA_URL}`);
    const parsed = await response.json();

    return {
      updatedAt: parsed.updatedAt || "1970-01-01T00:00:00.000Z",
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles.map(normalizeProfile) : []
    };
  } catch {
    return {
      updatedAt: "1970-01-01T00:00:00.000Z",
      profiles: []
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

function normalizeAmbassador(ambassador) {
  const name = String(ambassador.name || "Unnamed ambassador").trim();
  const id = ambassador.id || profileId(name);

  return {
    id,
    name,
    city: String(ambassador.city || "").trim(),
    country: String(ambassador.country || "").trim(),
    countryCode: String(ambassador.countryCode || "").trim().toUpperCase(),
    links: Array.isArray(ambassador.links) ? ambassador.links : []
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC"
  }).format(date)} UTC.`;
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

  const rankedProfiles = sortedProfiles();
  if (!rankedProfiles.length) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    row.innerHTML = `
      <td colspan="7">
        <strong>No ranked profiles yet.</strong>
        <span>Attach a Codex profile screenshot and run <code>/update-stats setup</code> to claim the first row.</span>
      </td>
    `;
    rows.append(row);
    return;
  }

  rankedProfiles.forEach((profile, index) => {
    const row = document.createElement("tr");
    const locationText = [profile.flag, profile.location].filter(Boolean).join("\u00a0");
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

function ambassadorMatches(ambassador, term) {
  if (!term) return true;

  return [
    ambassador.name,
    ambassador.city,
    ambassador.country,
    ambassador.countryCode
  ].some((value) => value.toLowerCase().includes(term));
}

function renderAmbassadors() {
  if (!ambassadorDirectory) return;

  const syncedIds = new Set(profiles.map((profile) => profile.id));
  const term = ambassadorSearch?.value.trim().toLowerCase() || "";
  const pendingAmbassadors = ambassadors
    .filter((ambassador) => !syncedIds.has(ambassador.id))
    .filter((ambassador) => ambassadorMatches(ambassador, term))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (ambassadorSourceLabel) {
    const total = ambassadors.length;
    const visible = pendingAmbassadors.length;
    const countText = term ? `${visible} matching ambassadors` : `${total} ambassadors listed`;
    ambassadorSourceLabel.textContent = `${countText}.`;
  }

  ambassadorDirectory.innerHTML = pendingAmbassadors.map((ambassador) => {
    const flag = flagFromCountryCode(ambassador.countryCode);
    const location = [ambassador.city, ambassador.country].filter(Boolean).join(", ");
    const links = ambassador.links
      .map(renderAmbassadorLink)
      .join("");

    return `
      <article class="ambassador-card">
        <div>
          <p>${escapeHtml(flag)} ${escapeHtml(ambassador.name)}</p>
          <span>${escapeHtml(location)}</span>
        </div>
        <strong>Awaiting stats</strong>
        ${links ? `<nav aria-label="${escapeHtml(`${ambassador.name} links`)}">${links}</nav>` : ""}
      </article>
    `;
  }).join("");
}

function renderAmbassadorLink(link) {
  const kind = normalizeLinkKind(link.kind);
  const label = linkLabel(kind);

  return `
    <a class="ambassador-link ambassador-link-${kind}" href="${escapeHtml(link.url)}" rel="noopener noreferrer" target="_blank" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">
      ${linkIcon(kind)}
      <span class="sr-only">${escapeHtml(label)}</span>
    </a>
  `;
}

function normalizeLinkKind(value) {
  const kind = String(value || "site").trim().toLowerCase();
  if (kind === "linkedin" || kind === "x") return kind;
  return "site";
}

function linkLabel(kind) {
  const labels = {
    linkedin: "LinkedIn",
    x: "X",
    site: "Website"
  };
  return labels[kind] || labels.site;
}

function linkIcon(kind) {
  const icons = {
    linkedin: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6.9 9.1h3.2v9.8H6.9V9.1Zm1.6-4.9a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6Zm3.9 4.9h3.1v1.3c.5-.8 1.4-1.5 3-1.5 2.2 0 3.7 1.4 3.7 4.4v5.6H19v-5.2c0-1.4-.5-2.3-1.7-2.3-1 0-1.5.6-1.8 1.2-.1.2-.1.6-.1.9v5.4h-3.1V9.1Z" />
      </svg>
    `,
    x: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m4.7 4.5 6.1 8.1-6.1 6.9h2.1l4.9-5.5 4.1 5.5h4.1l-6.4-8.6 5.7-6.4h-2.1l-4.5 5-3.7-5H4.7Zm3.1 1.6 9 11.8h-1.9L5.9 6.1h1.9Z" />
      </svg>
    `,
    site: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="8.2" />
        <path d="M3.8 12h16.4M12 3.8c2.2 2.3 3.3 5 3.3 8.2s-1.1 5.9-3.3 8.2M12 3.8c-2.2 2.3-3.3 5-3.3 8.2s1.1 5.9 3.3 8.2" />
      </svg>
    `
  };

  return icons[kind] || icons.site;
}

function render() {
  const updatedText = formatUpdatedAt(sourceProfiles.updatedAt);
  if (updatedLabel) updatedLabel.textContent = updatedText;
  if (footerUpdatedLabel) footerUpdatedLabel.textContent = updatedText;
  renderRows();
  renderAmbassadors();
}

function setDirectoryExpanded(expanded) {
  if (!directorySection || !directoryToggle || !directoryBody) return;

  directorySection.classList.toggle("is-expanded", expanded);
  directorySection.classList.toggle("is-collapsed", !expanded);
  directoryToggle.setAttribute("aria-expanded", String(expanded));
  directoryBody.hidden = !expanded;

  if (directoryToggleLabel) {
    directoryToggleLabel.textContent = expanded ? "Hide directory" : "Show directory";
  }

  const icon = directoryToggle.querySelector("[aria-hidden='true']");
  if (icon) icon.textContent = expanded ? "-" : "+";
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  if (themeToggle) themeToggle.setAttribute("aria-pressed", String(nextTheme === "dark"));
  if (themeLabel) themeLabel.textContent = nextTheme === "dark" ? "Dark" : "Light";
}

function saveTheme(theme) {
  try {
    localStorage.setItem("tokenmaxx-theme", theme);
  } catch {
    // Ignore storage failures; the toggle still works for the current page.
  }
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
  if (!setupCommand && !setupCommandPreview) return;

  const parts = ["/update-stats setup"];
  const location = locationInput?.value.trim();
  const countryText = countryInput?.value.trim();
  const country = resolveCountry(countryText);

  if (location) parts.push("--location", quoteArg(location));
  if (country) parts.push("--country", quoteArg(country.name));
  else if (countryText) parts.push("--country", quoteArg(countryText));

  const command = parts.join(" ");
  if (setupCommand) setupCommand.textContent = command;
  if (setupCommandPreview) setupCommandPreview.textContent = command;

  if (countryHint) {
    countryHint.textContent = country
      ? `${country.flag} ${country.name} will be saved with your profile.`
      : "Type a country name or two-letter code; the flag is added automatically.";
  }
}

populateCountryOptions();
applyTheme(document.documentElement.dataset.theme);
locationInput?.addEventListener("input", updateSetupCommand);
countryInput?.addEventListener("input", updateSetupCommand);
ambassadorSearch?.addEventListener("input", renderAmbassadors);
directoryToggle?.addEventListener("click", () => {
  setDirectoryExpanded(directoryToggle.getAttribute("aria-expanded") !== "true");
});
setDirectoryExpanded(false);
themeToggle?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  saveTheme(nextTheme);
});

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

Promise.all([loadProfiles(), loadAmbassadors()]).then(([loadedProfiles, loadedAmbassadors]) => {
  profiles = loadedProfiles;
  ambassadors = loadedAmbassadors;
  render();
});
