# Trade-family catalog

This catalog routes user language to a focused reference. The mappings are navigation hints, not frozen API facts. Confirm current enum values and conditional fields with `get_schema` / `get_field`, validate payloads, and confirm symbol/account availability with live discovery.

Every mapping targets the New API only. A contract code shared by Legacy and New APIs does not validate the surrounding proposal envelope; the New API-only guard in the parent skill always applies, and repository examples are composition references rather than field authority.

| User intent | Current family hint | Read |
|---|---|---|
| Accumulators, accumulation | Accumulator | [accumulators.md](accumulators.md) |
| Rise/Fall, Up/Down | Entry-relative up/down | [up-down.md](up-down.md) |
| Higher/Lower | User-selected single barrier | [up-down.md](up-down.md) |
| Matches/Differs, Over/Under, Even/Odd | Last-digit contracts | [digits.md](digits.md) |
| Multipliers, multiply up/down | Multiplier | [multipliers.md](multipliers.md) |
| Touch/No Touch, Stays In/Goes Out | Barrier/path contracts | [barrier-options.md](barrier-options.md) |
| Vanilla Call/Put, strike options | Vanilla | [vanilla-turbos.md](vanilla-turbos.md) |
| Turbos long/short | Turbos | [vanilla-turbos.md](vanilla-turbos.md) |
| Asian Up/Down, Reset, Tick High/Low, Only Ups/Downs | Advanced Options families | [advanced.md](advanced.md) |

## Ambiguous terms

- **Derivatives:** an umbrella covering many products, not one Options contract value. Ask whether the user means a full multi-trade terminal, Vanilla options, another Options family, CFDs, or something else when context does not resolve it.
- **Derived Indices:** an underlying market family. Combine it with an explicit trade family, then filter live symbol discovery accordingly.
- **Options:** the API surface containing many contract families. It does not choose one for the user.
- **Up/Down:** often means Rise/Fall, but may mean Higher/Lower when the user describes a chosen barrier. Resolve from the controls they ask for.
- **Call/Put:** may refer to Rise/Fall or Vanilla Calls/Puts. A strike/barrier and longer expiry usually signals Vanilla; verify rather than guessing when it changes the product.

Never invent a contract code from a label. If a requested family is not listed here, search the current MCP for the phrase, inspect the proposal contract-type enum and live contract catalog, then add a focused adapter only when the mapping is verified.

## Common adapter interface

Every family adapter should provide:

- `id` and user-facing name.
- Current direction/contract choices.
- A control schema driven by the selected symbol's live contract metadata.
- Pure validation and proposal construction.
- A stable selection key used to invalidate stale proposals.
- Confirmation and position-summary formatting.

The app shell supplies selected account/currency, symbol discovery, subscription ownership, proposal execution, and position management.
