# Accumulators

Use this reference only when the user requests Accumulators. The current routing hint is the `ACCU` contract type; verify it and all request fields through the hosted Deriv API MCP before implementing.

## Product and controls

An Accumulator grows while ticks remain within its moving barriers. A focused UI normally needs:

- Underlying symbol, filtered to live Accumulator availability.
- Initial capital/basis and the selected account's currency.
- Growth rate populated from the selected contract's live metadata.
- Optional take-profit only when current proposal validation supports it.
- Live spot, current high/low barriers, indicative/executable price, maximum ticks/payout, and an explicit buy confirmation.

Do not present a generic duration control merely because other Options families use one. Current Accumulator availability may report a no-expiry shape, and a valid proposal may omit duration/expiry. Verify this behaviour against the current schema and a live validation/proposal response.

## MCP checks

1. Call `guide_place_contract`.
2. Resolve and inspect active-symbol, contracts-for, proposal, buy, and open-contract schemas.
3. Confirm the current Accumulator contract value and inspect the proposal fields for growth rate and supported limit orders with `get_field`.
4. Read growth-rate choices, stake bounds, and any no-expiry metadata from contracts-for at runtime.
5. Validate an Accumulator proposal fixture with `validate_payload`.
6. Use proposal validation/contract details for supported take-profit range, maximum ticks, maximum payout, and barrier display. Do not assume stop-loss support from a broad shared schema.

## Adapter rules

- Keep growth rate as a numeric domain value and format it as a percentage only in the UI.
- Clear and revalidate the selection when a new symbol offers a different growth-rate set.
- Treat metadata as loading after every symbol/family generation change. Do not propose while growth rates are missing, and never retain a hard-coded default or fallback list when the live response is empty or late.
- Model Accumulator-specific proposal and open-contract fields in typed extensions instead of casting a generic response throughout the component tree.
- Delay or align barrier rendering according to the semantics of the live proposal/tick stream so the displayed boundary matches the evaluated tick.
- Invalidate the proposal on account, connection, symbol, amount, growth-rate, or take-profit change.
- Let open-contract state determine barrier breach, current value, sellability, and terminal outcome.
- For a knock-out statistics display, use the proposal stream's `contract_details.ticks_stayed_in` array (each number is how long the spot stayed between barriers). Confirm the observed stream shape before merging: an initial response can carry the full history while later updates carry only the live counter, so de-duplicate by the accompanying tick epoch and detect a counter reset by comparing values — the stream does not announce breaches with a flag.
- Live validation can reject a second open Accumulator for the same symbol and account. Confirm the current rule through proposal/buy validation rather than hardcoding it, surface that rejection as an explicit product state, and disable repeat purchase while it applies.
- Do not assume an open Accumulator accepts `contract_update`. Offer post-purchase take-profit editing only when the live contract state and schema advertise it; otherwise treat take profit as fixed at proposal time.
- Do not route an Accumulator through a generic proposal path that requires or emits duration or expiry fields. Use a discriminated family request or an Accumulator-specific proposal path, and validate that unrelated Rise/Fall controls are absent.

## Tests

- Growth choices come from current contract metadata and reset safely on symbol changes.
- Proposal omits unrelated generic controls and includes only validated Accumulator fields.
- Optional take-profit follows current validation limits.
- Barrier and maximum-tick/payout data normalise correctly.
- A growth-rate or family change invalidates the previous proposal before buy can run.
