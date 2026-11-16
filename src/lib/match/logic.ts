import {
  CRITERIA_INDEX,
  type CriterionNode,
  type Evaluation,
  type Scope,
  type ThresholdKey,
} from "./criteria";

export type Period = "1MT" | "2MT" | "P1" | "P2";

export const PERIODS: { value: Period; label: string; short: string }[] = [
  { value: "1MT", label: "1re mi-temps", short: "1re MT" },
  { value: "2MT", label: "2e mi-temps", short: "2e MT" },
  { value: "P1", label: "Prolongation 1", short: "Prol. 1" },
  { value: "P2", label: "Prolongation 2", short: "Prol. 2" },
];

export interface CodedAction {
  id: string;
  /** Nœud le plus précis codé (critère ou sous-critère). */
  nodeId: string;
  actor: string;
  result: string;
  period: Period;
  minute: number;
  second: number;
  /** Position dans la vidéo, en secondes. */
  videoTime: number;
  comment: string;
  thumbnail?: string | undefined;
  createdAt: number;
}

export interface StaffConfig {
  thresholds: Record<ThresholdKey, number>;
  /** Secondes de lecture avant l'action. */
  preRoll: number;
  evaluations: Record<string, Evaluation>;
  results: Record<string, string[]>;
  /** Critères affichés en boutons de codage rapide sous la vidéo. */
  shortcuts: string[];
  /** Effectif saisi par le staff (un joueur par ligne). */
  roster: string[];
}

export const DEFAULT_CONFIG: StaffConfig = {
  thresholds: { hi1: 19.8, hi2: 25, acc: 2.5 },
  preRoll: 5,
  evaluations: {},
  results: {},
  shortcuts: [
    "tec.passe",
    "tec.controle",
    "tec.dribble",
    "tec.tir",
    "tec.centre",
    "tec.interception",
    "reg.faute-commise",
    "tac.ind.pressing",
  ],
  roster: [],
};

const fr = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

export function nodeLabel(node: CriterionNode, config: StaffConfig): string {
  switch (node.threshold) {
    case "hi1":
      return `Seuil de ${fr(config.thresholds.hi1)} km/h`;
    case "hi2":
      return `Seuil de ${fr(config.thresholds.hi2)} km/h`;
    case "acc":
      return `Seuil supérieur à ${fr(config.thresholds.acc)} m/s²`;
    default:
      return node.label;
  }
}

export function scopeOf(nodeId: string): Scope {
  return CRITERIA_INDEX.get(nodeId)?.scope ?? "individuel";
}

/** Remonte jusqu'au critère pour trouver l'évaluation (surcharge staff prioritaire). */
export function evaluationFor(nodeId: string, config: StaffConfig): Evaluation | undefined {
  let id: string | null = nodeId;
  while (id) {
    const entry = CRITERIA_INDEX.get(id);
    if (!entry) return undefined;
    if (Object.hasOwn(config.evaluations, id)) return config.evaluations[id];
    if (entry.node.evaluation) return entry.node.evaluation;
    if (entry.node.kind === "criterion") return undefined;
    id = entry.parentId;
  }
  return undefined;
}

/** Résultats proposés : surcharge staff ou défaut du nœud le plus proche. */
export function resultsFor(nodeId: string, config: StaffConfig): string[] {
  let id: string | null = nodeId;
  while (id) {
    const entry = CRITERIA_INDEX.get(id);
    if (!entry) break;
    const override = config.results[id];
    if (override?.length) return override;
    if (entry.node.results?.length) return entry.node.results;
    id = entry.parentId;
  }
  return ["Réussi", "Raté", "Autre"];
}

/** Résultats proposés sur un bouton rapide : au plus deux, sans « Autre ». */
export function quickResults(nodeId: string, config: StaffConfig): string[] {
  const list = resultsFor(nodeId, config).filter((r) => normalize(r) !== "autre");
  return (list.length ? list : resultsFor(nodeId, config)).slice(0, 2);
}

export interface QuickCard {
  id: string;
  /** Sous-critères codables : si non vide, le critère n'affiche qu'un total. */
  subs: string[];
}

/**
 * Cartes de codage rapide pour un mode (individuel ou collectif). Un critère qui possède des
 * sous-critères n'est pas cliquable : il affiche le total et un bouton par sous-critère.
 */
export function quickCards(shortcuts: string[], mode: Scope): QuickCard[] {
  return [...new Set(shortcuts)]
    .filter((id) => CRITERIA_INDEX.has(id) && scopeOf(id) === mode)
    .map((id) => {
      const node = CRITERIA_INDEX.get(id)!.node;
      const subs = node.kind === "criterion" ? (node.children ?? []).map((ch) => ch.id) : [];
      return { id, subs };
    });
}

/** Effectif : un joueur par ligne, espaces superflus retirés, doublons ignorés. */
export function parseRoster(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const name = line.trim().replace(/\s+/g, " ");
    const key = normalize(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** Minute/seconde de match proposées à partir de la position dans la vidéo. */
export function matchClock(videoTime: number): { minute: number; second: number } {
  const t = Math.max(0, Math.floor(videoTime));
  return { minute: Math.floor(t / 60), second: t % 60 };
}

const PERIOD_ORDER: Record<Period, number> = { "1MT": 0, "2MT": 1, P1: 2, P2: 3 };

export function sortActions(actions: CodedAction[]): CodedAction[] {
  return [...actions].sort(
    (a, b) =>
      PERIOD_ORDER[a.period] - PERIOD_ORDER[b.period] ||
      a.minute - b.minute ||
      a.second - b.second ||
      a.videoTime - b.videoTime,
  );
}

/** Actions codées sur le nœud ou l'un de ses descendants ; la racine renvoie tout. */
export function actionsForNode(actions: CodedAction[], nodeId: string): CodedAction[] {
  if (nodeId === "root") return sortActions(actions);
  return sortActions(
    actions.filter((a) => CRITERIA_INDEX.get(a.nodeId)?.path.includes(nodeId) ?? false),
  );
}

/** Nombre d'actions par nœud (descendants inclus). */
export function countByNode(actions: CodedAction[]): Map<string, number> {
  const counts = new Map<string, number>();
  counts.set("root", actions.length);
  for (const a of actions) {
    for (const id of CRITERIA_INDEX.get(a.nodeId)?.path ?? []) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

/** Instant de démarrage de la lecture : quelques secondes avant l'action, jamais avant 0. */
export function playbackStart(videoTime: number, preRoll: number): number {
  return Math.max(0, videoTime - Math.max(0, preRoll));
}

export function formatTimecode(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Accepte « 75 », « 1:15 », « 01:02:03 ». Renvoie null si invalide. */
export function parseTimecode(input: string): number | null {
  const parts = input.trim().split(":");
  if (!parts.length || parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return null;
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .toLowerCase();
}

export type ResultTone = "positive" | "negative" | "warning" | "neutral";

export function resultTone(result: string): ResultTone {
  const r = normalize(result);
  if (r === "jaune") return "warning";
  if (["reussi", "reussie", "conforme", "obtenu"].includes(r)) return "positive";
  if (["rate", "ratee", "non conforme", "concede", "rouge"].includes(r)) return "negative";
  return "neutral";
}
