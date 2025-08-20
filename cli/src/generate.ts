import {readFileSync, writeFileSync, existsSync, mkdirSync} from "node:fs";
import {dirname, extname, basename, join, relative} from "node:path";
import {loadConfig} from "./config.js";
import {resolveTargets} from "./diff.js";
import {createBranch, commitAll, pushBranch} from "./git.js";
import {createPullRequest} from "./github.js";
import {SYSTEM_PROMPT, userPrompt} from "./prompts.js";

type RunArgs = {
  mode: string; // "changed" | "full" | "pr:123"
  files: string;
  owner: string;
  repo: string;
  base: string;
  reviewer: string;
  dryRun?: boolean;
};

function ensureDir(p: string) {
  const dir = dirname(p);
  if (!existsSync(dir)) mkdirSync(dir, {recursive: true});
}

function shouldWrite(
  header: string,
  path: string,
  policy: "generated-only" | "force"
) {
  if (!existsSync(path)) return true;
  if (policy === "force") return true;
  const content = readFileSync(path, "utf8");
  return content.trimStart().startsWith(header);
}

function targetPathsFor(
  componentPath: string,
  cfg: ReturnType<typeof loadConfig>
) {
  const ext = extname(componentPath);
  const base = basename(componentPath, ext);
  const dir = dirname(componentPath);
  const rel = relative(process.cwd(), dir);

  const coStories = join(dir, `${base}.stories.tsx`);
  const coUnit = join(dir, `__tests__/${base}.test.tsx`);

  const st =
    cfg.targets.storybook.mode === "co-locate"
      ? coStories
      : join(cfg.targets.storybook.folder, rel, `${base}.stories.tsx`);

  const ut =
    cfg.targets.unit.mode === "co-locate"
      ? coUnit
      : join(cfg.targets.unit.folder, rel, "__tests__", `${base}.test.tsx`);

  const it = join(cfg.targets.integration.folder, rel, `${base}.int.test.tsx`);
  return {st, ut, it};
}

async function callLLM(
  cfg: ReturnType<typeof loadConfig>,
  componentPath: string,
  source: string
) {
  const sys = SYSTEM_PROMPT.replace("{{FILE_HEADER}}", cfg.fileHeader);
  const usr = userPrompt(componentPath, source, "UI");
  if (cfg.llm.provider === "anthropic") {
    const {chatAnthropic} = await import("./providers/antrophic.js");
    const text = await chatAnthropic({
      system: sys,
      user: usr,
      model: cfg.llm.model,
      temperature: cfg.llm.temperature ?? 0.2,
    });
    return JSON.parse(text);
  } else {
    const {chatOpenAI} = await import("./providers/openai.js");
    const text = await chatOpenAI({
      system: sys,
      user: usr,
      model: cfg.llm.model,
      baseUrl: cfg.llm.baseUrl,
      temperature: cfg.llm.temperature ?? 0.2,
    });
    return JSON.parse(text);
  }
}

export async function run(args: RunArgs) {
  const cfg = loadConfig();
  const mode = args.mode.startsWith("pr:")
    ? "pr"
    : ["full", "changed"].includes(args.mode)
    ? args.mode
    : "changed";
  const prNum = mode === "pr" ? Number(args.mode.split(":")[1]) : undefined;
  const dry = !!args.dryRun || process.env.AI_GEN_DRY_RUN === "1";

  const owner = args.owner || process.env.DEFAULT_GH_OWNER || "";
  const repo = args.repo || process.env.DEFAULT_GH_REPO || "";
  if (!owner || !repo)
    console.warn(
      "Tip: pass --owner/--repo or set DEFAULT_GH_OWNER/DEFAULT_GH_REPO"
    );

  const targets = await resolveTargets({
    mode: mode as any,
    filesCsv: args.files,
    owner,
    repo,
    pr: prNum,
    baseBranch: args.base || cfg.branchBase,
    include: cfg.paths.components,
    exclude: cfg.paths.exclude,
  });
  if (!targets.length) {
    console.log("No target files.");
    return;
  }

  if (dry) {
    const plan: Array<{
      component: string;
      storybook?: string;
      unit?: string;
      integration?: string;
      note?: string;
    }> = [];
    for (const f of targets) {
      if (!f.endsWith(".tsx") && !f.endsWith(".ts")) continue;
      if (
        f.endsWith(".stories.tsx") ||
        f.endsWith(".test.tsx") ||
        f.endsWith(".spec.tsx")
      )
        continue;
      const {st, ut, it} = targetPathsFor(f, cfg);
      plan.push({
        component: f,
        storybook: cfg.features.storybook ? st : undefined,
        unit: cfg.features.unit ? ut : undefined,
        integration: cfg.features.integration ? it : undefined,
      });
    }
    console.log("=== AI-GEN DRY-RUN PLAN ===");
    console.table(plan);
    console.log("\nNothing was generated. Use --dry-run off to execute.");
    return;
  }

  const branchName = `${cfg.branchPrefix}${Date.now()}`;
  await createBranch(cfg.branchBase, branchName);

  for (const f of targets) {
    if (!f.endsWith(".tsx") && !f.endsWith(".ts")) continue;
    if (
      f.endsWith(".stories.tsx") ||
      f.endsWith(".test.tsx") ||
      f.endsWith(".spec.tsx")
    )
      continue;

    const src = readFileSync(f, "utf8");
    const out = await callLLM(cfg, f, src);

    const {st, ut, it} = targetPathsFor(f, cfg);
    if (cfg.features.storybook && out.storybook) {
      if (shouldWrite(cfg.fileHeader, st, cfg.overwritePolicy)) {
        ensureDir(st);
        writeFileSync(st, out.storybook, "utf8");
        console.log("Wrote", st);
      }
    }
    if (cfg.features.unit && out.unit) {
      if (shouldWrite(cfg.fileHeader, ut, cfg.overwritePolicy)) {
        ensureDir(ut);
        writeFileSync(ut, out.unit, "utf8");
        console.log("Wrote", ut);
      }
    }
    if (cfg.features.integration && out.integration) {
      if (shouldWrite(cfg.fileHeader, it, cfg.overwritePolicy)) {
        ensureDir(it);
        writeFileSync(it, out.integration, "utf8");
        console.log("Wrote", it);
      }
    }
  }

  await commitAll("chore(ai): generate stories & tests");
  await pushBranch(branchName);

  const title = `${cfg.prPrefix}Generate stories & tests`;
  const body = `Mode: ${args.mode}\nFiles: ${targets.length}\n`;
  const reviewers = args.reviewer ? [args.reviewer] : cfg.reviewers || [];
  const pr = await createPullRequest(
    owner,
    repo,
    branchName,
    cfg.branchBase,
    title,
    body,
    reviewers
  );
  console.log("PR created:", pr.html_url);
}
