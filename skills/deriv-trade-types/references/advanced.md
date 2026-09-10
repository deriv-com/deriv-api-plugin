# Asian, reset, and tick-lookback families

Use this reference for current Options families not covered by the focused references. These products have distinct evaluation rules and should not share a proposal builder merely because their controls look small.

Current routing hints include:

- Asian Up / Down: `ASIANU` / `ASIAND`
- Reset Call / Put: `RESETCALL` / `RESETPUT`
- Tick High / Low: `TICKHIGH` / `TICKLOW`
- Only Ups / Only Downs: `RUNHIGH` / `RUNLOW`

The live proposal enum may contain additional or renamed families. Search by the user's phrase and verify current values before implementation.

## MCP checks

1. Search the endpoint index and current contract-type narrative for the requested product name.
2. Inspect the proposal JSON schema's conditional variant, not only the top-level properties.
3. Use `get_field` for family-specific inputs such as selected tick, reset conditions, or other parameters returned by that variant.
4. Discover compatible symbols, durations, and limits at runtime.
5. Get a schema-backed example and validate every request shape exposed by the UI.
6. Inspect open-contract response fields needed to explain evaluation and outcome.

## Adapter rules

- Explain the actual evaluation rule in the trade selector and confirmation. Avoid generic “up/down” copy that makes an Asian average, reset rule, or selected-tick lookback sound like ordinary Rise/Fall.
- Model required family-specific controls with a discriminated type and make invalid combinations unrepresentable where practical.
- Drive selectable ticks, durations, barriers, or reset values from live metadata.
- Clear proposal and incompatible controls whenever the family or symbol changes.
- If the current MCP/schema cannot establish the product's request shape, stop and report the unavailable fact rather than copying a legacy payload.

## Tests

- Semantic direction/evaluation labels match each current product.
- Every family-specific control is required only for its own variant.
- Live bounds and unavailable combinations are enforced.
- A switch from an advanced family to ordinary Rise/Fall cannot reuse its proposal or hidden control state.
