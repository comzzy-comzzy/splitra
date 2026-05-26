#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const yes = args.has("--yes") || args.has("-y");
const targetArg = process.argv.slice(2).find((arg) => !arg.startsWith("-"));
const target = path.resolve(targetArg || process.cwd());

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assertSplitraCheckout(directory) {
  const packagePath = path.join(directory, "package.json");
  const readmePath = path.join(directory, "README.md");
  const skillPath = path.join(directory, "SKILL.md");

  if (!fs.existsSync(packagePath) || !fs.existsSync(readmePath) || !fs.existsSync(skillPath)) {
    fail(`Refusing to remove ${directory}: it does not look like a Splitra checkout.`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  if (packageJson.name !== "splitra") {
    fail(`Refusing to remove ${directory}: package name is ${packageJson.name || "missing"}, not splitra.`);
  }
}

assertSplitraCheckout(target);

if (!yes) {
  console.log(`This will remove the local Splitra checkout at: ${target}`);
  console.log("Run again with --yes to confirm.");
  process.exit(0);
}

if (target === path.parse(target).root) {
  fail("Refusing to remove a filesystem root.");
}

const cwdRelativeToTarget = path.relative(target, process.cwd());
const cwdIsInsideTarget = cwdRelativeToTarget === "" ||
  (!cwdRelativeToTarget.startsWith("..") && !path.isAbsolute(cwdRelativeToTarget));

if (cwdIsInsideTarget) {
  process.chdir(path.dirname(target));
}

fs.rmSync(target, {
  recursive: true,
  force: true,
  maxRetries: 3,
  retryDelay: 100
});

console.log(`Removed Splitra checkout: ${target}`);
