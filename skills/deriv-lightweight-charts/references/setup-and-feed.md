# Setup and feed: one series, one socket

> **Version anchor.** The library behaviour this file records — the v5 `addSeries` API in place of v4's `add…Series()` methods, the production build's `Cannot update oldest data` throw, the development-only sort assertion, and whitespace rows counting as points — was observed against `lightweight-charts@5.2.1`, the version this skill was authored and reviewed against between 2026-09-08 and 2026-09-09. The two `pip_size` meanings were read from the live API on 2026-09-09. Re-confirm every option name against the installed `typings.d.ts`: a major bump changes these APIs, as the v4-to-v5 rename recorded here shows.

The library exposes a chart, series on that chart, and two data calls per series: `setData` for the full history and `update` for the latest point. The adapter's job is to fill those from the application's existing tick-history request and subscription on the shared WebSocket, and nothing else.

## Install and create

- Install `lightweight-charts` (v5, Apache-2.0). It is a plain DOM library with one dependency — no runtime assets to copy, no framework coupling — so it mounts inside any React, Vue, or vanilla host. Create the chart client-side only (no server rendering).
- Create the chart with `createChart(container, options)`. Use `autoSize` so it follows its container, and set `timeScale.timeVisible` (and `secondsVisible` for tick charts) so intraday times render.
- Create series with `addSeries(<definition>, options)` using the exported definitions — `CandlestickSeries`, `LineSeries`, `AreaSeries`, `BaselineSeries`, `HistogramSeries`. Set `priceFormat` (`precision` and `minMove`) from the symbol's pip size so the price scale matches the market — and read that pip size deliberately, because two responses carry a `pip_size` field with different meanings: the `active_symbols` value was observed as a minimum fluctuation amount (`0.00001`) and the `ticks_history` value as a decimal-place count (`5`) for the same symbol. `precision` wants the decimal-place count and `minMove` the fluctuation amount; read each field's own description with `get_field` and convert rather than passing one where the other is meant. Confirm option names against the installed `typings.d.ts`; do not rely on v4 examples, which used `add…Series()` methods.
- Drive the theme through `layout` (`background`, `textColor`) and the grid options from the application's resolved theme via `applyOptions`; the library does not read host CSS variables.
- On unmount, release the live subscription first, then call the chart's `remove()`. One chart per container; recreate rather than reuse across symbols if state leaks.

## Data shapes

- Candles: `{ time, open, high, low, close }`. Line, area, and baseline series: `{ time, value }`. Histogram adds an optional `color`.
- `time` is a `UTCTimestamp` in **seconds**. Deriv epochs are seconds, so a tick's epoch and a candle's open time pass straight through.
- History must be sorted ascending with strictly increasing times. Only the development build asserts this; the production build does not, so an unsorted or duplicated array renders wrongly instead of failing loudly. De-duplicate the boundary between the history response and the first live update by time.
- Parse the numeric strings the schema documents into numbers once, in the adapter. Read the tick, candle, and history field names and types with `get_schema`/`get_field`; do not copy them from a chart example.
- A whitespace point `{ time }` with no value extends the time axis without drawing — the way to show a contract window that ends in the future — but never on the series you drive with `update`. `update` rejects any time earlier than the series' last point, whitespace rows count as points, and the production build throws `Cannot update oldest data` on the next live tick. Keep future whitespace on a separate whitespace-only series (see trade overlays).

## Mapping the feed

- **History** — one tick-history request: ticks when granularity is zero, candles otherwise; a bounded count; the latest point as the end unless paging back with explicit bounds. Map the response to the series shape and call `setData`. Validate the request shape with `validate_payload`.
- **Live** — the streaming tick-history subscription for the same symbol and granularity. For a tick, `update({ time: epoch, value: quote })` on a line or area series. For a candle, `update({ time: openTime, open, high, low, close })`: the same open time updates the forming candle in place; a new open time appends the next one.
- **Granularity switch** — release the live subscription, request new history, `setData` the new array (or remove and re-add the series when the type changes between line and candles), then subscribe again. Never let two live subscriptions exist for one chart.
- **Symbol switch** — the same sequence, plus clearing every overlay keyed to the previous symbol before the new history lands.
- **Reconnect** — the connection owner decides when the socket is back; the adapter then re-requests history to fill the gap and re-subscribes. The library has no connection state of its own, so the application shows any "reconnecting" state itself.

## Subscription ownership

- Key the live subscription by symbol and granularity; store its unsubscribe handle in adapter state.
- Release the previous key before honouring a request for a new one, and release everything on unmount.
- Ignore updates for a key that has already been released — a late message from a disposed stream must not reach `update`.
- The socket's lifecycle — including a fresh OTP URL for an authenticated reconnect — belongs to the application's connection owner described in the authentication skill. Chart code never reconnects.

## Time scale behaviour

- `scrollToRealTime()` snaps the view to the newest point; `fitContent()` shows everything loaded; `setVisibleRange` frames a specific window such as a settled contract.
- `rightOffset` leaves headroom after the last bar so markers at the newest tick are not clipped; `shiftVisibleRangeOnNewBar` keeps the view following live data.
- Tick charts advance every second or faster; keep `secondsVisible` on and expect the time axis to relabel continuously.

## Attribution and licence

`layout.attributionLogo` defaults to `true` and renders TradingView's logo linking to tradingview.com; the library documents that this alone satisfies its linking requirement. Leave it on unless the page already carries an equivalent link. Independently, Apache-2.0 requires the package's LICENSE and NOTICE text to ship with the application — add them to the open-source-licences page alongside every other dependency.

## Verify

- Every request the adapter can emit validates against the live schema through `validate_payload`.
- History followed by live updates produces strictly increasing times with no duplicate boundary point.
- Symbol switch, granularity switch, and unmount each leave no dangling subscription; a mocked stream proves late messages are dropped.
- Tick and candle updates normalise to the series shapes with the symbol's pip precision preserved.
- The chart renders with the attribution logo present (or the page carries the equivalent link) and the licence texts are on the licences page.
