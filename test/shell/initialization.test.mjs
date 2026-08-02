import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const initializer = fileURLToPath(new URL("../../bin/repo-guardrails.sh", import.meta.url));

function git(directory, args) {
  return execFileSync("git", args, { cwd: directory, encoding: "utf8" }).trim();
}

test("shell: preserves an existing Git hooks path during initialization", () => {
  const directory = mkdtempSync(join(tmpdir(), "repo-guardrails-shell-"));
  git(directory, ["init", "-q"]);
  git(directory, ["config", "core.hooksPath", ".custom-hooks"]);

  const result = spawnSync(initializer, ["init"], { cwd: directory, encoding: "utf8" });

  assert.equal(result.status, 0, `${result.error ?? ""}\n${result.stdout}\n${result.stderr}`);
  assert.equal(git(directory, ["config", "--get", "core.hooksPath"]), ".custom-hooks");
  assert.match(result.stdout, /⚠️ Preserved existing Git hooks path: .custom-hooks/);
  assert.match(readFileSync(join(directory, ".repo-guardrails", "branch-names.conf"), "utf8"), /types=/);
});
