---
name: deriv-lightweight-charts
description: Add TradingView's Lightweight Charts (the `lightweight-charts` npm package, Apache-2.0, ~60 KB) as the slim price chart of an application built on the New Deriv API Options platform, fed from the app's shared WebSocket and overlaid with barriers and trade markers derived from its trading state. Use whenever a task mentions Lightweight Charts, a TradingView chart, a small or minimal chart, a candlestick or tick chart without SmartCharts, or "add a chart" to an app that names no library (this is the default chart) — even if the user just says "show the price", "a simple chart is enough", or "draw the result on the chart". Not for a second WebSocket, for Legacy API compatibility, or for the full SmartCharts terminal (read the chart selection guide first).
---

## Hosted MCP first, then bundled references

If hosted MCP tools are available, call them by bare name (`get_schema`, `get_field`, `validate_payload`, `get_example`, `search_endpoints`, `guide_api_conventions`, `guide_authenticate`, and the other hosted guide tools). Do not use bundled field lists while those tools work. Never invent fields.

If those tools are missing or fail, read this skill and its `references/`. Do not invent fields that are not in those files.

Never name a host-namespaced tool; use the bare tool name only.

# Add the Lightweight Charts price chart

Lightweight Charts is a rendering library, not a trading chart: it draws whatever series the application feeds it and knows nothing about symbols, markets, trading hours, or contracts. Everything a trading app needs beyond candles — the symbol picker, market-closed state, barriers, contract markers — is supplied by the application from state the sibling skills already own. It is the default chart for these skills: read the [chart selection guide](../deriv-trading-app/references/chart-selection.md) to confirm no requirement escalates to SmartCharts, state the choice in one line, and proceed.

## Compose the flow skills

1. Read the [market-data flow](../deriv-market-data/SKILL.md). The chart's history and live updates are adapters over that layer's tick history and subscription lifecycle.
2. Read the [trade lifecycle](../deriv-trade-lifecycle/SKILL.md) whenever the chart shows barriers or contract markers — they are derived from proposal and open-contract state, never computed by chart code.
3. Read the [authentication flow](../deriv-auth/SKILL.md) if the chart must follow the application from the public socket to the account's OTP socket: it follows the single connection owner through that switch.
4. Read the [SmartCharts skill's trade overlays](../deriv-smartcharts/references/trade-overlays.md) for *what* to derive per contract family; this skill's overlay reference covers only *how to draw it* with this library.
5. Read the [trading-app router](../deriv-trading-app/SKILL.md) when the chart is part of an end-to-end trading application.

## Resolve facts before coding

Read and enforce the [New API-only guard](../deriv-trading-app/references/new-api-only.md). The chart's feed carries the same wire traffic as the rest of the application, so every request it emits is subject to the guard.

Two authorities apply, and neither is this skill:

- **Wire facts** — tick history, live tick and candle subscriptions, trading times, active symbols — come from the configured `deriv` MCP: `guide_subscribe_ticks` for the workflow, `search_endpoints` to resolve endpoint IDs, `get_schema`/`get_field` for every field, `validate_payload` for each request shape the adapter emits.
- **Library facts** — chart and series options, data shapes, marker and price-line fields, the primitives API — come from the installed package: it ships its type declarations (`typings.d.ts`) and TradingView's documentation site, and the library repository's `plugin-examples` directory holds the worked custom drawings. Confirm every option this skill names against the installed version; v5 changed series creation from the v4 `add…Series()` methods to `addSeries(<SeriesDefinition>)`.

Never freeze either kind of fact into constants copied from an example.

## Integration contract

- **One socket, one adapter.** Translate the chart's needs into the application's existing tick-history request and subscription on the shared WebSocket owner: `setData` for history, `update` for each live tick or candle. The chart never opens, owns, or reconnects a connection. Read [setup and feed](references/setup-and-feed.md).
- **Deriv time is chart time.** The API's epochs are seconds and the library's `UTCTimestamp` is seconds; pass them through without conversion and keep history sorted ascending with unique times.
- **The host owns the market UI.** Symbol selection, market-open state (from trading times), and any indicators are application features built from the market-data layer; the chart only renders the selected symbol's series.
- **Overlays follow trading state.** Barriers become price lines, entry and exit spots become series markers, contract windows become primitives — all keyed to the chart's symbol and cleared when the proposal or contract they represent goes away. Read [trade overlays](references/trade-overlays.md). Shipping the feed without overlays is a complete first deliverable; agree the overlay scope with the user.
- **Generations apply to the chart too.** On symbol, granularity, account, or connection change, release the previous subscription before requesting the next, reset the series data, and ignore late messages from a released subscription — the same rules the market-data skill sets for every stream.
- **Keep the attribution.** The library's `attributionLogo` layout option is on by default and satisfies TradingView's link requirement; disable it only if the page carries an equivalent tradingview.com link, and ship the package's LICENSE and NOTICE text in the application's open-source-licences page.
- **Keep the chart out of the purchase path.** The chart displays state; it never prices, buys, or sells. Purchase remains gated behind authentication and a fresh executable proposal as the lifecycle skill requires.

## Definition of done

The chart renders ticks and candles for the selected symbol from the shared socket; symbol and granularity switches leave exactly one live subscription and no stale series data; a reconnect resumes updates without a second socket; unmounting releases the subscription and removes the chart; the attribution logo (or an equivalent link) is present; barriers and markers, where in scope, appear and disappear with the proposal and open-contract state they represent. Tests cover the adapter's request shapes (validated against the live schema), history-to-live handoff without duplicate or out-of-order times, subscription cleanup on switch and unmount, tick-versus-candle normalisation with the symbol's pip precision, and overlay derivation for each contract state the app supports. No test buys a contract to verify a chart.
