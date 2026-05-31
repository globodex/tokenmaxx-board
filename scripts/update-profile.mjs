#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeProfile,
  parseDays,
  parseDuration,
  parseTokenCount,
  profileId,
  upsertProfile
} from "./profile-store.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = process.env.TOKENMAXX_DATA_PATH
  ? path.resolve(process.env.TOKENMAXX_DATA_PATH)
  : path.join(repoRoot, "data", "profiles.json");

const aliases = {
  "--current": "--current-streak",
  "--longest": "--longest-streak",
  "--task": "--longest-task",
  "--lifetime": "--lifetime-tokens",
  "--peak": "--peak-tokens"
};

const args = parseArgs(process.argv.slice(2));

if (args.help || Object.keys(args).length === 0) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const required = ["name", "handle", "lifetime-tokens", "peak-tokens", "longest-task", "current-streak", "longest-streak"];
const missing = required.filter((key) => !args[key]);

if (missing.length) {
  console.error(`Missing required flags: ${missing.map((key) => `--${key}`).join(", ")}`);
  printHelp();
  process.exit(1);
}

const profile = normalizeProfile({
  id: args.id || profileId(args.name),
  name: args.name,
  handle: args.handle,
  location: args.location,
  country: args.country,
  countryCode: args["country-code"],
  flag: args.flag,
  lifetimeTokens: parseTokenCount(args["lifetime-tokens"]),
  peakTokens: parseTokenCount(args["peak-tokens"]),
  longestTaskMinutes: parseDuration(args["longest-task"]),
  currentStreak: parseDays(args["current-streak"]),
  longestStreak: parseDays(args["longest-streak"])
});

const nextDatabase = upsertProfile(readDatabase(), profile);
fs.mkdirSync(path.dirname(dataPath), { recursive: true });
fs.writeFileSync(dataPath, `${JSON.stringify(nextDatabase, null, 2)}\n`);

console.log(`Updated ${profile.name} (${profile.handle}) in ${path.relative(repoRoot, dataPath) || dataPath}`);
console.log(`Lifetime tokens: ${profile.lifetimeTokens.toLocaleString("en-US")}`);

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const rawKey = argv[index];
    if (!rawKey.startsWith("--")) {
      throw new Error(`Unexpected argument: ${rawKey}`);
    }

    const key = aliases[rawKey] || rawKey;
    if (key === "--help") {
      parsed.help = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${rawKey}`);
    }

    parsed[key.slice(2)] = value;
    index += 1;
  }

  return parsed;
}

function readDatabase() {
  if (!fs.existsSync(dataPath)) {
    return { version: 1, updatedAt: new Date().toISOString(), profiles: [] };
  }

  const parsed = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  return {
    version: 1,
    updatedAt: parsed.updatedAt || new Date().toISOString(),
    profiles: Array.isArray(parsed.profiles) ? parsed.profiles : []
  };
}

function printHelp() {
  console.log(`Usage:
  node scripts/update-profile.mjs \\
    --name "Daniel Green" \\
    --handle "@daniel.green" \\
    --location "San Francisco" \\
    --country "United States" \\
    --lifetime-tokens 16B \\
    --peak-tokens 1.7B \\
    --longest-task "18h 10m" \\
    --current-streak 57 \\
    --longest-streak 65

Short aliases:
  --lifetime, --peak, --task, --current, --longest

Optional profile metadata:
  --location "Austin"
  --country "United States"
  --country-code US
  --flag "🇺🇸"  # optional override; usually derived from country

Shared sync:
  Use scripts/sync-profile.mjs to update globodex/tokenmaxx-board through GitHub.
`);
}
