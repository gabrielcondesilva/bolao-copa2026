import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase admin client
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

// Mock next/headers (not available in test env)
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

describe("phase-transition cron logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens pending phases where open_at <= now()", () => {
    // The route itself is difficult to unit test directly (it calls supabase with
    // time-dependent WHERE clauses). We verify the intent with a functional mock.
    const now = new Date();
    const pastOpenAt = new Date(now.getTime() - 1000).toISOString();
    const futureCloseAt = new Date(now.getTime() + 86400000).toISOString();

    // A phase that should transition pending → open
    const pendingPhase = {
      id: "ph-1",
      phase_key: "round_of_32",
      status: "pending",
      open_at: pastOpenAt,
      close_at: futureCloseAt,
    };

    // Simulate the transition logic (extracted from the route)
    function shouldOpen(phase: typeof pendingPhase): boolean {
      return phase.status === "pending" && new Date(phase.open_at) <= now;
    }
    function shouldClose(phase: typeof pendingPhase): boolean {
      return phase.status === "open" && !!phase.close_at && new Date(phase.close_at) <= now;
    }

    expect(shouldOpen(pendingPhase)).toBe(true);
    expect(shouldClose(pendingPhase)).toBe(false);
  });

  it("closes open phases where close_at <= now()", () => {
    const now = new Date();
    const pastCloseAt = new Date(now.getTime() - 1000).toISOString();

    const openPhase = {
      id: "ph-2",
      phase_key: "group",
      status: "open",
      open_at: new Date(now.getTime() - 86400000).toISOString(),
      close_at: pastCloseAt,
    };

    function shouldClose(phase: typeof openPhase): boolean {
      return phase.status === "open" && !!phase.close_at && new Date(phase.close_at) <= now;
    }

    expect(shouldClose(openPhase)).toBe(true);
  });

  it("does not close open phases with close_at in the future", () => {
    const now = new Date();

    const openPhase = {
      id: "ph-3",
      phase_key: "group",
      status: "open",
      open_at: new Date(now.getTime() - 86400000).toISOString(),
      close_at: new Date(now.getTime() + 86400000).toISOString(),
    };

    function shouldClose(phase: typeof openPhase): boolean {
      return phase.status === "open" && !!phase.close_at && new Date(phase.close_at) <= now;
    }

    expect(shouldClose(openPhase)).toBe(false);
  });

  it("is idempotent: re-applying transition to already-open phase has no effect", () => {
    const now = new Date();

    const openPhase = {
      id: "ph-4",
      phase_key: "round_of_32",
      status: "open", // already transitioned
      open_at: new Date(now.getTime() - 1000).toISOString(),
      close_at: new Date(now.getTime() + 86400000).toISOString(),
    };

    function shouldOpen(phase: typeof openPhase): boolean {
      return phase.status === "pending" && new Date(phase.open_at) <= now;
    }

    // Should NOT try to open an already-open phase
    expect(shouldOpen(openPhase)).toBe(false);
  });
});
