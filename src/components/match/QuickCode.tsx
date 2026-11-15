import { Settings2, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CRITERIA_INDEX, criteriaOfGroup, getNode, type CodingGroupId } from "@/lib/match/criteria";
import {
  PERIODS,
  nodeLabel,
  quickResults,
  resultTone,
  type Period,
  type StaffConfig,
} from "@/lib/match/logic";

const GROUPS: { id: CodingGroupId; label: string }[] = [
  { id: "reglement", label: "Règlement" },
  { id: "physique", label: "Physique" },
  { id: "technique", label: "Technique" },
  { id: "mental", label: "Mental" },
  { id: "tac.individuel", label: "Tactique — Individuel" },
  { id: "tac.collectif", label: "Tactique — Collectif" },
];

interface Props {
  config: StaffConfig;
  onConfigChange: (c: StaffConfig) => void;
  player: string;
  onPlayer: (v: string) => void;
  team: string;
  onTeam: (v: string) => void;
  period: Period;
  onPeriod: (p: Period) => void;
  players: string[];
  teams: string[];
  counts: Map<string, number>;
  onCode: (nodeId: string, result: string) => void;
}

function catAttr(id: string) {
  const e = CRITERIA_INDEX.get(id);
  return e?.scope === "collectif" ? "collectif" : (e?.categoryId ?? "root");
}

export function QuickCode(p: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const shortcuts = p.config.shortcuts.filter((id) => CRITERIA_INDEX.has(id));

  return (
    <section className="rounded-xl border bg-card shadow-panel">
      <div className="flex flex-wrap items-center gap-2 border-b p-2.5">
        <span className="flex items-center gap-1.5 font-display text-base font-bold uppercase tracking-wide">
          <Zap className="size-4 text-primary" /> Codage rapide
        </span>
        <Select value={p.period} onValueChange={(v) => p.onPeriod(v as Period)}>
          <SelectTrigger className="h-9 w-[7.5rem] text-xs" aria-label="Période">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((x) => (
              <SelectItem key={x.value} value={x.value}>
                {x.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          list="quick-players"
          value={p.player}
          onChange={(e) => p.onPlayer(e.target.value)}
          placeholder="Joueur en cours"
          aria-label="Joueur en cours"
          className="h-9 min-w-[9rem] flex-1 basis-36 text-sm"
        />
        <datalist id="quick-players">
          {p.players.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
        <Input
          list="quick-teams"
          value={p.team}
          onChange={(e) => p.onTeam(e.target.value)}
          placeholder="Équipe (collectif)"
          aria-label="Équipe pour les actions collectives"
          className="h-9 min-w-[9rem] flex-1 basis-36 text-sm"
        />
        <datalist id="quick-teams">
          {p.teams.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
        <Button size="sm" variant="ghost" className="ml-auto h-9" onClick={() => setPickerOpen(true)}>
          <Settings2 /> Choisir les boutons
        </Button>
      </div>

      {shortcuts.length === 0 ? (
        <p className="p-4 text-center text-sm text-muted-foreground">
          Aucun bouton. Cliquez sur « Choisir les boutons ».
        </p>
      ) : (
        <div className="grid gap-2 p-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map((id) => {
            const node = getNode(id)!;
            const parent = node.kind === "sub" ? getNode(CRITERIA_INDEX.get(id)?.parentId ?? "") : null;
            const label = parent ? `${parent.label} · ${nodeLabel(node, p.config)}` : nodeLabel(node, p.config);
            return (
              <div
                key={id}
                data-cat={catAttr(id)}
                className="quick-card flex items-center gap-2 rounded-md border bg-background/40 px-2.5 py-2"
              >
                <span className="size-2 shrink-0 rounded-full bg-branch" />
                <span className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-tight" title={label}>
                  {label}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{p.counts.get(id) ?? 0}</span>
                {quickResults(id, p.config).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="quick-result"
                    data-tone={resultTone(r)}
                    onClick={() => p.onCode(id, r)}
                    title={`Enregistrer : ${label} — ${r}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <ShortcutPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selected={p.config.shortcuts}
        config={p.config}
        onSave={(shortcuts) => p.onConfigChange({ ...p.config, shortcuts })}
      />
    </section>
  );
}

function ShortcutPicker({
  open,
  onOpenChange,
  selected,
  config,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  selected: string[];
  config: StaffConfig;
  onSave: (ids: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(selected);
  useEffect(() => {
    if (open) setDraft(selected);
  }, [open, selected]);

  const toggle = (id: string, on: boolean) =>
    setDraft((d) => (on ? [...d, id] : d.filter((x) => x !== id)));

  const row = (id: string, label: string, indent = false) => (
    <label
      key={id}
      className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent ${indent ? "ml-6 text-muted-foreground" : ""}`}
    >
      <Checkbox checked={draft.includes(id)} onCheckedChange={(v) => toggle(id, v === true)} />
      {label}
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-wide">
            Boutons de codage rapide
          </DialogTitle>
          <DialogDescription>
            Cochez les critères à afficher sous la vidéo. Un appui enregistre l’action au moment
            exact de la vidéo.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {GROUPS.map((g) => (
            <div key={g.id} data-cat={g.id === "tac.collectif" ? "collectif" : g.id.split(".")[0] === "tac" ? "tactique" : g.id}>
              <p className="text-branch mb-1 font-display text-lg font-bold uppercase tracking-wide">
                {g.label}
              </p>
              {criteriaOfGroup(g.id).map((c) => (
                <div key={c.id}>
                  {row(c.id, c.section ? `${c.label} (${c.section.slice(3)})` : c.label)}
                  {(getNode(c.id)?.children ?? []).map((s) => row(s.id, nodeLabel(s, config), true))}
                </div>
              ))}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDraft([])}>
            Tout décocher
          </Button>
          <Button
            variant="hero"
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            Enregistrer ({draft.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
