import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const scriptPath = path.join(repoRoot, "scripts", "update-profile.mjs");

describe("update-profile command", () => {
  it("updates a temp leaderboard database without touching committed seed data", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tokenmaxx-cli-"));
    const dataPath = path.join(tempDir, "profiles.json");
    await fs.writeFile(dataPath, JSON.stringify({ version: 1, profiles: [] }));

    const result = spawnSync(process.execPath, [
      scriptPath,
      "--name", "Command Tester",
      "--handle", "@command.tester",
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
    assert.equal(database.profiles[0].lifetimeTokens, 2400000000);
    assert.equal(database.profiles[0].peakTokens, 320000000);
    assert.equal(database.profiles[0].longestTaskMinutes, 555);
  });
});
