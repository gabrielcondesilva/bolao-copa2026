type Phase = {
  label: string;
  status: string;
  close_at: string | null;
};

export default function PhaseStatusBanner({ phase }: { phase: Phase | undefined }) {
  if (!phase) return null;

  if (phase.status === "open") {
    const closesBRT = phase.close_at
      ? new Date(phase.close_at).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    return (
      <div className="flex items-center gap-2 rounded-xl bg-success/10 border border-success/20 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse shrink-0" />
        <p className="text-sm text-success">
          <span className="font-semibold">Palpites abertos</span>
          {closesBRT && (
            <span className="font-normal text-success/80"> — fecha em {closesBRT}</span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3">
      <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
      <p className="text-sm text-accent/90">
        <span className="font-semibold">Palpites encerrados</span>
        <span className="font-normal"> — esta fase não aceita mais alterações</span>
      </p>
    </div>
  );
}
