#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getCurrentBranchName, validateBranchName } from "../src/node/branchlint.mjs";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const command = process.argv[2];
const args = process.argv.slice(3);

function branchlint() {
  const branchName = args[0] ?? getCurrentBranchName();
  const result = validateBranchName(branchName);
  if (!result.valid) {
    console.error(result.message);
    process.exitCode = 1;
    return;
  }
  console.log(`Valid branch name: "${branchName}"${result.exempt ? " (exempt)" : ""}`);
}

function commitlint() {
  const result = spawnSync("npx", ["--no", "--", "commitlint", ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

function ensureFile(relativePath, templatePath, created, skipped) {
  if (existsSync(relativePath)) {
    skipped.push(relativePath);
    return;
  }
  mkdirSync(dirname(relativePath), { recursive: true });
  copyFileSync(join(packageRoot, "templates", templatePath), relativePath);
  created.push(relativePath);
}

function init() {
  if (!existsSync("package.json")) {
    throw new Error("No package.json found. Run this command from an npm repository root.");
  }
  const gitCheck = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" });
  if (gitCheck.status !== 0) {
    throw new Error("No Git repository found. Run this command from a Git repository.");
  }

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  packageJson.scripts ??= {};
  const desiredScripts = {
    branchlint: "repo-guardrails branchlint",
    commitlint: "repo-guardrails commitlint",
    prepare: "husky",
  };
  const updatedScripts = [];
  const preservedScripts = [];
  for (const [name, value] of Object.entries(desiredScripts)) {
    if (packageJson.scripts[name] === undefined) {
      packageJson.scripts[name] = value;
      updatedScripts.push(name);
    } else if (packageJson.scripts[name] !== value) {
      preservedScripts.push(name);
    }
  }
  if (updatedScripts.length > 0) {
    writeFileSync("package.json", `${JSON.stringify(packageJson, null, 2)}\n`);
  }

  const created = [];
  const skipped = [];
  ensureFile("commitlint.config.mjs", "node/commitlint.config.mjs", created, skipped);
  ensureFile(".husky/commit-msg", "node/husky/commit-msg", created, skipped);
  ensureFile(".husky/pre-push", "node/husky/pre-push", created, skipped);
  ensureFile(".github/workflows/commitlint.yml", "node/workflows/commitlint.yml", created, skipped);
  ensureFile(".github/workflows/branchlint.yml", "node/workflows/branchlint.yml", created, skipped);

  const husky = spawnSync("npx", ["--no", "--", "husky"], { stdio: "inherit" });
  console.log("\nrepo-guardrails initialization complete.");
  if (updatedScripts.length) console.log(`Added package scripts: ${updatedScripts.join(", ")}`);
  if (created.length) console.log(`Created: ${created.join(", ")}`);
  if (skipped.length) console.log(`Preserved existing files: ${skipped.join(", ")}`);
  if (preservedScripts.length) console.log(`Preserved differing scripts: ${preservedScripts.join(", ")}`);
  if (husky.status !== 0) console.warn("Husky setup did not complete; run npm run prepare after installing dependencies.");
  console.log("Next: commit the generated workflows, open a pull request, and configure the main ruleset as documented in the README.");
}

try {
  if (command === "branchlint") branchlint();
  else if (command === "commitlint") commitlint();
  else if (command === "init") init();
  else {
    console.error("Usage: repo-guardrails <init|branchlint|commitlint> [options]");
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`repo-guardrails: ${error.message}`);
  process.exitCode = 1;
}
