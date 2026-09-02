# Security

This document describes the trust boundary and network behaviour of the Deriv
API plugin and how to report a vulnerability.

## Trust boundary

The plugin is a thin client. The trust boundary runs:

```
your MCP host  ⟷  Deriv-hosted read-only MCP server  ⟷  developers.deriv.com
```

- **Client to hosted server.** The MCP host connects to the Deriv-hosted MCP
  server whose URL is declared in `.mcp.json` over **HTTPS**. The connection is
  **unauthenticated and credential-free**: no authentication is required to call
  the server, and none is accepted. The plugin does not sign in to Deriv, does
  not read or write any API tokens, and asks you to configure nothing.
- **Hosted server to Deriv docs.** The server fetches from a **single approved
  origin**, `developers.deriv.com`, and no other. It reads public documentation
  and schemas only.

The hosted server is **read-only**. None of its tools writes, holds a
credential, signs in, or places a trade — the tools search endpoints, read
schemas, fields, and worked examples, validate payloads, and serve task-based
guidance. The server holds no secrets.

If your own application authenticates to Deriv — for example via OAuth — that is
your application's concern. Those credentials belong to your application and are
never handled, stored, or transmitted by this plugin.

## Failure modes

The server is designed not to improvise an answer when it cannot fetch fresh
data. There are two failure modes:

- **Docs source unreachable.** If `developers.deriv.com` cannot be reached, the
  server returns cached content **labelled with its age**, or — when there is no
  cache to fall back on — an explicit error telling the agent not to answer from
  prior knowledge.
- **Hosted server unreachable.** If the Deriv-hosted MCP server itself is down,
  your MCP host reports the MCP as disconnected and no Deriv tool is available;
  there is no local fallback that would answer from a stale copy.

Every successful answer carries a `_source` freshness label so the agent can
tell how current the underlying documentation is.

## Reporting a vulnerability

If you believe you have found a security issue, please report it privately to
the maintaining team, **`@deriv_api_v2_team`**, rather than opening a public
issue. Include enough detail to reproduce the problem and, where relevant, the
potential impact. The team will acknowledge the report and follow up on a fix.

> Note: `mcp-api.deriv.com` is a separate Deriv MCP operated by a different team
> and is not the server this plugin points at.
