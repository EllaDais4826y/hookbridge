import {
  configureThrottle,
  resetThrottle,
  acquire,
  release,
  activeCount,
  queuedCount,
  getThrottleOptions,
} from "./requestThrottle";

beforeEach(() => {
  resetThrottle();
});

describe("configureThrottle", () => {
  it("updates options", () => {
    configureThrottle({ maxConcurrent: 3, maxQueueSize: 5 });
    const opts = getThrottleOptions();
    expect(opts.maxConcurrent).toBe(3);
    expect(opts.maxQueueSize).toBe(5);
  });

  it("uses defaults for unspecified fields", () => {
    configureThrottle({ maxConcurrent: 2 });
    expect(getThrottleOptions().maxQueueSize).toBe(100);
  });
});

describe("acquire / release", () => {
  it("resolves immediately when slots are available", async () => {
    configureThrottle({ maxConcurrent: 2, maxQueueSize: 10 });
    await expect(acquire()).resolves.toBeUndefined();
    expect(activeCount()).toBe(1);
  });

  it("queues requests when at max concurrent", async () => {
    configureThrottle({ maxConcurrent: 1, maxQueueSize: 5 });
    await acquire();
    expect(activeCount()).toBe(1);

    let resolved = false;
    const pending = acquire().then(() => {
      resolved = true;
    });

    expect(queuedCount()).toBe(1);
    expect(resolved).toBe(false);

    release();
    await pending;
    expect(resolved).toBe(true);
    expect(queuedCount()).toBe(0);
  });

  it("rejects when queue is full", async () => {
    configureThrottle({ maxConcurrent: 1, maxQueueSize: 1 });
    await acquire();
    acquire(); // fills queue
    await expect(acquire()).rejects.toThrow("Throttle queue full");
  });

  it("decrements active count on release with empty queue", async () => {
    configureThrottle({ maxConcurrent: 2, maxQueueSize: 5 });
    await acquire();
    expect(activeCount()).toBe(1);
    release();
    expect(activeCount()).toBe(0);
  });

  it("does not go below zero on excess releases", () => {
    release();
    expect(activeCount()).toBe(0);
  });
});

describe("resetThrottle", () => {
  it("clears active and queue counts", async () => {
    configureThrottle({ maxConcurrent: 1, maxQueueSize: 5 });
    await acquire();
    acquire();
    resetThrottle();
    expect(activeCount()).toBe(0);
    expect(queuedCount()).toBe(0);
  });
});
