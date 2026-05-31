#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeProfile } from "./profile-store.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = process.env.TOKENMAXX_DATA_PATH
  ? path.resolve(process.env.TOKENMAXX_DATA_PATH)
  : path.join(repoRoot, "data", "profiles.json");
const pagesUrl = ensureTrailingSlash(
  process.env.TOKENMAXX_PAGES_URL || "https://globodex.github.io/tokenmaxx-board/"
);
const timeoutMs = Number(process.env.TOKENMAXX_VERIFY_TIMEOUT_MS || 180000);
const intervalMs = Number(process.env.TOKENMAXX_VERIFY_INTERVAL_MS || 10000);
const expected = canonicalDatabase(JSON.parse(fs.readFileSync(dataPath, "utf8")));
const deadline = Date.now() + timeoutMs;

let lastError = "";

while (Date.now() <= deadline) {
  const cacheBust = encodeURIComponent(`${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const url = `${pagesUrl}data/profiles.json?tokenmaxx_verify=${cacheBust}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const actual = canonicalDatabase(await response.json());
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      console.log(`Verified deployed leaderboard data at ${pagesUrl}`);
      process.exit(0);
    }

    lastError = `deployed data does not match ${path.relative(repoRoot, dataPath)}`;
  } catch (error) {
    lastError = error.message;
  }

  if (Date.now() + intervalMs <= deadline) {
    console.log(`Waiting for GitHub Pages to publish latest data: ${lastError}`);
    await sleep(intervalMs);
  }
}

console.error(`GitHub Pages verification failed for ${pagesUrl}: ${lastError}`);
process.exit(1);

function canonicalDatabase(database) {
  return {
    version: database.version,
    updatedAt: database.updatedAt,
    profiles: Array.isArray(database.profiles) ? database.profiles.map(normalizeProfile) : []
  };
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
