#!/usr/bin/env node
import {
  assertMatchingSplitConfigs,
  defaultGasSettings,
  loadNetwork,
  loadSplitConfig,
  normalizeToken,
  parseArgs,
  printPlan,
  publicClient,
  routeIdFromInputs,
  splitraVaultAbi,
  validateAddress,
  waitForReceipt,
  walletClient,
  zeroAddress
} from "./lib.mjs";

try {
  const args = parseArgs();
  const network = loadNetwork(args.network);
  const vault = validateAddress(args.vault, "Vault");
  const token = normalizeToken(args.token || "native");
  const amount = BigInt(args.amount);
  const config = loadSplitConfig(args.config);
  const routeId = args.routeId || routeIdFromInputs({ network, vault, token, amount, config });

  printPlan({ network, vault, token, amount, config, routeId });

  if (args["dry-run"]) {
    console.log("Dry run only. No transaction was sent.");
    process.exit(0);
  }

  const readClient = publicClient(network);
  const { account, client } = walletClient(network);
  const owner = await readClient.readContract({
    address: vault,
    abi: splitraVaultAbi,
    functionName: "owner"
  });
  if (owner.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error(`Signer ${account.address} is not vault owner ${owner}`);
  }
  const onchainConfig = await readClient.readContract({
    address: vault,
    abi: splitraVaultAbi,
    functionName: "getSplitConfig"
  });
  assertMatchingSplitConfigs(config, onchainConfig);

  const hash = await client.writeContract({
    address: vault,
    abi: splitraVaultAbi,
    functionName: "route",
    args: [token === zeroAddress ? zeroAddress : token, amount, routeId],
    ...defaultGasSettings()
  });
  const receipt = await waitForReceipt(readClient, hash);
  console.log(JSON.stringify({
    ok: receipt.status === "success",
    network: network.name,
    signer: account.address,
    vault,
    txHash: hash,
    blockNumber: receipt.blockNumber?.toString()
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
