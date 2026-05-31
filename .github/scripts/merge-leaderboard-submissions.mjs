#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const repo = process.env.GITHUB_REPOSITORY || gh(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]).trim();
const defaultBranch = process.env.TOKENMAXX_DEFAULT_BRANCH
  || gh(["repo", "view", repo, "--json", "defaultBranchRef", "--jq", ".defaultBranchRef.name"]).trim();
const allowedFiles = new Set(
  (process.env.TOKENMAXX_ALLOWED_FILES || "data/profiles.json")
    .split(",")
    .map((file) => file.trim())
    .filter(Boolean)
);

const pullRequests = JSON.parse(gh([
  "pr", "list",
  "--repo", repo,
  "--state", "open",
  "--base", defaultBranch,
  "--limit", "100",
  "--json", "number,title,isDraft,url"
]));

let merged = 0;
const skipped = [];

if (!pullRequests.length) {
  console.log("No open leaderboard submission PRs found.");
  writeOutput("merged_count", "0");
  process.exit(0);
}

for (const pullRequest of pullRequests) {
  const label = `#${pullRequest.number} ${pullRequest.title}`;

  if (pullRequest.isDraft) {
    skipped.push(`${label}: draft PR`);
    continue;
  }

  const files = changedFiles(pullRequest.number);
  if (!files.length) {
    skipped.push(`${label}: no changed files`);
    continue;
  }

  const disallowed = files.filter((file) => !allowedFiles.has(file));
  if (disallowed.length) {
    skipped.push(`${label}: changes non-leaderboard files (${disallowed.join(", ")})`);
    continue;
  }

  const checkedOut = run("gh", ["pr", "checkout", String(pullRequest.number), "--repo", repo, "--detach"]);
  if (checkedOut.status !== 0) {
    skipped.push(`${label}: checkout failed`);
    continue;
  }

  const check = run("npm", ["run", "check"]);
  if (check.status !== 0) {
    skipped.push(`${label}: validation failed`);
    checkoutDefaultBranch();
    continue;
  }

  checkoutDefaultBranch();

  const merge = run("gh", [
    "pr", "merge", String(pullRequest.number),
    "--repo", repo,
    "--squash",
    "--delete-branch",
    "--subject", `chore(data): merge leaderboard submission #${pullRequest.number}`
  ]);

  if (merge.status !== 0) {
    skipped.push(`${label}: merge failed`);
    continue;
  }

  merged += 1;
  console.log(`Merged ${label}`);
  checkoutDefaultBranch();
}

for (const reason of skipped) {
  console.log(`Skipped ${reason}`);
}

writeOutput("merged_count", String(merged));
console.log(`Merged ${merged} leaderboard submission PR${merged === 1 ? "" : "s"}.`);

function changedFiles(number) {
  const payload = JSON.parse(gh([
    "pr", "view", String(number),
    "--repo", repo,
    "--json", "files"
  ]));

  return Array.isArray(payload.files) ? payload.files.map((file) => file.path) : [];
}

function checkoutDefaultBranch() {
  if (process.env.GITHUB_ACTIONS !== "true") {
    throw new Error("Refusing to reset a local checkout outside GitHub Actions.");
  }

  runRequired("git", ["fetch", "origin", defaultBranch]);
  runRequired("git", ["checkout", "-B", defaultBranch, `origin/${defaultBranch}`]);
}

function gh(args) {
  return runRequired("gh", args, { silent: true }).stdout;
}

function runRequired(command, args, options = {}) {
  const result = run(command, args, options);
  if (result.status !== 0) {
    if (options.silent) {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
    }
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
  return result;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (!options.silent && result.stdout) process.stdout.write(result.stdout);
  if (!options.silent && result.stderr) process.stderr.write(result.stderr);
  return result;
}

function writeOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}
