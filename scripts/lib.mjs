import fs from "node:fs";
import path from "node:path";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  encodeFunctionData,
  formatUnits,
  getAddress,
  http,
  isAddress,
  keccak256,
  parseAbi,
  parseGwei,
  toBytes,
  zeroAddress
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const nativeTokenAliases = new Set(["native", "phrs", "pros", "0x0000000000000000000000000000000000000000"]);
export { zeroAddress };

export const splitraVaultAbi = parseAbi([
  "constructor(address initialOwner)",
  "function configureSplits(address[] newRecipients,uint16[] newSharesBps,string[] newLabels)",
  "function route(address token,uint256 amount,bytes32 routeId)",
  "function getSplitConfig() view returns (address[] configRecipients,uint16[] configShares,string[] configLabels)",
  "function currentConfigHash() view returns (bytes32)",
  "function owner() view returns (address)",
  "event SplitsConfigured(bytes32 indexed configHash,uint256 recipientCount)",
  "event RevenueRouted(bytes32 indexed routeId,address indexed token,uint256 grossAmount,uint256 remainder,bytes32 indexed configHash)",
  "event Payout(bytes32 indexed routeId,address indexed token,address indexed recipient,uint256 amount,uint16 bps)"
]);

export const erc20Abi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "event Transfer(address indexed from,address indexed to,uint256 value)"
]);

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (!item.startsWith("--")) {
      throw new Error(`Unexpected argument: ${item}`);
    }
    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, bigintReplacer, 2)}\n`);
}

export function loadNetwork(name) {
  const configPath = new URL("../assets/networks.json", import.meta.url);
  const config = readJson(configPath);
  const networkName = name || config.defaultNetwork;
  const network = config.networks.find((entry) => entry.name === networkName);
  if (!network) {
    throw new Error(`Unsupported network: ${networkName}`);
  }
  return network;
}

export function chainFromNetwork(network) {
  return defineChain({
    id: network.chainId,
    name: network.name,
    nativeCurrency: {
      name: network.nativeToken,
      symbol: network.nativeToken,
      decimals: 18
    },
    rpcUrls: {
      default: { http: [network.rpcUrl] }
    },
    blockExplorers: {
      default: {
        name: "PharosScan",
        url: network.explorerUrl
      }
    },
    testnet: network.name !== "mainnet"
  });
}

export function publicClient(network) {
  return createPublicClient({
    chain: chainFromNetwork(network),
    transport: http(network.rpcUrl)
  });
}

export function walletClient(network) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is required for write operations. Set it in the shell environment.");
  }
  const account = privateKeyToAccount(normalizePrivateKey(privateKey));
  return {
    account,
    client: createWalletClient({
      account,
      chain: chainFromNetwork(network),
      transport: http(network.rpcUrl)
    })
  };
}

export function normalizePrivateKey(privateKey) {
  const trimmed = String(privateKey || "").trim();
  const normalized = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error(
      "PRIVATE_KEY must be a 32-byte hex private key: 64 hex characters, optionally prefixed with 0x. Do not use your public wallet address or seed phrase."
    );
  }
  return normalized;
}

export function normalizeToken(token) {
  const value = String(token || "native").toLowerCase();
  if (nativeTokenAliases.has(value)) {
    return zeroAddress;
  }
  return getAddress(token);
}

export function displayToken(token, network) {
  return token === zeroAddress ? network.nativeToken : token;
}

export function validateAddress(value, label) {
  if (!isAddress(value)) {
    throw new Error(`${label} is not a valid EVM address: ${value}`);
  }
  return getAddress(value);
}

export function loadSplitConfig(configPath) {
  if (!configPath) {
    throw new Error("--config is required");
  }
  const resolved = path.resolve(configPath);
  const config = readJson(resolved);
  validateSplitConfig(config);
  return config;
}

export function validateSplitConfig(config) {
  if (!config || !Array.isArray(config.recipients)) {
    throw new Error("Split config must contain a recipients array");
  }
  if (config.recipients.length === 0) {
    throw new Error("Split config must include at least one recipient");
  }

  let total = 0;
  const seen = new Set();
  for (const recipient of config.recipients) {
    if (!recipient.label || typeof recipient.label !== "string") {
      throw new Error("Every recipient needs a label");
    }
    const address = validateAddress(recipient.address, `Recipient ${recipient.label}`);
    if (address === zeroAddress) {
      throw new Error(`Recipient ${recipient.label} cannot be the zero address`);
    }
    const lower = address.toLowerCase();
    if (seen.has(lower)) {
      throw new Error(`Duplicate recipient address: ${address}`);
    }
    seen.add(lower);
    if (!Number.isInteger(recipient.basisPoints) || recipient.basisPoints <= 0) {
      throw new Error(`Recipient ${recipient.label} must have positive integer basisPoints`);
    }
    total += recipient.basisPoints;
  }
  if (total !== 10000) {
    throw new Error(`Split basis points must total 10000, received ${total}`);
  }
  return true;
}

export function planPayouts(amount, config) {
  const gross = BigInt(amount);
  if (gross <= 0n) {
    throw new Error("Amount must be greater than zero");
  }
  let paid = 0n;
  const payouts = config.recipients.map((recipient) => {
    const payout = (gross * BigInt(recipient.basisPoints)) / 10000n;
    paid += payout;
    return {
      label: recipient.label,
      address: getAddress(recipient.address),
      basisPoints: recipient.basisPoints,
      amount: payout
    };
  });
  return {
    gross,
    payouts,
    remainder: gross - paid
  };
}

export function splitConfigArrays(config) {
  return {
    recipients: config.recipients.map((recipient) => getAddress(recipient.address)),
    shares: config.recipients.map((recipient) => recipient.basisPoints),
    labels: config.recipients.map((recipient) => recipient.label)
  };
}

export function normalizeConfigForCompare(config) {
  return config.recipients.map((recipient) => ({
    label: recipient.label,
    address: getAddress(recipient.address).toLowerCase(),
    basisPoints: Number(recipient.basisPoints)
  }));
}

export function assertMatchingSplitConfigs(localConfig, onchainConfig) {
  const local = normalizeConfigForCompare(localConfig);
  const [addresses, shares, labels] = onchainConfig;
  const onchain = addresses.map((address, index) => ({
    label: labels[index],
    address: getAddress(address).toLowerCase(),
    basisPoints: Number(shares[index])
  }));

  if (local.length !== onchain.length) {
    throw new Error(`Local config has ${local.length} recipients, on-chain config has ${onchain.length}`);
  }
  for (let i = 0; i < local.length; i++) {
    const expected = local[i];
    const actual = onchain[i];
    if (
      expected.label !== actual.label ||
      expected.address !== actual.address ||
      expected.basisPoints !== actual.basisPoints
    ) {
      throw new Error(`Local split config does not match on-chain config at index ${i}`);
    }
  }
}

export function routeIdFromInputs({ network, vault, token, amount, config }) {
  const payload = JSON.stringify({
    network: network.name,
    chainId: network.chainId,
    vault: getAddress(vault),
    token,
    amount: String(amount),
    recipients: config.recipients.map((recipient) => ({
      label: recipient.label,
      address: getAddress(recipient.address),
      basisPoints: recipient.basisPoints
    }))
  });
  return keccak256(toBytes(payload));
}

export function printPlan({ network, vault, token, amount, config, routeId }) {
  const plan = planPayouts(amount, config);
  console.log(JSON.stringify({
    network: network.name,
    chainId: network.chainId,
    vault: getAddress(vault),
    token: displayToken(token, network),
    routeId,
    grossAmountRaw: plan.gross.toString(),
    payouts: plan.payouts.map((payout) => ({
      ...payout,
      amountRaw: payout.amount.toString()
    })),
    remainderRaw: plan.remainder.toString()
  }, bigintReplacer, 2));
  return plan;
}

export async function waitForReceipt(client, hash) {
  return client.waitForTransactionReceipt({ hash });
}

export async function tokenMetadata(client, token, network) {
  if (token === zeroAddress) {
    return {
      symbol: network.nativeToken,
      decimals: 18
    };
  }
  const [symbol, decimals] = await Promise.all([
    client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }).catch(() => "ERC20"),
    client.readContract({ address: token, abi: erc20Abi, functionName: "decimals" }).catch(() => 18)
  ]);
  return { symbol, decimals: Number(decimals) };
}

export function formatAmount(raw, decimals) {
  return formatUnits(BigInt(raw), decimals);
}

export function bigintReplacer(_key, value) {
  return typeof value === "bigint" ? value.toString() : value;
}

export function requireFile(filePath, help) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} not found. ${help || ""}`.trim());
  }
}

export function splitraBytecodePath() {
  return path.resolve("build", "contracts_SplitraVault_sol_SplitraVault.bin");
}

export function deploymentBytecode() {
  const filePath = splitraBytecodePath();
  requireFile(filePath, "Run npm run compile first.");
  return `0x${fs.readFileSync(filePath, "utf8").trim()}`;
}

export function encodedCall(functionName, args) {
  return encodeFunctionData({
    abi: splitraVaultAbi,
    functionName,
    args
  });
}

export function defaultGasSettings() {
  return {
    maxFeePerGas: parseGwei("10"),
    maxPriorityFeePerGas: 0n
  };
}
