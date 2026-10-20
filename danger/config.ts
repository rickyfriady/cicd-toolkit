import * as fs from "node:fs";
import * as path from "node:path";

export interface DangerConfig {
  ticketPattern: string;
  minDescriptionLength: number;
  maxChangedLines: number;
  maxChangedFiles: number;
  enforcePackageVersion: boolean;
  coverageThreshold: number;
  blockConsole: boolean;
  blockInlineStyles: boolean;
  protectedBranches: string[];
}

export const DEFAULT_CONFIG: DangerConfig = {
  ticketPattern: "^\\[[A-Za-z0-9_-]+\\]|^(\\w+(\\([\\w-]+\\))?:)",
  minDescriptionLength: 50,
  maxChangedLines: 400,
  maxChangedFiles: 50,
  enforcePackageVersion: false,
  coverageThreshold: 80,
  blockConsole: true,
  blockInlineStyles: true,
  protectedBranches: ["main", "master", "staging", "development"],
};

export function loadConfig(): DangerConfig {
  const configPath = path.join(process.cwd(), ".dangerrc.json");
  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}
