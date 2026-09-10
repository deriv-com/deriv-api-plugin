# New API-only guard

Apply this guard to every Deriv request, response model, example, fixture, and repository integration. The generated application must target the New Deriv Options API only.

## Establish the API version

1. Prefer the hosted Deriv API MCP only when its result is identified as the New API contract.
2. Review the affected endpoint in the official [Legacy vs New API comparison](https://developers.deriv.com/comparison/) and implement the New API column.
3. Use current endpoint documentation and a version-identified New API schema for exact fields.
4. Treat repository types, templates, SDK examples, `llms.txt`, and linked schemas as discovery aids, not version proof.

Endpoint names are often unchanged between Legacy and New APIs. If the MCP, comparison, endpoint documentation, or schema disagree about a request or response, stop the affected implementation before producing executable code or fixtures. Report the conflict and require a New-API-confirmed contract; never select or preserve the Legacy shape merely because an older schema or local type accepts it.

## Reject Legacy transport and requests

- Start OAuth at `https://auth.deriv.com/oauth2/auth` with the registered New API OAuth client's `client_id`, then exchange the code at `https://auth.deriv.com/oauth2/token`. Never add the optional Legacy `app_id` query parameter or substitute a V1 application ID.
- Use `https://api.derivws.com` as the New API REST base. Authenticated REST calls use `Authorization: Bearer ...` and `Deriv-App-ID` for the registered New API application.
- Use `wss://api.derivws.com/trading/v1/options/ws/public` for unauthenticated Options market data. For an authenticated demo or real socket, call `POST /trading/v1/options/accounts/{accountId}/otp` and connect only to the ready-to-use URL returned for that account.
- Never connect to `ws.binaryws.com`, `ws.derivws.com`, any `/websockets/v3` endpoint, or a `/trading/v1/options/legacy/` route. Never send a top-level WebSocket `authorize` request.
- Establish account context with the selected account's OTP-authenticated WebSocket. Never send `loginid` in WebSocket requests, and never request multi-account balance through `account: "all"` or `account: "current"`.
- `active_symbols`: do not send removed `landing_company`, `landing_company_short`, `product_type`, `loginid`, or `barrier_category` filters.
- `contracts_for`: do not send removed `currency`, `landing_company`, `landing_company_short`, `product_type`, or `loginid` fields.
- `proposal`: send `underlying_symbol`, never the Legacy request field `symbol`; do not send removed `loginid`, `barrier_range`, `product_type`, `date_start`, `trade_risk_profile`, or `trading_period_start` fields.
- `buy` and `sell`: send `price` as a finite JSON number, never a numeric string. Require a non-negative sell price and use numeric `0` for a market sell.

## Model New API responses

- `active_symbols`: use `underlying_symbol`, `underlying_symbol_name`, `underlying_symbol_type`, and `pip_size`. Do not consume removed translated display-name or spot fields; use `ticks` for spot and `trading_times` for schedules.
- `contracts_for`: do not consume removed spot, schedule, display, barrier-category, start-type, forward-starting, or trading-period fields, and do not read a `non_available` list — `available` is the only contract list in the response. Where the removed field carried a decision, use the New API replacement: distinguish entry-relative products from barrier products by each entry's `contract_category`, not by the removed `barrier_category` and not by a `barriers` count, which was observed to be the same for both families. Confirm that field and the values you match on with `get_schema` / `get_field` before filtering on them.
- `ticks` and `ticks_history`: model requiredness and numeric types for the tick object, the history arrays, and the candle fields from `get_schema` / `get_field`, never from an older local type or a Legacy example.
- `proposal`: model the response object's requiredness and numeric types — `ask_price`, `payout`, `commission`, and every other field — from `get_schema` / `get_field`, and expect the New API to drop the Legacy fields listed above. Confirm a field against the live schema before using it in a calculation or an execution path.
- `portfolio` and `transaction`: use `underlying_symbol`, not the removed response field `symbol`. Do not consume removed transaction display, barrier, stop-loss, stop-out, or take-profit fields.
- `proposal_open_contract`: model the response object's requiredness and numeric types from `get_schema` / `get_field`, never from an older local type or a Legacy example; use `exit_spot` and `exit_spot_time`, and do not consume removed display fields or deprecated `sell_spot` fields.
- Treat `portfolio` as a one-shot authenticated snapshot. Use `proposal_open_contract` for live position subscriptions.

## Verify the boundary

Validate every request against a New-API-confirmed schema and test that forbidden fields are absent from emitted payloads. Test optional and union-typed response fields explicitly. A flat schema that permits unrelated family fields proves only structural validity; it does not prove that a family-specific combination is executable. Require hosted-MCP validation or a read-only proposal response on the New public endpoint before treating such a combination as valid. Never send `buy` as validation.
