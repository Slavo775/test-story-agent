import { readFileSync, existsSync } from "node:fs";
export function loadConfig(cwd = process.cwd()) {
    const path = `${cwd}/ai-gen.config.json`;
    if (!existsSync(path))
        throw new Error(`Missing ai-gen.config.json in ${cwd}`);
    return JSON.parse(readFileSync(path, "utf8"));
}
