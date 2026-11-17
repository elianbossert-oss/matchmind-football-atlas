import { ChevronLeft, ChevronRight, Pencil, Play, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CRITERIA_INDEX, getNode } from "@/lib/match/criteria";
import {
  PERIODS,
  evaluationFor,
  formatTimecode,
  nodeLabel,
  resultTone,
  scopeOf,
  type CodedAction,
  type StaffConfig,
} from "@/lib/match/logic";

interface Props {
  nodeId: string;
  actions: CodedAction[];
  activeId: string | null;
  config: StaffConfig;
  onPlay: (a: CodedAction) => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (a: CodedAction) => void;
  onDelete: (a: CodedAction) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

function criterionPath(nodeId: string, fromId: string, config: StaffConfig): string {
  const path = CRITERIA_INDEX.get(nodeId)?.path ?? [];
  const start = fromId === "root" ? 0 : path.indexOf(fromId) + 1;
  return path
    .slice(start)
    .map((id) => {
      const n = getNode(id);
      return n ? nodeLabel(n, config) : id;
    })
    .join(" › ");
}

export function ResultsPanel({
  nodeId,
  actions,
  activeId,
  config,
  onPlay,
  onPrev,
  onNext,
  onEdit,
  onDelete,
}: Props) {
  const entry = CRITERIA_INDEX.get(nodeId);
  const node = entry?.node;
  const breadcrumb = (entry?.path ?? []).slice(0, -1).map((id) => {
    const n = getNode(id);
    return n ? nodeLabel(n, config) : id;
  });
  const evaluation = evaluationFor(nodeId, config);
  const activeIndex = actions.findIndex((a) => a.id === activeId);
  const cat = entry?.scope === "collectif" ? "collectif" : (entry?.categoryId ?? "root");

  return (
    <section
      id="resultats"
      data-cat={cat}
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-panel"
    >
      <header className="branch-top space-y-2 border-b p-4">
        {breadcrumb.length > 0 && (
          <p className="truncate text-xs text-muted-foreground">{breadcrumb.join(" › ")}</p>
        )}
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase leading-tight tracking-wide">
            {node ? nodeLabel(node, config) : "—"}
          </h2>
          <div className="shrink-0 text-right">
            <p className="text-branch font-mono text-2xl leading-none">
              {actions.length}
            </p>
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              occurrence{actions.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {evaluation && (evaluation.success || evaluation.fail || evaluation.note) && (
          <dl className="space-y-1 rounded-md bg-muted p-2.5 text-xs">
            {evaluation.success && (
              <div>
                <dt className="inline font-semibold text-success">
                  {nodeId === "tac.ind.placement" ? "Conforme" : "Réussi"} :{" "}
                </dt>
                <dd className="inline text-muted-foreground">{evaluation.success}</dd>
              </div>
            )}
            {evaluation.fail && (
              <div>
                <dt className="inline font-semibold text-destructive">
                  {nodeId === "tac.ind.placement" ? "Non conforme" : "Raté"} :{" "}
                </dt>
                <dd className="inline text-muted-foreground">{evaluation.fail}</dd>
              </div>
            )}
            {evaluation.note && (
              <div>
                <dt className="inline font-semibold">Staff : </dt>
                <dd className="inline text-muted-foreground">{evaluation.note}</dd>
              </div>
            )}
          </dl>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="soft"
            className="flex-1"
            onClick={onPrev}
            disabled={actions.length === 0 || activeIndex === 0}
          >
            <ChevronLeft /> Action précédente
          </Button>
          <Button
            size="sm"
            variant="soft"
            className="flex-1"
            onClick={onNext}
            disabled={actions.length === 0 || activeIndex === actions.length - 1}
          >
            Action suivante <ChevronRight />
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {actions.length === 0 ? (
          <p className="px-2 py-10 text-center text-sm text-muted-foreground">
            Aucune action codée pour ce critère
          </p>
        ) : (
          <ol className="space-y-2">
            {actions.map((a) => {
              const period = PERIODS.find((p) => p.value === a.period);
              const scope = scopeOf(a.nodeId);
              const sub = criterionPath(a.nodeId, nodeId, config);
              return (
                <li key={a.id}>
                  <div
                    className="action-row group flex gap-3 rounded-lg border bg-background/40 p-2 transition-colors hover:border-primary/50"
                    data-active={a.id === activeId}
                  >
                    <button
                      type="button"
                      onClick={() => onPlay(a)}
                      className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-muted sm:w-32"
                      aria-label={`Lire l’action à ${formatTimecode(a.videoTime)}`}
                    >
                      {a.thumbnail ? (
                        <img src={a.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="pitch-canvas absolute inset-0" />
                      )}
                      <span className="absolute inset-0 grid place-items-center bg-background/30 opacity-80 transition-opacity group-hover:opacity-100">
                        <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Play className="size-4 translate-x-px" />
                        </span>
                      </span>
                      <span className="absolute bottom-1 right-1 rounded bg-background/80 px-1 font-mono text-[0.6rem]">
                        {formatTimecode(a.videoTime)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPlay(a)}
                      className="min-w-0 flex-1 space-y-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-sm">
                          {pad(a.minute)}′{pad(a.second)}″
                        </span>
                        <span className="text-xs text-muted-foreground">{period?.short}</span>
                        {a.result && (
                          <span className="result-chip" data-tone={resultTone(a.result)}>
                            {a.result}
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        <span className="scope-chip" data-scope={scope}>
                          {scope === "collectif" ? "Équipe" : "Joueur"}
                        </span>
                        <span className="truncate">{a.actor}</span>
                      </p>
                      {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
                      {a.comment && (
                        <p className="line-clamp-2 text-xs italic text-muted-foreground">
                          « {a.comment} »
                        </p>
                      )}
                    </button>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => onEdit(a)}
                        aria-label="Modifier l’action"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            aria-label="Supprimer l’action"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette action ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              L’action codée à {pad(a.minute)}′{pad(a.second)}″ ({a.actor}) sera
                              définitivement supprimée.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(a)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
