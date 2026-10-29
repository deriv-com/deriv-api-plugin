# Deriv API plugin

A plugin that gives an AI coding agent Deriv API knowledge. Installing it as a
native plugin for Cursor, Claude Code, Codex, Antigravity, and Kimi adds the
hosted MCP server plus bundled Agent Skills. Agents that
only support the Agent Skills standard can install the skills separately.

## Install

### Claude Code

```
/plugin marketplace add deriv-com/deriv-api-plugin
/plugin install deriv@deriv
```

The first command registers the public repository as a plugin marketplace; the
second installs the plugin from it. No Node or Python is required.
Installing the plugin approves its MCP server once, at install time;
Claude Code may still prompt per tool call.

### Cursor

The plugin is listed on the Cursor Marketplace at
https://cursor.com/marketplace/deriv. Install it from there:

```
/add-plugin deriv
```

As a secondary option — to try a surface that is not yet published to the
marketplace — clone the public repository into Cursor's local plugin directory:

```
git clone https://github.com/deriv-com/deriv-api-plugin ~/.cursor/plugins/local/deriv
```

Then reload the Cursor window so the plugin is picked up.

### Codex

```
codex plugin marketplace add deriv-com/deriv-api-plugin
```

That registers this repository as a Codex marketplace. Install **deriv** from the
Plugins Directory, then restart Codex so it picks up the hosted MCP server. To
refresh an existing install after a listing change, run `codex plugin marketplace upgrade`.
If Codex shows an authentication step during install, that is Codex's
generic MCP install flow — the plugin itself needs no Deriv sign-in
and asks for no API token.

### Antigravity

```
agy plugin install https://github.com/deriv-com/deriv-api-plugin
```

That installs the plugin straight from the public repository, with no local
checkout. Google curates the Antigravity Marketplace, and the plugin
can be put forward for it through Google's interest form at
https://forms.gle/2EX5RFYPoJe1UgxR9.

### Kimi

In Kimi Code CLI, run:

```
/plugins install https://github.com/deriv-com/deriv-api-plugin
```

Kimi Work imports the same repository. Listing on Kimi's official marketplace
is requested from Kimi Work, on the plugin detail page, through
"Apply for official marketplace publication".

### Verify it works

In Claude Code, run `/mcp` and confirm `deriv` shows as connected, with its
tools listed. In Cursor, open the MCP settings and confirm the same. In
Antigravity, check that `deriv` is listed as installed and enabled, together
with its `deriv` MCP server, in the App's Customizations > Installed tab or
under `/plugin` > Installed in the `agy` CLI. In Kimi Code CLI, run `/reload`
after installing (plugin MCP servers start after `/reload` or in a new
session), then run `/plugins` and check that `deriv` and its `deriv` MCP server
are enabled. If the hosted endpoint is unreachable,
the bundled skills still load; follow those instead of inventing field lists.
Do not invent field lists in either case.

## Skills only

This path copies `skills/` only and does not add the hosted MCP.

If your agent cannot install a plugin, add the skills with:

```
npx skills add https://github.com/deriv-com/deriv-api-plugin
```

That command is the `npx skills` CLI at https://skills.sh.

Or copy the folders under `skills/` into the personal skills directory for your
agent:

| Agent | Skill directory |
| --- | --- |
| Claude Code | `~/.claude/skills/` |
| Cursor | `~/.cursor/skills/` |
| OpenCode | `~/.config/opencode/skills/` |
| Codex | `~/.codex/skills/` |
| Pi | `~/.pi/agent/skills/` |

If the plugin is already installed on that host, do not also copy skills or run
`npx skills`. Doing both can load the same skills twice.

## Skills

| Skill | Useful for |
| --- | --- |
| `deriv-trading-app` | Build or extend an authenticated trading application |
| `deriv-auth` | Authentication, OAuth, tokens, accounts, and sessions |
| `deriv-market-data` | Market discovery and live prices |
| `deriv-trade-types` | Map user-facing trade names to contract families |
| `deriv-trade-lifecycle` | Proposal, buy, monitor, sell, and settlement |
| `deriv-lightweight-charts` | Add the default slim price chart with barriers and trade markers |
| `deriv-smartcharts` | Add the terminal-grade chart with indicators and drawing tools |
| `deriv-llms` | Bundled docs snapshot when hosted MCP is unavailable |

## MCP

| Server key | URL | Purpose |
| --- | --- | --- |
| `deriv` | `https://mcp-api-v2.deriv.com/mcp` | Live schemas, field facts, payload validation, and task guides |

The server is declared twice at the plugin root: `.mcp.json` (`type: "http"`)
is what Cursor and Claude Code read, and `mcp.json` (`type: "streamable-http"`,
under the Agent Plugins v1 schema) is what a host following that standard
reads. Codex reads the root `mcp.json`. The Codex compatibility manifest's
`mcpServers` field names `./.mcp.json`, but this is a portable package, and
under [OpenAI's package rules](https://developers.openai.com/plugins/deploy/submission)
a portable package's root `mcp.json` is what OpenAI discovers; that field
cannot replace it. That matches what we measured on 2026-10-01 with Codex CLI
0.159.2. Both files name the same server at the same URL.

Two more hosts read their own files, which point at that same `deriv` server:
Antigravity reads `mcp_config.json`, and Kimi reads the `mcpServers` entry in
`kimi.plugin.json`.

## Usage

Once installed, the plugin's MCP tools, the Cursor rule, and the bundled skills
are available to the agent automatically. **No credentials and no configuration
are required** — the plugin requires no Deriv account credentials. The hosted
server reads public Deriv API documentation and schemas to answer questions and
validate payloads; it does not sign in, store keys, or ask you to set anything
up. Tool-call arguments, including a `validate_payload` body, reach the hosted
server, so keep API tokens and other secrets out of tool-call arguments.
When you build an integration that itself calls the Deriv API, your own
application supplies its own credentials.

## Where to go next

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to file issues and open pull requests.
- [`SECURITY.md`](SECURITY.md) — network scope, credential handling, and how to report a vulnerability.
- [`PRIVACY.md`](PRIVACY.md) — what data the plugin processes, and the Deriv Privacy Policy that applies.
- [`LICENSE`](LICENSE) — MIT.
