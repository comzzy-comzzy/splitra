---
name: splitra
description: >
  Use Splitra when a user wants an AI agent to manage, verify, split, or route
  onchain revenue on Pharos. Splitra verifies incoming payment transactions,
  plans revenue distributions, configures SplitraVault recipient shares, routes
  ERC20 or native PROS/PHRS funds to recipients, and generates audit proof
  reports.
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

- Supported networks are Pharos mainnet and Pharos Atlantic testnet.
- Ask or infer the target network before writes when the prompt is ambiguous.
- Never print private keys or ask the user to paste a private key into chat.
- Write operations require `PRIVATE_KEY` in the shell environment.
- Show the network, signer address, vault address, token, recipients, shares,
  and exact payout plan before executing a write.
- Treat `mainnet` as real fund movement. Use `atlantic-testnet` for demos and
  review flows.
- Use `--dry-run` first for `route-revenue`.
- Do not route to recipients that are not present in the active split config.
- Reject split configs where shares do not total exactly 10000 basis points.
- Reject zero addresses, duplicate recipients, and malformed addresses.

## Network

Read `assets/networks.json`. Both `mainnet` and `atlantic-testnet` are
supported. Pass `--network mainnet` or `--network atlantic-testnet` explicitly
in generated commands.

## Common Workflows

### Inspect or verify incoming revenue

Use `scripts/verify-payment.mjs` when the user asks whether a transaction is a
valid revenue payment.

```bash
node scripts/verify-payment.mjs \
  --network mainnet \
  --tx 0x... \
  --expected-to 0xVaultOrReceiver \
  --token 0xErc20TokenOrnative \
  --min-amount 1000000
```

Use `--network atlantic-testnet` for Pharos Atlantic testnet payments.

### Preview payout plan

Use `scripts/route-revenue.mjs --dry-run` before any real routing.

```bash
node scripts/route-revenue.mjs \
  --network mainnet \
  --vault 0xVault \
  --token 0xTokenOrnative \
  --amount 1000000 \
  --config assets/example-splits.json \
  --dry-run
```

Use `--network atlantic-testnet` for testnet previews.

### Deploy SplitraVault

Deploy only after confirming the target network and signer address.

```bash
PRIVATE_KEY=... node scripts/deploy-vault.mjs \
  --network mainnet
```

For testnet:

```bash
PRIVATE_KEY=... node scripts/deploy-vault.mjs \
  --network atlantic-testnet
```

### Configure recipient splits

```bash
PRIVATE_KEY=... node scripts/configure-splits.mjs \
  --network mainnet \
  --vault 0xVault \
  --config assets/example-splits.json
```

Use `--network atlantic-testnet` when configuring a testnet vault.

### Route revenue

Run a dry-run first. After user confirmation, execute without `--dry-run`.

```bash
PRIVATE_KEY=... node scripts/route-revenue.mjs \
  --network mainnet \
  --vault 0xVault \
  --token 0xTokenOrnative \
  --amount 1000000 \
  --config assets/example-splits.json
```

Use `--network atlantic-testnet` when routing from a testnet vault.

### Generate proof report

```bash
node scripts/generate-proof-report.mjs \
  --network mainnet \
  --payment-tx 0xIncomingPayment \
  --route-tx 0xRouteTransaction \
  --vault 0xVault \
  --config assets/example-splits.json \
  --out proof-report.json
```

Use the same network as the payment and route transactions.

## Natural Language Examples

- "Verify this payment transaction and tell me if Splitra can route it."
- "Create a payout plan for 25 USDC using this recipient config."
- "Deploy a Splitra vault on Pharos mainnet."
- "Deploy a Splitra vault on Pharos Atlantic testnet."
- "Configure Splitra with 40% operator, 30% creator, 20% treasury, 10% referrer."
- "Route the verified revenue and generate a proof report."

## Resources

- Contract: `contracts/SplitraVault.sol`
- Network config: `assets/networks.json`
- Example split config: `assets/example-splits.json`
- Safety notes: `references/safety.md`
- Revenue flow: `references/x402-revenue-flow.md`
