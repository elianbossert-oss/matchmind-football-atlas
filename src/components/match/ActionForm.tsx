import { Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORY_IDS,
  CRITERIA_INDEX,
  criteriaOfGroup,
  getNode,
  groupOf,
  type CategoryId,
  type CodingGroupId,
} from "@/lib/match/criteria";
import {
  PERIODS,
  formatTimecode,
  nodeLabel,
  parseTimecode,
  resultsFor,
  type CodedAction,
  type Period,
  type StaffConfig,
} from "@/lib/match/logic";

export interface ActionDraft {
  action?: CodedAction | undefined;
  nodeId?: string | undefined;
  videoTime: number;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  draft: ActionDraft | null;
  config: StaffConfig;
  actorsIndividual: string[];
  actorsCollective: string[];
  lastPeriod: Period;
  getCurrentTime: () => number | null;
  onSave: (
    a: Omit<CodedAction, "id" | "createdAt" | "thumbnail"> & { id?: string | undefined },
  ) => void;
}

const NONE = "__none";

function initialState(draft: ActionDraft | null, lastPeriod: Period) {
  const nodeId = draft?.action?.nodeId ?? draft?.nodeId ?? "";
  const entry = nodeId ? CRITERIA_INDEX.get(nodeId) : undefined;
  const group = nodeId ? groupOf(nodeId) : null;
  let criterion = "";
  let sub = NONE;
  if (entry) {
    const crit = entry.path.find((id) => getNode(id)?.kind === "criterion");
    if (crit) criterion = crit;
    if (entry.node.kind === "sub") sub = entry.node.id;
  }
  const t = draft?.action?.videoTime ?? draft?.videoTime ?? 0;
  return {
    category: (entry?.categoryId ?? "") as CategoryId | "",
    tab: (group === "tac.collectif" ? "tac.collectif" : "tac.individuel") as
      "tac.individuel" | "tac.collectif",
    criterion,
    sub,
    actor: draft?.action?.actor ?? "",
    result: draft?.action?.result ?? "",
    period: draft?.action?.period ?? lastPeriod,
    minute: String(draft?.action?.minute ?? Math.floor(t / 60)),
    second: String(draft?.action?.second ?? Math.floor(t % 60)),
    timecode: formatTimecode(t),
    comment: draft?.action?.comment ?? "",
  };
}

