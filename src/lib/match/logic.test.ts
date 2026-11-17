import { describe, expect, it } from "vitest";

import { CATEGORY_IDS, CRITERIA_INDEX, CRITERIA_TREE } from "./criteria";
import {
  DEFAULT_CONFIG,
  actionsForNode,
  countByNode,
  evaluationFor,
  nodeLabel,
  migrateActions,
  parseRoster,
  sectionOf,
  upgradeConfig,
  parseTimecode,
  quickCards,
  quickResults,
  playbackStart,
  scopeOf,
  type CodedAction,
} from "./logic";

const action = (
  id: string,
  nodeId: string,
  minute: number,
  videoTime = minute * 60,
): CodedAction => ({
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
    expect(nodeLabel(CRITERIA_INDEX.get("phy.hi.s1")!.node, DEFAULT_CONFIG)).toBe(
      "Seuil de 19,8 km/h",
    );
    expect(nodeLabel(CRITERIA_INDEX.get("phy.hi.s1")!.node, config)).toBe("Seuil de 21 km/h");
    expect(nodeLabel(CRITERIA_INDEX.get("phy.hi.s2")!.node, config)).toBe("Seuil de 24,5 km/h");
    expect(nodeLabel(CRITERIA_INDEX.get("phy.acc.s")!.node, config)).toBe(
      "Seuil supérieur à 3 m/s²",
    );
  });
  it("la définition d'évaluation modifiée par le staff remplace celle par défaut", () => {
    const config = {
      ...DEFAULT_CONFIG,
      evaluations: { "tec.passe": { success: "Passe vers l’avant" } },
    };
    expect(evaluationFor("tec.passe.courte", config)?.success).toBe("Passe vers l’avant");
    expect(evaluationFor("tec.passe", DEFAULT_CONFIG)?.success).toMatch(/^Le partenaire contrôle/);
  });
});

describe("codage rapide", () => {
  it("propose au plus deux résultats, sans « Autre »", () => {
    expect(quickResults("tec.passe", DEFAULT_CONFIG)).toEqual(["Réussi", "Raté"]);
    expect(quickResults("reg.carton", DEFAULT_CONFIG)).toEqual(["Jaune", "Rouge"]);
    expect(quickResults("tac.ind.placement", DEFAULT_CONFIG)).toEqual(["Conforme", "Non conforme"]);
  });
});

describe("codage rapide", () => {
  it("Passe n'est pas cliquable : total + Courte, Longue, En profondeur", () => {
    const [passe] = quickCards(["tec.passe"], "individuel");
    expect(passe?.subs).toEqual(["tec.passe.courte", "tec.passe.longue", "tec.passe.profondeur"]);
    expect(quickCards(["tec.controle"], "individuel")[0]?.subs).toEqual([]);
  });

  it("sépare les boutons individuels et collectifs", () => {
    const ids = ["tec.passe", "col.def.pressing", "tac.ind.pressing"];
    expect(quickCards(ids, "individuel").map((c) => c.id)).toEqual([
      "tec.passe",
      "tac.ind.pressing",
    ]);
    expect(quickCards(ids, "collectif").map((c) => c.id)).toEqual(["col.def.pressing"]);
  });

  it("lit l'effectif ligne par ligne sans doublons ni lignes vides", () => {
    expect(parseRoster("10 Griezmann\n\n  7  Mbappé \n10 griezmann\n")).toEqual([
      "10 Griezmann",
      "7 Mbappé",
    ]);
  });
});

