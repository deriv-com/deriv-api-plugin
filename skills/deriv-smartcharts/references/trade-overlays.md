# Trade overlays: barriers and contract markers

> **Version anchor.** The prop shapes this file records — the `barriers` configuration, and `contracts_array` being undocumented in the package README so its entries come from the component source — were observed when this skill was housed on 2026-09-07, and the `@deriv-com/smartcharts-champion` version they were observed against was not recorded. The nearest version this skill records is `1.12.0`, observed on 2026-09-09 for the behaviour in [chart data and assets](chart-data-and-assets.md), but these prop shapes were not re-confirmed against it. Re-confirm each against the version your application installs.

Overlays make the chart part of the trading experience: the barrier a contract is measured against, and the entry, running state, and exit of each contract. Both are *derived views* of state the trade-lifecycle skill already owns. The chart never invents them.

## Barriers

The chart draws barriers from a `barriers` prop — an array of barrier configurations documented in the package README's Barriers API (shade type, high/low prices, colours, draggability, label visibility). Confirm the attribute set against the installed version.

Derive them from trading state by family:

- **Accumulators.** The live proposal's contract details carry the current high and low barriers around the spot. Render both with a `BETWEEN` shade, non-draggable, absolute prices, and colour the band by whether the spot has crossed; hide the off-screen indicators so a wide barrier does not clutter the chart. Read the barrier fields with `get_field` on the proposal response — do not compute barriers from the growth rate.
- **Higher/Lower, Touch/No Touch, and other barrier products.** The user's selected barrier is the chart barrier; render one line (or two for range products) and, if the chart is the input, wire `onChange` back to the control so a drag updates the proposal — the proposal is the source of truth, not the drag position.
- **Rise/Fall and Digits.** No barrier. Do not draw the entry spot as a barrier; the entry spot is a marker.
- **Take profit / stop loss on Multipliers.** Render as inline-label barriers when the package offers that variant; their values come from the proposal or contract limit orders.

Invalidate barriers with the same key as the proposal: a symbol, family, account, or control change clears them until a fresh proposal arrives.

## Contract markers

The chart renders contract lifecycles from a `contracts_array` prop. Each entry names the contract's marker type, its marker points, a small props bag (running or settled, in profit or not, padding and label), a direction, an optional profit-and-loss label, and the current epoch. That prop is not documented in the package README, so its entry shape must be read from the component source at the installed version. Confirm the entry shape and the marker-point vocabulary against the installed version; the current vocabulary distinguishes tick-based, time-based, and accumulator contracts and places points such as the entry spot, the (collapsed or expanded) start time, the running contract pill with an optional tick counter, the collapsed exit time, the exit spot, and the profit-and-loss label.

Derive markers from the open-contract stream (`proposal_open_contract`) that the lifecycle skill maintains:

- Filter positions to the chart's current symbol; a marker for another symbol is a bug.
- Sort newest first and give only the most recently started contract the expanded start-time line; older running contracts get the collapsed variant.
- For a running contract, place the entry spot at the entry tick time and quote, the contract pill at the start time (with a tick counter such as `3/5` for tick contracts, read from the contract's tick stream length and tick count), and the collapsed exit time at the expiry.
- For a settled contract, place the exit spot at the exit spot time and quote and attach the profit-and-loss label above or below it depending on whether the exit was above the entry.
- Read every epoch, spot, profit, and status field from `get_schema` on the open-contract response and normalise its documented numeric strings at one boundary; do not consume removed or deprecated fields the New API-only guard lists.
- Use the contract's current spot time as the marker's current epoch while it runs.

For a settled contract shown in isolation (a result or preview view), freeze the chart with `endEpoch` at the exit time so the marker is in frame and the chart stops advancing.

## Ordering with the feed

Barriers and markers are props; the feed is callbacks. Both must key on the same symbol and connection generation so a symbol switch cannot show the previous symbol's overlays on the new symbol's ticks for a frame. Clear overlays synchronously when the key changes; let the fresh proposal and open-contract data repopulate them.

## Verify

- Each supported family produces the expected barrier set from a proposal fixture, and no barrier for families that have none.
- Markers are produced for running and settled fixtures of each contract type the app supports, with the newest-first expanded start line.
- A symbol switch clears overlays before the new symbol's feed renders.
- Marker derivation never reads a field absent from the live open-contract schema.
