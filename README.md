# Tokenmaxx Board

Unofficial scoreboard for Globodex Codex ambassadors. It tracks the profile-style numbers visible on the Codex profile surface: lifetime tokens, peak tokens, longest task, current streak, and longest streak.

Live board: https://globodex.github.io/tokenmaxx-board/

## How To Use It

Most people should interact with the board through Codex:

```text
/update-stats setup
```

Attach a Codex profile screenshot when prompted. Codex reads the visible stats, asks for optional location/country, updates `data/profiles.json`, runs checks, and verifies the page.

For later refreshes, use:

```text
/update-stats
```

Do not invent stats. This project treats visible/profile-provided Codex profile stats as the source of truth.

## Submission Paths

There are two supported ways to update the board.

**Direct sync for maintainers**

Use this when your GitHub account can write to `globodex/tokenmaxx-board`:

```bash
npm run sync:profile -- \
  --name "Daniel Green" \
  --handle "@daniel.green" \
  --location "Kansas City" \
  --country "United States" \
  --lifetime 16B \
  --peak 1.7B \
  --task "18h 10m" \
  --current 57 \
  --longest 65
```

That command updates the shared `data/profiles.json` file in GitHub. GitHub Pages deploys from the latest `main` branch.

**Pull request submissions**

Use this when someone submits a leaderboard update through a PR. The daily automation only auto-merges PRs that:

- target `main`
- are not drafts
- change only `data/profiles.json`
- pass `npm run check`
- merge cleanly

PRs that touch app code, workflows, README text, or other data files are intentionally skipped for manual review.

## Daily Automation

The repo has three GitHub Actions workflows:

- `Validate` runs `npm run check` on pushes and pull requests.
- `Merge Leaderboard Submissions` runs once per day at `14:17 UTC` and can also be started manually from the Actions tab.
- `Deploy Pages` publishes the static site to GitHub Pages on pushes to `main`, once per day at `14:37 UTC`, or manually.

The merge workflow validates each eligible data-only PR before merging it. After the merge pass, it deploys the latest `main` branch and checks that the live `data/profiles.json` matches the repository copy.

## Local Development

Serve the static app:

```bash
npm start
```

Then open:

```text
http://localhost:5173
```

Run the full local check:

```bash
npm run check
```

Validate only the leaderboard data:

```bash
npm run validate:data
```

Verify the deployed Pages data against local `data/profiles.json`:

```bash
npm run verify:pages
```

## Data Model

- `data/profiles.json` is the canonical ranked leaderboard data.
- `data/ambassadors.json` is an unranked public directory sourced from the OpenAI Developers Codex Ambassadors page.
- Lifetime tokens are the default ranking lens.
- Peak tokens, longest task, current streak, and longest streak are secondary sort modes.

The app is plain HTML, CSS, and JavaScript. There is no private telemetry dependency and no public Codex stats API dependency.

## Maintainer Notes

GitHub Pages should be configured to publish with GitHub Actions, not the legacy branch source. GitHub documents that commits pushed by a workflow using the default `GITHUB_TOKEN` do not trigger a legacy Pages build, so this repo deploys Pages explicitly from Actions.

Before changing the automation, keep the auto-merge criteria narrow. Leaderboard PRs should stay data-only; code and workflow changes should remain human-reviewed.
