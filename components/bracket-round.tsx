import BracketMatch, { type BracketMatchData } from "./bracket-match";

type Prediction = { match_id: string; home_score: number; away_score: number };

type Props = {
  label: string;
  phaseKey: string;
  phaseOpen: boolean;
  matches: BracketMatchData[];
  predictions: Prediction[];
};

export default function BracketRound({ label, phaseKey, phaseOpen, matches, predictions }: Props) {
  const predMap = new Map(predictions.map((p) => [p.match_id, p]));

  return (
    <div className="min-w-[240px] flex-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 text-center">
        {label}
      </h3>
      <div className="space-y-3">
        {matches.map((m) => (
          <BracketMatch
            key={m.id}
            match={m}
            prediction={predMap.get(m.id) ?? null}
            phaseKey={phaseKey}
            phaseOpen={phaseOpen}
          />
        ))}
      </div>
    </div>
  );
}
