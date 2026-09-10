# Deriv API plugin

A plugin that gives an AI coding agent Deriv API knowledge. Installing it as a
native plugin for Cursor, Claude Code, and Codex adds the hosted MCP server plus
bundled Agent Skills. Agents that only support the Agent Skills standard can
install the skills separately.

## Install

### Claude Code

```
/plugin marketplace add deriv-com/deriv-api-plugin
/plugin install deriv@deriv
```

The first command registers the public repository as a plugin marketplace; the
second installs the plugin from it. No Node or Python is required. Claude Code
connects to the plugin's server without a separate approval prompt.

### Cursor

Cursor's own marketplace/URL import is available to **Teams and Enterprise** only;
individual users cannot add this plugin through a Cursor marketplace by URL.

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

### Verify it works

In Claude Code, run `/mcp` and confirm `deriv` shows as connected, with its
tools listed. In Cursor, open the MCP settings and confirm the same. If the
hosted endpoint is unreachable, the bundled skills still load; follow those
instead of inventing field lists. Do not invent field lists in either case.

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
| `deriv-llms` | Bundled docs snapshot when hosted MCP is unavailable |

## MCP

| Server key | URL | Purpose |
| --- | --- | --- |
| `deriv` | `https://mcp-api-v2.deriv.com/mcp` | Live schemas, field facts, payload validation, and task guides |

## Usage

Once installed, the plugin's MCP tools, the Cursor rule, and the bundled skills
are available to the agent automatically. **No credentials and no configuration
are required** — the hosted server reads public Deriv API documentation and
schemas to answer questions and validate payloads; it does not sign in, store
keys, or ask you to set anything up. When you build an integration that itself
calls the Deriv API, your own application supplies its own credentials; the
plugin never handles them.

## Where to go next

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to file issues and open pull requests.
- [`SECURITY.md`](SECURITY.md) — network scope, credential handling, and how to report a vulnerability.
- [`PRIVACY.md`](PRIVACY.md) — what data flows where, and what is not collected.
- [`LICENSE`](LICENSE) — MIT.
