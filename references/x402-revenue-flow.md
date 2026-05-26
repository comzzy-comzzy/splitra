# x402 Revenue Flow

Splitra can be used after an x402-protected agent endpoint receives payment on
Pharos.

## Flow

1. The agent exposes a paid endpoint.
2. A client receives `402 Payment Required`.
3. The client signs and submits payment.
4. The endpoint returns a settlement transaction hash.
5. Splitra verifies that payment transaction.
6. Revenue is sent to a `SplitraVault`.
7. Splitra routes vault funds to configured recipients.
8. Splitra generates a proof report containing payment, route, and config data.

## Why This Is Not Just Batch Transfer

Batch transfer starts from a list of recipients. Splitra starts from verified
agent revenue and enforces a reusable revenue policy before funds move.

Distinct Splitra behavior:

- payment verification before routing
- on-chain split config stored in the vault
- dry-run payout plans
- proof reports for accounting and review
- recipient policy validation

## Suggested Demo Prompt

```text
Verify this x402 payment transaction on Pharos mainnet or Atlantic testnet,
route 1 USDC from the Splitra vault using the configured 40/30/20/10 split, and
generate a proof report.
```
