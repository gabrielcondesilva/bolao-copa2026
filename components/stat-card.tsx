export type StatRow = {
  rank: number;
  player: { id: string; name: string; photo_url: string | null };
  team: { name: string; code: string; flag_url: string | null } | null;
  value: number;
};

type Props = {
  title: string;
  unit: string;
  rows: StatRow[];
};

export default function StatCard({ title, unit, rows }: Props) {
  return (
    <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div>
        {rows.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted">Sem dados disponíveis.</p>
        ) : (
          rows.map((row) => (
            <div
              key={row.player.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0"
            >
              <span className="w-5 shrink-0 text-center text-sm text-muted tabular-nums">
                {row.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{row.player.name}</p>
                {row.team && (
                  <p className="text-xs text-muted">{row.team.name}</p>
                )}
              </div>
              <span className="shrink-0 font-mono font-bold text-foreground tabular-nums">
                {row.value}{" "}
                <span className="text-xs font-normal text-muted">{unit}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