describe("critères modifiés par le staff", () => {
  it("Technique a un Duel Aérien / Au sol, Réussi ou Raté, et plus de Jeu de tête", () => {
    expect(CRITERIA_INDEX.get("tec.duel")?.node.children?.map((c) => c.label)).toEqual([
      "Aérien",
      "Au sol",
    ]);
    expect(quickResults("tec.duel.sol", DEFAULT_CONFIG)).toEqual(["Réussi", "Raté"]);
    expect(CRITERIA_INDEX.has("tec.tete")).toBe(false);
  });

  it("Faute commise n'a plus de sous-critères", () => {
    expect(CRITERIA_INDEX.get("reg.faute-commise")?.node.children).toBeUndefined();
    expect(CRITERIA_INDEX.has("reg.faute-commise.tacle")).toBe(false);
  });

  it("les actions déjà codées sur un critère retiré sont rattachées au nouveau", () => {
    const moved = migrateActions([
      action("a", "reg.faute-commise.tacle", 1),
      action("b", "tec.tete", 2),
    ]);
    expect(moved.map((a) => a.nodeId)).toEqual(["reg.faute-commise", "tec.duel.aerien"]);
  });

  it("les boutons existants gagnent Duel, Faute subie, la tactique individuelle et tout le collectif", () => {
    const old = {
      ...DEFAULT_CONFIG,
      shortcuts: ["tec.passe", "tec.tete"],
      shortcutsVersion: undefined,
    };
    const up = upgradeConfig(old).shortcuts;
    expect(up).not.toContain("tec.tete");
    expect(up).toEqual(
      expect.arrayContaining([
        "tec.duel",
        "reg.faute-subie",
        "tac.ind.appel",
        "tac.ind.soutien",
        "tac.ind.repli",
        "tac.ind.couverture",
        "tac.ind.placement",
      ]),
    );
    const sections = new Set(quickCards(up, "collectif").map((c) => sectionOf(c.id)?.label));
    expect([...sections]).toEqual([
      "A. Organisation offensive",
      "B. Organisation défensive",
      "C. Transitions défensives",
      "D. Buts concédés",
    ]);
  });

  it("une fois appliquée, la mise à jour ne remet pas un bouton retiré par le staff", () => {
    const once = upgradeConfig({ ...DEFAULT_CONFIG, shortcutsVersion: undefined });
    const removed = { ...once, shortcuts: once.shortcuts.filter((id) => id !== "tec.duel") };
    expect(upgradeConfig(removed).shortcuts).not.toContain("tec.duel");
  });

  it("des réglages enregistrés avant la mise à jour reçoivent les nouveaux boutons", () => {
    const stored = { shortcuts: ["tec.passe", "reg.faute-commise"] };
    const merged = { ...DEFAULT_CONFIG, ...stored };
    expect(upgradeConfig(merged).shortcuts).toEqual(
      expect.arrayContaining(["tec.duel", "tac.ind.appel", "col.def.bloc", "col.buts.recup"]),
    );
  });

  it("rend les boutons individuels à un staff qui n'en a plus aucun", () => {
    const stored = { ...DEFAULT_CONFIG, shortcuts: ["col.def.bloc"], shortcutsVersion: 2 };
    const up = upgradeConfig(stored).shortcuts;
    expect(up).toEqual(expect.arrayContaining(["tec.passe", "tec.duel", "tac.ind.appel", "col.def.bloc"]));
  });

  it("un sous-critère n'apparaît pas en double à côté de son critère", () => {
    const ids = quickCards(["col.off.sortie", "col.off.sortie.courte", "col.def.bloc"], "collectif");
    expect(ids.map((c) => c.id)).toEqual(["col.off.sortie", "col.def.bloc"]);
  });

  it("rend tous les blocs collectifs, dont D. Buts concédés, à un staff qui en avait retiré", () => {
    const stored = { ...DEFAULT_CONFIG, shortcuts: ["tec.passe", "col.off.sortie"], shortcutsVersion: 3 };
    const up = upgradeConfig(stored).shortcuts;
    expect(up).toEqual(
      expect.arrayContaining(["col.buts.perte", "col.buts.espace", "col.buts.recup", "col.def.bloc"]),
    );
  });

  it("Perte de balle à la relance, Bloc équipe et Pressing collectif : un seul clic, sans résultat", () => {
    for (const id of [
      "col.off.perte-relance",
      "col.def.bloc.haut",
      "col.def.bloc.etire",
      "col.def.pressing.declencheur",
      "col.def.pressing.contourne",
    ])
      expect(quickResults(id, DEFAULT_CONFIG)).toEqual([]);
    expect(quickResults("col.off.sortie.courte", DEFAULT_CONFIG)).toEqual(["Réussi", "Raté"]);
  });

  it("Circuits de passes préférentiels n'existe plus, ni ses actions codées", () => {
    expect(CRITERIA_INDEX.has("col.off.circuits")).toBe(false);
    expect(CRITERIA_INDEX.has("col.off.circuits.axe")).toBe(false);
    const kept = migrateActions([action("a", "col.off.circuits.axe", 1), action("b", "tec.passe", 2)]);
    expect(kept.map((a) => a.id)).toEqual(["b"]);
    expect(upgradeConfig({ ...DEFAULT_CONFIG, shortcuts: ["col.off.circuits"] }).shortcuts).not.toContain(
      "col.off.circuits",
    );
  });
});
