#!/usr/bin/env node
import { loadSplitConfig, parseArgs } from "./lib.mjs";

try {
  const args = parseArgs();
  const config = loadSplitConfig(args.config);
  console.log(JSON.stringify({
    ok: true,
    name: config.name || null,
    recipientCount: config.recipients.length,
    totalBasisPoints: config.recipients.reduce((sum, recipient) => sum + recipient.basisPoints, 0)
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
