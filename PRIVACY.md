# Privacy

This document describes what data the Deriv API plugin does and does not handle.

## Data flow

The plugin is a thin client. When one of its tools is called, the request is
sent to the Deriv-hosted MCP server whose URL is declared in `.mcp.json`, and
that hosted server is what fetches public Deriv API documentation and schemas
from the Deriv developer docs host. Your queries therefore reach Deriv
infrastructure — they are not answered entirely within the MCP host.

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

## Analytics

Analytics on the hosted server is **disabled by default**. It is enabled only
when a PostHog project key is configured on the deployment (via the
`POSTHOG_PROJECT_API_KEY` environment variable). This document describes both
states truthfully; whether production runs with analytics enabled is a
deployment decision.

When analytics is enabled, the server records a per-call event describing which
tool ran. A `before_send` hook runs before any event leaves the server and
removes the `payload` and `response` fields of `validate_payload` calls, so the
JSON payload the agent asked to validate and the validation result are not sent
to the analytics service.

## Cache and retention

The hosted server keeps an in-process, per-instance memory cache of the public
documentation and schemas it fetches, with a stale-on-error fallback so it can
still answer if the docs host is briefly unreachable. Nothing is written to
disk, and nothing persists across restarts — when a server instance restarts,
its cache is empty again.

## What is not collected by the plugin

- The plugin **stores no credentials** and requires none.
- The plugin collects **no personal data**.

There is no account and no profile. Note, however, that your own MCP host
(Cursor or Claude Code) may add its own telemetry about tool usage, independent
of this plugin; that is governed by your host's own privacy terms, not this
document.
