#!/usr/bin/env node
// verify-surface.mjs — PUBLIC-repo surface guard, run by verify-surface.yml.
//
// Self-contained on purpose: the private build script is never promoted, so this
// inlines the same allowlist (the 13 runtime paths) and the content-gate
// patterns. Keep it in step with the source repository's promotion tooling — with ONE
// intentional exception: internal hostname and repository-name gating is enforced
// ONLY on the private side (the source repository's promotion build), which runs before anything
// leaves the source repo. This public checker carries NO internal-hostnames gate at
// all, so it discloses none of those internal names.
//
// Two fail-closed checks over the public tree:
//   1. Surface: every path is an allowlisted runtime path OR under this repo's
//      own `.github/`. Anything else fails and is named.
//   2. Content gates: secrets/key material, tooling/planning artefacts, and
//      local-runtime remnants — any hit fails and is named. (Internal hostname /
//      repo-name gating is private-side only, per the note above, so this public
//      checker discloses none of those names.) The `.github/` CI machinery is
//      exempt from the content grep (it carries the gate patterns themselves and
//      automation tokens); it is covered by the surface check instead.
//
// File source (two modes):
//   - default: the committed tree via `git ls-files` (public-repo CI).
//   - `--dir <path>`: a FILESYSTEM WALK of <path> (used by publish.yml to check a
//     freshly-unpacked, not-yet-tracked staging tree — `git ls-files` there would
//     return empty and pass vacuously, a silent failure).
//
// Contract: exit 0 when both checks pass; exit non-zero and print `FAIL:` lines
// otherwise.

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { execFileSync } from 'node:child_process';

const ALLOW = new Set([
  'plugin.json',
  '.mcp.json',
  '.cursor-plugin/plugin.json',
  '.cursor-plugin/marketplace.json',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  'rules/deriv-api-conventions.mdc',
  'assets/logo.svg',
  'LICENSE',
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'PRIVACY.md',
]);

// NOTE: there is deliberately NO internal-hostnames gate here. Internal hostname
// and repository-name gating (the private repo name, the corporate domain, and the
// other internal identifiers) is enforced only on the private side, in
// the source repository's promotion build, which runs before anything leaves it.
// Naming those patterns in this public checker would make the checker itself
// disclose the very names it would otherwise guard, so the whole gate is omitted.
const CONTENT_GATES = [
  {
    id: 'secrets',
    patterns: [
      /phc_[A-Za-z0-9]{20,}/,
      /ghp_[A-Za-z0-9]{20,}/,
      /github_pat_[A-Za-z0-9_]{20,}/,
      /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/,
    ],
    filenamePatterns: [/^\.env(\..+)?$/],
  },
  {
    id: 'tooling-artefacts',
    // The tool-name patterns are assembled from fragments so this public file
    // does not itself spell out the source repository's internal tooling.
    patterns: [
      new RegExp(['open', 'spec'].join('')),
      new RegExp(['spec', 'to', 'pr'].join('-')),
      new RegExp('\\b' + ['ds', 'tp'].join('') + '\\b'),
      /PLAN\.md/,
      /(^|[\s"'(/])specs\//m,
      /\.claude\//,
      new RegExp('\\.' + ['build', 'wright'].join('')),
      new RegExp('\\.' + ['spec', 'to', 'pr'].join('-')),
      /AGENTS\.md/,
      /CLAUDE\.md/,
    ],
  },
  {
    id: 'local-runtime',
    patterns: [
      /(^|[\s"'(/])mcp\//m,
      /(^|[\s"'(/])skills\//m,
      /node_modules/,
      /(^|[\s"'(/])dist\//m,
    ],
  },
];

const failures = [];
const fail = (m) => failures.push(m);

// --dir <path> → filesystem-walk that path; otherwise git ls-files the cwd.
const dirIdx = process.argv.indexOf('--dir');
const walkDir = dirIdx !== -1 ? process.argv[dirIdx + 1] : null;

function* walk(dir, base = dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(abs, base);
    else if (entry.isFile()) yield relative(base, abs).split(sep).join('/');
  }
}

const root = walkDir || '.';
const paths = walkDir
  ? [...walk(walkDir)]
  : execFileSync('git', ['ls-files'], { encoding: 'utf8' })
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

// 1. Surface check: allowlisted runtime path or under .github/.
for (const path of paths) {
  if (ALLOW.has(path)) continue;
  if (path === '.github' || path.startsWith('.github/')) continue;
  fail(`unexpected path outside the allowlist (+ .github/): "${path}"`);
}

// 2. Content gates over the runtime surface (skip the .github/ machinery).
for (const path of paths) {
  if (path === '.github' || path.startsWith('.github/')) continue;
  const base = path.split('/').pop();
  let content = '';
  try {
    content = readFileSync(join(root, path), 'utf8');
  } catch {
    content = '';
  }
  for (const gate of CONTENT_GATES) {
    for (const pattern of gate.patterns || []) {
      const m = content.match(pattern);
      if (m) fail(`content gate "${gate.id}": ${path} matched ${pattern} ("${m[0]}")`);
    }
    for (const pattern of gate.filenamePatterns || []) {
      if (pattern.test(base)) fail(`content gate "${gate.id}": ${path} matched filename ${pattern}`);
    }
  }
}

// 3. Internal-reference scan over this repo's own .github/ machinery. The content
//    gates above skip .github/ (it carries the gate patterns themselves), so this
//    narrower scan covers the one thing that must never appear there: references
//    to the source repository's private planning documents, issue numbers, or
//    tooling file names. The two tooling-name patterns are assembled from fragments
//    so this file does not itself contain the names it rejects.
const INTERNAL_REF_PATTERNS = [
  /PLAN\.md/,
  /issue\s+#\d+/i,
  /\(#\d+\)/,
  new RegExp(['build', 'promotion', 'bundle'].join('-')),
  new RegExp(['promotion', 'allowlist'].join('-')),
];
for (const path of paths) {
  if (!(path === '.github' || path.startsWith('.github/'))) continue;
  let content = '';
  try {
    content = readFileSync(join(root, path), 'utf8');
  } catch {
    content = '';
  }
  for (const pattern of INTERNAL_REF_PATTERNS) {
    const m = content.match(pattern);
    if (m) fail(`internal reference in CI machinery: ${path} matched ${pattern} ("${m[0]}")`);
  }
}

if (failures.length > 0) {
  for (const line of failures) console.error(`FAIL: ${line}`);
  console.error(`\nverify-surface: ${failures.length} problem(s) found`);
  process.exit(1);
}
console.log(`verify-surface: OK — ${paths.length} path(s), surface + content + internal-reference gates clean`);
