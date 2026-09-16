# Feed adapter: chart callbacks over the shared socket

> **Version anchor.** The callback contract this file records — the three callbacks, their arguments, and `style` reaching `getQuotes` alone — was observed when this skill was housed on 2026-09-07, and the `@deriv-com/smartcharts-champion` version it was observed against was not recorded. The nearest version this skill records is `1.12.0`, observed on 2026-09-09 for the behaviour in [chart data and assets](chart-data-and-assets.md), but these signatures were not re-confirmed against it. Re-confirm each against the version your application installs before you rely on it.

SmartCharts asks the host for data through three callbacks and does nothing else on the network. The adapter's whole job is to translate those calls into the application's existing tick-history and subscription requests on the one shared WebSocket, and to normalise the answers into the shape the chart expects.

## The three callbacks

Confirm the exact signatures against the installed package's README and, for anything the README omits, the component source in the SmartCharts repository under `deriv-com` at the installed version; the current contract is:

- `getQuotes({ symbol, granularity, count, start, end, style })` — returns a promise of historical data. Map it to a one-shot tick-history request: ticks when granularity is zero, candles otherwise; a bounded `count`; `end` as the latest point unless the chart pages backwards with explicit `start`/`end`.
- `subscribeQuotes({ symbol, granularity }, callback)` — returns an unsubscribe function. It is passed no `style`, so the adapter derives the style itself, exactly as above: granularity zero means the `"ticks"` style with granularity omitted, otherwise the `"candles"` style at that granularity. Map it to a streaming tick-history subscription with the smallest history the schema allows, then forward each live update to `callback`.
- `unsubscribeQuotes(request)` — the chart's request to drop a stream. Resolve the same key the subscription used (symbol plus granularity) and release exactly that subscription.

Resolve the request and response fields for tick history, ticks, and candles with `search_endpoints`, `get_schema`, and `get_field`; validate the adapter's distinct request shapes with `validate_payload`. Do not copy field names, units, or defaults from a chart example: the library documents what it *calls*, not what the current API *accepts*.

## Normalising quotes for the chart

The chart consumes a flat quote object per update. Build it from the live schema's fields rather than from an assumed shape:

- For a tick update, derive the chart's date from the tick epoch and its close from the tick quote, and keep the raw tick alongside for anything else the host needs.
- For a candle update, derive open, high, low, close, and the bar's date from the candle fields, parsing the numeric strings the schema documents at this one boundary.
- Read the field names, epoch units, and numeric types from `get_schema` for the tick and candle responses; normalise once in the adapter, never in components.

## Subscription ownership

- Key every live subscription by symbol and granularity, and keep the unsubscribe functions in adapter-owned state so `unsubscribeQuotes` can release the right one.
- Release the previous key before honouring a request for a new one; the chart may call `subscribeQuotes` for the new symbol before `unsubscribeQuotes` for the old one, so the adapter must tolerate either order without leaking.
- On adapter unmount, release every remaining subscription.
- Ignore updates that arrive for a key that has already been released — late messages from a disposed stream must not be forwarded to the chart.
- Never open a second socket, never reconnect from inside the adapter, and never call the account-bound endpoints from chart code. The socket's lifecycle — including a fresh OTP URL for an authenticated reconnect — belongs to the application's connection owner described in the authentication skill.

## Reconnect and connection state

Pass the connection owner's live state to the chart as `isConnectionOpened`. When it flips back to open after a drop, the chart patches missing data or reloads depending on granularity; it can only do that if the value is honest. Do not hard-code it to true.

## Verify

- Every request the adapter can emit validates against the live schema through `validate_payload`.
- Symbol switch, granularity switch, and unmount each leave no dangling subscription; a mocked stream proves late messages are dropped.
- Tick and candle updates normalise to the chart's shape with the symbol's pip precision preserved.
- The adapter works against a public socket and, after login, the OTP socket, without creating a connection of its own.
