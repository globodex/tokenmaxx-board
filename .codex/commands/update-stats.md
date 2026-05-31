---
description: Update Tokenmaxx leaderboard stats
argument-hint: [optional profile name or handle]
---

Update this repository's Tokenmaxx Board leaderboard for the ambassador named in `$ARGUMENTS`, or for the current user if no name is provided.

Follow this workflow:

1. Inspect the ambassador's exposed Codex profile stats from the user-provided screenshot, pasted profile text, or browser-visible profile page.
2. Extract exactly these fields: display name, handle, lifetime tokens, peak tokens, longest task, current streak, longest streak.
3. If any field is missing, ask for only the missing field or ask the user to attach a profile screenshot.
4. Run `node scripts/update-profile.mjs` with the extracted values. Use compact values like `16B`, `1.7B`, and quoted durations like `"18h 10m"`.
   - If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present, the script also updates the persistent database.
   - If they are not present, it updates `data/profiles.json` for local development and PR review.
5. Run `/Applications/Codex.app/Contents/Resources/node --check app.js`.
6. If a local server is available or easy to start, open `http://127.0.0.1:5173/` in the in-app browser and verify the updated profile appears.
7. Show the exact command you ran and summarize the changed row.

Do not invent stats. Do not scrape private data beyond what the user has explicitly shown or asked you to inspect. Official docs confirm these stats are visible on Codex Profile, but do not document a public stats storage file or API.
