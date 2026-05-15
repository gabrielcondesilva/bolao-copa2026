"use client";

import { useEffect, useState } from "react";

const KICKOFF = new Date("2026-06-11T19:00:00Z"); // 16:00 BRT

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    function compute() {
      const diff = KICKOFF.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      setTimeLeft({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    }

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) return null;

  const units = [
    { value: timeLeft.days, label: "dias" },
    { value: timeLeft.hours, label: "horas" },
    { value: timeLeft.minutes, label: "min" },
    { value: timeLeft.seconds, label: "seg" },
  ];

  return (
    <div className="flex items-end gap-3 sm:gap-6">
      {units.map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="font-mono text-4xl sm:text-5xl font-bold text-foreground tabular-nums">
            {pad(value)}
          </span>
          <span className="text-xs text-muted mt-1">{label}</span>
        </div>
      ))}
    </div>
  );
}
