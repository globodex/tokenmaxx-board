---
description: Set up or sync Tokenmaxx leaderboard stats from a Codex profile screenshot
argument-hint: [setup|optional profile name or handle]
---

Set up or update this repository's Tokenmaxx Board leaderboard from a Codex profile screenshot, pasted profile text, or browser-visible profile page.

Follow this workflow:

1. Decide the flow:
   - First-time setup when the user passes `setup`, is not already listed, or asks to create/manage their profile.
   - Returning sync when the user is already listed and only wants stat refresh.
2. Prefer a user-provided Codex profile screenshot. If no screenshot is available, inspect pasted profile text or a browser-visible profile page.
3. Extract exactly these fields: display name, handle, lifetime tokens, peak tokens, longest task, current streak, longest streak.
4. For first-time setup, ask whether they want to add an optional location and/or country. They can type a country name or two-letter country code; the sync script derives the flag emoji automatically. Do not block sync if they skip either field.
5. If any stat field is missing, ask for only the missing field or ask the user to attach a Codex profile screenshot.
6. Confirm the ambassador should be listed as a Globodex member. If they have not joined Globodex yet, send them to https://github.com/globodex and ask them to join or get an invite before syncing.
7. Confirm `gh auth status` succeeds for a GitHub account that belongs to the Globodex org or otherwise has write access to `globodex/tokenmaxx-board`.
8. Run `npm run sync:profile --` with the extracted values. Include `--location`, `--country`, or `--country-code` when provided. Use compact values like `16B`, `1.7B`, and quoted durations like `"18h 10m"`.
9. Run `npm run check`.
10. If a local server is available or easy to start, open `http://127.0.0.1:5173/` in the in-app browser and verify the updated profile appears.
11. Show the exact command you ran, the GitHub sync target, and summarize the changed row.

Do not invent stats. Do not scrape private data beyond what the user has explicitly shown or asked you to inspect. Official docs confirm these stats are visible on Codex Profile, but do not document a public stats storage file or API. The shared source of truth for this project is `globodex/tokenmaxx-board/data/profiles.json`.
