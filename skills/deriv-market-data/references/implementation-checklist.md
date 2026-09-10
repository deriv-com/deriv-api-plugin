# Market-data implementation checklist

Use this after resolving endpoint IDs and fields through the hosted Deriv API MCP.

## New API boundary

- `active_symbols`: use `underlying_symbol`, `underlying_symbol_name`, `underlying_symbol_type`, and `pip_size`. Do not depend on Legacy `symbol`, `display_name`, `symbol_type`, `pip`, spot fields, translated display fields, or removed `landing_company`, `landing_company_short`, `product_type`, `loginid`, and `barrier_category` filters.
- `active_symbols` display strings: `market` and `submarket` were observed arriving as codes only (`synthetic_index`, `major_pairs`), so `underlying_symbol_name` was the only display string observed. Derive market and submarket labels client-side from the codes rather than expecting a translated name, and expect `underlying_symbol_type` to be empty for some symbols (Step indices were observed this way), so a formatter with no fallback throws. Never let a discovery failure be reported as a connection failure: log the underlying cause, so a type error inside a sort or format step is not read as a network fault. None of that is a schema promise: confirm each of those fields and its description with `get_schema` / `get_field` before relying on the shape.
- `contracts_for`: never send `currency`, `landing_company`, `landing_company_short`, `product_type`, or `loginid`. Do not parse removed spot, schedule, display, barrier-category, start-type, forward-starting, or trading-period fields; use ticks for prices and trading times for schedules.
- `ticks` and `ticks_history`: model requiredness and numeric types for the tick object, the history arrays, and the candle fields from `get_schema` / `get_field`, never from an older local type or a Legacy example.
- If the MCP, comparison, documentation, schema, and repository types do not agree on the New API shape, stop before implementation. Do not choose the Legacy-compatible union or requiredness as a convenience fallback.

## Data model

- Store the symbol's API identifier separately from its display name, market, submarket, type, pip size, open/suspended flags, and other presentation metadata.
- Keep raw contract metadata per symbol and derive selectable families and controls from it. Do not reduce the response to one global duration range when families have different expiry modes.
- Keep prices as numbers only after a deliberate boundary conversion. Format with the selected symbol's precision in the view layer. `pip_size` means different things on different responses — on `active_symbols` it was observed as a minimum fluctuation amount (`0.00001`) and on `ticks_history` as a decimal-place count (`5`) for the same symbol — so read each field's own description with `get_field` and convert deliberately rather than passing one value where the other is meant.
- Represent loading, empty, unavailable, stale, reconnecting, and error states explicitly.

## Discovery

- Query active symbols for the requested contract families rather than presenting every market when the app is focused.
- On symbol selection, request its current contract metadata. Re-run after account/socket changes when account permissions can affect availability.
- Use contract metadata for duration/expiry mode, barriers or strikes, growth rates, multipliers, payout choices, stake limits, and default values.
- If a previously selected family becomes unavailable, clear its quote and show a deliberate unavailable state. Do not switch the user to another family silently.
- Use trading-time information for market schedules when needed; do not infer schedule solely from the last tick.

## History and live ticks

- Fetch history first and merge the live stream at its boundary without duplicates.
- Give each request a correlation ID and each subscription an owner/generation.
- On a symbol change, mark the previous generation disposed before awaiting unsubscribe so late messages cannot update the new chart.
- Bound the price window retained in memory. Avoid re-subscribing because a render created a new but equivalent parameter object.
- Restore active streams after reconnect only after the new connection is ready. Do not restore a stream whose owning screen or selection is gone.

## Cleanup and resilience

- Store and invoke the API's subscription cleanup operation for every stream.
- Centralise heartbeat, backoff, request correlation, and response-error handling in the shared transport.
- Retry idempotent reads only, with exponential backoff, jitter, and a stopping condition.
- Cache relatively stable discovery data for a short period where useful, but revalidate account-dependent contract availability.
- Respect the live rate, subscription, and connection limits returned by current guidance.

## Tests

- Active-symbol filtering and grouping.
- Empty list, closed market, suspended symbol, and unsupported contract family.
- Controls change when contract metadata changes.
- History/live boundary de-duplication and numeric precision.
- Out-of-order and late messages cannot overwrite a newer selection.
- Every subscription is forgotten on change/unmount.
- Reconnect restores only current streams.
- Rate-limit and transient-error backoff stops at the configured bound.
