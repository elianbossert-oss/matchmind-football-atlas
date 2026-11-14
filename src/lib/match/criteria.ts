/**
 * Référentiel de la carte mentale — reprend STRICTEMENT les catégories et critères du cahier
 * des charges. Ne pas ajouter de critères ici sans demande explicite du staff.
 */
export type Scope = "individuel" | "collectif";
export type NodeKind = "root" | "category" | "tab" | "section" | "criterion" | "sub";
export type ThresholdKey = "hi1" | "hi2" | "acc";
export type CategoryId = "reglement" | "physique" | "technique" | "mental" | "tactique";

export interface Evaluation {
  success?: string;
  fail?: string;
  note?: string;
}

export interface CriterionNode {
  id: string;
  label: string;
  kind: NodeKind;
  /** Libellé dynamique pour les seuils physiques configurables. */
  threshold?: ThresholdKey;
  evaluation?: Evaluation;
  /** Résultats proposés dans le formulaire (hérités par les descendants). */
  results?: string[];
  children?: CriterionNode[];
}

const RES_REUSSI = ["Réussi", "Raté", "Autre"];
const RES_CONFORME = ["Conforme", "Non conforme", "Autre"];
const RES_OBTENU = ["Obtenu", "Concédé", "Autre"];

function c(
  id: string,
  label: string,
  opts: Partial<Omit<CriterionNode, "id" | "label" | "kind" | "children">> = {},
  children?: CriterionNode[],
): CriterionNode {
  return { id, label, kind: "criterion", ...opts, children };
}
function s(id: string, label: string, opts: Partial<CriterionNode> = {}): CriterionNode {
  return { id, label, kind: "sub", ...opts };
}

