import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  parseDays,
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

  it("parses streak day labels", () => {
    assert.equal(parseDays("57 days"), 57);
    assert.equal(parseDays("65"), 65);
  });
});

describe("profile persistence helpers", () => {
  const profile = {
    name: "Daniel Green",
    handle: "@daniel.green",
    location: "Chicago",
    flag: "🇺🇸",
    lifetimeTokens: 16000000000,
    peakTokens: 1700000000,
    longestTaskMinutes: 1090,
    currentStreak: 57,
    longestStreak: 65
  };

  it("upserts a profile and sorts the board by lifetime tokens", () => {
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
    assert.equal(next.profiles[0].location, "Chicago");
    assert.equal(next.profiles[0].flag, "🇺🇸");
  });

  it("replaces an existing profile with the same id", () => {
    const database = {
      version: 1,
      updatedAt: "2026-05-31T00:00:00.000Z",
      profiles: [{ ...profile, id: "daniel-green", lifetimeTokens: 1 }]
    };

    const next = upsertProfile(database, { ...profile, id: "daniel-green" }, "2026-05-31T01:00:00.000Z");

    assert.equal(next.profiles.length, 1);
    assert.equal(next.profiles[0].lifetimeTokens, 16000000000);
  });
});
