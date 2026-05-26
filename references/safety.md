# Splitra Safety

Splitra routes money. Treat every write operation as sensitive.

## Required Checks

- Use Pharos Atlantic testnet unless the user explicitly requests another supported network.
- Never print or request private keys in chat. Use `PRIVATE_KEY` in the shell environment.
- Run `route-revenue.mjs --dry-run` before sending a route transaction.
- Confirm the signer is the `SplitraVault` owner before configuring or routing.
- Confirm the local split config matches the vault's on-chain config before routing.
- Reject malformed, duplicate, or zero recipient addresses.
- Reject split configs whose shares do not total exactly 10000 basis points.
- Do not route to arbitrary addresses from a prompt. Recipients must come from the config.

## Mainnet Rule

Mainnet is supported by config but should not be used for campaign demos. If a
user asks for mainnet, explicitly state the network, chain ID, signer address,
vault address, token, and payout plan before any write.

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

- Atlantic testnet
- low-value test tokens
- `--dry-run` screenshots
- a small payout route
- generated proof report
