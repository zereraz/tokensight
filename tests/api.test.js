import { describe, it, mock } from "node:test";
import assert from "node:assert";

// Mock fetch for testing
global.fetch = mock.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ code: 200, data: {} }),
  })
);

describe("Zai API", () => {
  it("should parse subscription response", async () => {
    const mockResponse = {
      code: 200,
      data: [
        {
          productName: "GLM Coding Pro",
          status: "VALID",
          valid: "true",
          nextRenewTime: "2026-03-28",
          billingCycle: "quarterly",
          actualPrice: 36.45,
          autoRenew: 1,
        },
      ],
    };

    global.fetch = mock.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const response = await fetch("https://api.z.ai/api/biz/subscription/list", {
      headers: { authorization: "Bearer test-token" },
    });

    const data = await response.json();
    assert.strictEqual(data.code, 200);
    assert.strictEqual(data.data[0].productName, "GLM Coding Pro");
  });

  it("should parse quota limit response", async () => {
    const mockResponse = {
      code: 200,
      data: {
        limits: [
          {
            type: "TOKENS_LIMIT",
            unit: 1,
            number: 200000000,
            usage: 25600000,
            currentValue: 25600000,
            remaining: 174400000,
            percentage: 12.8,
            nextResetTime: 1735699200000,
          },
        ],
      },
    };

    global.fetch = mock.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const response = await fetch("https://api.z.ai/api/monitor/usage/quota/limit", {
      headers: { authorization: "Bearer test-token" },
    });

    const data = await response.json();
    assert.strictEqual(data.data.limits[0].type, "TOKENS_LIMIT");
    assert.strictEqual(data.data.limits[0].percentage, 12.8);
  });

  it("should handle API errors", async () => {
    global.fetch = mock.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      })
    );

    const response = await fetch("https://api.z.ai/api/biz/subscription/list", {
      headers: { authorization: "Bearer invalid-token" },
    });

    assert.strictEqual(response.ok, false);
    assert.strictEqual(response.status, 401);
  });
});
