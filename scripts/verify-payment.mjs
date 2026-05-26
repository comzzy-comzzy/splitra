#!/usr/bin/env node
import {
  erc20Abi,
  formatAmount,
  loadNetwork,
  normalizeToken,
  parseArgs,
  publicClient,
  tokenMetadata,
  validateAddress,
  zeroAddress
} from "./lib.mjs";
import { decodeEventLog } from "viem";

try {
  const args = parseArgs();
  const network = loadNetwork(args.network);
  const txHash = args.tx;
  if (!txHash) {
    throw new Error("--tx is required");
  }
  const expectedTo = args["expected-to"] ? validateAddress(args["expected-to"], "Expected receiver") : null;
  const token = normalizeToken(args.token || "native");
  const minAmount = args["min-amount"] ? BigInt(args["min-amount"]) : 0n;
  const client = publicClient(network);
  const [tx, receipt] = await Promise.all([
    client.getTransaction({ hash: txHash }),
    client.getTransactionReceipt({ hash: txHash })
  ]);

  let matched = false;
  let amount = 0n;
  let receiver = null;
  let sender = tx.from;

  if (token === zeroAddress) {
    receiver = tx.to;
    amount = tx.value;
    matched = (!expectedTo || receiver?.toLowerCase() === expectedTo.toLowerCase()) && amount >= minAmount;
  } else {
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== token.toLowerCase()) {
        continue;
      }
      try {
        const decoded = decodeEventLog({
          abi: erc20Abi,
          data: log.data,
          topics: log.topics
        });
        if (decoded.eventName !== "Transfer") {
          continue;
        }
        const to = decoded.args.to;
        const value = decoded.args.value;
        if ((!expectedTo || to.toLowerCase() === expectedTo.toLowerCase()) && value >= minAmount) {
          matched = true;
          receiver = to;
          sender = decoded.args.from;
          amount = value;
          break;
        }
      } catch {
        continue;
      }
    }
  }

  const meta = await tokenMetadata(client, token, network);
  const ok = receipt.status === "success" && matched;
  console.log(JSON.stringify({
    ok,
    network: network.name,
    chainId: network.chainId,
    txHash,
    status: receipt.status,
    token: token === zeroAddress ? network.nativeToken : token,
    symbol: meta.symbol,
    sender,
    receiver,
    amountRaw: amount.toString(),
    amountFormatted: formatAmount(amount, meta.decimals),
    minAmountRaw: minAmount.toString(),
    blockNumber: receipt.blockNumber?.toString(),
    reason: ok ? "payment verified" : "payment did not match expected receiver/token/minimum"
  }, null, 2));

  if (!ok) {
    process.exit(2);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
