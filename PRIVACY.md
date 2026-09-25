# Privacy

This document describes what data the Deriv API plugin does and does not handle.

## Data flow

When one of its tools is called, the request is sent to the Deriv-hosted MCP
server whose URL is declared in `.mcp.json`, and that hosted server is what
fetches public Deriv API documentation and schemas from the Deriv developer docs
host. Your queries therefore reach Deriv infrastructure — they are not answered
entirely within the MCP host.

What reaches the Deriv-hosted server on each call is:

- **The tool name and its arguments.** Depending on the tool, the arguments
  include endpoint ids, field paths, and free-text search terms. For
  `validate_payload`, the argument is the JSON payload the agent asked to
  validate.
- **Transport-level metadata.** As with any HTTP request, the connection carries
  metadata such as the client IP address and user agent, which are subject to
  standard HTTP access logging on the server side.

The plugin does not add any account, profile, or credential to these requests —
what it sends is the tool call the agent made, and nothing more.

When the hosted MCP is down, the bundled skill files that ship with the plugin
are read locally on the developer's machine. That local read is not a tool call:
it does not send those queries to the Deriv-hosted server. When MCP is used,
tool-call queries still reach Deriv infrastructure as described above.

## Analytics

Analytics may be collected. The hosted server may send operational events about
its own calls (which tool ran, how long it took, whether it failed) to a
third-party analytics service. Tool arguments, responses, and client identity
are not included.

## Cache and retention

The hosted server caches only the shared catalogue documents it fetches: the
`llms.txt` index, the WebSocket endpoint list, and the REST OpenAPI document.
It holds them in an in-process, per-instance memory cache with a fifteen-minute
per-entry lifetime and a stale-on-error fallback, so an expired entry is served
rather than the call failing when the docs host is briefly unreachable.

Per-endpoint content — a schema, an endpoint page, a published example — is
never cached; it is fetched on each call. Nothing is written to disk, and
nothing persists across restarts — when a server instance restarts, its cache
is empty again.

## What is not collected by the plugin

- The plugin **stores no credentials** and requires none.
- The plugin collects **no personal data**.

There is no account and no profile. Note, however, that your own MCP host
(Cursor or Claude Code) may add its own telemetry about tool usage, independent
of this plugin; that is governed by your host's own privacy terms, not this
document.
