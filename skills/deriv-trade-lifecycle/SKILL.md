---
name: deriv-trade-lifecycle
description: Implement the New Deriv API Options flow: price, buy, monitor, sell, and settle. Use whenever a task prices or purchases a contract, tracks open or closed positions, reconciles a portfolio, sells early, cancels a contract, sets take profit, handles buy or sell errors, recovers mid-trade from a disconnect, or cleans up subscriptions — even if the user just says "the buy button fails", "show my open trades", or "sell at market". Not for Legacy API compatibility or OAuth setup alone.
---

## Hosted MCP first, then bundled references

If hosted MCP tools are available, call them by bare name (`get_schema`, `get_field`, `validate_payload`, `get_example`, `search_endpoints`, `guide_api_conventions`, `guide_authenticate`, and the other hosted guide tools). Do not use bundled field lists while those tools work. Never invent fields.

If those tools are missing or fail, read this skill and its `references/`. Do not invent fields that are not in those files.

Never name a host-namespaced tool; use the bare tool name only.

# Implement the trading lifecycle

Build a typed, observable state machine around the current Deriv API rather than scattering WebSocket sends across UI components. Buying and account-scoped monitoring require the shared authenticated OTP connection supplied by the auth layer.

## Resolve the live workflow

Read and enforce the [New API-only guard](../deriv-trading-app/references/new-api-only.md). Use only version-identified New API schemas and examples. If the hosted Deriv API MCP, comparison, published schema, and repository types disagree, stop before producing executable code or fixtures and report the discrepancy.

Use the configured hosted Deriv API MCP:

1. Call `guide_place_contract`, `guide_api_conventions`, `guide_handle_errors`, and `guide_rest_vs_websocket`.
2. Use `search_endpoints` to resolve proposal, buy, proposal-open-contract, portfolio, balance, transaction, sell, update, cancel, forget, and ping endpoints as needed.
3. Read every request and response with `get_schema` or `get_field`, including auth/scopes and conditional fields.
4. Get schema-backed starting payloads with `get_example` and validate each implemented request shape with `validate_payload`.

If those tools are unavailable, route from [llms.txt](https://developers.deriv.com/llms.txt) to the live [workflow](https://developers.deriv.com/llms/workflows.md), [proposal](https://developers.deriv.com/llms/proposal.md), [buy](https://developers.deriv.com/llms/buy.md), [open contract](https://developers.deriv.com/llms/proposal-open-contract.md), [portfolio](https://developers.deriv.com/llms/portfolio.md), [sell](https://developers.deriv.com/llms/sell.md), [contract update](https://developers.deriv.com/llms/contract-update.md), [cancel](https://developers.deriv.com/llms/cancel.md), [transaction](https://developers.deriv.com/llms/transaction.md), [forget](https://developers.deriv.com/llms/forget.md), and [errors](https://developers.deriv.com/llms/errors.md) guides. Accept a linked schema only after its version and shape are unambiguously New API under the shared guard. If that cannot be established, stop before emitting executable requests or fixtures.

## Lifecycle state machine

Model at least these states where they apply: idle, pricing, quoted, confirming, buying, open, sellable or cancellable, settling, closed, reconnecting, and failed. Retain the request ID, subscription ID, connection generation, proposal identity, contract ID, transaction IDs, and selected account/family/symbol keys needed to reconcile events.

1. Build a valid family-specific proposal from current controls.
2. Stream prices and accept only responses whose request/selection generation is still current.
3. Before confirmation, require an authenticated OTP connection. Obtain the executable proposal on that same connection rather than buying an indicative public proposal.
4. At confirmation, snapshot the selection and latest quote. Prevent double submission and invalidate the quote when any keyed input changes.
5. Convert the current proposal price to a finite number and buy using the proposal identity with numeric `price`. Never serialise `price` as a string. Record the returned contract and transaction identities before updating UI success state.
6. Stream position changes through `proposal_open_contract`, per contract or using its New-API-supported all-contract mode. Use `portfolio` only for initial or reconciliation snapshots, then reconcile balance and transaction subscriptions without duplicating positions.
7. Offer update, cancellation, or early sell only when the live contract state and schema say it is allowed. Treat settlement and an early close as terminal paths.
8. Forget all no-longer-needed subscriptions and release connection listeners on terminal state, navigation, account switch, family switch, or unmount.

## Retry and reconnect rules

- Retry idempotent discovery/status reads with bounded exponential backoff and jitter.
- Never blindly retry a buy, sell, cancel, or update after an ambiguous timeout. Reconcile by contract/transaction identity or portfolio before deciding whether another write is safe.
- On socket replacement, increment the connection generation, invalidate proposal IDs, and restore only subscriptions relevant to the selected account and still-open contracts.
- Obtain a fresh OTP URL before every replacement authenticated connection. An automatic reconnect that reopens a consumed OTP URL is invalid; route reconnection through the shared auth/transport owner. Do not persist or reuse an OTP URL as durable session state.
- Handle response error envelopes before reading success fields. Keep provider details out of unsafe HTML and never log credentials or OTP URLs.
- Keep heartbeat and subscription limits centralised in the shared transport layer.

## Multi-trade applications

Proposal state belongs to a complete selection, not merely a component. A change of family, direction, symbol, account, amount/basis/currency, duration/expiry, barrier, growth rate, multiplier, or other family control must invalidate any incompatible proposal immediately. A late response from the previous selection must be ignored.

Read [the lifecycle checklist](references/implementation-checklist.md) when implementing state, tests, or reconnect handling.

## Verify without live trades

Use schema validation and mocked WebSocket sequences for success, rejection, late response, duplicate response, disconnect-before-acknowledgement, reconnect, early sell, natural settlement, and cleanup paths. Assert that the same user action cannot buy twice and that an ambiguous write is reconciled instead of retried. Never use a real account for automated verification; a demo trade still requires explicit authorisation.
