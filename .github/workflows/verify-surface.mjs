#!/usr/bin/env node
// verify-surface.mjs — PUBLIC-repo surface guard, run by verify-surface.yml.
//
// Self-contained on purpose: the private build script is never promoted, so this
// inlines the same allowlist (the runtime paths) and the content-gate
// patterns. Keep it in step with the source repository's promotion tooling — with ONE
// intentional exception: internal hostname and repository-name gating is enforced
// ONLY on the private side (the source repository's promotion build), which runs before anything
// leaves the source repo. This public checker carries NO internal-hostnames gate at
// all, so it discloses none of those internal names.
//
// Fail-closed checks over the public tree:
//   1. Surface: every path is an allowlisted runtime path OR under this repo's
//      own `.github/`. Anything else fails and is named.
//   2. Presence: SECURITY.md, PRIVACY.md, and .mcp.json must exist
//      (independent of ALLOW).
//   3. MCP URL pin: when .mcp.json is present, mcpServers.deriv must be
//      type "http" at https://mcp-api-v2.deriv.com/mcp. No hostname-pattern gate.
//   4. Content gates: secrets/key material, tooling/planning artefacts, and
//      local-runtime remnants — any hit fails and is named. (Internal hostname /
//      repo-name gating is private-side only, per the note above, so this public
//      checker discloses none of those names.) The `.github/` CI machinery is
//      exempt from the content grep (it carries the gate patterns themselves and
//      automation tokens); it is covered by the surface check instead.
//   5. Internal-reference scan over this repo's own `.github/` machinery.
//   6. Codex listing contract.
//
// File source (two modes):
//   - default: the committed tree via `git ls-files` (public-repo CI).
//   - `--dir <path>`: a FILESYSTEM WALK of <path> (used by publish.yml to check a
//     freshly-unpacked, not-yet-tracked staging tree — `git ls-files` there would
//     return empty and pass vacuously, a silent failure).
//
// Contract: exit 0 when all checks pass; exit non-zero and print `FAIL:` lines
// otherwise.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { execFileSync } from 'node:child_process';

