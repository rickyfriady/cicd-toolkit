import { describe, it, expect } from "vitest";
import { DEFAULT_CONFIG, loadConfig } from "../../danger/config";

describe("Danger Config Module", () => {
  it("should provide solid enterprise default configurations", () => {
    expect(DEFAULT_CONFIG).toBeDefined();
    expect(DEFAULT_CONFIG.coverageThreshold).toBe(80);
    expect(DEFAULT_CONFIG.minDescriptionLength).toBe(50);
    expect(DEFAULT_CONFIG.maxChangedLines).toBe(400);
    expect(DEFAULT_CONFIG.maxAssetSizeKB).toBe(350);
    expect(DEFAULT_CONFIG.enforceSecretScanning).toBe(true);
    expect(DEFAULT_CONFIG.enforceLicenseCompliance).toBe(true);
  });

  it("should load configuration gracefully without throwing", () => {
    const config = loadConfig();
    expect(config).toBeDefined();
    expect(typeof config.ticketPattern).toBe("string");
    expect(config.coverageThreshold).toBeGreaterThanOrEqual(80);
  });
});
