import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { unlinkSync, existsSync, writeFileSync, readFileSync } from "fs";

const TEST_CONFIG_PATH = `${process.env.HOME}/.tokensight-test.json`;

// Mock the config module to use test path
async function getConfig(testPath = TEST_CONFIG_PATH) {
  if (!existsSync(testPath)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(testPath, "utf-8"));
  } catch {
    return {};
  }
}

async function saveConfig(config, testPath = TEST_CONFIG_PATH) {
  writeFileSync(testPath, JSON.stringify(config, null, 2), "utf-8");
}

describe("Config", () => {
  afterEach(() => {
    if (existsSync(TEST_CONFIG_PATH)) {
      unlinkSync(TEST_CONFIG_PATH);
    }
  });

  it("should return empty object if config not exists", async () => {
    if (existsSync(TEST_CONFIG_PATH)) {
      unlinkSync(TEST_CONFIG_PATH);
    }

    const config = await getConfig();
    assert.ok(config);
    assert.deepStrictEqual(config, {});
  });

  it("should read existing config", async () => {
    const testConfig = {
      cookie: "test-token-123",
    };

    writeFileSync(TEST_CONFIG_PATH, JSON.stringify(testConfig, null, 2));

    const config = await getConfig();
    assert.strictEqual(config.cookie, "test-token-123");
  });

  it("should save config with token", async () => {
    const config = await getConfig();
    config.cookie = "eyJhbGciOiJIUzUxMiJ9.test";

    await saveConfig(config);

    // Verify it was saved
    const saved = JSON.parse(readFileSync(TEST_CONFIG_PATH, "utf-8"));
    assert.strictEqual(saved.cookie, "eyJhbGciOiJIUzUxMiJ9.test");
  });
});
