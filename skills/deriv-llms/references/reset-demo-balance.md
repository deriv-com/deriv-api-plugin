# Reset Demo Balance

**Auth:** required (scopes: trade)

Request to reset balance for Options trading demo account

**Endpoint:** `POST /trading/v1/options/accounts/{account_id}/reset-demo-balance`

**Status codes:** 200, 400, 401, 403, 404, 500, 504


| Surface | Gateway | Auth |
|---------|---------|------|
| Public market data | `wss://api.derivws.com/trading/v1/options/ws/public` | None — connect directly |
| Authenticated trading | OTP-issued `wss://api.derivws.com/trading/v1/options/ws/real` or `/ws/demo` | OTP URL from `POST /trading/v1/options/accounts/{accountId}/otp` |

Public market data needs no auth. Authenticated trading uses an OTP URL (issued from a REST call with your Bearer token — OAuth 2.0 or PAT; PAT auth also sends `Deriv-App-ID`), then connect to that URL and send messages directly. The symbol field is `underlying_symbol`. See [authentication](https://developers.deriv.com/llms/authentication.md).

- Request schema: [`reset_demo_balance_request.schema.json`](https://developers.deriv.com/schemas/reset_demo_balance_request.schema.json)
- Response schema: [`reset_demo_balance_response.schema.json`](https://developers.deriv.com/schemas/reset_demo_balance_response.schema.json)

## Example

```bash
curl -X POST "https://api.derivws.com/trading/v1/options/accounts/{account_id}/reset-demo-balance" \
  -H "Authorization: Bearer <oauth_token>" \
  -H "Content-Type: application/json"
# Add -H "Deriv-App-ID: <app_id>" when authenticating with a Personal Access Token (PAT).
```

## Request

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `headers` | object | Yes |  |
| `path` | object | Yes |  |

### `headers`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Deriv-App-ID` | string | Yes | Application identifier. Required for Personal Access Token (PAT) authentication; not required for OAuth Bearer tokens. |
| `Authorization` | string | Yes | Bearer token for authentication |

### `path`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `account_id` | string | Yes | Options trading account ID |

## Response

_Source: [reset-demo-balance](https://developers.deriv.com/llms/reset-demo-balance.md)._