const ALLOW = new Set([
  'plugin.json',
  '.mcp.json',
  '.cursor-plugin/plugin.json',
  '.cursor-plugin/marketplace.json',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
  '.agents/plugins/marketplace.json',
  'rules/deriv-api-conventions.mdc',
  'assets/logo.png',
  'assets/logo-dark.png',
  'LICENSE',
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'PRIVACY.md',
  'skills/deriv-auth/SKILL.md',
  'skills/deriv-auth/agents/openai.yaml',
  'skills/deriv-auth/references/implementation-checklist.md',
  'skills/deriv-llms/SKILL.md',
  'skills/deriv-llms/references/account-nickname.md',
  'skills/deriv-llms/references/active-symbols.md',
  'skills/deriv-llms/references/api-overview.md',
  'skills/deriv-llms/references/authentication.md',
  'skills/deriv-llms/references/auto-get.md',
  'skills/deriv-llms/references/auto-list-strategies.md',
  'skills/deriv-llms/references/auto-list.md',
  'skills/deriv-llms/references/auto-pause.md',
  'skills/deriv-llms/references/auto-resume.md',
  'skills/deriv-llms/references/auto-start.md',
  'skills/deriv-llms/references/auto-stop.md',
  'skills/deriv-llms/references/balance.md',
  'skills/deriv-llms/references/bulk-purchase.md',
  'skills/deriv-llms/references/buy.md',
  'skills/deriv-llms/references/cancel.md',
  'skills/deriv-llms/references/contract-types.md',
  'skills/deriv-llms/references/contract-update-history.md',
  'skills/deriv-llms/references/contract-update.md',
  'skills/deriv-llms/references/contracts-for.md',
  'skills/deriv-llms/references/contracts-list.md',
  'skills/deriv-llms/references/create-account.md',
  'skills/deriv-llms/references/errors.md',
  'skills/deriv-llms/references/examples.md',
  'skills/deriv-llms/references/forget-all.md',
  'skills/deriv-llms/references/forget.md',
  'skills/deriv-llms/references/get-accounts.md',
  'skills/deriv-llms/references/getting-started.md',
  'skills/deriv-llms/references/health.md',
  'skills/deriv-llms/references/markup-statistics.md',
  'skills/deriv-llms/references/oauth.md',
  'skills/deriv-llms/references/payment-agent-client-settings-update.md',
  'skills/deriv-llms/references/payment-agent-client-settings.md',
  'skills/deriv-llms/references/payment-agent-get.md',
  'skills/deriv-llms/references/payment-agent-list.md',
  'skills/deriv-llms/references/payment-agent-statistics.md',
  'skills/deriv-llms/references/payment-agent-transfer-status.md',
  'skills/deriv-llms/references/payment-agent-transfer.md',
  'skills/deriv-llms/references/payment-agent-withdraw-status.md',
  'skills/deriv-llms/references/payment-agent-withdraw-verification.md',
  'skills/deriv-llms/references/payment-agent-withdraw.md',
  'skills/deriv-llms/references/ping.md',
  'skills/deriv-llms/references/portfolio.md',
  'skills/deriv-llms/references/profit-table.md',
  'skills/deriv-llms/references/proposal-open-contract.md',
  'skills/deriv-llms/references/proposal.md',
  'skills/deriv-llms/references/reset-demo-balance.md',
  'skills/deriv-llms/references/sell.md',
  'skills/deriv-llms/references/statement.md',
  'skills/deriv-llms/references/ticks-history.md',
  'skills/deriv-llms/references/ticks.md',
  'skills/deriv-llms/references/time.md',
  'skills/deriv-llms/references/trading-times.md',
  'skills/deriv-llms/references/transaction.md',
  'skills/deriv-llms/references/wallet-list.md',
  'skills/deriv-llms/references/wallet-transactions.md',
  'skills/deriv-llms/references/websocket.md',
  'skills/deriv-llms/references/workflows.md',
  'skills/deriv-llms/references/ws-demo.md',
  'skills/deriv-llms/references/ws-public.md',
  'skills/deriv-llms/references/ws-real.md',
  'skills/deriv-market-data/SKILL.md',
  'skills/deriv-market-data/agents/openai.yaml',
  'skills/deriv-market-data/references/implementation-checklist.md',
  'skills/deriv-trade-lifecycle/SKILL.md',
  'skills/deriv-trade-lifecycle/agents/openai.yaml',
  'skills/deriv-trade-lifecycle/references/implementation-checklist.md',
  'skills/deriv-trade-types/SKILL.md',
  'skills/deriv-trade-types/agents/openai.yaml',
  'skills/deriv-trade-types/references/accumulators.md',
  'skills/deriv-trade-types/references/advanced.md',
  'skills/deriv-trade-types/references/barrier-options.md',
  'skills/deriv-trade-types/references/catalog.md',
  'skills/deriv-trade-types/references/digits.md',
  'skills/deriv-trade-types/references/multipliers.md',
  'skills/deriv-trade-types/references/up-down.md',
  'skills/deriv-trade-types/references/vanilla-turbos.md',
  'skills/deriv-trading-app/SKILL.md',
  'skills/deriv-trading-app/agents/openai.yaml',
  'skills/deriv-trading-app/references/new-api-only.md',
  'skills/deriv-llms/references/partners-analytics-overview.md',
  'skills/deriv-llms/references/partners-client-tags-check.md',
  'skills/deriv-llms/references/wallet-exchange-rate.md',
  'skills/deriv-llms/references/wallet-transfer-exchange.md',
  'skills/deriv-llms/references/wallet-transfer-platforms.md',
  'skills/deriv-llms/references/wallet-transfer-validate.md',
  'skills/deriv-llms/references/wallet-transfer.md',
  'skills/deriv-trading-app/references/chart-selection.md',
  'skills/deriv-lightweight-charts/SKILL.md',
  'skills/deriv-lightweight-charts/agents/openai.yaml',
  'skills/deriv-lightweight-charts/references/setup-and-feed.md',
  'skills/deriv-lightweight-charts/references/trade-overlays.md',
  'skills/deriv-smartcharts/SKILL.md',
  'skills/deriv-smartcharts/agents/openai.yaml',
  'skills/deriv-smartcharts/references/chart-data-and-assets.md',
  'skills/deriv-smartcharts/references/feed-adapter.md',
  'skills/deriv-smartcharts/references/trade-overlays.md',
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
      /\.claude\/(?!skills\/)|(?<!~\/)\.claude\/skills\//,
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
      /node_modules/,
      /(^|[\s"'(/])dist\//m,
    ],
  },
];

const failures = [];
const fail = (m) => failures.push(m);
const PIN_SOURCE_KEYS = new Set(['source', 'url', 'ref']);
const pinSourceExtraKey = (source) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
  return Object.keys(source).find((key) => !PIN_SOURCE_KEYS.has(key)) ?? null;
};

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

// 2. Presence gate.
for (const file of ['SECURITY.md', 'PRIVACY.md', '.mcp.json']) {
  if (!existsSync(join(root, file))) fail(`required file missing: ${file}`);
}

