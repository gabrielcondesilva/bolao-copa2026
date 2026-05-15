"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type LeaderboardEntry = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  total_points: number;
  position_yesterday: number | null;
};

// Subscribes to profiles.total_points changes. Re-sorts in the client so
// the leaderboard order updates instantly without a page reload.
// NOTE: we intentionally DO NOT read `email` from the Realtime payload.
export function useRealtimeScores(initial: LeaderboardEntry[]): LeaderboardEntry[] {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initial);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("leaderboard-scores")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const { id, name, avatar_url, total_points, position_yesterday } =
            payload.new as LeaderboardEntry;

          setEntries((prev) =>
            prev
              .map((e) =>
                e.id === id
                  ? { id, name, avatar_url, total_points, position_yesterday }
                  : e
              )
              .sort((a, b) => b.total_points - a.total_points)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return entries;
}
