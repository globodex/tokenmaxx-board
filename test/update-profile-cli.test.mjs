import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const scriptPath = path.join(repoRoot, "scripts", "update-profile.mjs");
const syncScriptPath = path.join(repoRoot, "scripts", "sync-profile.mjs");

describe("update-profile command", () => {
  it("updates a temp leaderboard database without touching committed seed data", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tokenmaxx-cli-"));
    const dataPath = path.join(tempDir, "profiles.json");
    await fs.writeFile(dataPath, JSON.stringify({ version: 1, profiles: [] }));

    const result = spawnSync(process.execPath, [
      scriptPath,
      "--name", "Command Tester",
      "--handle", "@command.tester",
      "--location", "Austin",
      "--country", "United States",
      "--lifetime", "2.4B",
      "--peak", "320M",
      "--task", "9h 15m",
      "--current", "12",
      "--longest", "21"
    ], {
      cwd: repoRoot,
      env: {
        ...process.env,
        TOKENMAXX_DATA_PATH: dataPath
      },
      encoding: "utf8"
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Updated Command Tester/);

    const database = JSON.parse(await fs.readFile(dataPath, "utf8"));
    assert.equal(database.profiles.length, 1);
    assert.equal(database.profiles[0].handle, "@command.tester");
    assert.equal(database.profiles[0].location, "Austin");
    assert.equal(database.profiles[0].country, "United States");
    assert.equal(database.profiles[0].countryCode, "US");
    assert.equal(database.profiles[0].flag, "🇺🇸");
    assert.equal(database.profiles[0].lifetimeTokens, 2400000000);
    assert.equal(database.profiles[0].peakTokens, 320000000);
    assert.equal(database.profiles[0].longestTaskMinutes, 555);
  });
});

describe("sync-profile command", () => {
  it("builds the shared leaderboard update from a source file in dry-run mode", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tokenmaxx-sync-"));
    const sourcePath = path.join(tempDir, "source.json");
    const localPath = path.join(tempDir, "local.json");
    await fs.writeFile(sourcePath, JSON.stringify({ version: 1, profiles: [] }));

    const result = spawnSync(process.execPath, [
      syncScriptPath,
      "--name", "Globodex Member",
      "--handle", "@globodex.member",
      "--location", "London",
      "--country-code", "GB",
      "--lifetime", "3B",
      "--peak", "500M",
      "--task", "10h",
      "--current", "14",
      "--longest", "22",
      "--source-file", sourcePath,
      "--dry-run"
    ], {
      cwd: repoRoot,
      env: {
        ...process.env,
        TOKENMAXX_DATA_PATH: localPath
      },
      encoding: "utf8"
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /would sync Globodex Member/);
    assert.match(result.stdout, /globodex\/tokenmaxx-board/);

    const database = JSON.parse(await fs.readFile(localPath, "utf8"));
    assert.equal(database.profiles.length, 1);
    assert.equal(database.profiles[0].handle, "@globodex.member");
    assert.equal(database.profiles[0].location, "London");
    assert.equal(database.profiles[0].country, "United Kingdom");
    assert.equal(database.profiles[0].countryCode, "GB");
    assert.equal(database.profiles[0].flag, "🇬🇧");
    assert.equal(database.profiles[0].lifetimeTokens, 3000000000);
  });
});
