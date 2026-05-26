---
name: splitra
description: >
  Use Splitra when a user wants an AI agent to manage, verify, split, or route
  onchain revenue on Pharos. Splitra verifies incoming payment transactions,
  plans revenue distributions, configures SplitraVault recipient shares, routes
  ERC20 or native PHRS funds to recipients, and generates audit proof reports.
  Trigger for requests about agent revenue, x402 earnings, payment settlement,
  treasury routing, payout splits, revenue shares, proof-of-payout reports, or
  Pharos autonomous commerce workflows.
requires:
  anyBins:
    - node
    - npm
    - npx
---

# Splitra

Splitra is a Pharos Agent Center skill for autonomous revenue routing. It helps
AI agents verify incoming onchain revenue, calculate split policies, route funds
through `SplitraVault`, and export proof reports for reviewers, treasuries, or
agent operators.

## Safety Defaults

- Default network is Pharos Atlantic testnet.
- Never print private keys or ask the user to paste a private key into chat.
- Write operations require `PRIVATE_KEY` in the shell environment.
- Show the network, signer address, vault address, token, recipients, shares,
  and exact payout plan before executing a write.
- Use `--dry-run` first for `route-revenue`.
- Do not route to recipients that are not present in the active split config.
- Reject split configs where shares do not total exactly 10000 basis points.
- Reject zero addresses, duplicate recipients, and malformed addresses.

## Network

Read `assets/networks.json`. Use `atlantic-testnet` unless the user explicitly
asks for another supported network.

## Common Workflows

### Inspect or verify incoming revenue

Use `scripts/verify-payment.mjs` when the user asks whether a transaction is a
valid revenue payment.

```bash
node scripts/verify-payment.mjs \
  --network atlantic-testnet \
  --tx 0x... \
  --expected-to 0xVaultOrReceiver \
  --token 0xErc20TokenOrnative \
  --min-amount 1000000
```

### Preview payout plan

Use `scripts/route-revenue.mjs --dry-run` before any real routing.

```bash
node scripts/route-revenue.mjs \
  --network atlantic-testnet \
  --vault 0xVault \
  --token 0xTokenOrnative \
  --amount 1000000 \
  --config assets/example-splits.json \
  --dry-run
```

### Deploy SplitraVault

Deploy only after confirming the target network and signer address.

```bash
PRIVATE_KEY=... node scripts/deploy-vault.mjs \
  --network atlantic-testnet
```

### Configure recipient splits

```bash
PRIVATE_KEY=... node scripts/configure-splits.mjs \
  --network atlantic-testnet \
  --vault 0xVault \
  --config assets/example-splits.json
```

### Route revenue

Run a dry-run first. After user confirmation, execute without `--dry-run`.

```bash
PRIVATE_KEY=... node scripts/route-revenue.mjs \
  --network atlantic-testnet \
  --vault 0xVault \
  --token 0xTokenOrnative \
  --amount 1000000 \
  --config assets/example-splits.json
```

### Generate proof report

```bash
node scripts/generate-proof-report.mjs \
  --network atlantic-testnet \
  --payment-tx 0xIncomingPayment \
  --route-tx 0xRouteTransaction \
  --vault 0xVault \
  --config assets/example-splits.json \
  --out proof-report.json
```

## Natural Language Examples

- "Verify this payment transaction and tell me if Splitra can route it."
- "Create a payout plan for 25 USDC using this recipient config."
- "Deploy a Splitra vault on Pharos Atlantic testnet."
- "Configure Splitra with 40% operator, 30% creator, 20% treasury, 10% referrer."
- "Route the verified revenue and generate a proof report."

## Resources

- Contract: `contracts/SplitraVault.sol`
- Network config: `assets/networks.json`
- Example split config: `assets/example-splits.json`
- Safety notes: `references/safety.md`
- Revenue flow: `references/x402-revenue-flow.md`
