#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  normalizeProfile,
  parseDays,
  parseDuration,
  parseTokenCount,
  profileId,
  upsertProfile
} from "./profile-store.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localDataPath = process.env.TOKENMAXX_DATA_PATH
  ? path.resolve(process.env.TOKENMAXX_DATA_PATH)
  : path.join(repoRoot, "data", "profiles.json");
const defaultRepository = "globodex/tokenmaxx-board";
const dataFilePath = "data/profiles.json";

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

const repository = args.repo || process.env.TOKENMAXX_REPOSITORY || defaultRepository;
const branch = args.branch || process.env.TOKENMAXX_BRANCH || "main";
const sourceFile = args["source-file"] ? path.resolve(args["source-file"]) : null;
const dryRun = Boolean(args["dry-run"]);

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

const remote = sourceFile
  ? readSourceFile(sourceFile)
  : fetchRemoteDatabase(repository, branch);
if (sourceFile && !dryRun) {
  throw new Error("--source-file is only supported with --dry-run");
}
const nextDatabase = upsertProfile(remote.database, profile);
const content = `${JSON.stringify(nextDatabase, null, 2)}\n`;

fs.mkdirSync(path.dirname(localDataPath), { recursive: true });
fs.writeFileSync(localDataPath, content);

if (dryRun) {
  console.log(`Dry run: would sync ${profile.name} (${profile.handle}) to ${repository}:${branch}/${dataFilePath}`);
} else {
  updateRemoteDatabase(repository, branch, remote.sha, content, profile);
  console.log(`Synced ${profile.name} (${profile.handle}) to ${repository}:${branch}/${dataFilePath}`);
}

console.log(`Updated local preview at ${path.relative(repoRoot, localDataPath) || localDataPath}`);
console.log(`Lifetime tokens: ${profile.lifetimeTokens.toLocaleString("en-US")}`);

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const rawKey = argv[index];
    if (!rawKey.startsWith("--")) {
      throw new Error(`Unexpected argument: ${rawKey}`);
    }

    const key = aliases[rawKey] || rawKey;
    if (key === "--help" || key === "--dry-run") {
      parsed[key.slice(2)] = true;
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

function readSourceFile(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return {
    sha: "source-file",
    database: {
      version: 1,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : []
    }
  };
}

function fetchRemoteDatabase(repository, branch) {
  const result = runGh(["api", `repos/${repository}/contents/${dataFilePath}?ref=${encodeURIComponent(branch)}`]);
  const payload = JSON.parse(result.stdout);
  const decoded = Buffer.from(String(payload.content).replace(/\n/g, ""), "base64").toString("utf8");
  const parsed = JSON.parse(decoded);

  return {
    sha: payload.sha,
    database: {
      version: 1,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : []
    }
  };
}

function updateRemoteDatabase(repository, branch, sha, content, profile) {
  const body = JSON.stringify({
    message: `chore(data): sync ${profile.handle} profile`,
    content: Buffer.from(content, "utf8").toString("base64"),
    sha,
    branch
  });

  runGh([
    "api",
    "--method", "PUT",
    `repos/${repository}/contents/${dataFilePath}`,
    "--input", "-"
  ], body);
}

function runGh(args, input) {
  const result = spawnSync("gh", args, {
    cwd: repoRoot,
    input,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(`gh ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
  }

  return result;
}

function printHelp() {
  console.log(`Usage:
  node scripts/sync-profile.mjs \\
    --name "Daniel Green" \\
    --handle "@daniel.green" \\
    --location "San Francisco" \\
    --country "United States" \\
    --lifetime 16B \\
    --peak 1.7B \\
    --task "18h 10m" \\
    --current 57 \\
    --longest 65

Sync target:
  Defaults to ${defaultRepository}:${branch}/${dataFilePath}.
  Requires GitHub CLI auth with write access to the Globodex repo.

Options:
  --repo owner/name
  --branch branch-name
  --dry-run

Optional profile metadata:
  --location "Austin"
  --country "United States"
  --country-code US
  --flag "🇺🇸"  # optional override; usually derived from country
`);
}
