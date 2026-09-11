---
name: deriv-trade-types
description: Map trade names to New Deriv API Options contract families, proposal shapes, and live availability. Use whenever a task selects, adds, or configures a Deriv Options trade type — Accumulator options, Rise/Fall, Higher/Lower, Matches/Differs, Even/Odd, Over/Under, Multipliers, Touch/No Touch, Stays Between / Goes Outside, Vanilla options, Turbo options, Asian options, Reset Call / Reset Put, or High/Low Ticks — even if the user just says "up/down", "digits", "binary call/put", or "add accumulators to my bot" without naming contract codes. Not for Legacy API compatibility or CFD execution.
---

## Hosted MCP first, then bundled references

If hosted MCP tools are available, call them by bare name (`get_schema`, `get_field`, `validate_payload`, `get_example`, `search_endpoints`, `guide_api_conventions`, `guide_authenticate`, and the other hosted guide tools). Do not use bundled field lists while those tools work. Never invent fields.

If those tools are missing or fail, read this skill and its `references/`. Do not invent fields that are not in those files.

Never name a host-namespaced tool; use the bare tool name only.

# Configure trading contract types

Turn each requested trade family into a small adapter from UI state to a live-schema-validated proposal request. Keep authentication, transport, market data, and position management outside the adapter so several families can share one app.

## Route user language

Read [the trade-family catalog](references/catalog.md) first. Then read only the references for the requested families:

- [Accumulators](references/accumulators.md)
- [Rise/Fall and Higher/Lower](references/up-down.md)
- [Digits](references/digits.md)
- [Multipliers](references/multipliers.md)
- [Touch, range, and other barrier options](references/barrier-options.md)
- [Vanilla and Turbos](references/vanilla-turbos.md)
- [Asian, reset, and tick-lookback families](references/advanced.md)

Do not load every family reference for a focused request.

Parse app surface, trade family, and underlying market separately. “Derivatives” does not identify a contract type; “Derived Indices” identifies a market family. Clarify the intended meaning when it changes the implementation. Do not invent a `DERIVATIVES` value or route CFDs through the Options proposal flow.

## Resolve every family against the hosted Deriv API MCP

Read and enforce the [New API-only guard](../deriv-trading-app/references/new-api-only.md) for each family. Shared contract codes do not make a surrounding Legacy proposal envelope valid.

For each selected family:

1. Call `guide_place_contract` for the proposal-to-buy method and live contract-type narrative.
2. Use `search_endpoints` to resolve proposal, active-symbol, and contracts-for endpoint IDs.
3. Read the proposal request as JSON with `get_schema`. Use `get_field` for the contract-type enum and every conditional field the adapter needs.
4. Use `get_example` as a starting point, never as proof that the same fields fit another family.
5. Validate a representative proposal from that adapter with `validate_payload` before finalising it.
6. At runtime, use active-symbol and contracts-for responses plus proposal validation metadata to decide whether the selected symbol/account supports the family and which control values are allowed.

If these tools are unavailable, use the current [contract-type guide](https://developers.deriv.com/llms/contract-types.md), [proposal guide](https://developers.deriv.com/llms/proposal.md), and [proposal comparison](https://developers.deriv.com/comparison/proposal/) only as New API cross-checks. A published flat proposal schema may permit unrelated family fields and therefore proves structural validity only. Do not finalise a family-specific executable payload until a New-API-aware validator or a read-only proposal request on the New public endpoint confirms the combination. If sources conflict or that confirmation is unavailable, stop; never fall back to a Legacy example or repository type.

## Adapter contract

Each adapter should define:

- A stable internal family ID and user-facing label.
- The currently verified API contract type or direction choices.
- Typed control state and validation derived from live contract metadata.
- A pure proposal builder that either returns a valid request or a structured validation error.
- A reset policy for controls that do not apply after a family or symbol change.
- Formatting for proposal, confirmation, open-position, and result summaries.
- Focused tests for valid, boundary, unavailable, and stale-selection cases.

Never reuse the generic proposal builder when the selected family needs fields it cannot express. Extend its typed input or create a family-specific adapter, as Accumulators require.

## Multi-family safety

- Key proposal state by account, connection generation, family, direction, symbol, and control values.
- Cancel the previous proposal subscription and clear its ID before changing any of those keys.
- Disable buy until a fresh proposal matches the entire current selection.
- Display only controls supported by the selected family and current contracts-for metadata.
- Do not silently translate one family into a superficially similar one. Ordinary Rise/Fall and barrier-based Higher/Lower are distinct products.
- Prefer an explicit unavailable state to falling back to a different contract.

## Verify

Test every selected family independently and test switching between each pair of materially different shapes. Include a regression proving that a proposal received just before a family switch cannot be bought afterwards. Validate fixtures against the hosted Deriv API MCP, but never send `buy` while testing a proposal adapter.
