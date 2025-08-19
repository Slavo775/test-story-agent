import {readFileSync, existsSync} from "node:fs";

export type Config = {
  branchBase: string;
  branchPrefix: string;
  prPrefix: string;
  reviewers: string[];
  features: {storybook: boolean; unit: boolean; integration: boolean};
  paths: {components: string[]; exclude: string[]};
  targets: {
    storybook: {mode: "co-locate" | "folder"; folder: string};
    unit: {mode: "co-locate" | "folder"; folder: string};
    integration: {folder: string};
  };
  overwritePolicy: "generated-only" | "force";
  fileHeader: string;
  llm: {
    provider: "anthropic" | "openai";
    model: string;
    baseUrl?: string;
    temperature?: number;
  };
};

export function loadConfig(cwd = process.cwd()): Config {
  const path = `${cwd}/ai-gen.config.json`;
  if (!existsSync(path))
    throw new Error(`Missing ai-gen.config.json in ${cwd}`);
  return JSON.parse(readFileSync(path, "utf8")) as Config;
}
