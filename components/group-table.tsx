import type { StandingRow } from "@/lib/groups/standings";

export default function GroupTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-muted text-xs uppercase tracking-wider">
            <th className="text-left pb-2 pr-3 font-medium w-6">#</th>
            <th className="text-left pb-2 font-medium">Seleção</th>
            <th className="text-right pb-2 px-2 font-medium">J</th>
            <th className="text-right pb-2 px-2 font-medium">V</th>
            <th className="text-right pb-2 px-2 font-medium">E</th>
            <th className="text-right pb-2 px-2 font-medium">D</th>
            <th className="text-right pb-2 px-2 font-medium">GP</th>
            <th className="text-right pb-2 px-2 font-medium">GC</th>
            <th className="text-right pb-2 px-2 font-medium">SG</th>
            <th className="text-right pb-2 pl-2 font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.team.id} className="border-b border-white/5 last:border-0">
              <td className="py-2 pr-3 text-muted tabular-nums">{i + 1}</td>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  {row.team.flag_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.team.flag_url}
                      alt={row.team.code}
                      className="h-4 w-6 object-cover rounded-sm shrink-0"
                    />
                  )}
                  <span className="truncate font-medium text-foreground">{row.team.name}</span>
                  <span className="text-muted text-xs hidden sm:inline">{row.team.code}</span>
                </div>
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-muted">{row.played}</td>
              <td className="py-2 px-2 text-right tabular-nums text-muted">{row.won}</td>
              <td className="py-2 px-2 text-right tabular-nums text-muted">{row.drawn}</td>
              <td className="py-2 px-2 text-right tabular-nums text-muted">{row.lost}</td>
              <td className="py-2 px-2 text-right tabular-nums text-muted">{row.gf}</td>
              <td className="py-2 px-2 text-right tabular-nums text-muted">{row.ga}</td>
              <td className="py-2 px-2 text-right tabular-nums text-muted">
                {row.gd > 0 ? `+${row.gd}` : row.gd}
              </td>
              <td className="py-2 pl-2 text-right tabular-nums font-bold text-foreground">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
