import { Minus, Plus } from "lucide-react";
import type { CSSProperties } from "react";

import { CRITERIA_INDEX, CRITERIA_TREE, type CriterionNode } from "@/lib/match/criteria";
import { nodeLabel, type StaffConfig } from "@/lib/match/logic";

interface MindMapProps {
  expanded: Set<string>;
  onToggle: (id: string) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  counts: Map<string, number>;
  matches: Set<string> | null;
  config: StaffConfig;
}

function catOf(node: CriterionNode): string {
  if (node.id === "root") return "root";
  if (CRITERIA_INDEX.get(node.id)?.scope === "collectif") return "collectif";
  return CRITERIA_INDEX.get(node.id)?.categoryId ?? "root";
}

function NodeButton({ node, ...p }: { node: CriterionNode } & MindMapProps) {
  const hasChildren = !!node.children?.length && node.kind !== "root";
  const isOpen = p.expanded.has(node.id);
  const count = p.counts.get(node.id) ?? 0;
  const label = nodeLabel(node, p.config);
  return (
    <button
      type="button"
      data-node-id={node.id}
      data-kind={node.kind}
      data-cat={catOf(node)}
      data-selected={p.selectedId === node.id}
      data-match={p.matches?.has(node.id) ?? false}
      data-dim={p.matches ? !p.matches.has(node.id) && node.kind !== "root" : false}
      className="mm-node"
      onClick={() => {
        p.onSelect(node.id);
        if (hasChildren && !isOpen) p.onToggle(node.id);
      }}
      aria-pressed={p.selectedId === node.id}
      aria-expanded={hasChildren ? isOpen : undefined}
      title={label}
    >
      <span className="min-w-0 flex-1">{label}</span>
      <span className="mm-count" data-empty={count === 0} aria-label={`${count} action(s)`}>
        {count}
      </span>
      {hasChildren && (
        <span
          role="button"
          tabIndex={-1}
          aria-label={isOpen ? "Réduire la branche" : "Développer la branche"}
          className="mm-toggle"
          onClick={(e) => {
            e.stopPropagation();
            p.onToggle(node.id);
          }}
        >
          {isOpen ? <Minus className="size-3" /> : <Plus className="size-3" />}
        </span>
      )}
    </button>
  );
}

function HBranch({ node, ...p }: { node: CriterionNode } & MindMapProps) {
  const open = p.expanded.has(node.id) && !!node.children?.length;
  return (
    <div className="mm-branch" data-cat={catOf(node)}>
      <NodeButton node={node} {...p} />
      {open && (
        <div className="mm-children">
          {node.children!.map((ch) => (
            <div key={ch.id} className="mm-child">
              <HBranch node={ch} {...p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VBranch({ node, ...p }: { node: CriterionNode } & MindMapProps) {
  const open = p.expanded.has(node.id) && !!node.children?.length;
  return (
    <div data-cat={catOf(node)} className="flex flex-col items-start">
      <NodeButton node={node} {...p} />
      {open && (
        <div className="mm-vlist">
          {node.children!.map((ch) => (
            <VBranch key={ch.id} node={ch} {...p} />
          ))}
        </div>
      )}
    </div>
  );
}

const LEFT = ["reglement", "physique", "technique"];

export function MindMap(props: MindMapProps) {
  const cats = CRITERIA_TREE.children ?? [];
  const left = cats.filter((c) => LEFT.includes(c.id));
  const right = cats.filter((c) => !LEFT.includes(c.id));
  const lineVar = { "--branch": "var(--muted-foreground)" } as CSSProperties;

  return (
    <>
      {/* Ordinateur / tablette : carte radiale gauche-droite */}
      <div className="hidden min-h-full min-w-max items-center justify-center p-10 md:flex">
        <div className="mm-dir-left" style={lineVar}>
          <div className="mm-children mm-root-lines">
            {left.map((c) => (
              <div key={c.id} className="mm-child" data-cat={c.id}>
                <HBranch node={c} {...props} />
              </div>
            ))}
          </div>
        </div>
        <NodeButton node={CRITERIA_TREE} {...props} />
        <div className="mm-dir-right" style={lineVar}>
          <div className="mm-children mm-root-lines">
            {right.map((c) => (
              <div key={c.id} className="mm-child" data-cat={c.id}>
                <HBranch node={c} {...props} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Téléphone : arbre vertical */}
      <div className="flex flex-col items-start gap-1 p-4 md:hidden">
        <NodeButton node={CRITERIA_TREE} {...props} />
        <div className="mm-vlist w-full" data-cat="root">
          {cats.map((c) => (
            <VBranch key={c.id} node={c} {...props} />
          ))}
        </div>
      </div>
    </>
  );
}
