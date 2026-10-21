# Privacy

The Deriv API plugin is provided by Deriv. [Deriv's Privacy Policy](https://deriv.com/privacy-policy)
applies to personal data processed through the plugin. It describes the categories of data Deriv
collects, why, who receives it, how long it is kept, and your rights. This page summarises what
applies to the plugin.

## What the plugin processes

When your AI assistant calls one of the plugin's tools, the request goes to the Deriv-hosted MCP
server the plugin declares. Deriv may process:

- **Tool inputs:** the tool name and its arguments, such as search terms, endpoint names and field
  paths, and for `validate_payload`, the JSON payload the agent asked to validate.
- **Technical data:** such as the client IP address, user agent, and request times.
- **Usage data:** such as which tools were called, how long they took, and whether they failed.

Some of this information may be kept in service logs and analytics records.

The plugin also ships skill files that your assistant reads from your own machine. Reading them
sends nothing to Deriv. When the hosted server is unavailable, those skills may direct your
assistant to Deriv's public documentation at developers.deriv.com.

## How it is used and shared

Deriv uses this data to answer tool requests, to operate and secure the service, to fix problems, and
to understand and improve how the plugin is used. It may be processed by Deriv's hosting, network,
security, and analytics providers, and within the Deriv group, as described in the Privacy Policy.

## Retention and your choices

How long data is kept, and the rights you have, are set out in Deriv's Privacy Policy. You can stop
the plugin sending requests at any time by disabling or uninstalling it.

## Credentials

The plugin does not ask for your Deriv account credentials or API tokens. Do not include credentials
or other personal data in tool inputs.

## Your AI host

Your AI host (for example ChatGPT, Codex, Claude Code, or Cursor) may collect its own data about tool
use under its own privacy terms, independent of this plugin.

## Contact

For privacy questions or requests, contact Deriv's Data Protection Officer at dpo@deriv.com.
