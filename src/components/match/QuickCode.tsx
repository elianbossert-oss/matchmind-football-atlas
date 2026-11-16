import { Settings2, UserRound, Users, Zap } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CRITERIA_INDEX,
  criteriaOfGroup,
  getNode,
  type CodingGroupId,
  type Scope,
} from "@/lib/match/criteria";
import {
  PERIODS,
  nodeLabel,
  parseRoster,
  quickCards,
  quickResults,
  resultTone,
  scopeOf,
  sectionOf,
  type QuickCard,
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

const groupScope = (id: CodingGroupId): Scope =>
  id === "tac.collectif" ? "collectif" : "individuel";

interface Props {
  config: StaffConfig;
  onConfigChange: (c: StaffConfig) => void;
  mode: Scope;
  onMode: (m: Scope) => void;
  player: string;
  onPlayer: (v: string) => void;
  team: string;
  onTeam: (v: string) => void;
  period: Period;
  onPeriod: (p: Period) => void;
  teams: string[];
  counts: Map<string, number>;
  onCode: (nodeId: string, result: string) => void;
}

function catAttr(id: string) {
  const e = CRITERIA_INDEX.get(id);
  return e?.scope === "collectif" ? "collectif" : (e?.categoryId ?? "root");
}

const TREE_ORDER = new Map([...CRITERIA_INDEX.keys()].map((id, i) => [id, i]));

/** Cartes collectives regroupées par sous-partie (A, B, C, D), dans l'ordre de la carte. */
function bySection(cards: QuickCard[]) {
  const sorted = [...cards].sort(
    (a, b) => (TREE_ORDER.get(a.id) ?? 0) - (TREE_ORDER.get(b.id) ?? 0),
  );
  const groups: { id: string; label: string; cards: QuickCard[] }[] = [];
  for (const card of sorted) {
    const sec = sectionOf(card.id);
    const id = sec?.id ?? "autre";
    let g = groups.find((x) => x.id === id);
    if (!g) groups.push((g = { id, label: sec?.label ?? "Collectif", cards: [] }));
    g.cards.push(card);
  }
  return groups;
}

const GRID = "grid grid-flow-row-dense auto-rows-[2.375rem] gap-1.5";

function shortcutLabel(id: string, config: StaffConfig) {
  const node = getNode(id)!;
  const parent = node.kind === "sub" ? getNode(CRITERIA_INDEX.get(id)?.parentId ?? "") : null;
  return parent ? `${parent.label} · ${nodeLabel(node, config)}` : nodeLabel(node, config);
}

export function QuickCode(p: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const cards = quickCards(p.config.shortcuts, p.mode);
  const roster = p.config.roster ?? [];

  const resultButtons = (id: string, label: string) =>
    quickResults(id, p.config).map((r) => (
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
    ));

  const renderCard = ({ id, subs }: QuickCard) => {
            const label = shortcutLabel(id, p.config);
            if (subs.length) {
              return (
                <div
                  key={id}
                  data-cat={catAttr(id)}
                  style={{ gridRow: `span ${subs.length + 1}` }}
                  className="quick-card flex flex-col overflow-hidden rounded-md border bg-background/40"
                >
                  <div className="flex flex-1 items-center gap-1.5 bg-muted/40 px-2">
                    <span className="size-2 shrink-0 rounded-full bg-branch" />
                    <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wide" title={label}>
                      {label}
                    </span>
                    <span className="font-mono text-xs">
                      Total <strong>{p.counts.get(id) ?? 0}</strong>
                    </span>
                  </div>
                  {subs.map((sid) => {
                    const sub = nodeLabel(getNode(sid)!, p.config);
                    return (
                      <div key={sid} className="flex flex-1 items-center gap-1.5 border-t px-2 pl-5">
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold" title={sub}>
                          {sub}
                        </span>
                        <span className="font-mono text-[0.7rem] text-muted-foreground">
                          {p.counts.get(sid) ?? 0}
                        </span>
                        {resultButtons(sid, `${label} · ${sub}`)}
                      </div>
                    );
                  })}
                </div>
              );
            }
            return (
              <div
                key={id}
                data-cat={catAttr(id)}
                className="quick-card flex items-center gap-1.5 rounded-md border bg-background/40 px-2"
              >
                <span className="size-2 shrink-0 rounded-full bg-branch" />
                <span className="line-clamp-2 min-w-0 flex-1 text-xs font-semibold leading-tight" title={label}>
                  {label}
                </span>
                <span className="font-mono text-[0.7rem] text-muted-foreground">
                  {p.counts.get(id) ?? 0}
                </span>
                {resultButtons(id, label)}
              </div>
            );
  };

  return (
    <section className="rounded-xl border bg-card shadow-panel">
      <div className="flex flex-wrap items-center gap-2 border-b p-2">
        <span className="flex items-center gap-1.5 font-display text-base font-bold uppercase tracking-wide">
          <Zap className="size-4 text-primary" /> Codage rapide
        </span>
        <div role="tablist" aria-label="Type de boutons" className="flex rounded-md border p-0.5">
          {(
            [
              { id: "individuel", label: "Individuel", Icon: UserRound },
              { id: "collectif", label: "Collectif", Icon: Users },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={p.mode === id}
              data-cat={id === "collectif" ? "collectif" : "tactique"}
              onClick={() => p.onMode(id)}
              className="quick-mode flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold"
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        <Select value={p.period} onValueChange={(v) => p.onPeriod(v as Period)}>
          <SelectTrigger className="h-8 w-[7.5rem] text-xs" aria-label="Période">
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
        {p.mode === "collectif" && (
          <>
            <Input
              list="quick-teams"
              value={p.team}
              onChange={(e) => p.onTeam(e.target.value)}
              placeholder="Équipe"
              aria-label="Équipe pour les actions collectives"
              className="h-8 min-w-[9rem] max-w-xs flex-1 basis-36 text-sm"
            />
            <datalist id="quick-teams">
              {p.teams.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </>
        )}
        <div className="ml-auto flex gap-1">
          {p.mode === "individuel" && (
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setRosterOpen(true)}>
              <Users /> Mon effectif
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8" onClick={() => setPickerOpen(true)}>
            <Settings2 /> Choisir les boutons
          </Button>
        </div>
      </div>

      {p.mode === "individuel" && (
        <div className="flex flex-wrap items-center gap-1.5 border-b px-2 py-1.5">
          <span className="mr-1 text-xs font-semibold text-muted-foreground">Joueur en cours :</span>
          {roster.length === 0 ? (
            <button
              type="button"
              onClick={() => setRosterOpen(true)}
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              Ajoutez vos joueurs pour les sélectionner en un clic
            </button>
          ) : (
            roster.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={p.player === name}
                onClick={() => p.onPlayer(p.player === name ? "" : name)}
                className="player-chip"
              >
                {name}
              </button>
            ))
          )}
        </div>
      )}

      {cards.length === 0 ? (
        <p className="p-4 text-center text-sm text-muted-foreground">
          Aucun bouton {p.mode === "collectif" ? "collectif" : "individuel"}. Cliquez sur « Choisir
          les boutons ».
        </p>
      ) : p.mode === "collectif" ? (
        <div className="flex flex-wrap gap-3 p-2">
          {bySection(cards).map((g) => (
            <div
              key={g.id}
              className="min-w-0"
              style={{ flex: `${Math.min(g.cards.length, 4)} 1 ${Math.min(g.cards.length, 4) * 14}rem` }}
            >
              <p className="mb-1 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {g.label}
              </p>
              <div className={GRID} style={{ gridTemplateColumns: "repeat(auto-fill, minmax(13.5rem, 1fr))" }}>
                {g.cards.map(renderCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${GRID} p-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5`}>
          {cards.map(renderCard)}
        </div>
      )}

      <ShortcutPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode={p.mode}
        selected={p.config.shortcuts}
        config={p.config}
        onSave={(shortcuts) => p.onConfigChange({ ...p.config, shortcuts })}
      />
      <RosterDialog
        open={rosterOpen}
        onOpenChange={setRosterOpen}
        roster={roster}
        onSave={(r) => {
          p.onConfigChange({ ...p.config, roster: r });
          if (p.player && !r.includes(p.player)) p.onPlayer("");
        }}
      />
    </section>
  );
}

function RosterDialog({
  open,
  onOpenChange,
  roster,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  roster: string[];
  onSave: (r: string[]) => void;
}) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (open) setText(roster.join("\n"));
  }, [open, roster]);
  const count = parseRoster(text).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-wide">
            Mon effectif
          </DialogTitle>
          <DialogDescription>
            Un joueur par ligne, avec son numéro si vous voulez (ex. « 10 Griezmann »). Ils
            apparaîtront sous la vidéo pour être choisis en un clic.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder={"1 Lloris\n2 Pavard\n10 Griezmann"}
          aria-label="Liste des joueurs"
          className="font-mono text-sm"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="hero"
            onClick={() => {
              onSave(parseRoster(text));
              onOpenChange(false);
            }}
          >
            Enregistrer ({count} joueur{count > 1 ? "s" : ""})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutPicker({
  open,
  onOpenChange,
  mode,
  selected,
  config,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: Scope;
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
  const inMode = draft.filter((id) => CRITERIA_INDEX.has(id) && scopeOf(id) === mode).length;

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
            Boutons {mode === "collectif" ? "collectifs" : "individuels"}
          </DialogTitle>
          <DialogDescription>
            Cochez les critères à afficher sous la vidéo. Un critère avec sous-critères (ex. Passe)
            affiche son total et un bouton par sous-critère.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {GROUPS.filter((g) => groupScope(g.id) === mode).map((g) => (
            <div
              key={g.id}
              data-cat={
                g.id === "tac.collectif"
                  ? "collectif"
                  : g.id.split(".")[0] === "tac"
                    ? "tactique"
                    : g.id
              }
            >
              <p className="text-branch mb-1 font-display text-lg font-bold uppercase tracking-wide">
                {g.label}
              </p>
              {criteriaOfGroup(g.id).map((c) => (
                <div key={c.id}>
                  {row(c.id, c.section ? `${c.label} (${c.section.slice(3)})` : c.label)}
                  {(getNode(c.id)?.children ?? []).map((s) =>
                    row(s.id, nodeLabel(s, config), true),
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setDraft((d) => d.filter((id) => scopeOf(id) !== mode))}
          >
            Tout décocher
          </Button>
          <Button
            variant="hero"
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            Enregistrer ({inMode})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
