import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

function readPolicy() {
  const policyFile = new URL("../../policy/branch-names.conf", import.meta.url);
  return Object.fromEntries(
    readFileSync(policyFile, "utf8")
      .trim()
      .split("\n")
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split("=", 2)),
  );
}

const policy = readPolicy();
const types = policy.types.split(" ");
const exemptExact = policy.exempt_exact.split(" ");
const exemptPrefixes = policy.exempt_prefixes.split(" ");

export const BRANCH_NAME_PATTERN = new RegExp(
  `^(${types.join("|")})\\/([0-9]+-)?(?=[a-z0-9-]*[a-z])[a-z0-9]+(-[a-z0-9]+)*$`,
);

export const EXEMPT_BRANCH_PATTERNS = [
  ...exemptExact.map((branchName) => new RegExp(`^${branchName}$`)),
  ...exemptPrefixes.map((prefix) => new RegExp(`^${prefix}.+$`)),
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
      `  ${types.join(", ")}`,
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
