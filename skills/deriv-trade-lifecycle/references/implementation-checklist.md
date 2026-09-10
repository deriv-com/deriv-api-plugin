# Trade-lifecycle implementation checklist

Use this checklist after reading the live guides, request schemas, response schemas, and auth requirements through the hosted Deriv API MCP.

## New API-only gate

- Validate every request with an explicitly New API contract and cross-check its endpoint comparison. Stop if the sources disagree.
- Reject every emitted request containing `loginid`. Proposal requests require `underlying_symbol` and must reject Legacy `symbol`, `barrier_range`, `product_type`, `date_start`, `trade_risk_profile`, and `trading_period_start` fields.
- Model the proposal response object's requiredness and numeric types — `id`, `ask_price`, `payout`, `commission`, and every other field — from `get_schema` / `get_field`, never from an older local type or a Legacy example. Confirm a field against the live schema before using it in a calculation or an execution path.
- Require finite numeric `buy.price` and finite non-negative numeric `sell.price`; never emit either as a string.
- Use `underlying_symbol` in portfolio and transaction responses. Do not consume removed transaction display/barrier/risk-order fields or deprecated open-contract display and `sell_spot` fields.

## Quote ownership

- Key a quote by account ID, socket generation, family, direction, underlying symbol, amount, basis, currency, duration or expiry, and every family-specific control.
- Attach a local generation to each subscription and ignore messages from older generations.
- Keep indicative public quotes visibly distinct from executable quotes. Refresh the quote on the authenticated socket before enabling purchase.
- Store the proposal ID only with its complete selection snapshot and timestamp. Clear it synchronously when any keyed value changes.

## Purchase boundary

- Require an authenticated selected account and connected OTP socket.
- Show a confirmation containing the current trade family, market, duration/expiry where applicable, amount/basis, current price, payout/return description, and account type/currency.
- Disable repeated submission while the first buy is unresolved.
- Correlate the response to the submitted request and store contract and transaction identities before announcing success.
- Treat a disconnect or timeout after send as ambiguous. Query authenticated state/portfolio before considering another buy.
- When a proposal or purchase is rejected for a limit violation, recover the current bounds from every place the response carries them — the error object's structured fields and any proposal payload returned alongside the rejection — rather than parsing the message string. Verify the exact envelope fields with `get_schema` before consuming them.

## Open positions

- Use `proposal_open_contract` to stream position updates, by contract or with its New-API-supported all-contract mode. Use `portfolio` as a one-shot authenticated snapshot for initial state and ambiguous-write reconciliation; never implement or describe it as a stream.
- Merge updates by contract ID and transaction identity. Do not append duplicates after reconnect or navigation.
- Normalise schema-declared numeric/string variants at one boundary before calculating profit, percentage, or chart markers.
- Drive sell, cancel, or update controls from the current contract flags and supported schema, not from the original trade family alone.
- Treat sold, cancelled, won/lost, and other verified terminal statuses as final and release their subscriptions.

## Close and settlement

- Send a finite, non-negative numeric `sell.price`; numeric `0` means sell at market. Never serialise it as a string, and enable selling only when the contract is currently sellable.
- Use cancellation and contract-update operations only for products and states that advertise them.
- Reconcile balance, transaction stream, portfolio, and closed-position history after a terminal event.
- Surface provider failures safely and retain enough non-secret correlation data for debugging.

## Reconnect and retry

- Increment the socket generation before accepting messages on a replacement connection.
- Invalidate every proposal from the old generation.
- Reacquire an OTP URL through the auth layer for a new authenticated connection.
- Ensure transport-level automatic reconnect cannot bypass that fresh-OTP step.
- Restore only current market streams and still-open contract subscriptions.
- Retry idempotent reads with a bound. Never blindly retry trading writes; reconcile first.

## Tests

- Quote generation and invalidation for every keyed input.
- Public quote cannot be bought; authenticated replacement quote can.
- Buy success, API rejection, double-click suppression, and ambiguous timeout reconciliation.
- Contract stream merge, sellability transitions, early sell, cancellation/update when supported, and natural settlement.
- Account/family/symbol switch ignores late responses and releases old subscriptions.
- Reconnect invalidates old proposals and restores only relevant positions.
- All terminal and unmount paths clean listeners, heartbeats, and subscriptions.
- Automated tests never connect a real account or perform credentialed writes.
