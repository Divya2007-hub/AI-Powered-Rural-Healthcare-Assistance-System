import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, readError } from "./client.js";
import { setToken } from "./token.js";

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("adds the bearer token and parses JSON", async () => {
    setToken("session-token");
    fetch.mockResolvedValue(jsonResponse({ ok: true }));

    const result = await apiFetch("/triage/symptoms");

    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/triage/symptoms"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer session-token",
        }),
      }),
    );
  });

  it("returns null for 204 responses", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error("no body");
      },
    });

    await expect(apiFetch("/auth/logout", { method: "POST" })).resolves.toBeNull();
  });

  it("throws the server detail for failed requests", async () => {
    fetch.mockResolvedValue(
      jsonResponse({ detail: "Invalid credentials" }, 401),
    );

    await expect(apiFetch("/auth/login")).rejects.toThrow("Invalid credentials");
  });

  it("joins validation errors from FastAPI", async () => {
    fetch.mockResolvedValue(
      jsonResponse(
        { detail: [{ msg: "Field required" }, { msg: "Too short" }] },
        422,
      ),
    );

    await expect(apiFetch("/triage/symptoms")).rejects.toThrow(
      "Field required; Too short",
    );
  });
});

describe("readError", () => {
  it("falls back to a generic message for non-JSON bodies", async () => {
    const response = {
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    };

    await expect(readError(response)).resolves.toBe(
      "The server could not process the request (500).",
    );
  });
});
