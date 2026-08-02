import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../../src/shell/commitlint.sh", import.meta.url));

function run(message) {
  const directory = mkdtempSync(join(tmpdir(), "repo-guardrails-commit-"));
  const messageFile = join(directory, "COMMIT_EDITMSG");
  writeFileSync(messageFile, `${message}\n`);
  return spawnSync("bash", [script, messageFile], { encoding: "utf8" });
}

test("shell: accepts Conventional Commit subjects", () => {
  for (const message of ["feat: add search", "fix(auth): preserve session"]) {
    assert.equal(run(message).status, 0, message);
  }
});

test("shell: rejects invalid commit subjects", () => {
  for (const message of ["bad message", "feat:", "fix(Auth): preserve session"]) {
    assert.notEqual(run(message).status, 0, message);
  }
});
