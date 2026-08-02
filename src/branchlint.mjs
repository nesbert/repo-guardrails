import { execFileSync } from "node:child_process";

export const BRANCH_NAME_PATTERN =
  /^(feat|fix|docs|test|refactor|perf|build|ci|chore)\/([0-9]+-)?(?=[a-z0-9-]*[a-z])[a-z0-9]+(-[a-z0-9]+)*$/;

export const EXEMPT_BRANCH_PATTERNS = [
  /^main$/,
  /^codex\/.+$/,
  /^dependabot\/.+$/,
];

export function validateBranchName(branchName) {
  if (typeof branchName !== "string" || branchName.length === 0) {
    return { valid: false, message: "Branch name cannot be empty." };
  }

  if (EXEMPT_BRANCH_PATTERNS.some((pattern) => pattern.test(branchName))) {
    return { valid: true, exempt: true };
  }

  if (BRANCH_NAME_PATTERN.test(branchName)) {
    return { valid: true, exempt: false };
  }

  return {
    valid: false,
    message: [
      `Invalid branch name: "${branchName}"`,
      "",
      "Human-created branches must use:",
      "  <type>/[<issue-number>-]<short-description>",
      "",
      "Allowed types:",
      "  feat, fix, docs, test, refactor, perf, build, ci, chore",
      "",
      "Examples:",
      "  feat/42-add-search",
      "  fix/session-expiration",
      "  docs/git-workflow",
    ].join("\n"),
  };
}

export function getCurrentBranchName() {
  return execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8",
  }).trim();
}
