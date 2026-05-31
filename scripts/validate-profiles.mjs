#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  COUNTRY_CODES,
  normalizeProfile,
  profileId
} from "./profile-store.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = process.env.TOKENMAXX_DATA_PATH
  ? path.resolve(process.env.TOKENMAXX_DATA_PATH)
  : path.join(repoRoot, "data", "profiles.json");

const errors = [];
const database = readDatabase(dataPath);

if (database.version !== 1) {
  errors.push("version must be 1");
}

if (!database.updatedAt || Number.isNaN(new Date(database.updatedAt).getTime())) {
  errors.push("updatedAt must be a valid ISO timestamp");
}

if (!Array.isArray(database.profiles)) {
  errors.push("profiles must be an array");
}

const profiles = Array.isArray(database.profiles) ? database.profiles : [];
const ids = new Set();
const handles = new Set();
const normalizedProfiles = profiles.map((profile, index) => validateProfile(profile, index));

for (let index = 1; index < normalizedProfiles.length; index += 1) {
  const previous = normalizedProfiles[index - 1];
  const current = normalizedProfiles[index];
  if (!previous || !current) continue;

  const lifetimeOrder = previous.lifetimeTokens - current.lifetimeTokens;
  const nameOrder = previous.name.localeCompare(current.name);
  if (lifetimeOrder < 0 || (lifetimeOrder === 0 && nameOrder > 0)) {
    errors.push("profiles must be sorted by lifetimeTokens descending, then name ascending");
    break;
  }
}

if (errors.length) {
  console.error(`Invalid ${path.relative(repoRoot, dataPath) || dataPath}:`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${profiles.length} leaderboard profile${profiles.length === 1 ? "" : "s"}.`);

function readDatabase(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`Unable to read ${path.relative(repoRoot, filePath) || filePath}: ${error.message}`);
    process.exit(1);
  }
}

function validateProfile(rawProfile, index) {
  let profile;
  const label = rawProfile?.name || rawProfile?.id || `profile ${index + 1}`;

  try {
    profile = normalizeProfile(rawProfile || {});
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
    return null;
  }

  if (!profile.id) {
    errors.push(`${label}: id is required`);
  }

  if (profile.id !== profileId(profile.id)) {
    errors.push(`${label}: id must be URL-safe lowercase text`);
  }

  if (!profile.name) {
    errors.push(`${label}: name is required`);
  }

  if (!profile.handle || !profile.handle.startsWith("@")) {
    errors.push(`${label}: handle must start with @`);
  }

  validateNumber(profile, "lifetimeTokens", label);
  validateNumber(profile, "peakTokens", label);
  validateNumber(profile, "longestTaskMinutes", label);
  validateNumber(profile, "currentStreak", label);
  validateNumber(profile, "longestStreak", label);
  validateNumber(profile, "activitySeed", label);

  if (profile.countryCode && !COUNTRY_CODES.includes(profile.countryCode)) {
    errors.push(`${label}: countryCode must be a supported two-letter region code`);
  }

  const idKey = profile.id.toLowerCase();
  if (ids.has(idKey)) {
    errors.push(`${label}: duplicate id ${profile.id}`);
  }
  ids.add(idKey);

  const handleKey = profile.handle.toLowerCase();
  if (handles.has(handleKey)) {
    errors.push(`${label}: duplicate handle ${profile.handle}`);
  }
  handles.add(handleKey);

  return profile;
}

function validateNumber(profile, key, label) {
  if (!Number.isFinite(profile[key]) || profile[key] < 0) {
    errors.push(`${label}: ${key} must be a non-negative number`);
  }
}
