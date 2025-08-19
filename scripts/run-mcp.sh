#!/usr/bin/env bash
set -euo pipefail

# Vyžadované: GITHUB_PERSONAL_ACCESS_TOKEN v env
: "${GITHUB_PERSONAL_ACCESS_TOKEN:?Set GITHUB_PERSONAL_ACCESS_TOKEN in env}"

# Minimal toolsety potrebné pre náš use-case:
# - repos: čítanie/zápis vetiev/súborov
# - pull_requests: tvorba/úprava PR
# - actions: workflow_dispatch, listing runs
TOOLSETS="repos,pull_requests,actions,context"

docker run -it --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN \
  -e GITHUB_TOOLSETS="$TOOLSETS" \
  ghcr.io/github/github-mcp-server