const PRODUCTION_MCP_URL = 'https://mcp-api-v2.deriv.com/mcp';
// 3. MCP URL pin.
if (existsSync(join(root, '.mcp.json'))) {
  try {
    const mcp = JSON.parse(readFileSync(join(root, '.mcp.json'), 'utf8'));
    const deriv = mcp && mcp.mcpServers && mcp.mcpServers.deriv;
    if (!deriv || deriv.type !== 'http' || deriv.url !== PRODUCTION_MCP_URL) {
      fail(
        `MCP URL pin: mcpServers.deriv must have type "http" and url ${PRODUCTION_MCP_URL}`,
      );
    }
  } catch (err) {
    fail(`MCP URL pin: .mcp.json is not valid JSON (${err.message})`);
  }
}

// 4. Content gates over the runtime surface (skip the .github/ machinery).
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

// 5. Internal-reference scan over this repo's own .github/ machinery. The content
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

// 6. Codex listing contract. Official package rules require a relative
//    branding path (not an HTTPS URL), MCP declared as ./.mcp.json, and
//    directory-submission length limits on the title and subtitle.
const CODEX_CATEGORIES = new Set([
  'Productivity',
  'Creativity',
  'Developer Tools',
  'Business & Operations',
  'Data & Analytics',
  'Communication',
  'Education & Research',
  'Security',
  'Finance',
  'Healthcare',
  'Travel',
  'Entertainment',
  'Other',
]);
const HTTPS = /^https:\/\/[^/\s]+/;
const HEX = /^#[0-9A-Fa-f]{6}$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const loadJson = (path) => {
  try {
    return JSON.parse(readFileSync(join(root, path), 'utf8'));
  } catch (err) {
    fail(`codex listing: ${path} is not valid JSON (${err.message})`);
    return null;
  }
};
const requireHttps = (label, value) => {
  if (typeof value !== 'string' || !HTTPS.test(value)) {
    fail(`codex listing: ${label} must be an https URL`);
  }
};
const requireAsset = (label, value) => {
  if (typeof value !== 'string' || !value.startsWith('./') || value.includes('..')) {
    fail(`codex listing: ${label} must be a relative path starting with ./`);
    return;
  }
  if (/^https?:/i.test(value)) {
    fail(`codex listing: ${label} must not be a URL`);
    return;
  }
  const rel = value.slice(2);
  if (!existsSync(join(root, rel))) fail(`codex listing: ${label} file missing (${rel})`);
};

const codex = loadJson('.codex-plugin/plugin.json');
if (codex) {
  const iface = codex.interface && typeof codex.interface === 'object' ? codex.interface : null;
  if (!iface) fail('codex listing: interface object is required');
  if (codex.name !== 'deriv') fail('codex listing: name must be deriv');
  if (typeof codex.version !== 'string' || !SEMVER.test(codex.version)) {
    fail('codex listing: version must be semver');
  }
  if (typeof codex.description !== 'string' || !codex.description || codex.description.length > 1024) {
    fail('codex listing: description is required and must be 1024 characters or fewer');
  }
  if (!codex.author || codex.author.name !== 'deriv') fail('codex listing: author.name must be deriv');
  if (codex.mcpServers !== './.mcp.json') {
    fail('codex listing: mcpServers must be ./.mcp.json so the hosted server is imported');
  }
  if (codex.skills !== './skills/') fail('codex listing: skills must be ./skills/');
  if (codex.apps != null) fail('codex listing: apps must be omitted; there is no .app.json');
  if (iface) {
    if (iface.developerName !== codex.author.name) {
      fail('codex listing: interface.developerName must match author.name');
    }
    if (typeof iface.displayName !== 'string' || !iface.displayName || iface.displayName.length > 30) {
      fail('codex listing: displayName must be 30 characters or fewer');
    }
    if (typeof iface.shortDescription !== 'string' || !iface.shortDescription || iface.shortDescription.includes('\n') || iface.shortDescription.length > 30) {
      fail('codex listing: shortDescription must be one line of 30 characters or fewer');
    }
    if (typeof iface.longDescription !== 'string' || !iface.longDescription || iface.longDescription.length > 4000) {
      fail('codex listing: longDescription is required');
    }
    if (!CODEX_CATEGORIES.has(iface.category)) fail('codex listing: category is not a supported Codex category');
    if (!Array.isArray(iface.capabilities) || iface.capabilities.length === 0 || iface.capabilities.length > 20) {
      fail('codex listing: capabilities must be a non-empty list of at most 20 entries');
    }
    if (typeof iface.brandColor !== 'string' || !HEX.test(iface.brandColor)) {
      fail('codex listing: brandColor must be a six-digit hex color');
    }
    requireHttps('homepage', codex.homepage);
    requireHttps('author.url', codex.author.url);
    requireHttps('interface.websiteURL', iface.websiteURL);
    requireHttps('interface.privacyPolicyURL', iface.privacyPolicyURL);
    requireHttps('interface.termsOfServiceURL', iface.termsOfServiceURL);
    requireHttps('interface.supportURL', iface.supportURL);
    requireAsset('interface.logo', iface.logo);
    requireAsset('interface.logoDark', iface.logoDark);
    requireAsset('interface.composerIcon', iface.composerIcon);
    const prompts = Array.isArray(iface.defaultPrompt) ? iface.defaultPrompt : [];
    if (prompts.length === 0 || prompts.length > 3) fail('codex listing: defaultPrompt must contain 1–3 strings');
    const seen = new Set();
    for (const prompt of prompts) {
      if (typeof prompt !== 'string' || !prompt || prompt.includes('\n') || prompt.length > 128) {
        fail('codex listing: each defaultPrompt must be one line of 128 characters or fewer');
      }
      if (prompt.includes('@')) fail('codex listing: defaultPrompt must not contain @mentions');
      const key = prompt.normalize('NFC').trim();
      if (seen.has(key)) fail('codex listing: defaultPrompt entries must be unique');
      seen.add(key);
    }
  }
  const cursor = loadJson('.cursor-plugin/plugin.json');
  if (cursor && cursor.version !== codex.version) {
    fail('codex listing: version must stay in lockstep with .cursor-plugin/plugin.json');
  }
  const rootPlugin = loadJson('plugin.json');
  if (rootPlugin && rootPlugin.version !== codex.version) {
    fail('codex listing: version must stay in lockstep with plugin.json');
  }
}

