import { useEffect, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  criteriaOfGroup,
  getNode,
  type CodingGroupId,
  type Evaluation,
} from "@/lib/match/criteria";
import { DEFAULT_CONFIG, resultsFor, type StaffConfig } from "@/lib/match/logic";

const GROUPS: { id: CodingGroupId; label: string }[] = [
  { id: "reglement", label: "Règlement" },
  { id: "physique", label: "Physique" },
  { id: "technique", label: "Technique" },
  { id: "mental", label: "Mental" },
  { id: "tac.individuel", label: "Tactique — Individuel" },
  { id: "tac.collectif", label: "Tactique — Collectif" },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  config: StaffConfig;
  onSave: (c: StaffConfig) => void;
}

export function StaffSettings({ open, onOpenChange, config, onSave }: Props) {
  const [draft, setDraft] = useState(config);
  const [resultsText, setResultsText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setDraft(config);
      setResultsText({});
    }
  }, [open, config]);

  const evalOf = (id: string): Evaluation =>
    Object.hasOwn(draft.evaluations, id)
      ? (draft.evaluations[id] ?? {})
      : (getNode(id)?.evaluation ?? {});

  const setEval = (id: string, key: keyof Evaluation, value: string) =>
    setDraft((d) => ({
      ...d,
      evaluations: { ...d.evaluations, [id]: { ...evalOf(id), [key]: value } },
    }));

  const setThreshold = (k: keyof StaffConfig["thresholds"], v: string) => {
    const n = Number(v.replace(",", "."));
    setDraft((d) => ({ ...d, thresholds: { ...d.thresholds, [k]: Number.isFinite(n) ? n : 0 } }));
  };

  const save = () => {
    const results = { ...draft.results };
    for (const [id, text] of Object.entries(resultsText)) {
      const list = text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length) results[id] = list;
      else delete results[id];
    }
    onSave({ ...draft, results });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-wide">
            Paramètres du staff
          </DialogTitle>
          <DialogDescription>
            Seuils physiques, critères d’évaluation et lecture vidéo.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="seuils" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="seuils">Seuils physiques</TabsTrigger>
            <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
            <TabsTrigger value="video">Lecture vidéo</TabsTrigger>
          </TabsList>

          <TabsContent value="seuils" className="space-y-4 pt-2">
            {(
              [
                ["hi1", "Course à haute intensité — seuil 1", "km/h"],
                ["hi2", "Course à haute intensité — seuil 2", "km/h"],
                ["acc", "Accélération / décélération — seuil supérieur à", "m/s²"],
              ] as const
            ).map(([k, label, unit]) => (
              <div key={k} className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`th-${k}`}>{label}</Label>
                  <Input
                    id={`th-${k}`}
                    type="number"
                    step="0.1"
                    value={draft.thresholds[k]}
                    onChange={(e) => setThreshold(k, e.target.value)}
                  />
                </div>
                <span className="w-12 pb-2 text-sm text-muted-foreground">{unit}</span>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDraft((d) => ({ ...d, thresholds: DEFAULT_CONFIG.thresholds }))}
            >
              Revenir aux seuils par défaut
            </Button>
          </TabsContent>

          <TabsContent value="evaluations" className="min-h-0 flex-1 overflow-y-auto pr-1 pt-2">
            <p className="mb-3 text-sm text-muted-foreground">
              Modifiez les définitions de réussite/échec et les résultats proposés dans le
              formulaire (séparés par des virgules).
            </p>
            <Accordion type="single" collapsible>
              {GROUPS.map((g) => (
                <AccordionItem key={g.id} value={g.id}>
                  <AccordionTrigger className="font-display text-lg uppercase tracking-wide">
                    {g.label}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {criteriaOfGroup(g.id).map((c) => {
                      const ev = evalOf(c.id);
                      return (
                        <div
                          key={c.id}
                          className="space-y-2 rounded-lg border bg-background/40 p-3"
                        >
                          <p className="font-medium">
                            {c.section && (
                              <span className="mr-1 text-xs text-muted-foreground">
                                {c.section} ›
                              </span>
                            )}
                            {c.label}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Textarea
                              rows={2}
                              aria-label={`${c.label} — réussi`}
                              placeholder="Réussi / conforme si…"
                              value={ev.success ?? ""}
                              onChange={(e) => setEval(c.id, "success", e.target.value)}
                            />
                            <Textarea
                              rows={2}
                              aria-label={`${c.label} — raté`}
                              placeholder="Raté / non conforme si…"
                              value={ev.fail ?? ""}
                              onChange={(e) => setEval(c.id, "fail", e.target.value)}
                            />
                          </div>
                          <Input
                            aria-label={`${c.label} — note du staff`}
                            placeholder="Note du staff (critère spécifique, consigne…)"
                            value={ev.note ?? ""}
                            onChange={(e) => setEval(c.id, "note", e.target.value)}
                          />
                          <Input
                            aria-label={`${c.label} — résultats proposés`}
                            value={resultsText[c.id] ?? resultsFor(c.id, draft).join(", ")}
                            onChange={(e) =>
                              setResultsText((r) => ({ ...r, [c.id]: e.target.value }))
                            }
                          />
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="video" className="space-y-2 pt-2">
            <Label htmlFor="preroll">Lancer la vidéo avant l’action (secondes)</Label>
            <Input
              id="preroll"
              type="number"
              min={0}
              max={60}
              value={draft.preRoll}
              onChange={(e) =>
                setDraft((d) => ({ ...d, preRoll: Math.max(0, Number(e.target.value) || 0) }))
              }
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="hero" onClick={save}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
