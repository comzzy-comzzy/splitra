#!/usr/bin/env node
import {
  defaultGasSettings,
  loadNetwork,
  loadSplitConfig,
  parseArgs,
  publicClient,
  splitConfigArrays,
  splitraVaultAbi,
  validateAddress,
  waitForReceipt,
  walletClient
} from "./lib.mjs";

try {
  const args = parseArgs();
  const network = loadNetwork(args.network);
  const vault = validateAddress(args.vault, "Vault");
  const config = loadSplitConfig(args.config);
  const { recipients, shares, labels } = splitConfigArrays(config);
  const readClient = publicClient(network);
  let account = null;
  let client = null;
  let owner = null;
  if (!args["dry-run"] || process.env.PRIVATE_KEY) {
    ({ account, client } = walletClient(network));
    owner = await readClient.readContract({
      address: vault,
      abi: splitraVaultAbi,
      functionName: "owner"
    });
    if (owner.toLowerCase() !== account.address.toLowerCase()) {
      throw new Error(`Signer ${account.address} is not vault owner ${owner}`);
    }
  }

  console.log(JSON.stringify({
    network: network.name,
    chainId: network.chainId,
    signer: account?.address || null,
    owner,
    vault,
    recipients: config.recipients
  }, null, 2));

  if (args["dry-run"]) {
    console.log("Dry run only. No transaction was sent.");
    process.exit(0);
  }

  const hash = await client.writeContract({
    address: vault,
    abi: splitraVaultAbi,
    functionName: "configureSplits",
    args: [recipients, shares, labels],
    ...defaultGasSettings()
  });
  const receipt = await waitForReceipt(readClient, hash);
  const configHash = await readClient.readContract({
    address: vault,
    abi: splitraVaultAbi,
    functionName: "currentConfigHash"
  });

  console.log(JSON.stringify({
    ok: receipt.status === "success",
    txHash: hash,
    blockNumber: receipt.blockNumber?.toString(),
    configHash
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
