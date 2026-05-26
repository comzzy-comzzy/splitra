# Splitra

Splitra is a Pharos Agent Center skill for autonomous agent revenue routing. It helps an AI agent verify incoming onchain revenue, calculate configured payout splits, route funds through a `SplitraVault` smart contract, and generate proof reports for review.

## What You Use It For

Use Splitra when an AI agent earns onchain revenue and needs to distribute it safely.

Example use cases:

- Route x402 or agent-service payments to an operator, creator, treasury, and referrer.
- Verify that a payment transaction arrived before distributing funds.
- Preview a payout plan before sending a transaction.
- Store reusable revenue split rules in a vault contract.
- Generate a proof report showing the payment, route transaction, recipients, and payout config.

Splitra is not just a batch transfer script. It is revenue-aware: it starts from verified income, applies a split policy, routes from a vault, and produces an audit trail.

## Repository Structure

```text
splitra/
  SKILL.md                       # Agent Center skill instructions
  agents/openai.yaml             # Skill metadata
  contracts/SplitraVault.sol     # Revenue routing vault contract
  scripts/
    deploy-vault.mjs             # Deploy SplitraVault
    configure-splits.mjs         # Configure recipient shares
    verify-payment.mjs           # Verify incoming payment tx
    route-revenue.mjs            # Dry-run or execute payouts
    generate-proof-report.mjs    # Export proof report JSON
    validate-config.mjs          # Validate split config
  assets/
    networks.json                # Pharos network config
    example-splits.json          # Example 40/30/20/10 split
  references/                    # Safety and workflow notes
```

## Requirements

- Node.js 18+
- npm
- A Pharos Atlantic testnet wallet for write operations
- `PRIVATE_KEY` set in the shell for deploy/configure/route transactions

Do not paste private keys into chat, screenshots, GitHub, or config files.

## Install

```bash
git clone https://github.com/comzzy-comzzy/splitra.git
cd splitra
npm install
```

## Step 1: Validate The Example Config

The example split config is in `assets/example-splits.json`.

```bash
node scripts/validate-config.mjs --config assets/example-splits.json
```

Expected result: `ok: true` and total basis points equal `10000`.

## Step 2: Preview A Revenue Route

This command does not send a transaction. It only shows the payout plan.

```bash
node scripts/route-revenue.mjs \
  --network atlantic-testnet \
  --vault 0x5555555555555555555555555555555555555555 \
  --token native \
  --amount 1000000 \
  --config assets/example-splits.json \
  --dry-run
```

You should see a 40/30/20/10 payout plan.

## Step 3: Compile The Vault Contract

```bash
npm run compile
```

This compiles `contracts/SplitraVault.sol` and writes ABI/bytecode to `build/`.

## Step 4: Deploy A Splitra Vault

Set your private key in the shell environment:

```bash
export PRIVATE_KEY=your_private_key_here
```

Deploy on Pharos Atlantic testnet:

```bash
node scripts/deploy-vault.mjs --network atlantic-testnet
```

Save the returned `contractAddress`. That is your `SplitraVault`.

## Step 5: Configure Revenue Splits

Edit `assets/example-splits.json` and replace the placeholder recipient addresses with real testnet addresses.

Then configure the vault:

```bash
node scripts/configure-splits.mjs \
  --network atlantic-testnet \
  --vault 0xYourVaultAddress \
  --config assets/example-splits.json
```

The config must total exactly `10000` basis points.

Example:

- `4000` = 40%
- `3000` = 30%
- `2000` = 20%
- `1000` = 10%

## Step 6: Verify An Incoming Payment

For a native PHRS payment:

```bash
node scripts/verify-payment.mjs \
  --network atlantic-testnet \
  --tx 0xIncomingPaymentTx \
  --expected-to 0xYourVaultAddress \
  --token native \
  --min-amount 1000000
```

For an ERC20 payment:

```bash
node scripts/verify-payment.mjs \
  --network atlantic-testnet \
  --tx 0xIncomingPaymentTx \
  --expected-to 0xYourVaultAddress \
  --token 0xTokenAddress \
  --min-amount 1000000
```

## Step 7: Route Revenue

Always dry-run first:

```bash
node scripts/route-revenue.mjs \
  --network atlantic-testnet \
  --vault 0xYourVaultAddress \
  --token native \
  --amount 1000000 \
  --config assets/example-splits.json \
  --dry-run
```

If the payout plan is correct, execute:

```bash
node scripts/route-revenue.mjs \
  --network atlantic-testnet \
  --vault 0xYourVaultAddress \
  --token native \
  --amount 1000000 \
  --config assets/example-splits.json
```

## Step 8: Generate A Proof Report

```bash
node scripts/generate-proof-report.mjs \
  --network atlantic-testnet \
  --payment-tx 0xIncomingPaymentTx \
  --route-tx 0xRouteTransactionTx \
  --vault 0xYourVaultAddress \
  --config assets/example-splits.json \
  --out splitra-proof-report.json
```

The report contains:

- network
- vault address
- split config
- incoming payment transaction
- route transaction
- gas and block data
- review notes

## Agent Center Usage Prompts

Try these prompts with an AI coding agent using this skill:

```text
Use Splitra to validate this revenue split config.
```

```text
Use Splitra to preview a payout plan for 1 PHRS from this vault.
```

```text
Use Splitra to verify this payment transaction and tell me if it can be routed.
```

```text
Use Splitra to route verified revenue and generate a proof report.
```

## Safety Rules

- Atlantic testnet is the default.
- Dry-run before routing funds.
- Never commit `.env`, private keys, or proof reports.
- Do not route unless the local config matches the vault's onchain config.
- Do not use placeholder recipient addresses for real transactions.
- Confirm the signer is the vault owner before configuring or routing.

## Campaign Submission Summary

Skill name: Splitra

Short description: Splitra is a Pharos Agent Center skill that lets AI agents verify incoming onchain revenue, calculate payout splits, route funds through a smart contract vault, and generate audit proof reports.

Supported framework: Pharos Agent Center / Codex-style Skill, Node.js, Solidity, viem, Pharos Atlantic testnet.
