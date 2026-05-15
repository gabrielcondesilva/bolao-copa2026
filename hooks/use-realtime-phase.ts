"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PhaseEntry = {
  id: string;
  phase_key: string;
  label: string;
  status: string;
  close_at: string | null;
  order_index: number;
};

// Subscribes to phase_schedule UPDATE events and keeps local state in sync.
// Use this hook wherever you need live phase-open/closed awareness.
export function useRealtimePhase(initial: PhaseEntry[]): PhaseEntry[] {
  const [phases, setPhases] = useState<PhaseEntry[]>(initial);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("phase-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "phase_schedule" },
        (payload) => {
          const updated = payload.new as PhaseEntry;
          setPhases((prev) =>
            prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return phases;
}
