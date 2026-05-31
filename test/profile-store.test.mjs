import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildSupabaseRow,
  parseDuration,
  parseTokenCount,
  upsertProfile
} from "../scripts/profile-store.mjs";

describe("profile stat parsing", () => {
  it("parses compact token counts from Codex profile stats", () => {
    assert.equal(parseTokenCount("16B"), 16000000000);
    assert.equal(parseTokenCount("1.7B"), 1700000000);
    assert.equal(parseTokenCount("420M"), 420000000);
  });

  it("parses longest task durations", () => {
    assert.equal(parseDuration("18h 10m"), 1090);
    assert.equal(parseDuration("17.7"), 1062);
  });
});

describe("profile persistence helpers", () => {
  const profile = {
    name: "Daniel Green",
    handle: "@daniel.green",
    lifetimeTokens: 16000000000,
    peakTokens: 1700000000,
    longestTaskMinutes: 1090,
    currentStreak: 57,
    longestStreak: 65
  };

  it("upserts a profile and sorts the board by score", () => {
    const database = {
      version: 1,
      updatedAt: "2026-05-31T00:00:00.000Z",
      profiles: [
        {
          id: "ada-launch",
          name: "Ada Launch",
          handle: "@ada.launch",
          lifetimeTokens: 12400000000,
          peakTokens: 1300000000,
          longestTaskMinutes: 1062,
          currentStreak: 42,
          longestStreak: 58,
          activitySeed: 7
        }
      ]
    };

    const next = upsertProfile(database, profile, "2026-05-31T01:00:00.000Z");

    assert.equal(next.updatedAt, "2026-05-31T01:00:00.000Z");
    assert.equal(next.profiles.length, 2);
    assert.equal(next.profiles[0].id, "daniel-green");
  });

  it("builds the row shape used by the persistent database", () => {
    assert.deepEqual(buildSupabaseRow({ ...profile, id: "daniel-green", activitySeed: 1195 }), {
      id: "daniel-green",
      name: "Daniel Green",
      handle: "@daniel.green",
      lifetime_tokens: 16000000000,
      peak_tokens: 1700000000,
      longest_task_minutes: 1090,
      current_streak: 57,
      longest_streak: 65,
      activity_seed: 1195
    });
  });
});
