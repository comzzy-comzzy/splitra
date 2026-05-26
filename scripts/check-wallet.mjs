#!/usr/bin/env node
import { formatEther } from "viem";
import { loadNetwork, parseArgs, publicClient, walletClient } from "./lib.mjs";

try {
  const args = parseArgs();
  const network = loadNetwork(args.network);
  const { account } = walletClient(network);
  const client = publicClient(network);
  const balance = await client.getBalance({ address: account.address });

  console.log(JSON.stringify({
    ok: true,
    network: network.name,
    chainId: network.chainId,
    address: account.address,
    nativeToken: network.nativeToken,
    balanceRaw: balance.toString(),
    balanceFormatted: formatEther(balance)
  }, null, 2));

  if (balance === 0n) {
    console.error(`Wallet has 0 ${network.nativeToken} on ${network.name}. Fund this address before deploying.`);
    process.exit(2);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
