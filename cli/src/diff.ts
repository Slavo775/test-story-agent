import {Minimatch} from "minimatch";
import simpleGit from "simple-git";

export async function resolveTargets({
  mode,
  filesCsv,
  owner,
  repo,
  pr,
  baseBranch,
  include,
  exclude,
}: {
  mode: "changed" | "full" | "pr";
  filesCsv: string;
  owner: string;
  repo: string;
  pr?: number;
  baseBranch: string;
  include: string[];
  exclude: string[];
}) {
  if (filesCsv) {
    return filesCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (mode === "pr" && pr) {
    // fallback: CLI použije GitHub API priamo (MCP vie tiež, ale CLI nech je samostatné)
    const {getPrChangedFiles} = await import("./github.js");
    return await getPrChangedFiles(owner, repo, pr);
  }
  if (mode === "full") {
    const git = simpleGit();
    const list = (await git.raw(["ls-files"])).split("\n").filter(Boolean);
    return match(list, include, exclude);
  }
  // changed: diff voči baseBranch
  const git = simpleGit();
  const diff = (await git.diff(["--name-only", `origin/${baseBranch}...HEAD`]))
    .split("\n")
    .filter(Boolean);
  return match(diff, include, exclude);
}

function match(files: string[], include: string[], exclude: string[]) {
  const inc = include.map((p) => new Minimatch(p));
  const exc = exclude.map((p) => new Minimatch(p));
  return files.filter(
    (f) => inc.some((m) => m.match(f)) && !exc.some((m) => m.match(f))
  );
}
