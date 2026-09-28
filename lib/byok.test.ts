import { describe, expect, it, vi } from "vitest";
import {
  normalizeByokEndpoint,
  runByokAgent,
  validateAgentInput,
} from "./byok";

const SECRET_KEY = "sk-test-SUPER-SECRET-KEY-1234567890";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function completion(text: string): Response {
  return jsonResponse({ choices: [{ message: { content: text } }] });
}

const request = {
  providerEndpoint: "https://api.example.com/v1/chat/completions",
  model: "some/model",
  questionText: "Will it rain tomorrow?",
  apiKey: SECRET_KEY,
};

describe("normalizeByokEndpoint", () => {
  it("accepts an https URL", () => {
    expect(normalizeByokEndpoint("https://api.example.com/v1/chat")).toBe(
      "https://api.example.com/v1/chat",
    );
  });

  it("rejects http and non-URLs", () => {
    expect(normalizeByokEndpoint("http://api.example.com")).toBeNull();
    expect(normalizeByokEndpoint("not a url")).toBeNull();
    expect(normalizeByokEndpoint("")).toBeNull();
  });
});

describe("validateAgentInput", () => {
  it("accepts a complete agent", () => {
    const result = validateAgentInput({
      name: "My agent",
      model: "openai/gpt-x",
      providerEndpoint: "https://api.example.com/v1/chat",
      promptHash: "a".repeat(64),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("My agent");
      expect(result.value.promptHash).toBe("a".repeat(64));
    }
  });

  it("rejects a missing or empty name", () => {
    expect(validateAgentInput({ name: "  ", model: "m", providerEndpoint: "https://a.com" })).toMatchObject({ ok: false });
  });

  it("rejects a missing model", () => {
    expect(validateAgentInput({ name: "a", model: "", providerEndpoint: "https://a.com" })).toMatchObject({ ok: false });
  });

  it("rejects a non-https provider endpoint", () => {
    expect(validateAgentInput({ name: "a", model: "m", providerEndpoint: "http://a.com" })).toMatchObject({ ok: false });
  });

  it("rejects a malformed prompt hash", () => {
    expect(
      validateAgentInput({
        name: "a",
        model: "m",
        providerEndpoint: "https://a.com",
        promptHash: "zzz",
      }),
    ).toMatchObject({ ok: false });
  });

  it("treats an absent prompt hash as null", () => {
    const result = validateAgentInput({
      name: "a",
      model: "m",
      providerEndpoint: "https://a.com",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.promptHash).toBeNull();
    }
  });
});

describe("runByokAgent", () => {
  it("returns the parsed forecast on success", async () => {
    const fetchMock = vi.fn(async () =>
      completion(JSON.stringify({ p: 0.42, why: "because" })),
    );
    const result = await runByokAgent({ fetch: fetchMock }, request);
    expect(result).toMatchObject({ ok: true, forecast: { p: 0.42 } });
  });

  it("sends the key as a bearer header exactly once", async () => {
    const fetchMock = vi.fn(async () => completion('{"p":0.5,"why":"x"}'));
    await runByokAgent({ fetch: fetchMock }, request);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(request.providerEndpoint);
    expect((init.headers as Record<string, string>).authorization).toBe(
      `Bearer ${SECRET_KEY}`,
    );
  });

  it("never leaks the key into a success outcome", async () => {
    const fetchMock = vi.fn(async () =>
      completion(JSON.stringify({ p: 0.3, why: "fine" })),
    );
    const result = await runByokAgent({ fetch: fetchMock }, request);
    expect(JSON.stringify(result)).not.toContain(SECRET_KEY);
  });

  it("never leaks the key into an unavailable outcome", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("network down");
    });
    const result = await runByokAgent({ fetch: fetchMock }, request);
    expect(result).toMatchObject({ ok: false, kind: "unavailable" });
    expect(JSON.stringify(result)).not.toContain(SECRET_KEY);
  });

  it("never leaks the key into a non-ok status outcome", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: "nope" }, 500));
    const result = await runByokAgent({ fetch: fetchMock }, request);
    expect(result).toMatchObject({ ok: false, kind: "unavailable", status: 500 });
    expect(JSON.stringify(result)).not.toContain(SECRET_KEY);
  });

  it("never leaks the key into an unparseable outcome", async () => {
    const fetchMock = vi.fn(async () => completion("I cannot answer this."));
    const result = await runByokAgent({ fetch: fetchMock }, request);
    expect(result).toMatchObject({ ok: false, kind: "unparseable" });
    expect(JSON.stringify(result)).not.toContain(SECRET_KEY);
  });

  it("reports an unparseable answer rather than a fallback", async () => {
    const fetchMock = vi.fn(async () => completion("no json here"));
    const result = await runByokAgent({ fetch: fetchMock }, request);
    expect(result).toMatchObject({ ok: false, kind: "unparseable", reason: "no_json" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a non-https endpoint before calling the network", async () => {
    const fetchMock = vi.fn();
    const result = await runByokAgent(
      { fetch: fetchMock },
      { ...request, providerEndpoint: "http://api.example.com" },
    );
    expect(result).toMatchObject({ ok: false, kind: "unavailable" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats a missing content field as unparseable", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ choices: [] }));
    const result = await runByokAgent({ fetch: fetchMock }, request);
    expect(result).toMatchObject({ ok: false, kind: "unparseable", reason: "no_content" });
  });
});