const marketplace = loadJson('.agents/plugins/marketplace.json');
if (marketplace) {
  const entry = Array.isArray(marketplace.plugins) ? marketplace.plugins[0] : null;
  if (!entry) fail('codex listing: marketplace must declare one plugin entry');
  else {
    if (entry.name !== 'deriv') fail('codex listing: marketplace plugin name must be deriv');
    const expectedRef = typeof codex?.version === 'string' ? `v${codex.version}` : null;
    const extra = pinSourceExtraKey(entry.source);
    const isUrlPin =
      entry.source &&
      entry.source.source === 'url' &&
      entry.source.url === 'https://github.com/deriv-com/deriv-api-plugin.git' &&
      entry.source.ref === expectedRef;
    if (extra && isUrlPin) fail(`.agents/plugins/marketplace.json: extra key "${extra}"`);
    else if (!isUrlPin) {
      fail('codex listing: marketplace source must be the url pin at the lockstep version tag');
    }
    if (!entry.policy || entry.policy.installation !== 'AVAILABLE' || entry.policy.authentication !== 'ON_INSTALL') {
      fail('codex listing: marketplace policy must be AVAILABLE / ON_INSTALL');
    }
    if (entry.category !== 'Developer Tools') fail('codex listing: marketplace category must be Developer Tools');
  }
}

const claudeMarketplace = loadJson('.claude-plugin/marketplace.json');
if (claudeMarketplace) {
  const entry = Array.isArray(claudeMarketplace.plugins) ? claudeMarketplace.plugins[0] : null;
  if (!entry) fail('claude listing: marketplace must declare one plugin entry');
  else {
    const claudePlugin = loadJson('.claude-plugin/plugin.json');
    if (claudePlugin) {
      const cursor = loadJson('.cursor-plugin/plugin.json');
      if (cursor && cursor.version !== claudePlugin.version) {
        fail('claude listing: version must stay in lockstep with .cursor-plugin/plugin.json');
      }
      const rootPlugin = loadJson('plugin.json');
      if (rootPlugin && rootPlugin.version !== claudePlugin.version) {
        fail('claude listing: version must stay in lockstep with plugin.json');
      }
    }
    const expectedRef = typeof claudePlugin?.version === 'string' ? `v${claudePlugin.version}` : null;
    const extra = pinSourceExtraKey(entry.source);
    const isUrlPin =
      entry.source &&
      entry.source.source === 'url' &&
      entry.source.url === 'https://github.com/deriv-com/deriv-api-plugin.git' &&
      entry.source.ref === expectedRef;
    if (extra && isUrlPin) fail(`.claude-plugin/marketplace.json: extra key "${extra}"`);
    else if (!isUrlPin) {
      fail('claude listing: marketplace source must be the url pin at the lockstep version tag');
    }
  }
}

if (failures.length > 0) {
  for (const line of failures) console.error(`FAIL: ${line}`);
  console.error(`\nverify-surface: ${failures.length} problem(s) found`);
  process.exit(1);
}
console.log(`verify-surface: OK — ${paths.length} path(s), surface + presence + MCP URL pin + content + internal-reference + Codex gates clean`);
