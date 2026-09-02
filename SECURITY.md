# Security

This document describes the network and credential behaviour of the Deriv API
plugin and how to report a vulnerability.

## Network scope

The plugin is a thin client: it points both hosts at a **hosted Deriv API MCP
server** over HTTP, and that hosted server is what fetches public Deriv API
documentation and schemas live when a tool is called. The plugin ships no local
server. A definitive, host-by-host network-scope description lands with the
hosted-posture rewrite of this document (tracked in the hosted-MCP migration).

## Credentials

The plugin **stores no credentials** and requires none to run. It does not sign
in to Deriv, does not read or write any API tokens, and asks you to configure
nothing.

If your own application authenticates to Deriv — for example via OAuth — that is
your application's concern. Those credentials belong to your application and are
never handled, stored, or transmitted by this plugin.

## Reporting a vulnerability

If you believe you have found a security issue, please report it privately to
the maintaining team, **`@deriv_api_v2_team`**, rather than opening a public
issue. Include enough detail to reproduce the problem and, where relevant, the
potential impact. The team will acknowledge the report and follow up on a fix.
