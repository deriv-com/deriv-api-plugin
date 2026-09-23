# Security

This document describes the trust boundary and network behaviour of the Deriv
API plugin and how to report a vulnerability.

## Trust boundary

The trust boundary runs:

```
your MCP host  ⟷  Deriv-hosted read-only MCP server  ⟷  developers.deriv.com
```

- **Client to hosted server.** The MCP host connects to the Deriv-hosted MCP
  server whose URL is declared in `.mcp.json` over **HTTPS**. The connection is
  **unauthenticated and credential-free**: no authentication is required to call
  the server, and none is accepted. The plugin does not sign in to Deriv and
  does not collect API tokens. It asks you to configure nothing. There are
  no user Deriv credentials in this plugin.
  The hosted server's own deployment secrets are never part of the plugin.
  `.mcp.json` records the expected initialize `serverInfo.name`
  (`deriv-api`). Cursor, Claude Code, and Codex still connect because
  they do not enforce that field. Deriv checks a captured initialize
  against it before promoting a release; no host enforces it. A
  different build that reports the same name still matches.
- **Hosted server to Deriv docs.** The server fetches from a **single approved
  origin**, `developers.deriv.com`, and no other. It reads public documentation
  and schemas only.

The hosted server is **read-only**. None of its tools writes, holds a
credential, signs in, or places a trade — the tools search endpoints, read
schemas, fields, and worked examples, validate payloads, and serve task-based
guidance.

The plugin does not collect, store, or send the user's Deriv account credentials.
Tool-call arguments, including a `validate_payload` body, reach the hosted
server, so keep API tokens and other secrets out of tool-call arguments.
If your own application authenticates to Deriv — for example via OAuth — that is
your application's concern.

## Failure modes

The server is designed not to improvise an answer when it cannot fetch fresh
data. There are two failure modes:

- **Docs source unreachable.** If `developers.deriv.com` cannot be reached, the
  server returns cached content **labelled with its age**, or — when there is no
  cache to fall back on — an explicit error telling the agent not to answer from
  prior knowledge.
- **Hosted server unreachable.** If the Deriv-hosted MCP server itself is down,
  your MCP host reports the MCP as disconnected and no Deriv tool is available.
  Follow the bundled skill files shipped with the plugin instead of guessing;
  those files are read locally when MCP is down. Do not invent fields that are
  not in those files.

Every successful answer carries a `_source` freshness label so the agent can
tell how current the underlying documentation is.

## Reporting a vulnerability

If you believe you have found a security issue, please report it privately to
**api-support@deriv.com** (Slack **`@deriv_api_v2_team`**), rather than
opening a public issue. Include enough detail to reproduce the problem and,
where relevant, the potential impact. The team will acknowledge the report
and follow up on a fix.

> Note: `mcp-api.deriv.com` is a separate Deriv MCP operated by a different team
> and is not the server this plugin points at.
