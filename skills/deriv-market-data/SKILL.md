---
name: deriv-market-data
description: Add New Deriv API market discovery and live prices — symbols, contracts, ticks, and tick history. Use whenever a task involves market or symbol selectors, deciding which trade types a symbol supports, deriving trade controls from contract metadata, live tick or price subscriptions, charts, or public read-only feeds — even if the user just says "show live prices", "list the volatility indices", or "why is this duration rejected". Not for order execution or Legacy API compatibility.
---

## Hosted MCP first, then bundled references

If hosted MCP tools are available, call them by bare name (`get_schema`, `get_field`, `validate_payload`, `get_example`, `search_endpoints`, `guide_api_conventions`, `guide_authenticate`, and the other hosted guide tools). Do not use bundled field lists while those tools work. Never invent fields.

If those tools are missing or fail, read this skill and its `references/`. Do not invent fields that are not in those files.

Never name a host-namespaced tool; use the bare tool name only.

# Implement trading market data

Build market data as a reusable layer shared by every trade family. Current live discovery is the source of truth for what a symbol and account can trade; do not freeze availability or controls in UI constants.

## Resolve the New API surface

Read and enforce the [New API-only guard](../deriv-trading-app/references/new-api-only.md). An unchanged endpoint name does not imply unchanged fields, requiredness, or response types.

Use the configured hosted Deriv API MCP:

1. Call `guide_rest_vs_websocket`, `guide_subscribe_ticks`, and `guide_api_conventions` for the workflow.
2. Use `search_endpoints` for active symbols, contracts for a symbol, contract listings, ticks, tick history, trading times, forget, forget-all, and ping as needed.
3. Read exact request/response fields with `get_schema` and `get_field`.
4. Start from `get_example`, then validate each distinct request with `validate_payload`.

If the hosted tools are unavailable, use [llms.txt](https://developers.deriv.com/llms.txt) only to locate the needed current endpoint pages. Cross-check them against the [New API comparison](https://developers.deriv.com/comparison/data/) and accept their linked schemas only when the version and shape are unambiguously New API. If the sources conflict, stop and report the missing New API contract instead of generating code or payloads.

## Discovery flow

1. Resolve the requested user-facing trade families to current contract types with the `deriv-trade-types` skill.
2. Query active symbols, optionally filtering by those types. Keep stable symbol codes separate from display names and market group labels.
3. When a symbol is selected, query the contracts available for it. The request is public; when current New API guidance says an authenticated socket filters the result for that account, treat that response as authoritative without adding removed account or currency request fields.
4. Derive the UI from returned metadata: supported contract families, expiry modes, durations, barriers or strikes, growth rates, multiplier or payout choices, default/min/max stake, and market-open or suspension state.
5. Disable or hide an unavailable combination and explain it. Do not submit a best-guess payload.

Use `underlying_symbol` where the current proposal schema requires it, while retaining endpoint-specific request keys returned by the schemas for ticks and contract discovery. Do not mechanically rename every endpoint field to `symbol` or `underlying_symbol`.

## Stream lifecycle

- Fetch enough history for the initial view, then subscribe to the live tick stream. Merge and de-duplicate by epoch/identity rather than appending duplicate boundary ticks.
- Store request IDs and subscription IDs. Route responses to the matching request or stream, even when multiple selectors or charts are active.
- On symbol, trade-type, account, or component changes, unsubscribe before replacing local state. Ignore late messages from disposed subscriptions.
- Give both subscription and one-shot discovery requests a selection generation. A late contracts-for or active-symbol response for the previous symbol/family must not overwrite current metadata.
- Keep one heartbeat strategy per connection, use bounded reconnects with backoff, and restore only the subscriptions that are still relevant after reconnect.
- Respect the current MCP guidance for rate and connection limits. Batch or cache stable discovery reads instead of polling them on every render.
- Normalise numeric strings only at the domain boundary and preserve precision needed for the symbol's pip size.

Public market data may connect without authentication. In an app that also trades, integrate with its shared WebSocket owner so login, logout, or account switching does not leave duplicate public and authenticated streams running accidentally.

Read [the market-data checklist](references/implementation-checklist.md) when implementing or reviewing this layer.

## Verify

Test empty and suspended markets, unsupported trade-family/symbol combinations, metadata-driven controls, history-to-live handoff, out-of-order responses, type or symbol switching, cleanup, reconnect restoration, error envelopes, and rate-limit backoff. Use mocked streams or a read-only public connection; market-data tests must not buy contracts.
