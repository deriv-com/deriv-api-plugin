# Digits

Use this reference for last-digit contracts. Current routing hints are:

- Matches / Differs: `DIGITMATCH` / `DIGITDIFF`
- Over / Under: `DIGITOVER` / `DIGITUNDER`
- Even / Odd: `DIGITEVEN` / `DIGITODD`

Verify all values and conditional fields through the hosted Deriv API MCP and current contracts-for response.

## Controls and data

- Underlying symbol supporting the selected digit family.
- Mode and direction/prediction.
- A digit prediction/barrier only for modes that require one; Even/Odd does not need a chosen digit.
- Tick duration restricted to current contract metadata.
- Initial capital/basis and selected account currency.
- Current quote and correctly extracted last digit using the symbol's pip precision.

Do not compute the last digit from an unformatted floating-point string. Format the quote to the symbol's declared precision first, then extract the final numeric digit.

## MCP checks

1. Inspect proposal contract-type, barrier/prediction, duration, and duration-unit fields with `get_schema` / `get_field`.
2. Confirm supported digit range and durations from live contract metadata.
3. Validate a fixture for every mode/direction exposed by the UI, including a prediction boundary.
4. Inspect proposal/open-contract responses needed for result display instead of inferring outcome from the chart alone.

## Adapter rules

- Model modes as a discriminated union so a prediction is required only where valid.
- Reset a now-incompatible prediction when switching to Even/Odd or to a symbol with a different range.
- Keep tick statistics observational; never imply historical digit frequency changes the contract's API payout guarantee.
- Invalidate the proposal on mode, direction, prediction, duration, symbol, amount, account, or socket generation change.

## Tests

- Every mode builds only its allowed fields.
- Prediction boundaries and missing prediction errors.
- Pip-aware last-digit extraction.
- Tick-duration availability and symbol changes.
- Switching modes clears stale proposal/prediction state before buy is enabled.
