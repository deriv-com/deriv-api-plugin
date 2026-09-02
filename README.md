# Deriv API plugin

A plugin that gives an AI coding agent first-class knowledge of the Deriv API.
It is a **thin client**: it points both **Cursor** and **Claude Code** at a
**hosted Deriv API MCP server** over HTTP, and ships one Cursor rule alongside
it. The hosted server exposes the tools that search endpoints; read the current
request/response schemas, fields, and worked examples; validate payloads; and
serve task-based guidance for auth, subscriptions, trading, and error handling.

The plugin itself contains only the plugin manifests, the single remote MCP
declaration, and the Cursor rule file. There is **no local MCP server and no
bundled copy of the API surface** — schemas and docs are read live by the hosted
server when a tool is called, so the plugin never carries a stale copy.

> **Staging endpoint.** The plugin currently connects to the **staging**
> deployment of the hosted Deriv API MCP server, declared in `.mcp.json`. Staging
> tracks the server's main branch and may change without notice; a later plugin
> release will point at the production endpoint.

## Install

### Claude Code

```
/plugin marketplace add deriv-com/deriv-api-plugin
/plugin install deriv-api@deriv-api-marketplace
```

The first command registers the public repository as a plugin marketplace; the
second installs the plugin from it. The plugin declares a remote MCP server, so
nothing runs on your machine: no local server, and no Node or Python to install.
Claude Code connects to the plugin's server without a separate approval prompt.

### Cursor

Cursor's marketplace/URL import is available to **Teams and Enterprise** only;
individual users cannot add this plugin by URL. Until the plugin is listed,
install it by cloning it into your Cursor local plugins directory:

```
git clone https://github.com/deriv-com/deriv-api-plugin ~/.cursor/plugins/local/deriv-api
```

Then reload the Cursor window so the plugin is picked up.

### Upgrading from version 1

Version 1 shipped a local MCP server and skills under the same plugin name. If
it is still installed, the new plugin is **not loaded and no error is shown**.
Remove version 1 first.

Claude Code:

```
/plugin uninstall deriv-api@deriv-api-marketplace
/plugin marketplace remove deriv-api-marketplace
```

then run the two install commands above. Cursor: delete the old `deriv-api`
folder from `~/.cursor/plugins/local/`, clone the new one as above, and reload
the window.

### Verify it works

In Claude Code, run `/mcp` and confirm `deriv-api` shows as connected with
twelve tools. In Cursor, open the MCP settings and confirm the same. If the
server shows as disconnected, the hosted endpoint is unreachable from your
network; the plugin has no offline fallback by design.

## Usage

Once installed, the plugin's MCP tools and the Cursor rule are available to the
agent automatically. **No credentials and no configuration are required** — the
hosted server reads public Deriv API documentation and schemas to answer
questions and validate payloads; it does not sign in, store keys, or ask you to
set anything up. When you build an integration that itself calls the Deriv API,
your own application supplies its own credentials; the plugin never handles them.

## Where to go next

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to file issues and open pull requests.
- [`SECURITY.md`](SECURITY.md) — network scope, credential handling, and how to report a vulnerability.
- [`PRIVACY.md`](PRIVACY.md) — what data flows where, and what is not collected.
- [`LICENSE`](LICENSE) — MIT.
