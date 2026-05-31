# Tokenmaxx Board

Unofficial scoreboard for Globodex Codex ambassadors. It tracks the profile-style numbers exposed by the Codex profile surface: lifetime tokens, peak tokens, longest task, current streak, and longest streak.

## Project Use

- Run lightweight ambassador leaderboards for workshops, office hours, demo nights, or internal community challenges.
- Give ambassadors a concrete reason to join Globodex and bring their projects into the org.
- Let people add or update profiles from a Codex-visible profile screenshot or manual stat values.
- Compare profiles through a calm, OpenAI-adjacent profile surface without using OpenAI branding.
- Keep the project remixable: plain HTML, CSS, JavaScript, and a GitHub-backed JSON leaderboard.

## Project Start

Open `index.html` directly in a browser, or serve the folder locally:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Join The Board

From this repo in Codex, run:

```text
/update-stats setup
```

Attach a screenshot of your Codex profile first. Codex should read the visible stats, add your optional location and searchable country, derive the flag emoji, sync the shared `data/profiles.json` file in `globodex/tokenmaxx-board`, run the local checks, and verify the page. Participants should be members of the [Globodex GitHub org](https://github.com/globodex) before they sync.

After your row exists, returning updates are just:

```text
/update-stats
```

If you want to update manually from a terminal:

```bash
node scripts/sync-profile.mjs \
  --name "Daniel Green" \
  --handle "@daniel.green" \
  --location "San Francisco" \
  --country "United States" \
  --lifetime 16B \
  --peak 1.7B \
  --task "18h 10m" \
  --current 57 \
  --longest 65
```

Official OpenAI docs say Codex Profile displays lifetime tokens, peak tokens, streaks, longest task, and token activity. They do not document a public stats storage file or API, so this project treats visible/profile-provided stats as the source of truth.

## Shared Database

The shared database is the repo itself:

- `data/profiles.json` is the canonical leaderboard data.
- The static site reads that JSON file directly.
- `scripts/sync-profile.mjs` uses the GitHub CLI to update the JSON in `globodex/tokenmaxx-board`.
- Participants should be in the [Globodex GitHub org](https://github.com/globodex), or they should ask to join before syncing.

Set up GitHub CLI once:

```bash
gh auth login
```

Then run `/update-stats` from Codex. If the GitHub account is a Globodex member with write access to the repo, Codex can commit the updated profile data directly through GitHub.

## Project Skill

This project is intentionally a tiny static app. The ranking model is simple and explainable: lifetime tokens are the default leaderboard order. Peak tokens, longest task, current streak, and longest streak are available as secondary sort modes.

## Notes

- Shared leaderboard data lives in `data/profiles.json`.
- The page reads the checked-in JSON data.
- The reset button restores the currently loaded source profiles.
- The app is unofficial and has no dependency on Codex account data or private telemetry.
- Seed profiles are fictional. Add real profiles manually only when people opt in.
