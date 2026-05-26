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
- A funded Pharos wallet on the target network for write operations
- `PRIVATE_KEY` set in the shell for deploy/configure/route transactions

Do not paste private keys into chat, screenshots, GitHub, or config files.

## Install

```bash
git clone https://github.com/comzzy-comzzy/splitra.git
cd splitra
npm install
```

## Choose A Network

Splitra supports both Pharos mainnet and Pharos Atlantic testnet. Pass the
network explicitly in every command so it is clear which chain you are using.

| Network | Flag | Chain ID | Native token | Use for |
| --- | --- | ---: | --- | --- |
| Pharos mainnet | `--network mainnet` | `1672` | `PROS` | real deployments and revenue routing |
| Pharos Atlantic testnet | `--network atlantic-testnet` | `688689` | `PHRS` | demos, testing, and campaign reviews |

If `--network` is omitted, Splitra uses `defaultNetwork` from
`assets/networks.json`, currently `mainnet`.

## Step 1: Validate The Example Config

The example split config is in `assets/example-splits.json`.

```bash
node scripts/validate-config.mjs --config assets/example-splits.json
```

Expected result: `ok: true` and total basis points equal `10000`.

## Step 2: Preview A Revenue Route

These commands do not send transactions. They only show the payout plan.

Mainnet preview:

```bash
node scripts/route-revenue.mjs \
  --network mainnet \
  --vault 0x5555555555555555555555555555555555555555 \
  --token native \
  --amount 1000000 \
  --config assets/example-splits.json \
  --dry-run
```

Testnet preview:

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

Set your private key in the shell environment. Use the wallet private key, not
your public wallet address and not your seed phrase.

```bash
export PRIVATE_KEY=your_private_key_here
```

Correct format:

```bash
export PRIVATE_KEY=0x1234...64_hex_characters_total
```

Wrong:

```bash
export export PRIVATE_KEY=your_private_key_here
export PRIVATE_KEY=0xYourPublicWalletAddress
export PRIVATE_KEY="word1 word2 word3 ..."
```

Check that the private key derives a valid address and has funds on the target
network:

```bash
npm run check:wallet:mainnet
npm run check:wallet:testnet
```

Deploy on Pharos mainnet:

```bash
node scripts/deploy-vault.mjs --network mainnet
```

Deploy on Pharos Atlantic testnet:

```bash
node scripts/deploy-vault.mjs --network atlantic-testnet
```

Save the returned `contractAddress`. That is your `SplitraVault`.

## Step 5: Configure Revenue Splits

Edit `assets/example-splits.json` and replace the placeholder recipient
addresses with real addresses on the same network as the vault.

Then configure the vault:

```bash
node scripts/configure-splits.mjs \
  --network mainnet \
  --vault 0xYourVaultAddress \
  --config assets/example-splits.json
```

For testnet, use `--network atlantic-testnet` with a testnet vault address.

The config must total exactly `10000` basis points.

Example:

- `4000` = 40%
- `3000` = 30%
- `2000` = 20%
- `1000` = 10%

## Step 6: Verify An Incoming Payment

For a native mainnet `PROS` payment:

```bash
node scripts/verify-payment.mjs \
  --network mainnet \
  --tx 0xIncomingPaymentTx \
  --expected-to 0xYourVaultAddress \
  --token native \
  --min-amount 1000000
```

For a native testnet `PHRS` payment, use the same command with
`--network atlantic-testnet`.

For an ERC20 payment:

```bash
node scripts/verify-payment.mjs \
  --network mainnet \
  --tx 0xIncomingPaymentTx \
  --expected-to 0xYourVaultAddress \
  --token 0xTokenAddress \
  --min-amount 1000000
```

## Step 7: Route Revenue

Always dry-run first:

```bash
node scripts/route-revenue.mjs \
  --network mainnet \
  --vault 0xYourVaultAddress \
  --token native \
  --amount 1000000 \
  --config assets/example-splits.json \
  --dry-run
```

For testnet, use `--network atlantic-testnet` with a testnet vault address.

If the payout plan is correct, execute:

```bash
node scripts/route-revenue.mjs \
  --network mainnet \
  --vault 0xYourVaultAddress \
  --token native \
  --amount 1000000 \
  --config assets/example-splits.json
```

## Step 8: Generate A Proof Report

```bash
node scripts/generate-proof-report.mjs \
  --network mainnet \
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
Use Splitra to preview a payout plan for 1 PROS on mainnet from this vault.
```

```text
Use Splitra to preview a payout plan for 1 PHRS on Atlantic testnet from this vault.
```

```text
Use Splitra to verify this payment transaction and tell me if it can be routed.
```

```text
Use Splitra to route verified revenue and generate a proof report.
```

## Safety Rules

- Pharos mainnet and Pharos Atlantic testnet are both supported.
- Always pass `--network mainnet` or `--network atlantic-testnet` explicitly.
- Treat mainnet transactions as real fund movement.
- Use Atlantic testnet for demos, testing, and low-risk review flows.
- Dry-run before routing funds.
- Never commit `.env`, private keys, or proof reports.
- Do not route unless the local config matches the vault's onchain config.
- Do not use placeholder recipient addresses for real transactions.
- Confirm the signer is the vault owner before configuring or routing.

## Campaign Submission Summary

Skill name: Splitra

Short description: Splitra is a Pharos Agent Center skill that lets AI agents verify incoming onchain revenue, calculate payout splits, route funds through a smart contract vault, and generate audit proof reports.

Supported framework: Pharos Agent Center / Codex-style Skill, Node.js, Solidity, viem, Pharos mainnet and Pharos Atlantic testnet.
