# Tokenmaxx Board

An unofficial leaderboard for Globodex Codex ambassadors. It tracks the profile-style numbers people can see on Codex profile pages: lifetime tokens, peak tokens, longest task, current streak, and longest streak.

Live board: https://globodex.github.io/tokenmaxx-board/

## Participate

The easiest way to update the board is through Codex. Start with a screenshot of your visible Codex profile stats.

First-time setup:

```text
/update-stats setup
```

Later refreshes:

```text
/update-stats
```

Codex reads the visible stats, can add optional location and country metadata, updates `data/profiles.json`, runs checks, and helps verify the board.

## How Updates Stay Trustworthy

The board is meant to be easy for the community to audit.

- Stats should come from visible Codex profile screenshots or visible profile text.
- Optional location and country fields are contributor-provided metadata.
- If a stat is unclear, leave it out until there is a clearer screenshot or profile view.
- `data/profiles.json` is the shared source for the ranked leaderboard.

## Submission Paths

There are two supported ways to get an update into the board.

### Maintainer Sync

Maintainers with write access can sync a profile directly:

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

That command updates `data/profiles.json` in GitHub. GitHub Pages publishes from the latest `main` branch.

### Pull Request Submissions

Community submissions can come through pull requests. The daily automation can merge straightforward leaderboard updates when a PR:

- targets `main`
- is not a draft
- changes only `data/profiles.json`
- passes `npm run check`
- merges cleanly

PRs that touch app code, workflows, docs, or other data files wait for a human review. That keeps the auto-merge path focused on simple leaderboard data updates.

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

- `data/profiles.json` is the ranked leaderboard data.
- `data/ambassadors.json` is an unranked public directory sourced from the OpenAI Developers Codex Ambassadors page.
- Lifetime tokens are the default ranking lens.
- Peak tokens, longest task, current streak, and longest streak are secondary sort modes.

The app is plain HTML, CSS, and JavaScript. It does not depend on private telemetry or a public Codex stats API.

## Maintainer Notes

GitHub Pages should be configured to publish with GitHub Actions, not the legacy branch source. GitHub documents that commits pushed by a workflow using the default `GITHUB_TOKEN` do not trigger a legacy Pages build, so this repo deploys Pages explicitly from Actions.

Please keep the auto-merge criteria narrow. Leaderboard PRs should stay data-only, while code and workflow changes should remain human-reviewed.
