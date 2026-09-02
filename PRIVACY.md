# Privacy

This document describes what data the Deriv API plugin does and does not handle.

## Data flow

The plugin is a thin client: when a tool is called it reaches a **hosted Deriv
API MCP server** over HTTP, and that hosted server is what fetches public Deriv
API documentation and schemas. Traffic therefore goes to the hosted server, not
only to `developers.deriv.com` directly. A definitive, host-by-host data-flow
description lands with the hosted-posture rewrite of this document (tracked in
the hosted-MCP migration).

## What is not collected

- The plugin **stores no credentials** and requires none.
- It collects **no personal data**.
- It sends **no telemetry and no analytics** — there is no usage reporting of
  any kind.

There is no account, no profile, and no server that receives information about
you. The hosted server only reads public documentation from the Deriv developer
docs host so the agent can answer questions and validate payloads.
