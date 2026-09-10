# Authentication implementation checklist

Use this checklist after reading the live MCP guides and schemas. It is an architecture and security checklist, not a substitute for endpoint field definitions.

The server-side session items are the greenfield browser OAuth and explicit auth-migration target. A permitted trusted non-browser PAT client instead uses platform-protected credential storage and calls the REST endpoints directly. For ordinary work in an existing application, preserve its established shared ownership model, but require its wire protocol to conform to the New API. This architecture allowance never permits Legacy API behaviour or a parallel auth system.

## Application registration

- Identify the deployment origin and callback path before registering the app.
- Use one exact redirect URI across registration, authorisation, callback validation, and token exchange.
- Keep the registered New API OAuth `client_id` and REST `Deriv-App-ID` value in deployment configuration. Never substitute a V1 application ID or commit tokens, PATs, secrets, OTP URLs, or real account identifiers.
- Request only scopes required by the features being built. Ordinary Options trading and account creation are separate capabilities; verify both against the live schema.
- Carry affiliate attribution only when it is in scope, preserve supported parameter names, and resolve redirects through a constrained backend rather than a general-purpose fetch proxy.

## OAuth transaction

- Generate fresh `state` and PKCE material with a cryptographically secure source for every login or sign-up.
- Send authorization requests only to `https://auth.deriv.com/oauth2/auth` with `client_id`; reject the optional Legacy `app_id` compatibility parameter. Exchange codes only at `https://auth.deriv.com/oauth2/token`.
- Store the pending transaction with a short expiry, one-time consumption, and enough information to bind it to the browser session and exact redirect URI. Use server-side storage when the BFF owns initiation; short-lived `sessionStorage` is permitted when the browser owns initiation. Never use durable browser storage for `state` or the PKCE verifier.
- Add the registration prompt only for sign-up. Use a URL/query builder rather than string concatenation.
- Detect callbacks containing success or error parameters. Validate state before trusting either branch.
- Exchange the code from the backend, rotate the application session identifier, and store Deriv tokens server-side. For a browser/BFF deployment, send only an opaque `Secure`, `HttpOnly` application-session cookie with an appropriate `SameSite` policy and CSRF protection.
- Remove OAuth parameters after every terminal path without erasing unrelated query parameters or fragments.

## Session and token handling

- For browser OAuth/BFF deployments, make server-side token storage tenant/user scoped and encrypted or delegated to a managed credential store.
- Never place Deriv bearer tokens in browser storage, URLs, logs, analytics, or client-rendered error messages.
- For a permitted trusted non-browser PAT client, use an OS-backed credential manager, another platform-appropriate protected store, or an injected runtime secret. Do not use a browser-held PAT to avoid the BFF requirement.
- If refresh is supported by the verified environment, coalesce concurrent refreshes and retain the prior refresh token when a valid response omits a replacement.
- Retry transient provider failures with a bound. Clear the session only for terminal authentication failure, explicit logout, or verified revocation.
- Logout closes authenticated sockets, invalidates the application session, deletes stored credentials and cached account data, and resets client state.

## Accounts and WebSocket OTP

- For browser OAuth, have the application backend fetch accounts after authentication and return only the account data the UI needs. A permitted trusted non-browser PAT client may fetch them directly. Model account ID, account type, currency, and balance as one selected object.
- Prefer a demo account for first-run UI when product requirements allow, but let the user switch deliberately.
- Never infer or import an account ID from a cookie belonging to another Deriv application.
- Establish account context through the selected account's OTP-authenticated connection. Reject any WebSocket request containing `loginid`.
- Reject any attempt to authenticate with a top-level WebSocket `authorize` request.
- For browser OAuth, have the application backend ask the OTP endpoint for the selected account. A permitted trusted non-browser PAT client may ask it directly. If the browser owns the socket, give the one-time URL only to its dedicated connection owner, then connect directly to the returned WebSocket URL without exposing the Bearer token.
- Use `https://api.derivws.com` for REST, include `Deriv-App-ID` plus the Bearer token where required, and use `wss://api.derivws.com/trading/v1/options/ws/public` only for unauthenticated market data.
- Treat the OTP URL as a one-time short-lived credential: do not log, cache durably, share between accounts, or put it in application state that is persisted.
- Fetch a fresh OTP for account switches and new authenticated connections. Invalidate proposal and position subscriptions tied to the prior account before exposing the new one.
- Do not let a WebSocket manager automatically reconnect an authenticated socket with its consumed URL. Route replacement connection creation through auth, fetch a fresh OTP, and advance the account/connection generation before restoring subscriptions.
- Do not send a legacy `authorize` message or bearer token after the OTP WebSocket connects.

## UI contract

Expose a single typed auth surface with states such as loading, unauthenticated, authenticating, authenticated, reconnecting, and error. Include login, sign-up when requested, logout, account list, selected account, account switching, and an opaque connection/session handle. Keep a transient OTP URL inside the connection owner rather than general application state.

Keep public-price functionality explicitly separate from authenticated trading. A logged-out user may browse markets, but buy, balance, portfolio, open-contract, transaction, update, cancel, and sell controls remain unavailable.

## Tests

- PKCE/state uniqueness, expiry, one-time use, and mismatch rejection.
- Exact redirect URI matching and safe callback cleanup for both success and error.
- Session identifier rotation and, for browser/BFF deployments, cookie attributes and CSRF defenses.
- Missing scope and token expiry behaviour.
- Account selection, switch ordering, and fresh OTP retrieval.
- Hidden-tab/reconnect recovery without OTP reuse.
- Disconnect/reconnect while visible also fetches a fresh OTP rather than reopening the consumed URL.
- Transient failure preserves the session; terminal rejection clears it.
- Logout clears server and client state and closes authenticated connections.
- Secrets are redacted from telemetry, thrown errors, snapshots, and fixtures.
- Emitted WebSocket payloads never contain `loginid` or a top-level `authorize` request.
