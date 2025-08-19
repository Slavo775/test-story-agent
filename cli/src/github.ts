const GH = "https://api.github.com";

async function gh(path: string, init: RequestInit = {}) {
  const token =
    process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token)
    throw new Error("Missing GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN");
  const res = await fetch(`${GH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok)
    throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
}

export async function getPrChangedFiles(
  owner: string,
  repo: string,
  pr: number
) {
  const files: string[] = [];
  let page = 1;
  while (true) {
    const data = await gh(
      `/repos/${owner}/${repo}/pulls/${pr}/files?per_page=100&page=${page}`
    );
    if (!data.length) break;
    files.push(...data.map((f: any) => f.filename));
    page++;
  }
  return files;
}

export async function createPullRequest(
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body: string,
  reviewers: string[]
) {
  const pr = await gh(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({title, head, base, body}),
  });
  if (reviewers && reviewers.length) {
    await gh(`/repos/${owner}/${repo}/pulls/${pr.number}/requested_reviewers`, {
      method: "POST",
      body: JSON.stringify({reviewers}),
    });
  }
  return pr;
}
