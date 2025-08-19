#!/usr/bin/env node
import {run} from "./generate.js";

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => a.replace(/^--/, "").split("="))
);

run({
  mode: flags.mode || "changed", // "pr:123" | "changed" | "full"
  files: flags.files || "",
  owner: flags.owner || process.env.DEFAULT_GH_OWNER || "",
  repo: flags.repo || process.env.DEFAULT_GH_REPO || "",
  base: flags.base || "",
  reviewer: flags.reviewer || "",
  dryRun: flags["dry-run"] !== undefined || process.env.AI_GEN_DRY_RUN === "1",
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
