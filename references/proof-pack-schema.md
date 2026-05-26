# Proof Report Schema

`generate-proof-report.mjs` writes a JSON report for reviewers and operators.

## Fields

- `skill`: Always `splitra`.
- `reportVersion`: Report schema version.
- `generatedAt`: ISO timestamp.
- `network`: Pharos network metadata.
- `vault`: SplitraVault address.
- `splitConfig`: Recipient labels, addresses, and basis points.
- `payment`: Optional incoming payment transaction summary.
- `route`: Optional routing transaction summary.
- `notes`: Verification reminders.

## Verification Expectations

A reviewer should be able to:

- open the payment transaction on PharosScan
- open the route transaction on PharosScan
- confirm the vault address
- confirm payout recipients and shares
- match report data to public RPC data
