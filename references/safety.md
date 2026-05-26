# Splitra Safety

Splitra routes money. Treat every write operation as sensitive.

## Required Checks

- Support both Pharos mainnet and Pharos Atlantic testnet.
- Pass `--network mainnet` or `--network atlantic-testnet` explicitly.
- When the prompt is ambiguous, ask or infer the target network before writes.
- Never print or request private keys in chat. Use `PRIVATE_KEY` in the shell environment.
- Run `route-revenue.mjs --dry-run` before sending a route transaction.
- Confirm the signer is the `SplitraVault` owner before configuring or routing.
- Confirm the local split config matches the vault's on-chain config before routing.
- Reject malformed, duplicate, or zero recipient addresses.
- Reject split configs whose shares do not total exactly 10000 basis points.
- Do not route to arbitrary addresses from a prompt. Recipients must come from the config.

## Network Rules

Before any write, explicitly state the network, chain ID, signer address, vault
address, token, and payout plan.

- Mainnet uses real funds. Require an explicit dry-run and confirmation before
  sending a transaction.
- Atlantic testnet is appropriate for demos, testing, and campaign review.

## Private Key Handling

Allowed:

```bash
PRIVATE_KEY=... node scripts/route-revenue.mjs ...
```

Not allowed:

- Paste private keys into prompts.
- Commit `.env` or key files.
- Print full private keys in logs.

## Reviewer-Friendly Demo

For campaign review, prefer:

- Atlantic testnet routes when a live transaction is needed
- mainnet dry-runs when reviewers ask for production readiness
- low-value routes on the selected network
- `--dry-run` screenshots
- a small payout route only after confirmation
- generated proof report