export const CRITERIA_TREE: CriterionNode = {
  id: "root",
  label: "Analyse du match",
  kind: "root",
  children: [
    {
      id: "reglement",
      label: "Règlement",
      kind: "category",
      results: RES_OBTENU,
      children: [
        c("reg.faute-commise", "Faute commise (selon la décision de l’arbitre)", {}, [
          s("reg.faute-commise.tacle", "Tacle sanctionné"),
          s("reg.faute-commise.poussette", "Poussette / tirage sanctionné"),
          s("reg.faute-commise.dangereux", "Jeu dangereux sanctionné"),
        ]),
        c("reg.faute-subie", "Faute subie (selon la décision de l’arbitre)"),
        c("reg.hors-jeu", "Hors-jeu signalé"),
        c("reg.carton", "Carton jaune / rouge", { results: ["Jaune", "Rouge", "Autre"] }),
        c("reg.coup-franc", "Coup franc obtenu ou concédé"),
        c("reg.penalty", "Penalty obtenu ou concédé"),
      ],
    },
    {
      id: "physique",
      label: "Physique",
      kind: "category",
      results: RES_REUSSI,
      children: [
        c("phy.sprint", "Sprint", {}, [
          s("phy.sprint.avec", "Avec ballon"),
          s("phy.sprint.sans", "Sans ballon"),
        ]),
        c("phy.appel", "Appel"),
        c("phy.pressing", "Pressing"),
        c("phy.repli", "Repli"),
        c("phy.hi", "Course à haute intensité", {}, [
          s("phy.hi.s1", "Seuil de 19,8 km/h", { threshold: "hi1" }),
          s("phy.hi.s2", "Seuil de 25 km/h", { threshold: "hi2" }),
        ]),
        c("phy.acc", "Accélération / décélération", {}, [
          s("phy.acc.s", "Seuil supérieur à 2,5", { threshold: "acc" }),
        ]),
        c("phy.saut", "Saut"),
        c("phy.duel", "Duel physique"),
      ],
    },
    {
      id: "technique",
      label: "Technique",
      kind: "category",
      results: RES_REUSSI,
      children: [
        c(
          "tec.passe",
          "Passe",
          {
            evaluation: {
              success:
                "Le partenaire contrôle le ballon, ou la passe atteint la zone visée définie par le staff",
              fail: "La passe est interceptée, sort du terrain ou n’atteint pas la cible définie",
            },
          },
          [
            s("tec.passe.courte", "Courte"),
            s("tec.passe.longue", "Longue"),
            s("tec.passe.profondeur", "En profondeur"),
          ],
        ),
        c("tec.controle", "Contrôle", {
          evaluation: {
            success: "Le joueur garde le ballon et peut effectuer l’action suivante",
            fail: "Le ballon lui échappe ou est immédiatement récupéré par l’adversaire",
          },
        }),
        c("tec.dribble", "Dribble", {
          evaluation: {
            success: "Le joueur élimine son adversaire et conserve la possession",
            fail: "Il perd le ballon ou ne dépasse pas son adversaire",
          },
        }),
        c("tec.tir", "Tir", {
          evaluation: {
            success:
              "Selon l’objectif défini par le staff : tir cadré, but marqué ou zone visée atteinte",
            fail: "Le tir ne respecte pas l’objectif défini",
          },
        }),
        c("tec.centre", "Centre", {
          evaluation: {
            success: "Le ballon atteint un partenaire ou la zone de réception prévue",
            fail: "Il est intercepté, sort du terrain ou n’atteint pas la zone",
          },
        }),
        c("tec.tete", "Jeu de tête", {
          evaluation: {
            success: "Le joueur dirige le ballon vers un partenaire ou la zone visée",
            fail: "Le ballon est perdu ou envoyé hors de la cible",
          },
        }),
        c("tec.interception", "Interception", {
          evaluation: {
            success: "Le joueur récupère ou dévie le ballon et empêche la progression adverse",
            fail: "Il ne touche pas le ballon ou ne gêne pas l’action",
          },
        }),
      ],
    },
    {
      id: "mental",
      label: "Mental",
      kind: "category",
      results: RES_CONFORME,
      children: [
        c("men.encourage", "Encourage un partenaire"),
        c("men.communique", "Communique / donne une consigne"),
        c("men.erreur", "Réagit après une erreur"),
        c("men.arbitre", "Réagit après une décision arbitrale"),
        c("men.effort", "Continue l’effort après une action"),
        c("men.replace", "Se replace après la perte du ballon"),
        c("men.conteste", "Conteste une décision"),
      ],
    },
    {
      id: "tactique",
      label: "Tactique",
      kind: "category",
      children: [
        {
          id: "tac.individuel",
          label: "Individuel",
          kind: "tab",
          results: RES_REUSSI,
          children: [
            c("tac.ind.appel", "Appel / démarquage", {
              evaluation: {
                success:
                  "Le joueur se rend disponible dans la zone prévue ou libère un espace exploitable",
                note: "Évaluation selon le critère défini par le staff",
              },
            }),
            c("tac.ind.soutien", "Soutien au porteur", {
              evaluation: {
                success: "Le joueur propose une solution de passe jouable",
                fail: "Aucune solution n’est créée selon les consignes",
              },
            }),
            c("tac.ind.pressing", "Pressing", {
              evaluation: {
                success:
                  "Le joueur gêne la relance, force une passe en arrière ou provoque une perte de balle",
                fail: "Il est éliminé sans effet",
              },
            }),
            c("tac.ind.repli", "Repli défensif", {
              evaluation: {
                success: "Le joueur revient dans la zone prévue avant la progression adverse",
                fail: "Il ne se replace pas selon la consigne",
              },
            }),
            c("tac.ind.couverture", "Couverture d’un partenaire", {
              evaluation: {
                success:
                  "Le joueur protège l’espace laissé libre ou peut intervenir en cas de débordement",
              },
            }),
            c("tac.ind.placement", "Placement dans le bloc", {
              results: RES_CONFORME,
              evaluation: {
                success: "Conforme à la consigne tactique du staff",
                fail: "Non conforme à la consigne tactique du staff",
              },
            }),
          ],
        },
        {
          id: "tac.collectif",
          label: "Collectif",
          kind: "tab",
          results: ["Réussi", "Raté", "Conforme", "Non conforme", "Autre"],
          children: [
            {
              id: "col.off",
              label: "A. Organisation offensive",
              kind: "section",
              children: [
                c("col.off.sortie", "Sortie de balle", {}, [
                  s("col.off.sortie.courte", "Courte"),
                  s("col.off.sortie.longue", "Longue"),
                  s("col.off.sortie.mixte", "Mixte"),
                ]),
                c("col.off.perte-relance", "Perte de balle à la relance"),
                c("col.off.circuits", "Circuits de passes préférentiels", {}, [
                  s("col.off.circuits.gauche", "Côté gauche"),
                  s("col.off.circuits.droit", "Côté droit"),
                  s("col.off.circuits.axe", "Axe"),
                ]),
                c("col.off.progression", "Progression", {}, [
                  s("col.off.progression.couloirs", "Jeu dans les couloirs"),
                  s("col.off.progression.axe", "Jeu dans l’axe"),
                  s("col.off.progression.renversement", "Renversement de jeu"),
                  s("col.off.progression.profondeur", "Jeu en profondeur"),
                ]),
                c("col.off.occasions", "Création d’occasions", {}, [
                  s("col.off.occasions.centre", "Centre"),
                  s("col.off.occasions.profondeur", "Passe en profondeur"),
                  s("col.off.occasions.combine", "Jeu combiné"),
                  s("col.off.occasions.recup", "Tir après récupération"),
                ]),
                c("col.off.transitions", "Transitions offensives", {}, [
                  s("col.off.transitions.contre", "Contre-attaque"),
                  s("col.off.transitions.conservation", "Conservation après récupération"),
                  s("col.off.transitions.perte", "Perte rapide du ballon"),
                ]),
              ],
            },
            {
              id: "col.def",
              label: "B. Organisation défensive",
              kind: "section",
              children: [
                c("col.def.bloc", "Bloc équipe", {}, [
                  s("col.def.bloc.haut", "Haut"),
                  s("col.def.bloc.median", "Médian"),
                  s("col.def.bloc.bas", "Bas"),
                  s("col.def.bloc.compact", "Compact"),
                  s("col.def.bloc.etire", "Étiré"),
                ]),
                c("col.def.pressing", "Pressing collectif", {}, [
                  s("col.def.pressing.declencheur", "Déclencheur du pressing"),
                  s("col.def.pressing.recup", "Récupération"),
                  s("col.def.pressing.contourne", "Pressing contourné"),
                ]),
              ],
            },
            {
              id: "col.trans",
              label: "C. Transitions défensives",
              kind: "section",
              children: [
                c("col.trans.repli", "Repli collectif"),
                c("col.trans.contre-pressing", "Contre-pressing"),
                c("col.trans.contre-attaque", "Contre-attaque adverse concédée"),
              ],
            },
            {
              id: "col.buts",
              label: "D. Buts concédés",
              kind: "section",
              results: ["Concédé", "Autre"],
              children: [
                c("col.buts.perte", "Perte de balle à l’origine"),
                c("col.buts.espace", "Espace exploité"),
                c("col.buts.centre", "Centre"),
                c("col.buts.profondeur", "Passe en profondeur"),
                c("col.buts.combine", "Jeu combiné"),
                c("col.buts.recup", "Tir après récupération"),
              ],
            },
          ],
        },
      ],
    },
  ],
};

