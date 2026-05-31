# Tokenmaxx Board

Unofficial scoreboard for Codex community ambassadors. It tracks the profile-style numbers exposed by the Codex profile surface: lifetime tokens, peak tokens, longest task, current streak, longest streak, token activity, and a simple composite score.

## Project Use

- Run lightweight ambassador leaderboards for workshops, office hours, demo nights, or internal community challenges.
- Let people add or update profiles locally without a backend.
- Compare profiles through a calm, OpenAI-adjacent profile surface without using OpenAI branding.
- Keep the project remixable: plain HTML, CSS, and JavaScript with `localStorage` persistence.

## Project Start

Open `index.html` directly in a browser, or serve the folder locally:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

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

- Data stays in the browser through `localStorage`.
- The reset button restores the demo seed profiles.
- The app is unofficial and has no dependency on Codex account data or private telemetry.
- Seed profiles are fictional. Add real profiles manually only when people opt in.
