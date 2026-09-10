# Vanilla and Turbos

Use this reference when the user explicitly requests Vanilla options or Turbos. Do not assume that a generic request for “derivatives” means either family.

## Current routing hints

- Vanilla Call / Put: `VANILLALONGCALL` / `VANILLALONGPUT`
- Turbos Long / Short: `TURBOSLONG` / `TURBOSSHORT`

Verify these values, proposal variants, and availability through the hosted Deriv API MCP.

## Vanilla controls

- Underlying symbol supporting Vanilla.
- Call or Put direction.
- Strike/barrier selected from current contract metadata or proposal validation.
- Duration/unit or expiry, initial capital/basis, and selected account currency.
- Payout-per-point or equivalent pricing input only when the current schema and UX require it.

Strike choices move with market and expiry. Never hardcode an example relative or absolute barrier. Keep the number of contracts, payout-per-point, stake, and displayed return terminology aligned with the live response.

## Turbos controls

- Underlying symbol supporting Turbos.
- Long or Short direction.
- Duration/expiry and current barrier/strike semantics.
- Payout choice, stake range, and display-number-of-contracts values driven by live metadata.
- Confirmation that explains the selected barrier and payout model.

Do not treat Turbos as a styling variant of Vanilla. Give each a separate typed adapter even when some controls share UI components.

## MCP checks

1. Inspect the proposal JSON schema variants for the selected Vanilla/Turbo type.
2. Use `get_field` for barrier, payout-per-point, payout choices, display number of contracts, stake, duration, and expiry only as relevant.
3. Populate strikes/barriers and payout/stake ranges from live contracts-for/proposal metadata.
4. Validate each direction and pricing mode the UI exposes.
5. Inspect open-contract response fields used for current value, contract count, barrier, and settlement.

## Tests

- Call/Put and Long/Short directions remain distinct.
- Moving strike/barrier choices update without preserving an invalid old value.
- Pricing modes produce only their verified fields.
- Stake/payout choices respect live limits.
- Switching between Vanilla, Turbos, or another family clears the old proposal and incompatible controls.