export function ActionForm({
  open,
  onOpenChange,
  draft,
  config,
  actorsIndividual,
  actorsCollective,
  lastPeriod,
  getCurrentTime,
  onSave,
}: Props) {
  const [f, setF] = useState(() => initialState(draft, lastPeriod));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setF(initialState(draft, lastPeriod));
      setError(null);
    }
  }, [open, draft, lastPeriod]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const group: CodingGroupId | null = f.category
    ? f.category === "tactique"
      ? f.tab
      : f.category
    : null;
  const isCollective = group === "tac.collectif";
  const criteria = useMemo(() => (group ? criteriaOfGroup(group) : []), [group]);
  const sections = useMemo(() => {
    const map = new Map<string, typeof criteria>();
    for (const c of criteria) {
      const k = c.section ?? "";
      map.set(k, [...(map.get(k) ?? []), c]);
    }
    return [...map.entries()];
  }, [criteria]);
  const subs = f.criterion ? (getNode(f.criterion)?.children ?? []) : [];
  const targetId = f.sub !== NONE ? f.sub : f.criterion;
  const results = targetId ? resultsFor(targetId, config) : [];
  const actors = isCollective ? actorsCollective : actorsIndividual;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoTime = parseTimecode(f.timecode);
    const minute = Number(f.minute);
    const second = Number(f.second);
    if (!f.criterion) return setError("Choisissez un critère.");
    if (!f.actor.trim())
      return setError(isCollective ? "Indiquez l’équipe." : "Indiquez le joueur.");
    if (results.length && !f.result) return setError("Choisissez un résultat.");
    if (!Number.isInteger(minute) || minute < 0 || minute > 150)
      return setError("Minute invalide (0 à 150).");
    if (!Number.isInteger(second) || second < 0 || second > 59)
      return setError("Seconde invalide (0 à 59).");
    if (videoTime === null) return setError("Timecode vidéo invalide (format mm:ss ou h:mm:ss).");
    onSave({
      id: draft?.action?.id,
      nodeId: targetId,
      actor: f.actor.trim(),
      result: f.result,
      period: f.period,
      minute,
      second,
      videoTime,
      comment: f.comment.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-wide">
            {draft?.action ? "Modifier l’action" : "Ajouter une action"}
          </DialogTitle>
          <DialogDescription>
            Le timecode de la vidéo est enregistré automatiquement ; vous pouvez le corriger.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select
              value={f.category}
              onValueChange={(v) =>
                setF((p) => ({
                  ...p,
                  category: v as CategoryId,
                  criterion: "",
                  sub: NONE,
                  result: "",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    targetId && !results.length ? "Aucun résultat à choisir" : "Choisir…"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_IDS.map((id) => (
                  <SelectItem key={id} value={id}>
                    {getNode(id)?.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {f.category === "tactique" ? (
            <div className="space-y-1.5">
              <Label>Onglet</Label>
              <Select
                value={f.tab}
                onValueChange={(v) =>
                  setF((p) => ({
                    ...p,
                    tab: v as typeof f.tab,
                    criterion: "",
                    sub: NONE,
                    result: "",
                    actor: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tac.individuel">Individuel</SelectItem>
                  <SelectItem value="tac.collectif">Collectif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="hidden sm:block" />
          )}

          <div className="space-y-1.5">
            <Label>Critère</Label>
            <Select
              value={f.criterion}
              disabled={!group}
              onValueChange={(v) => setF((p) => ({ ...p, criterion: v, sub: NONE, result: "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={group ? "Choisir…" : "Choisir d’abord une catégorie"} />
              </SelectTrigger>
              <SelectContent>
                {sections.map(([section, items]) =>
                  section ? (
                    <SelectGroup key={section}>
                      <SelectLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                        {section}
                      </SelectLabel>
                      {items.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : (
                    items.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Sous-critère</Label>
            <Select
              value={f.sub}
              disabled={subs.length === 0}
              onValueChange={(v) => setF((p) => ({ ...p, sub: v, result: "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Non applicable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{subs.length ? "Aucun" : "Non applicable"}</SelectItem>
                {subs.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {nodeLabel(s, config)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="actor">{isCollective ? "Équipe" : "Joueur"}</Label>
            <Input
              id="actor"
              list="actor-list"
              value={f.actor}
              onChange={(e) => set("actor", e.target.value)}
              placeholder={isCollective ? "Nom de l’équipe" : "Nom ou numéro du joueur"}
            />
            <datalist id="actor-list">
              {actors.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label>Résultat</Label>
            <Select
              value={f.result}
              disabled={!targetId || !results.length}
              onValueChange={(v) => set("result", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {results.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Période</Label>
            <Select value={f.period} onValueChange={(v) => set("period", v as Period)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="minute">Minute</Label>
              <Input
                id="minute"
                inputMode="numeric"
                type="number"
                min={0}
                max={150}
                value={f.minute}
                onChange={(e) => set("minute", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="second">Seconde</Label>
              <Input
                id="second"
                inputMode="numeric"
                type="number"
                min={0}
                max={59}
                value={f.second}
                onChange={(e) => set("second", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="timecode">Timecode vidéo</Label>
            <div className="flex gap-2">
              <Input
                id="timecode"
                className="font-mono"
                value={f.timecode}
                onChange={(e) => set("timecode", e.target.value)}
                placeholder="mm:ss"
              />
              <Button
                type="button"
                variant="soft"
                onClick={() => {
                  const t = getCurrentTime();
                  if (t !== null) set("timecode", formatTimecode(t));
                }}
              >
                <Clock /> Timecode actuel
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="comment">Commentaire</Label>
            <Textarea
              id="comment"
              rows={3}
              value={f.comment}
              onChange={(e) => set("comment", e.target.value)}
              placeholder="Commentaire libre (facultatif)"
            />
          </div>

          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="hero">
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
