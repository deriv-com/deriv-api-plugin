---
name: deriv-auth
description: Add or fix New Deriv API authentication — OAuth, tokens, accounts, and trading WebSocket sessions. Use whenever a task involves Deriv login, sign-up, OAuth with PKCE, personal access tokens, OTP, tokens, scopes, sessions, accounts, account switching, logout, reconnects, or obtaining a trading WebSocket — even if the user just says "users can't log in", "hook up Deriv OAuth", "get an authenticated socket", or "reconnecting loses the session". Not for Legacy API compatibility.
---

## Hosted MCP first, then bundled references

If hosted MCP tools are available, call them by bare name (`get_schema`, `get_field`, `validate_payload`, `get_example`, `search_endpoints`, `guide_api_conventions`, `guide_authenticate`, and the other hosted guide tools). Do not use bundled field lists while those tools work. Never invent fields.

If those tools are missing or fail, read this skill and its `references/`. Do not invent fields that are not in those files.

Never name a host-namespaced tool; use the bare tool name only.

# Implement trading-application authentication

Provide one app-wide auth and account context that every trade family reuses. Public market data does not require authentication, but a generated trading application must authenticate before account data or trading operations become available.

## Read current guidance and facts

Read and enforce the [New API-only guard](../deriv-trading-app/references/new-api-only.md). Accept authentication and endpoint facts only when they are identified as New API. If a schema, example, or repository implementation conflicts with the comparison, stop and report the mismatch instead of generating a request from it.

Use the configured hosted Deriv API MCP first:

1. Call `guide_oauth_app_setup` when registering or configuring an OAuth app.
2. Call `guide_authenticate` for OAuth, PAT, token, account, and OTP guidance.
3. Call `guide_api_conventions` and `guide_rest_vs_websocket` for transport and cross-cutting rules.
4. Use `search_endpoints` to resolve the current account-list and OTP endpoint IDs.
5. Use `get_schema` or `get_field` for auth requirements, scopes, headers, fields, and response shapes. Validate request bodies with `validate_payload`.

