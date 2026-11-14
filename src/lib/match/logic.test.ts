import { describe, expect, it } from "vitest";

import { CATEGORY_IDS, CRITERIA_INDEX, CRITERIA_TREE } from "./criteria";
import {
  DEFAULT_CONFIG,
  actionsForNode,
  countByNode,
  evaluationFor,
  nodeLabel,
  parseTimecode,
  playbackStart,
  scopeOf,
  type CodedAction,
} from "./logic";

const action = (id: string, nodeId: string, minute: number, videoTime = minute * 60): CodedAction => ({
  id,
  nodeId,
  actor: "10",
  result: "Réussi",
  period: "1MT",
  minute,
  second: 0,
  videoTime,
  comment: "",
  createdAt: 0,
});

describe("structure de la carte", () => {
  it("a exactement les cinq catégories demandées", () => {
    expect(CRITERIA_TREE.children?.map((c) => c.label)).toEqual([
      "Règlement",
      "Physique",
      "Technique",
      "Mental",
      "Tactique",
    ]);
    expect(CATEGORY_IDS).toHaveLength(5);
  });

  it("Tactique contient les onglets Individuel et Collectif", () => {
    const tactique = CRITERIA_TREE.children?.find((c) => c.id === "tactique");
    expect(tactique?.children?.map((c) => c.label)).toEqual(["Individuel", "Collectif"]);
  });

  it("le collectif n'existe que sous Tactique", () => {
    const collectifs = [...CRITERIA_INDEX.values()].filter((e) => e.scope === "collectif");
    expect(collectifs.length).toBeGreaterThan(0);
    expect(collectifs.every((e) => e.categoryId === "tactique")).toBe(true);
    expect(scopeOf("tec.passe")).toBe("individuel");
    expect(scopeOf("col.def.bloc.haut")).toBe("collectif");
  });
});

describe("lecture vidéo", () => {
  it("démarre quelques secondes avant l'action", () => {
    expect(playbackStart(125, 5)).toBe(120);
  });
  it("ne démarre jamais avant le début de la vidéo", () => {
    expect(playbackStart(3, 5)).toBe(0);
  });
  it("comprend les timecodes saisis à la main", () => {
    expect(parseTimecode("1:15")).toBe(75);
    expect(parseTimecode("1:02:03")).toBe(3723);
    expect(parseTimecode("abc")).toBeNull();
  });
});

describe("filtrage des actions", () => {
  const actions = [
    action("a", "tec.passe.courte", 20),
    action("b", "tec.passe", 5),
    action("c", "tec.dribble", 10),
    action("d", "col.off.sortie.courte", 30),
  ];

  it("un critère affiche aussi les actions de ses sous-critères, triées dans le temps", () => {
    expect(actionsForNode(actions, "tec.passe").map((a) => a.id)).toEqual(["b", "a"]);
  });
  it("une catégorie regroupe toutes ses actions", () => {
    expect(actionsForNode(actions, "technique")).toHaveLength(3);
  });
  it("un critère sans action renvoie une liste vide", () => {
    expect(actionsForNode(actions, "men.encourage")).toEqual([]);
  });
  it("le compteur cumule les descendants", () => {
    const counts = countByNode(actions);
    expect(counts.get("tec.passe")).toBe(2);
    expect(counts.get("tactique")).toBe(1);
    expect(counts.get("root")).toBe(4);
  });
});

describe("paramètres staff", () => {
  it("les seuils physiques suivent la configuration", () => {
    const config = { ...DEFAULT_CONFIG, thresholds: { hi1: 21, hi2: 24.5, acc: 3 } };
    expect(nodeLabel(CRITERIA_INDEX.get("phy.hi.s1")!.node, DEFAULT_CONFIG)).toBe("Seuil de 19,8 km/h");
    expect(nodeLabel(CRITERIA_INDEX.get("phy.hi.s1")!.node, config)).toBe("Seuil de 21 km/h");
    expect(nodeLabel(CRITERIA_INDEX.get("phy.hi.s2")!.node, config)).toBe("Seuil de 24,5 km/h");
    expect(nodeLabel(CRITERIA_INDEX.get("phy.acc.s")!.node, config)).toBe("Seuil supérieur à 3 m/s²");
  });
  it("la définition d'évaluation modifiée par le staff remplace celle par défaut", () => {
    const config = { ...DEFAULT_CONFIG, evaluations: { "tec.passe": { success: "Passe vers l’avant" } } };
    expect(evaluationFor("tec.passe.courte", config)?.success).toBe("Passe vers l’avant");
    expect(evaluationFor("tec.passe", DEFAULT_CONFIG)?.success).toMatch(/^Le partenaire contrôle/);
  });
});
