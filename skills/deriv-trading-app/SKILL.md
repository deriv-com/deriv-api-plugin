---
name: deriv-trading-app
description: Build or extend an authenticated trading application backed by the New Deriv API Options platform by composing authentication, market discovery, trade families, and the proposal-to-position lifecycle. Use whenever a task involves creating or extending a Deriv-powered trading product in any form — an app, template, terminal, bot, or trade screen; adding or combining trade types in one product; or wiring login, live prices, and purchase together — even if the user just says "build me a trading app", "add trading to my site", or names trade families like Accumulators and Rise/Fall together. Not for Legacy API compatibility or general explanations of financial derivatives.
---

## Hosted MCP first, then bundled references

If hosted MCP tools are available, call them by bare name (`get_schema`, `get_field`, `validate_payload`, `get_example`, `search_endpoints`, `guide_api_conventions`, `guide_authenticate`, and the other hosted guide tools). Do not use bundled field lists while those tools work. Never invent fields.

If those tools are missing or fail, read this skill and its `references/`. Do not invent fields that are not in those files.

Never name a host-namespaced tool; use the bare tool name only.

# Build a trading application

Create one coherent application from the requested trade families. Authentication is mandatory for an application that can trade, but it is an app-wide concern: do not create a separate login, account state, or WebSocket for each trade type.

Deriv is the API and execution provider, not the generated product identity. Keep the application generic or apply the user's requested name, logo, colours, copy, and domain through the target repository's branding seams. Never title, describe, or brand the product as a “Deriv trading application” unless the user explicitly requests Deriv branding and has authority to use it.

For the default greenfield browser OAuth application, current guidance requires a backend or backend-for-frontend to exchange the authorization code and protect provider tokens. Surface that constraint before scaffolding: under this OAuth boundary, the authenticated product cannot be delivered as a static-only SPA. A public, read-only market view may remain static because it does not hold account credentials.

## Compose the flow skills

Read and apply these sibling skills as the request requires:

1. Always read the [authentication flow](../deriv-auth/SKILL.md) for a trading application. Logged-out users may see public prices and indicative proposals, but account data and execution stay gated.
2. Read the [market-data flow](../deriv-market-data/SKILL.md) for symbols, contract availability, controls derived from contract metadata, ticks, or charts.
3. Read the [trade-type flow](../deriv-trade-types/SKILL.md), then only the references for the families the user requested.
4. Read the [trade lifecycle](../deriv-trade-lifecycle/SKILL.md) whenever the app prices, buys, monitors, updates, cancels, or sells a contract.
5. Whenever the app renders a price chart, read the [chart selection guide](references/chart-selection.md) — Lightweight Charts by default, SmartCharts when the requirements or the user call for it — then read the chart skill it selects: Lightweight Charts or SmartCharts.

## Resolve the request before coding

Separate three dimensions that users often mix together:

- **App surface:** a focused trade screen, several selectable trade types, a full terminal, a bot, or a read-only market view.
- **Trade family:** Accumulators, Rise/Fall, Digits, Multipliers, Vanilla, Turbos, or another Options contract family.
- **Underlying market:** forex, commodities, Derived Indices, or another market returned by live discovery.

“Derivatives” is an umbrella term, not a contract type. “Derived Indices” is an underlying market, not a contract type. Never invent a `DERIVATIVES` contract value. CFDs are outside the Options `proposal`/`buy` flow.

Resolve the target repository/template and its architecture before editing application shell or auth code. Treat a request for both browser OAuth trading and a static-only deployment as an architecture conflict to resolve explicitly; do not substitute a browser-held PAT merely to avoid a backend. If the meaning of an ambiguous product or target changes the architecture, ask one concise clarification. Until it is answered, continue only with read-only resource discovery and architecture-neutral interfaces/test cases; do not scaffold a shell that may belong to the wrong product.

## Use the hosted Deriv API MCP as the development source

Read and enforce the [New API-only guard](references/new-api-only.md) before using any API fact or repository example. Existing endpoint names, code, and schemas do not prove that their fields use the New API.

Use the configured Deriv API MCP at `https://mcp-api-v2.deriv.com/mcp`. The MCP is a read-only development aid; generated applications call Deriv APIs directly and must not depend on the MCP at runtime.

First inspect the client's MCP tool list for the configured `deriv` server. A URL written in a prompt is not a connected tool: if the server is absent, configure it through the client's MCP settings and confirm the service is reachable, or use the fallback below. Do not make raw JSON-RPC calls from generated application code.

With the hosted Deriv API MCP:

- Use `guide_*` tools for “how do I do this?” guidance.
- Use `search_endpoints` to resolve endpoint IDs.
- Use `get_schema` and `get_field` for every field-level claim.
- Use `get_example` only as a schema-backed starting point.
- Run `validate_payload` for each distinct request shape before finalising code or fixtures.

If the hosted MCP is unavailable, use [the current `llms.txt` index](https://developers.deriv.com/llms.txt) only to locate the needed current guides. Cross-check each affected endpoint against the New API comparison and accept a linked schema only when its version and shape are unambiguously New API. If sources conflict, or no New-API-confirmed validator is available, stop before finalising executable code or fixtures. Do not use an older MCP tool, Legacy example, or repository type as a fallback API authority.

## Composition contract

- Keep one auth/session/account context and one shared WebSocket owner. Switching accounts obtains a fresh OTP URL and reconnects that shared owner.
- Treat every newly opened authenticated socket as a new connection generation. Its OTP URL must be freshly minted; an automatic reconnect must not reuse the URL that opened the previous socket.
- Treat each trade family as an adapter from validated UI state to a proposal request. Do not duplicate transport or account logic inside adapters.
- Discover symbols and supported contracts at runtime. Drive durations, barriers, growth rates, multipliers, strikes, and stake limits from live metadata or proposal validation.
- For a logged-out indicative proposal, resolve currency from explicit application configuration or current validated guidance. If neither supplies one, show public ticks without a proposal and ask for the product decision; never silently default the quote currency.
- Price and buy an executable proposal on the same authenticated OTP connection. Never buy a proposal created on an old connection or for a previous trade-type selection.
- On symbol, account, or trade-type change, unsubscribe the prior proposal/tick streams, clear stale proposal IDs, reset incompatible controls, and prevent purchase until a fresh valid proposal arrives.
- Gate `buy`, balances, portfolio, open-contract monitoring, updates, cancellation, and `sell` behind authentication and the required scope.
- Correlate concurrent requests, handle API error envelopes, bound retries, and clean up subscriptions and sockets.
- Never place a real trade to verify generated code. Use schema validation, mocks, unit/integration tests, or a demo account only with explicit authorisation.

## Definition of done

The completed app has explicit loading, logged-out, authenticating, ready, reconnecting, and error states; account switching; valid controls for every requested family; a confirmation boundary before purchase; open/closed position handling; responsive and accessible UI; and tests covering auth gates, family switching, stale proposals, API errors, and subscription cleanup. Run the target repository's test, type-check, and build commands.
