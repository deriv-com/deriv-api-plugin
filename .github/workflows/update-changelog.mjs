#!/usr/bin/env node
// update-changelog.mjs — marker-anchored CHANGELOG updater for publish.yml.
//
// Idempotent by design: entries are anchored below a fixed marker and keyed by
// tag with explicit delimiters, so re-running the same tag REPLACES that tag's
// block rather than appending a duplicate (the promotion receiver must be safe
// to re-run).
//
// The changelog lives at `.github/CHANGELOG.md` so the public tree stays exactly
// the 13 allowlisted runtime paths plus this repo's own `.github/`.
//
// Usage: node .github/workflows/update-changelog.mjs <tag> <notes>

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [, , tag, notes = ''] = process.argv;
if (!tag) {
  console.error('FAIL: usage: update-changelog.mjs <tag> <notes>');
  process.exit(2);
}

const FILE = '.github/CHANGELOG.md';
const MARKER = '<!-- promotion:entries -->';
const begin = `<!-- tag:${tag} -->`;
const end = `<!-- /tag:${tag} -->`;

const header = `# Changelog\n\nPromoted runtime-surface releases.\n\n${MARKER}\n`;
let text = existsSync(FILE) ? readFileSync(FILE, 'utf8') : header;
if (!text.includes(MARKER)) text = header + '\n' + text;

const block = `${begin}\n## ${tag}\n\n${notes.trim()}\n${end}\n`;

// Replace an existing block for this tag, else insert directly after the marker.
const blockRe = new RegExp(
  `${escapeRe(begin)}[\\s\\S]*?${escapeRe(end)}\\n?`,
);
if (blockRe.test(text)) {
  text = text.replace(blockRe, block);
} else {
  text = text.replace(MARKER, `${MARKER}\n\n${block}`);
}

mkdirSync(dirname(FILE), { recursive: true });
writeFileSync(FILE, text);
console.log(`update-changelog: wrote ${tag} block to ${FILE}`);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
