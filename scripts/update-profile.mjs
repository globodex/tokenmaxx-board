#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildSupabaseRow,
  normalizeProfile,
  parseDays,
  parseDuration,
  parseTokenCount,
  profileId,
  scoreFor,
  upsertProfile
} from "./profile-store.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(repoRoot, "data", "profiles.json");

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
  lifetimeTokens: parseTokenCount(args["lifetime-tokens"]),
  peakTokens: parseTokenCount(args["peak-tokens"]),
  longestTaskMinutes: parseDuration(args["longest-task"]),
  currentStreak: parseDays(args["current-streak"]),
  longestStreak: parseDays(args["longest-streak"])
});

const nextDatabase = upsertProfile(readDatabase(), profile);
fs.writeFileSync(dataPath, `${JSON.stringify(nextDatabase, null, 2)}\n`);

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  await updateSupabase(profile);
  console.log("Updated persistent database via Supabase REST.");
}

console.log(`Updated ${profile.name} (${profile.handle}) in data/profiles.json`);
console.log(`Score: ${scoreFor(profile).toLocaleString("en-US")}`);

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

async function updateSupabase(profile) {
  const url = `${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/profiles`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify(buildSupabaseRow(profile))
  });

  if (!response.ok) {
    throw new Error(`Supabase update failed: ${response.status} ${await response.text()}`);
  }
}

function printHelp() {
  console.log(`Usage:
  node scripts/update-profile.mjs \\
    --name "Daniel Green" \\
    --handle "@daniel.green" \\
    --lifetime-tokens 16B \\
    --peak-tokens 1.7B \\
    --longest-task "18h 10m" \\
    --current-streak 57 \\
    --longest-streak 65

Short aliases:
  --lifetime, --peak, --task, --current, --longest

Persistent database:
  Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to upsert the same profile to Supabase.
`);
}
