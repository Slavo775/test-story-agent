# AI Gen Starter (MCP + GitHub)

## Požiadavky

- Docker (na MCP server)
- Node 20+
- PAT: `repo`, `pull_request`, `workflow`

## Spustenie MCP servera (lokálne)

```bash
cp .env.sample .env
export $(grep -v '^#' .env | xargs)  # načítaj env
./scripts/run-mcp.sh
```
