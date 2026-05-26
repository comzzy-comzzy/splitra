#!/usr/bin/env node
import {
  loadNetwork,
  loadSplitConfig,
  parseArgs,
  publicClient,
  validateAddress,
  writeJson
} from "./lib.mjs";

try {
  const args = parseArgs();
  const network = loadNetwork(args.network);
  const client = publicClient(network);
  const vault = validateAddress(args.vault, "Vault");
  const config = loadSplitConfig(args.config);
  const out = args.out || "splitra-proof-report.json";

  const fetchTx = async (hash) => {
    if (!hash) {
      return null;
    }
    const [tx, receipt] = await Promise.all([
      client.getTransaction({ hash }),
      client.getTransactionReceipt({ hash })
    ]);
    return {
      hash,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      status: receipt.status,
      blockNumber: receipt.blockNumber?.toString(),
      gasUsed: receipt.gasUsed?.toString(),
      logCount: receipt.logs.length
    };
  };

  const report = {
    skill: "splitra",
    reportVersion: "0.1.0",
    generatedAt: new Date().toISOString(),
    network: {
      name: network.name,
      chainId: network.chainId,
      explorerUrl: network.explorerUrl
    },
    vault,
    splitConfig: config,
    payment: await fetchTx(args["payment-tx"]),
    route: await fetchTx(args["route-tx"]),
    notes: [
      "This report is generated from public Pharos RPC data and the provided split config.",
      "Verify recipient addresses and tx hashes independently before accounting settlement."
    ]
  };

  writeJson(out, report);
  console.log(JSON.stringify({
    ok: true,
    out,
    paymentTx: report.payment?.hash || null,
    routeTx: report.route?.hash || null
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