export interface IndexedNode {
  node: CriterionNode;
  parentId: string | null;
  /** Chemin d'ids depuis la racine (exclue) jusqu'au nœud inclus. */
  path: string[];
  categoryId: CategoryId | null;
  scope: Scope;
  depth: number;
}

export function buildIndex(root: CriterionNode = CRITERIA_TREE): Map<string, IndexedNode> {
  const map = new Map<string, IndexedNode>();
  const walk = (
    node: CriterionNode,
    parentId: string | null,
    path: string[],
    categoryId: CategoryId | null,
    scope: Scope,
    depth: number,
  ) => {
    const cat = node.kind === "category" ? (node.id as CategoryId) : categoryId;
    const sc: Scope = node.id === "tac.collectif" ? "collectif" : scope;
    const p = node.kind === "root" ? [] : [...path, node.id];
    map.set(node.id, { node, parentId, path: p, categoryId: cat, scope: sc, depth });
    node.children?.forEach((ch) => walk(ch, node.id, p, cat, sc, depth + 1));
  };
  walk(root, null, [], null, "individuel", 0);
  return map;
}

export const CRITERIA_INDEX = buildIndex();

export const CATEGORY_IDS: CategoryId[] = [
  "reglement",
  "physique",
  "technique",
  "mental",
  "tactique",
];

export function getNode(id: string): CriterionNode | undefined {
  return CRITERIA_INDEX.get(id)?.node;
}

/** Ids de tous les nœuds possédant des enfants (pour « Tout développer »). */
export function expandableIds(root: CriterionNode = CRITERIA_TREE): string[] {
  const out: string[] = [];
  const walk = (n: CriterionNode) => {
    if (n.children?.length) {
      out.push(n.id);
      n.children.forEach(walk);
    }
  };
  walk(root);
  return out;
}

/** Groupes de critères codables : catégorie directe ou onglet de Tactique. */
export type CodingGroupId = Exclude<CategoryId, "tactique"> | "tac.individuel" | "tac.collectif";

export function groupOf(nodeId: string): CodingGroupId | null {
  const entry = CRITERIA_INDEX.get(nodeId);
  if (!entry || !entry.categoryId) return null;
  if (entry.categoryId !== "tactique") return entry.categoryId;
  if (entry.path.includes("tac.collectif")) return "tac.collectif";
  if (entry.path.includes("tac.individuel")) return "tac.individuel";
  return null;
}

export interface CriterionOption {
  id: string;
  label: string;
  section?: string;
}

/** Critères (niveau « criterion ») d'un groupe, avec leur section éventuelle (collectif). */
export function criteriaOfGroup(groupId: CodingGroupId): CriterionOption[] {
  const groupNode = getNode(groupId);
  const out: CriterionOption[] = [];
  const walk = (n: CriterionNode, section?: string) => {
    if (n.kind === "criterion") {
      out.push({ id: n.id, label: n.label, section });
      return;
    }
    n.children?.forEach((ch) => walk(ch, n.kind === "section" ? n.label : section));
  };
  groupNode?.children?.forEach((ch) => walk(ch));
  return out;
}
