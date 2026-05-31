const STORAGE_KEY = "tokenmaxx-board-profiles";

const seedProfiles = [
  {
    id: "ada",
    name: "Ada Launch",
    tokens: 1280000,
    streak: 18,
    longest: 21,
    focus: "Workshops"
  },
  {
    id: "max",
    name: "Max Demo",
    tokens: 930000,
    streak: 24,
    longest: 16.5,
    focus: "Demos"
  },
  {
    id: "jules",
    name: "Jules Merge",
    tokens: 760000,
    streak: 11,
    longest: 28,
    focus: "Open source"
  },
  {
    id: "riley",
    name: "Riley Triage",
    tokens: 610000,
    streak: 15,
    longest: 12,
    focus: "Support"
  }
];

let profiles = loadProfiles();
let sortKey = "score";

const form = document.querySelector("#profileForm");
const rows = document.querySelector("#leaderboardRows");
const resetButton = document.querySelector("#resetBoard");
const sortButtons = [...document.querySelectorAll(".sort-button")];
const totalTokens = document.querySelector("#totalTokens");
const bestStreak = document.querySelector("#bestStreak");
const longestTask = document.querySelector("#longestTask");
const activeBuilders = document.querySelector("#activeBuilders");

function loadProfiles() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return seedProfiles;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedProfiles;
  } catch {
    return seedProfiles;
  }
}

function saveProfiles() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function scoreFor(profile) {
  const tokenScore = profile.tokens / 10000;
  const streakScore = profile.streak * 42;
  const taskScore = profile.longest * 24;
  return Math.round(tokenScore + streakScore + taskScore);
}

function sortedProfiles() {
  return [...profiles].sort((a, b) => {
    const values = {
      score: scoreFor(b) - scoreFor(a),
      tokens: b.tokens - a.tokens,
      streak: b.streak - a.streak,
      longest: b.longest - a.longest
    };

    return values[sortKey] || a.name.localeCompare(b.name);
  });
}

function renderTotals() {
  const tokens = profiles.reduce((sum, profile) => sum + profile.tokens, 0);
  const streak = Math.max(...profiles.map((profile) => profile.streak), 0);
  const longest = Math.max(...profiles.map((profile) => profile.longest), 0);

  totalTokens.textContent = formatNumber(tokens);
  bestStreak.textContent = `${streak}d`;
  longestTask.textContent = `${longest}h`;
  activeBuilders.textContent = profiles.length;
}

function renderRows() {
  rows.innerHTML = "";

  sortedProfiles().forEach((profile, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="rank">${index + 1}</span></td>
      <td>
        <div class="ambassador">
          <strong>${escapeHtml(profile.name)}</strong>
          <span>${escapeHtml(profile.id)}</span>
        </div>
      </td>
      <td>
        <strong>${formatNumber(profile.tokens)}</strong>
        <div class="metric-note">tokens</div>
      </td>
      <td><strong>${profile.streak}d</strong></td>
      <td><strong>${profile.longest}h</strong></td>
      <td><span class="focus-pill">${escapeHtml(profile.focus)}</span></td>
      <td class="score">${formatNumber(scoreFor(profile))}</td>
      <td>
        <button class="delete-button" type="button" aria-label="Remove ${escapeHtml(profile.name)}" data-remove="${escapeHtml(profile.id)}">×</button>
      </td>
    `;
    rows.append(row);
  });
}

function render() {
  renderTotals();
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
  const nextProfile = {
    id,
    name,
    tokens: Number(data.get("tokens")),
    streak: Number(data.get("streak")),
    longest: Number(data.get("longest")),
    focus: String(data.get("focus"))
  };

  profiles = profiles.filter((profile) => profile.id !== id).concat(nextProfile);
  saveProfiles();
  form.reset();
  render();
});

rows.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;

  profiles = profiles.filter((profile) => profile.id !== button.dataset.remove);
  saveProfiles();
  render();
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
    renderRows();
  });
});

render();
