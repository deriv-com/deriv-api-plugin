# Trade overlays: drawing barriers and contract results

> **Version anchor.** The drawing APIs this file records — `createPriceLine`, `createSeriesMarkers`, `attachPrimitive` / `detachPrimitive`, `addPane` / `moveToPane`, and the separate whitespace-only series — were observed against `lightweight-charts@5.2.1`, the version this skill was authored and reviewed against between 2026-09-08 and 2026-09-09. Re-confirm each against the installed `typings.d.ts`: a major bump changes them, as the v4-to-v5 rename of the series API shows.

The library has no contract model, but it exposes every primitive needed to draw one. *What* to draw per family — which barrier, which spots, which label — is defined once in the [SmartCharts skill's trade overlays](../../deriv-smartcharts/references/trade-overlays.md) and derived from the proposal and open-contract state the trade-lifecycle skill owns. This file covers only *how to draw it here*. Scope it with the user: a chart that shows only the price feed is a complete first deliverable, and overlays can follow.

## The drawing toolbox

Confirm each against the installed `typings.d.ts`:

- **Price lines** — `series.createPriceLine({ price, color, lineWidth, lineStyle, title, axisLabelVisible, … })` draws a labelled horizontal line at a price; keep the returned handle, move it with `applyOptions({ price })`, and drop it with `removePriceLine`. This is the barrier, entry-spot, and take-profit/stop-loss line.
- **Series markers** — `createSeriesMarkers(series, markers)` returns a plugin handle whose `setMarkers` replaces the set. A marker has `time`, `position` (`aboveBar`, `belowBar`, `inBar`, or the price-anchored `atPriceTop`/`atPriceMiddle`/`atPriceBottom` with a `price`), `shape` (`circle`, `square`, `arrowUp`, `arrowDown`), `color`, `size`, and `text`. This is the entry spot, exit spot, direction arrow, and profit-and-loss label.
- **Baseline series** — a `BaselineSeries` with its base value set to a price fills above and below that level in two colours. This is the win/lose zone for an entry-relative contract.
- **Primitives** — `series.attachPrimitive(...)` / `detachPrimitive(...)` and the pane equivalent accept custom canvas drawings (`ISeriesPrimitive`, `IPanePrimitive`). TradingView maintains worked examples in the library repository's `plugin-examples` directory — `vertical-line`, `session-highlighting`, `background-shade-series`, `rectangle-drawing-tool`, `anchored-text`, `partial-price-line` — adapt those rather than inventing renderers. This is the start and expiry line, the contract-window shading, and any free-floating label.
- **Whitespace series** — `{ time }` points extend the time axis into the future without drawing; without them nothing renders past the newest tick, so a marker or line at the expiry time is invisible until the data reaches it. Put them on a separate whitespace-only series (a `LineSeries` that never receives values), never on the price series: `update` rejects any time earlier than the series' last point and whitespace rows count, so a future tail on the price series makes the next live tick throw `Cannot update oldest data` in production. A separate series is TradingView's documented shape for this.
- **Panes** — `addSeries(definition, options, paneIndex)` with `addPane`/`moveToPane` places a histogram or statistic below the price pane (for example digit statistics).

## Per-family drawing

| Family (derivation in the SmartCharts reference) | Draw with |
|---|---|
| Accumulators — live high/low barriers from the proposal's contract details | Two price lines moved per tick with `applyOptions({ price })`; shade between them with the `background-shade-series` or `rectangle-drawing-tool` primitive; colour by whether the spot has crossed |
| Higher/Lower, Touch/No Touch, range products — the user's barrier(s) | One or two price lines; if the chart is the input, listen for the user's drag through your own primitive or control and feed the proposal — the proposal stays the source of truth |
| Rise/Fall — no barrier; entry spot is a marker | Entry marker at entry time and spot (`atPriceMiddle`, `circle`); optional `BaselineSeries` based at the entry spot for the win/lose zone; a direction arrow (`arrowUp`/`arrowDown`) at the start time |
| Digits — no barrier; outcome at the exit tick | Exit marker with the result text; a histogram pane for last-digit statistics if the app shows them |
| Multipliers — take profit / stop loss / stop out | Price lines with `title` labels; move them when the contract limit orders change |
| Any running contract — start time, expiry, tick counter | `vertical-line` primitive at the start time; a whitespace-only series carrying `{ time }` points to the expiry plus a second vertical line there; the running tick count (`3/5`) as marker `text` or an `anchored-text` primitive updated per tick |
| Any settled contract — exit spot and result | Exit marker at the exit spot time and quote with the profit-and-loss `text`, placed above or below depending on whether the exit was above the entry; frame it with `setVisibleRange` in a result view |

Read every epoch, spot, profit, and status field from `get_schema` on the open-contract response, normalise its documented numeric strings at one boundary, and do not consume removed or deprecated fields the New API-only guard lists.

## Ordering with the feed

Overlays and the feed must key on the same symbol and connection generation so a symbol switch cannot show the previous symbol's lines on the new symbol's ticks for a frame. On a key change, clear synchronously — `removePriceLine` each handle, `setMarkers([])`, `detachPrimitive` each drawing, `setData([])` the whitespace series — and let the fresh proposal and open-contract data repopulate. Invalidate barriers with the proposal's own key: a symbol, family, account, or control change removes them until a fresh proposal arrives.

## Verify

- Each supported family produces the expected price lines and markers from a proposal or open-contract fixture, and none for families that have no barrier.
- The whitespace series extends the axis exactly to the expiry, stays separate from the price series so live `update` calls keep succeeding after overlays are drawn, and is emptied on settlement or invalidation.
- A symbol switch clears every overlay before the new symbol's feed renders.
- Overlay derivation never reads a field absent from the live open-contract schema.
