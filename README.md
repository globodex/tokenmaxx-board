# Tokenmaxx Board

Unofficial scoreboard for Codex community ambassadors. It tracks the profile-style numbers exposed by the Codex profile surface: lifetime tokens, peak tokens, longest task, current streak, longest streak, token activity, and a simple composite score.

## Project Use

- Run lightweight ambassador leaderboards for workshops, office hours, demo nights, or internal community challenges.
- Let people add or update profiles from a Codex-visible profile screenshot or manual stat values.
- Compare profiles through a calm, OpenAI-adjacent profile surface without using OpenAI branding.
- Keep the project remixable: plain HTML, CSS, JavaScript, checked-in seed data, and optional Supabase persistence.

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
/update-stats @your.handle
```

Codex should read the profile stats you show it, update the persistent database when Supabase credentials are configured, run the local checks, and verify the page. Without Supabase credentials, the script updates `data/profiles.json` for local development.

If you want to update manually from a terminal:

```bash
node scripts/update-profile.mjs \
  --name "Daniel Green" \
  --handle "@daniel.green" \
  --lifetime 16B \
  --peak 1.7B \
  --task "18h 10m" \
  --current 57 \
  --longest 65
```

Official OpenAI docs say Codex Profile displays lifetime tokens, peak tokens, streaks, longest task, and token activity. They do not document a public stats storage file or API, so this project treats visible/profile-provided stats as the source of truth.

## Persistent Database

The production path is Supabase Postgres:

1. Run `supabase/schema.sql` in your Supabase project.
2. Copy `config.example.js` values into `config.js` using your public anon key so the page can read profiles.
3. Set server-side update credentials when running the command:

```bash
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

The service role key must stay out of the browser and out of Git. It is only for the local Codex update command.

## Project Skill

This project is intentionally a tiny static app. The useful skill is the scoring model:

```text
score = lifetime_tokens / 10000000
      + peak_tokens / 5000000
      + longest_task_minutes * 0.65
      + current_streak_days * 18
      + longest_streak_days * 10
```

That keeps lifetime usage meaningful while still rewarding peak intensity, consistency, and ambitious long-running tasks. Adjust the weights in `app.js` if the ambassador league wants a different culture.

## Notes

- Shared leaderboard seed data lives in `data/profiles.json`.
- The page reads Supabase when configured, otherwise it reads the checked-in JSON seed.
- The reset button restores the currently loaded source profiles.
- The app is unofficial and has no dependency on Codex account data or private telemetry.
- Seed profiles are fictional. Add real profiles manually only when people opt in.
