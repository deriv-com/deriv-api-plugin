# Rise/Fall and Higher/Lower

Use this reference for entry-relative up/down contracts and single-barrier Higher/Lower contracts. They look similar in UI copy but are different products.

## Current routing hints

- Rise: `CALL`
- Fall: `PUT`
- Rise with equality: `CALLE`
- Fall with equality: `PUTE`
- Higher than a selected barrier: `HIGHER`
- Lower than a selected barrier: `LOWER`

Verify these values through the current proposal schema and live contract catalog. Do not use a legacy guide that reverses CALL and PUT, and do not add a barrier to ordinary Rise/Fall.

## Distinguishing the products in discovery

The New API `contracts_for` response has no `barrier_category` field, so do not follow older guidance that separates Rise/Fall from Higher/Lower with it. Distinguish the entries by `contract_category` together with `contract_type` — entry-relative Rise/Fall entries were observed under `callput` and `callputequal`, barrier products under `higherlower`. Do not filter on an entry's `barriers` count: entries for both families were observed carrying the same count, so a count filter drops every Rise/Fall entry and leaves the UI with no direction and no duration. Equality variants arrive as their own entries whose duration bounds can differ from plain Rise/Fall, so read each variant's `min_contract_duration`/`max_contract_duration` separately per `expiry_type` rather than assuming they share limits. The two bounds of one entry can carry different unit suffixes — an intraday entry was observed spanning `15s` to `1d` — so normalise both bounds to seconds before deriving per-unit controls instead of requiring them to share a unit. Scope that conversion to the time suffixes `s`, `m`, `h`, and `d`, and keep a `t` bound on the tick axis rather than converting it: `tick` was observed as one of the `expiry_type` values, so a tick entry's `1t`..`10t` bounds are counts of ticks, not seconds — which is why the bounds are read per `expiry_type` in the first place. Every bound observed carried a suffix, but the published schema's own example for `min_contract_duration` was a bare, suffixless value, so read that example with `get_field` and accept a bare bound rather than rejecting the entry. Confirm the exact discriminator fields and values with `get_schema`/`get_field` before relying on them, and never reintroduce removed forward-starting fields (`start_type`, `forward_starting_options`, proposal `date_start`).

## Rise/Fall controls

- Underlying symbol supporting the chosen direction.
- Rise or Fall direction, plus an equality option only when the current contract metadata supports the equality variant.
- Initial capital/basis and selected account currency.
- Duration/unit or an explicit expiry, restricted by live contracts-for metadata.
- Current spot, proposal price/payout, and confirmation before purchase.

For an end-time picker, convert the selected local date/time deliberately, reject past/invalid values, and send the schema's verified expiry representation. Preserve the selected symbol's market schedule.

## Higher/Lower controls

Higher/Lower adds a user-selected barrier. Populate and validate barrier semantics from current contract metadata and schema. Relative and absolute barrier rules can vary with duration and market; do not derive them from a single hard-coded example.

Keep the product label explicit. A user who asks for Rise/Fall should not silently receive Higher/Lower simply because the implementation already has a barrier input.

## MCP checks

1. Call `guide_place_contract` and inspect the live contract-type narrative.
2. Use `get_field` on the proposal contract type, duration/expiry fields, and barrier only when Higher/Lower is selected.
3. Query active symbols for all selected variants and use contracts-for to determine which equality/duration/barrier choices exist for the symbol/account.
4. Validate at least one proposal for every direction/variant the UI exposes.

## Tests

- Rise and Fall map to the intended semantic direction, including equality variants when offered.
- Ordinary Rise/Fall sends no stray barrier.
- Higher/Lower requires and validates its barrier.
- Duration/unit and end-time boundaries follow live contract metadata.
- Direction, equality, barrier, duration, or symbol changes invalidate the old proposal.
