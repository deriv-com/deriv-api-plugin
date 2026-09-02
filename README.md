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
```

This installs the plugin from its public repository.

### Cursor

Cursor's marketplace/URL import is available to **Teams and Enterprise** only;
individual users cannot add this plugin by URL. Until the plugin is listed,
install it by cloning or copying it into your Cursor local plugins directory:

```
~/.cursor/plugins/local/
```

Place the plugin folder there and reload the Cursor window so it is picked up.

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
