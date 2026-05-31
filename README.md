# Tokenmaxx Board

Unofficial scoreboard for Codex community ambassadors. It tracks the fun internal-profile numbers that make sense for community builders: total tokens used, current streak, longest task, focus area, and a simple composite score.

## Project Use

- Run lightweight ambassador leaderboards for workshops, office hours, demo nights, or internal community challenges.
- Let people add or update profiles locally without a backend.
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
score = tokens / 10000 + streak_days * 42 + longest_task_hours * 24
```

That keeps tokens meaningful while still rewarding consistency and ambitious long-running tasks. Adjust the weights in `app.js` if the ambassador league wants a different culture.

## Notes

- Data stays in the browser through `localStorage`.
- The reset button restores the demo seed profiles.
- The app is unofficial and has no dependency on Codex account data or private telemetry.
