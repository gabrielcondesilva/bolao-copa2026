const STAGE_LABEL: Record<string, string> = {
  group: "Grupos",
  round_of_32: "Oitavas",
  round_of_16: "Dezesseis avos",
  quarter: "Quartas",
  semi: "Semifinal",
  third_place: "3º Lugar",
  final: "Final",
};

export type MatchCardData = {
  id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  scheduled_at: string;
  stage: string;
  home_team: { name: string; code: string; flag_url: string | null } | null;
  away_team: { name: string; code: string; flag_url: string | null } | null;
};

export default function MatchCard({ match }: { match: MatchCardData }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const hasScore = isLive || isFinished;

  const scheduledBRT = new Date(match.scheduled_at).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-surface rounded-xl border border-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted">{STAGE_LABEL[match.stage] ?? match.stage}</span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            AO VIVO
          </span>
        ) : isFinished ? (
          <span className="text-xs text-muted">Encerrado</span>
        ) : (
          <span className="text-xs text-muted">{scheduledBRT}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          <span className="truncate text-sm font-semibold text-foreground">
            {match.home_team?.name ?? "TBD"}
          </span>
          {match.home_team?.flag_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={match.home_team.flag_url}
              alt={match.home_team.code}
              className="h-5 w-7 object-cover rounded-sm shrink-0"
            />
          )}
        </div>

        {/* Score / vs */}
        <div className="shrink-0 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
          {hasScore ? (
            <>
              <span className="w-5 text-center font-mono text-lg font-bold tabular-nums text-foreground">
                {match.home_score ?? "–"}
              </span>
              <span className="text-muted text-sm">–</span>
              <span className="w-5 text-center font-mono text-lg font-bold tabular-nums text-foreground">
                {match.away_score ?? "–"}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted px-1">vs</span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          {match.away_team?.flag_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={match.away_team.flag_url}
              alt={match.away_team.code}
              className="h-5 w-7 object-cover rounded-sm shrink-0"
            />
          )}
          <span className="truncate text-sm font-semibold text-foreground">
            {match.away_team?.name ?? "TBD"}
          </span>
        </div>
      </div>
    </div>
  );
}
