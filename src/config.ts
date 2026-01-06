import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface TokensightConfig {
  cookie?: string;
  starPrompted?: boolean;
}

const CONFIG_PATH = join(homedir(), ".tokensight.json");

export function getConfig(): TokensightConfig {
  if (!existsSync(CONFIG_PATH)) {
    const defaultConfig: TokensightConfig = {};
    writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), "utf-8");
    return defaultConfig;
  }
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

export function saveConfig(config: TokensightConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