If those tools are unavailable, use the live [authentication](https://developers.deriv.com/llms/authentication.md), [OAuth](https://developers.deriv.com/llms/oauth.md), [accounts](https://developers.deriv.com/llms/get-accounts.md), [WebSocket OTP](https://developers.deriv.com/llms/websocket.md), and [errors](https://developers.deriv.com/llms/errors.md) references reached from [llms.txt](https://developers.deriv.com/llms.txt). Do not substitute legacy authorize endpoints or an old WebSocket `authorize` flow.

## Choose the method deliberately

- Default a user-facing web application to OAuth 2.0 Authorization Code with PKCE and an application backend or backend-for-frontend.
- Require a registered New API OAuth client. Start authorization at `https://auth.deriv.com/oauth2/auth` with `client_id`; never include the optional Legacy `app_id` compatibility parameter or use a V1 application ID. Exchange the code at `https://auth.deriv.com/oauth2/token`.
- Use a PAT only when manual token entry is acceptable, such as a CLI, desktop/native tool, or an explicitly requested PAT integration.
- Treat bulk purchase as a distinct PAT-only workflow. Do not generalise its credential placement to ordinary REST or WebSocket trading.
- Request the minimal configured scopes. Determine the actual endpoint scopes from the live MCP/schema; do not add account-management or payment scopes merely because they exist.

## Preserve the security boundary

Apply the browser OAuth/BFF boundary below to greenfield browser applications and to work explicitly scoped as an authentication migration. An existing repository may preserve its established component ownership and session topology when re-platforming is outside scope, but this is an architecture-only exception. It never permits Legacy API endpoints, WebSocket authentication, request fields, or response assumptions. If the shared seam violates the New API contract, migrate it once before extending it; do not add a second credential path.

- Generate fresh cryptographically random PKCE verifier, challenge, and state per attempt. Store pending transactions briefly, server-side when the BFF owns initiation or in `sessionStorage` when the browser owns initiation, and consume them once.
- Validate state before trusting either a success or error callback. Exchange the code immediately and clean OAuth parameters from every terminal callback path while preserving unrelated URL state.
- Perform the code exchange on a backend. Keep Deriv access/refresh tokens in protected server-side storage. For a browser/BFF deployment, give the browser an opaque application session in a `Secure`, `HttpOnly` cookie with an appropriate `SameSite` policy and CSRF protection.
- Use the exact registered redirect URI for registration, authorisation, and exchange. Never silently change path, slash, scheme, host, or port.
- Never put provider tokens or PATs in browser storage, URLs, logs, analytics, or client-rendered errors; persist browser OAuth tokens only in protected server-side credential storage. Never durably persist authorisation codes, PKCE verifiers, or OTP URLs. An OTP URL may exist transiently only in the connection owner that opens its one permitted connection.
- Do not render provider error strings as HTML. Distinguish verified invalid credentials from transient timeouts, rate limits, and server failures; a transient failure must not destroy a valid session.
- Implement refresh only to the contract verified for the target environment. Coalesce concurrent refresh attempts and fall back to re-authentication when refresh is unavailable or terminally rejected.

For a permitted CLI, desktop/native, or other trusted non-browser PAT client, there is no OAuth code exchange or application cookie. Keep the PAT in platform-appropriate protected credential storage or inject it at runtime, and let that trusted client call account and OTP REST endpoints directly. Never use a browser-held PAT as a shortcut around the browser OAuth/BFF boundary.

## Bridge the session to trading

For the browser OAuth/BFF flow, have the application backend fetch the user's Options accounts with its server-held provider token and return only the account data the UI needs. A permitted trusted non-browser PAT client performs the same request directly with its protected PAT. Let the user choose an account, keep its ID, type, balance, and currency together, and use the selected account's currency for proposal requests.

Use `https://api.derivws.com` as the REST base and identify the registered New API application with `Deriv-App-ID`. Obtain an account-specific, one-time WebSocket URL from `POST /trading/v1/options/accounts/{accountId}/otp` with the Bearer credential: the application backend performs this call for browser OAuth, while a permitted trusted non-browser PAT client may perform it directly. When the browser owns the trading socket, return only that URL to the dedicated connection owner; never return the Bearer token. Connect directly to the returned demo or real URL; do not construct it or send an auth message over the socket. Unauthenticated market data uses only `wss://api.derivws.com/trading/v1/options/ws/public`. Obtain a fresh URL for a new connection, account switch, expired attempt, or reconnect that cannot reuse the previous connection. Never infer the account from a shared Deriv cookie.

Account context comes from that selected account's OTP-authenticated connection. Never send `loginid` in a WebSocket request and never send a top-level WebSocket `authorize` message.

Separate a live socket from the URL that created it. A connected socket can remain open, but after it closes its consumed OTP URL is not a reconnect credential. Before opening a replacement authenticated socket, enter a reconnecting gate, fetch a new account OTP URL, increment the connection generation, then restore only current subscriptions. Account switching must invalidate the old account generation before awaiting its replacement URL.

Expose auth state, selected account, account switching, an opaque connection/session handle, and logout through one abstraction. If the browser owns the trading socket, pass its OTP URL directly to the socket owner only long enough to open the connection; other trading features consume the handle and never read credentials or reusable URL state.

## Respect an existing application architecture

Reuse an established auth abstraction only after verifying that its wire protocol conforms to the New API. Keep the target repository's tracked shared provider as the integration seam, but correct that seam once if it emits Legacy API requests; existing code is not grandfathered. Repository allowances may preserve ownership and security topology only, never an obsolete Deriv API contract. For a greenfield browser OAuth application, follow the backend exchange and server-side token boundary above; for a permitted trusted non-browser PAT client, follow the protected PAT branch.

If current Deriv guidance requires a stronger boundary than an existing implementation, report the gap separately. A trade-type addition must not silently create a second auth system, and a security migration must not be smuggled into an unrelated feature.

When implementing or reviewing the flow, read [the auth checklist](references/implementation-checklist.md).

## Verify without credentialed side effects

Test PKCE/state creation, success and error callbacks, exact redirect matching, session rotation, scope failures, account switching, fresh OTP acquisition, reconnect behaviour, logout cleanup, and transient versus terminal errors. Mock upstream responses and redact secrets. Do not use a real account or place a trade as an auth test.
