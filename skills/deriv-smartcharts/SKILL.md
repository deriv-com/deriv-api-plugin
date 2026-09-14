---
name: deriv-smartcharts
description: Add the Deriv SmartCharts price chart (the `@deriv-com/smartcharts-champion` package) to an application that uses the New Deriv API Options platform, and drive its barriers and contract markers from the app's trading state. Use when the chart selection guide escalates to SmartCharts or the user names it — a terminal-grade chart with built-in technical indicators, drawing tools, an in-chart symbol browser, or Deriv's standard contract markers and barriers without building an overlay layer — even if the user just says "the same chart Deriv uses", "a full trading terminal", "draw the barrier on the chart", or "mark my trades on the chart". A chart request that names no library defaults to Lightweight Charts; read the guide first. Not for a second WebSocket, for Legacy API compatibility, or for non-Deriv charting libraries.
---

## Hosted MCP first, then bundled references

If hosted MCP tools are available, call them by bare name (`get_schema`, `get_field`, `validate_payload`, `get_example`, `search_endpoints`, `guide_api_conventions`, `guide_authenticate`, and the other hosted guide tools). Do not use bundled field lists while those tools work. Never invent fields.

If those tools are missing or fail, read this skill and its `references/`. Do not invent fields that are not in those files.

Never name a host-namespaced tool; use the bare tool name only.

# Add the SmartCharts price chart

SmartCharts is a host-fed chart: it renders whatever the application feeds it and never opens its own connection. Treat it as one more consumer of the application's shared market-data layer, not as a data source. Everything below composes with the sibling skills; do not duplicate their auth, discovery, or lifecycle logic inside chart code.

Use it when the [chart selection guide](../deriv-trading-app/references/chart-selection.md) escalates to it — a terminal-grade requirement Lightweight Charts cannot meet without building it — or when the user asks for SmartCharts; state the reason in one line.

## Compose the flow skills

1. Read the [market-data flow](../deriv-market-data/SKILL.md). The chart's history and live-quote callbacks are adapters over that layer's tick history and subscription lifecycle.
2. Read the [trade lifecycle](../deriv-trade-lifecycle/SKILL.md) whenever the chart shows barriers or contract markers — they are derived from proposal and open-contract state, never computed independently.
3. Read the [authentication flow](../deriv-auth/SKILL.md) if the chart must switch between the public socket and the account's OTP socket: the chart follows the application's single connection owner through that switch.
4. Read the [trading-app router](../deriv-trading-app/SKILL.md) when the chart is part of an end-to-end trading application.

## Resolve facts before coding

Read and enforce the [New API-only guard](../deriv-trading-app/references/new-api-only.md). The chart's feed carries the same wire traffic as the rest of the application, so every request it emits is subject to the guard.

Two authorities apply, and neither is this skill:

- **Wire facts** — tick history, live tick and candle subscriptions, trading times, active symbols — come from the configured `deriv` MCP: `guide_subscribe_ticks` for the workflow, `search_endpoints` to resolve endpoint IDs, `get_schema`/`get_field` for every field, `validate_payload` for each request shape the adapter emits.
- **Component facts** — props, barrier attributes, chart settings, marker vocabulary — come from the installed package's README and, for anything the README omits, the component source in the SmartCharts repository under `deriv-com` at the installed version, because the published package ships no type declarations. Confirm any prop this skill names against the installed version before relying on it; the package evolves independently of the API.

Never freeze either kind of fact into constants copied from an example.

## Integration contract

- **One socket.** Build the chart's `getQuotes`, `subscribeQuotes`, and `unsubscribeQuotes` callbacks over the application's existing shared WebSocket owner. Never let the chart create, own, or reconnect a connection. Read [the feed adapter reference](references/feed-adapter.md).
- **Host-supplied metadata.** Pass `chartData` (active symbols plus a trading-times map) assembled from the application's own discovery calls. At the installed version the chart issues no market requests of its own, so there is nothing to switch off — leave `shouldFetchTradingTimes` at its default, because despite its name it gates whether the chart *processes* the trading times you supply. Read [chart data and assets](references/chart-data-and-assets.md).
- **Assets are yours to serve.** The package lazy-loads its chart engine, chunks, fonts, and sprites at runtime from a path you declare with `setSmartChartsPublicPath`. Copy its distributed assets to a served location at install/build time and include any deployment base path. Same reference.
- **Overlays follow trading state.** Barriers come from the current proposal or contract; contract markers come from the open-contract stream, keyed by the chart's symbol. Read [trade overlays](references/trade-overlays.md).
- **Generations apply to the chart too.** On symbol, granularity, account, or connection change, the adapter must release the previous quote subscription before the chart requests the next, and late messages from a released subscription must be ignored — the same rules the market-data skill sets for every stream.
- **Reconnect honestly.** Pass the connection's live state as `isConnectionOpened` so the chart patches or refreshes after a reconnect; do not fake an always-open connection.
- **Keep the chart out of the purchase path.** The chart displays state; it never prices, buys, or sells. Purchase remains gated behind authentication and a fresh executable proposal as the lifecycle skill requires.

## Definition of done

The chart renders ticks and candles for the selected symbol from the shared socket; its assets load under the deployed base path; symbol and granularity switches leave exactly one live quote subscription; barriers and markers appear and disappear with the proposal and open-contract state they represent; a reconnect restores the chart without a second socket; unmounting releases every subscription. Tests cover the adapter's request shapes (validated against the live schema), subscription cleanup on switch and unmount, tick-versus-candle normalisation, `chartData` completeness for every active symbol, and marker derivation for each contract state the app supports. No test buys a contract to verify a chart.
