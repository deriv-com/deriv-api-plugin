---
name: deriv-llms
description: Bundled Deriv API docs snapshot for when hosted MCP tools are unavailable. Use when looking up Deriv API endpoints, authentication, errors, workflows, contract types, or field lists from the bundled docs; when the hosted MCP is down; or when the user asks for llms.txt / endpoint pages. Prefer hosted get_schema, get_field, and guide tools while they work. Do not invent fields.
---

## Hosted MCP first, then bundled references

If hosted MCP tools are available, call them by bare name (`get_schema`, `get_field`, `validate_payload`, `get_example`, `search_endpoints`, `guide_api_conventions`, `guide_authenticate`, and the other hosted guide tools). Do not use bundled field lists while those tools work. Never invent fields.

If those tools are missing or fail, read this skill and its `references/`. Do not invent fields that are not in those files.

Never name a host-namespaced tool; use the bare tool name only.

Snapshot: these pages were fetched from developers.deriv.com on 2026-09-10. They are a point-in-time snapshot, not a live source — while the hosted Deriv API MCP tools work, they are authoritative.

# Deriv API

> Trading APIs: real-time market data, programmatic trading, account management, automation. Use ONLY this API; the symbol field is `underlying_symbol`.

Headers: `Authorization: Bearer <token>` (OAuth 2.0 or PAT) + `Deriv-App-ID` (required for PAT auth, not required for OAuth). OAuth2: `https://auth.deriv.com/oauth2/auth`, `https://auth.deriv.com/oauth2/token`.

Key rules:
- Public market data: connect directly to `wss://api.derivws.com/trading/v1/options/ws/public` (no OTP, no auth).
- WebSocket trading: `POST /trading/v1/options/accounts/{accountId}/otp` (with `Authorization: Bearer <token>`, plus `Deriv-App-ID` when using PAT auth) returns a WebSocket URL; connect to it and send messages directly.
- Bulk-purchase: `Deriv-App-ID` header + per-account `trade`-scoped Personal Access Tokens (PATs) in the body — never a Bearer token.

Resources: https://developers.deriv.com/docs/ · https://developers.deriv.com/playground · api-support@deriv.com

## Docs (concept guides — pure Markdown, low token cost)

- [Getting started](references/getting-started.md)
- [Authentication](references/authentication.md)
- [OAuth reference](references/oauth.md)
- [API overview](references/api-overview.md)
- [Errors](references/errors.md)
- [Contract types](references/contract-types.md)
- [Code examples](references/examples.md)
- [Workflows](references/workflows.md)

## WebSocket endpoints

- [active_symbols](references/active-symbols.md)
- [auto_get](references/auto-get.md)
- [auto_list](references/auto-list.md)
- [auto_list_strategies](references/auto-list-strategies.md)
- [auto_pause](references/auto-pause.md)
- [auto_resume](references/auto-resume.md)
- [auto_start](references/auto-start.md)
- [auto_stop](references/auto-stop.md)
- [balance](references/balance.md)
- [buy](references/buy.md)
- [cancel](references/cancel.md)
- [contract_update](references/contract-update.md)
- [contract_update_history](references/contract-update-history.md)
- [contracts_for](references/contracts-for.md)
- [contracts_list](references/contracts-list.md)
- [forget](references/forget.md)
- [forget_all](references/forget-all.md)
- [ping](references/ping.md)
- [portfolio](references/portfolio.md)
- [profit_table](references/profit-table.md)
- [proposal](references/proposal.md)
- [proposal_open_contract](references/proposal-open-contract.md)
- [sell](references/sell.md)
- [statement](references/statement.md)
- [ticks](references/ticks.md)
- [ticks_history](references/ticks-history.md)
- [time](references/time.md)
- [trading_times](references/trading-times.md)
- [transaction](references/transaction.md)
- [ws_demo](references/ws-demo.md)
- [ws_public](references/ws-public.md)
- [ws_real](references/ws-real.md)

## REST endpoints

- [GET /account/v1/nickname](references/account-nickname.md)
- [POST /trading/v1/options/contracts/bulk-purchase/{real,demo}](references/bulk-purchase.md)
- [POST /trading/v1/options/accounts](references/create-account.md)
- [GET /trading/v1/options/accounts](references/get-accounts.md)
- [GET /v1/health](references/health.md)
- [GET /applications/v1/markup-statistics](references/markup-statistics.md)
- [GET /partners/analytics/v1/overview](references/partners-analytics-overview.md)
- [POST /partners/client-tags/check](references/partners-client-tags-check.md)
- [GET /payment-agents/v1/clients/me](references/payment-agent-client-settings.md)
- [PATCH /payment-agents/v1/clients/me](references/payment-agent-client-settings-update.md)
- [GET /payment-agents/v1/agents/{id}](references/payment-agent-get.md)
- [GET /payment-agents/v1/agents](references/payment-agent-list.md)
- [GET /payment-agents/v1/agent-statistics](references/payment-agent-statistics.md)
- [POST /payment-agents/v1/transfer](references/payment-agent-transfer.md)
- [GET /payment-agents/v1/transfer/{request_id}](references/payment-agent-transfer-status.md)
- [POST /payment-agents/v1/withdraw](references/payment-agent-withdraw.md)
- [GET /payment-agents/v1/withdraw/{request_id}](references/payment-agent-withdraw-status.md)
- [POST /payment-agents/v1/withdraw/verification_code](references/payment-agent-withdraw-verification.md)
- [POST /trading/v1/options/accounts/{account_id}/reset-demo-balance](references/reset-demo-balance.md)
- [GET /wallet/v1/exchange-rate](references/wallet-exchange-rate.md)
- [GET /wallet/v1/wallets](references/wallet-list.md)
- [GET /wallet/v1/transactions/{wallet_type}](references/wallet-transactions.md)
- [POST /wallet/v1/transfers](references/wallet-transfer.md)
- [POST /wallet/v1/transfers/exchange](references/wallet-transfer-exchange.md)
- [POST /wallet/v1/transfers/platforms](references/wallet-transfer-platforms.md)
- [POST /wallet/v1/transfers/validate](references/wallet-transfer-validate.md)
- [POST /trading/v1/options/accounts/{accountId}/otp](references/websocket.md)

