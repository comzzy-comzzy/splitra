#!/usr/bin/env node
import {
  defaultGasSettings,
  deploymentBytecode,
  loadNetwork,
  parseArgs,
  publicClient,
  validateAddress,
  waitForReceipt,
  walletClient
} from "./lib.mjs";
import { encodeDeployData } from "viem";
import { splitraVaultAbi } from "./lib.mjs";

try {
  const args = parseArgs();
  const network = loadNetwork(args.network);
  let account = null;
  let client = null;
  if (!args["dry-run"] || process.env.PRIVATE_KEY) {
    ({ account, client } = walletClient(network));
  }
  const owner = args.owner ? validateAddress(args.owner, "Owner") : account?.address || "PRIVATE_KEY_SIGNER";

  console.log(JSON.stringify({
    network: network.name,
    chainId: network.chainId,
    signer: account?.address || null,
    owner
  }, null, 2));

  if (args["dry-run"]) {
    console.log("Dry run only. No transaction was sent.");
    process.exit(0);
  }

  const bytecode = deploymentBytecode();
  const data = encodeDeployData({
    abi: splitraVaultAbi,
    bytecode,
    args: [owner]
  });
  const hash = await client.sendTransaction({
    account,
    data,
    ...defaultGasSettings()
  });
  const receipt = await waitForReceipt(publicClient(network), hash);

  console.log(JSON.stringify({
    ok: receipt.status === "success",
    txHash: hash,
    contractAddress: receipt.contractAddress,
    blockNumber: receipt.blockNumber?.toString()
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
