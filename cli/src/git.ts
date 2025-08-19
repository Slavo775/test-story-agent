import simpleGit from "simple-git";

export async function currentSha(cwd = process.cwd()) {
  const git = simpleGit(cwd);
  return (await git.revparse(["HEAD"])).trim();
}

export async function createBranch(
  from: string,
  name: string,
  cwd = process.cwd()
) {
  const git = simpleGit(cwd);
  await git.fetch();
  await git.checkout(from);
  await git.pull("origin", from);
  await git.checkoutLocalBranch(name);
}

export async function commitAll(message: string, cwd = process.cwd()) {
  const git = simpleGit(cwd);
  await git.add(["-A"]);
  const s = await git.status();
  if (s.staged.length) await git.commit(message);
}

export async function pushBranch(name: string, cwd = process.cwd()) {
  const git = simpleGit(cwd);
  await git.push(["-u", "origin", name]);
}
