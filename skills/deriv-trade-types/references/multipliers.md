# Multipliers

Use this reference for multiplier contracts. Current routing hints are `MULTUP` and `MULTDOWN`; verify them and their fields through the hosted Deriv API MCP.

## Controls

- Underlying symbol with live Multiplier availability.
- Up or Down direction.
- Initial capital in the selected account's currency.
- Multiplier chosen from live contract metadata.
- Optional take-profit, stop-loss, or deal-cancellation controls only when current metadata, proposal validation, and product requirements support them.
- Current proposal, maximum loss/close conditions, and an explicit confirmation.

Do not reuse a duration-based binary-options form. Multiplier expiry, cancellation, and limit-order semantics are product-specific and must be read from the live schema and responses.

## MCP checks

1. Call `guide_place_contract`, then inspect proposal, buy, open-contract, contract-update, cancel, and sell endpoints as the requested UX requires.
2. Use `get_field` for multiplier and limit-order/cancellation shapes; inspect JSON schema variants instead of relying on a flattened Markdown table.
3. Populate multiplier and cancellation choices from contracts-for metadata.
4. Validate each direction and every optional order shape exposed by the UI.
5. Confirm update, cancellation, and sell availability from current open-contract state before rendering an action.

## Adapter rules

- Use a discriminated control model for optional risk-management modes so invalid combinations cannot reach the proposal builder.
- Clear or clamp a multiplier when a new symbol's allowed range changes.
- Keep money and percentage semantics explicit; do not label a stop amount as a price percentage without verified conversion.
- Invalidate the quote on direction, multiplier, risk-order, account, symbol, amount, or connection change.
- Treat close/update/cancel operations as trading writes and reconcile ambiguous results before any retry.

## Tests

- Up/Down mapping and allowed multiplier choices.
- Optional limit orders and cancellation are emitted only when supported.
- Symbol changes reset out-of-range controls.
- Open-contract flags correctly gate update, cancel, and sell actions.
- No automatic retry can duplicate a trading write.
