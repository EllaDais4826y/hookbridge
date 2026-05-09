import {
  configureTimeout,
  getTimeoutOptions,
  resetTimeoutOptions,
  createTimeoutSignal,
  fetchWithTimeout,
} from "./webhookTimeout";

beforeEach(() => {
  resetTimeoutOptions();
});

describe("getTimeoutOptions", () => {
  it("returns defaults", () => {
    const opts = getTimeoutOptions();
    expect(opts.timeoutMs).toBe(5000);
    expect(opts.abortOnTimeout).toBe(true);
  });
});

describe("configureTimeout", () => {
  it("updates timeoutMs", () => {
    configureTimeout({ timeoutMs: 2000 });
    expect(getTimeoutOptions().timeoutMs).toBe(2000);
  });

  it("updates abortOnTimeout", () => {
    configureTimeout({ abortOnTimeout: false });
    expect(getTimeoutOptions().abortOnTimeout).toBe(false);
  });

  it("merges partial options", () => {
    configureTimeout({ timeoutMs: 1000 });
    configureTimeout({ abortOnTimeout: false });
    const opts = getTimeoutOptions();
    expect(opts.timeoutMs).toBe(1000);
    expect(opts.abortOnTimeout).toBe(false);
  });
});

describe("resetTimeoutOptions", () => {
  it("restores defaults after change", () => {
    configureTimeout({ timeoutMs: 100 });
    resetTimeoutOptions();
    expect(getTimeoutOptions().timeoutMs).toBe(5000);
  });
});

describe("createTimeoutSignal", () => {
  it("returns an AbortSignal that is not yet aborted", () => {
    const { signal, timeoutId } = createTimeoutSignal();
    expect(signal.aborted).toBe(false);
    clearTimeout(timeoutId);
  });

  it("aborts after the configured timeout", async () => {
    configureTimeout({ timeoutMs: 30, abortOnTimeout: true });
    const { signal, timeoutId } = createTimeoutSignal();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(signal.aborted).toBe(true);
    clearTimeout(timeoutId);
  });
});

describe("fetchWithTimeout", () => {
  it("throws a timeout error when the request takes too long", async () => {
    configureTimeout({ timeoutMs: 20, abortOnTimeout: true });

    // Simulate a slow server by never resolving
    const originalFetch = global.fetch;
    global.fetch = (_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        const sig = init?.signal as AbortSignal | undefined;
        if (sig) {
          sig.addEventListener("abort", () =>
            reject(Object.assign(new Error("AbortError"), { name: "AbortError" }))
          );
        }
      }) as Promise<Response>;

    await expect(fetchWithTimeout("http://example.com")).rejects.toThrow(
      /timed out after 20ms/
    );

    global.fetch = originalFetch;
  });
});
