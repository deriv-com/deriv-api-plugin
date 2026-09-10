# Touch, range, and barrier options

Use this reference for contracts whose result depends on one or two barriers or on the path followed before expiry.

Current routing hints include:

- Touch / No Touch: `ONETOUCH` / `NOTOUCH`
- Ends In / Ends Out: `EXPIRYRANGE` / `EXPIRYMISS`
- Stays In / Goes Out: `RANGE` / `UPORDOWN`
- Higher / Lower: `HIGHER` / `LOWER` (also covered in [up-down.md](up-down.md))

Some equality variants may exist. Verify the live contract enum, category, and request combinators before exposing them.

## Controls

- Underlying symbol and selected barrier family/direction.
- One or two barriers as the family requires.
- Duration/unit or expiry from live contract metadata.
- Initial capital/basis and selected account currency.
- A preview that clearly explains whether evaluation happens at expiry or throughout the path.

Do not share one unlabeled barrier form across all families. Relative versus absolute rules, number/order of barriers, equality semantics, and supported expiries can differ by market and duration.

## MCP checks

1. Inspect the proposal JSON schema and its conditional variants for the selected contract type.
2. Use `get_field` for barrier fields and duration/expiry constraints.
3. Read current barrier choices and expiry modes from contracts-for metadata.
4. Validate representative requests for every one-barrier/two-barrier and direction variant exposed.
5. Inspect open-contract fields needed to describe path status, entry/exit spot, and terminal result.

## Adapter rules

- Model each family as a discriminated variant with exactly the barriers it needs.
- Validate barrier ordering for two-barrier contracts and preserve the API's verified relative/absolute representation.
- Explain path-dependent versus end-time evaluation in the confirmation.
- Reset barriers when symbol, duration mode, or family changes and the old values are no longer valid.
- Never translate an unavailable path contract to an end-time contract or vice versa.

## Tests

- Required barrier count and ordering.
- Relative/absolute values across supported durations and markets.
- Path-dependent and expiry-only labels/outcomes remain distinct.
- Family or symbol changes invalidate proposal and barrier state.
- Unavailable equality or barrier variants remain disabled rather than approximated.
