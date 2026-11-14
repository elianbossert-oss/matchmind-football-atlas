import { createFileRoute } from "@tanstack/react-router";
import { ChevronsDownUp, ChevronsUpDown, Plus, Search, Settings2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ActionForm, type ActionDraft } from "@/components/match/ActionForm";
import { MindMap } from "@/components/match/MindMap";
import { ResultsPanel } from "@/components/match/ResultsPanel";
import { StaffSettings } from "@/components/match/StaffSettings";
import { VideoPanel, type VideoSource } from "@/components/match/VideoPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CRITERIA_INDEX, expandableIds, getNode } from "@/lib/match/criteria";
import {
  DEFAULT_CONFIG,
  actionsForNode,
  countByNode,
  nodeLabel,
  normalize,
  playbackStart,
  scopeOf,
  type CodedAction,
  type Period,
  type StaffConfig,
} from "@/lib/match/logic";
import { captureFrame } from "@/lib/match/thumbnail";
import { usePersisted } from "@/lib/match/use-persisted";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Analyse du match — carte mentale vidéo" },
      {
        name: "description",
        content:
          "Carte mentale interactive pour coder les actions d’un match de football et revoir chaque séquence vidéo.",
      },
      { property: "og:title", content: "Analyse du match — carte mentale vidéo" },
      {
        property: "og:description",
        content: "Codez chaque action du match et retrouvez la séquence vidéo en un clic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysePage,
});

const KEY = "analyse-match:v1";

function AnalysePage() {
  const [actions, setActions] = usePersisted<CodedAction[]>(`${KEY}:actions`, []);
  const [config, setConfig] = usePersisted<StaffConfig>(`${KEY}:config`, DEFAULT_CONFIG);
  const [videoMeta, setVideoMeta] = usePersisted<VideoSource | null>(`${KEY}:video`, null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState("root");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);

  const source: VideoSource | null = videoMeta
    ? videoMeta.kind === "file"
      ? { ...videoMeta, url: fileUrl ?? "" }
      : videoMeta
    : null;

  const counts = useMemo(() => countByNode(actions), [actions]);
  const filtered = useMemo(() => actionsForNode(actions, selectedId), [actions, selectedId]);

  const searchResults = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return [...CRITERIA_INDEX.values()]
      .filter((e) => e.node.kind !== "root" && normalize(nodeLabel(e.node, config)).includes(q))
      .slice(0, 15);
  }, [query, config]);
  const matchSet = useMemo(
    () => (query.trim() ? new Set(searchResults.map((e) => e.node.id)) : null),
    [query, searchResults],
  );

  const actorsIndividual = useMemo(
    () => [...new Set(actions.filter((a) => scopeOf(a.nodeId) === "individuel").map((a) => a.actor))],
    [actions],
  );
  const actorsCollective = useMemo(
    () => [...new Set(actions.filter((a) => scopeOf(a.nodeId) === "collectif").map((a) => a.actor))],
    [actions],
  );
  const lastPeriod: Period =
    [...actions].sort((a, b) => b.createdAt - a.createdAt)[0]?.period ?? "1MT";

  // Défilement vers un nœud retrouvé par la recherche, une fois la branche dépliée.
  useEffect(() => {
    if (!pendingScroll) return;
    const els = document.querySelectorAll<HTMLElement>(`[data-node-id="${pendingScroll}"]`);
    const visible = [...els].find((el) => el.offsetParent !== null);
    visible?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    visible?.focus({ preventScroll: true });
    setPendingScroll(null);
  }, [pendingScroll, expanded]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    setActiveId(null);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setTimeout(() => document.getElementById("resultats")?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, []);

  const pickSearch = (id: string) => {
    const path = CRITERIA_INDEX.get(id)?.path ?? [];
    setExpanded((prev) => new Set([...prev, ...path.slice(0, -1)]));
    setSelectedId(id);
    setActiveId(null);
    setQuery("");
    setPendingScroll(id);
  };

  const play = (a: CodedAction) => {
    setActiveId(a.id);
    const video = videoRef.current;
    if (!video || !source?.url) {
      toast.error("Chargez d’abord la vidéo du match pour lire cette action.");
      return;
    }
    video.currentTime = playbackStart(a.videoTime, config.preRoll);
    void video.play().catch(() => undefined);
    const rect = video.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      video.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const step = (dir: -1 | 1) => {
    if (!filtered.length) return;
    const i = filtered.findIndex((a) => a.id === activeId);
    const next = i === -1 ? (dir === 1 ? 0 : filtered.length - 1) : i + dir;
    const target = filtered[next];
    if (target) play(target);
  };

  const currentTime = () => videoRef.current?.currentTime ?? null;

  const openNew = () => {
    const video = videoRef.current;
    video?.pause();
    const kind = getNode(selectedId)?.kind;
    setDraft({
      nodeId: kind === "criterion" || kind === "sub" ? selectedId : undefined,
      videoTime: video?.currentTime ?? 0,
    });
    setFormOpen(true);
  };

  const save: React.ComponentProps<typeof ActionForm>["onSave"] = (data) => {
    const existing = data.id ? actions.find((a) => a.id === data.id) : undefined;
    const id = existing?.id ?? crypto.randomUUID();
    const action: CodedAction = {
      ...data,
      id,
      createdAt: existing?.createdAt ?? Date.now(),
      thumbnail: existing && existing.videoTime === data.videoTime ? existing.thumbnail : undefined,
    };
    setActions((prev) => (existing ? prev.map((a) => (a.id === id ? action : a)) : [...prev, action]));
    setFormOpen(false);
    toast.success(existing ? "Action modifiée" : "Action enregistrée");
    if (source?.url && !action.thumbnail) {
      void captureFrame(source.url, action.videoTime, source.kind === "url").then((thumb) => {
        if (thumb) setActions((prev) => prev.map((a) => (a.id === id ? { ...a, thumbnail: thumb } : a)));
      });
    }
  };

  const onSource = (s: VideoSource) => {
    if (s.kind === "file") {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      setFileUrl(s.url);
      setVideoMeta({ kind: "file", name: s.name, url: "" });
    } else {
      setVideoMeta(s);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-primary">
            <span className="size-2 rounded-full bg-primary" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold uppercase leading-none tracking-wide sm:text-2xl">
              Analyse du match
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {actions.length} action{actions.length > 1 ? "s" : ""} codée{actions.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="soft" size="sm" onClick={() => setSettingsOpen(true)} aria-label="Paramètres staff">
            <Settings2 /> <span className="hidden sm:inline">Paramètres staff</span>
          </Button>
          <Button variant="hero" size="sm" onClick={openNew}>
            <Plus /> Ajouter une action
          </Button>
        </div>
      </header>

      <main className="grid flex-1 gap-4 p-4 lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:grid-rows-[auto_minmax(0,1fr)] lg:p-6">
        <div className="order-1 lg:col-start-2 lg:row-start-1">
          <VideoPanel videoRef={videoRef} source={source} onSource={onSource} preRoll={config.preRoll} />
        </div>

        <section className="order-2 flex min-h-[60dvh] flex-col overflow-hidden rounded-xl border bg-card shadow-panel lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:min-h-0">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <div className="relative min-w-0 flex-1 basis-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults[0]) pickSearch(searchResults[0].node.id);
                  if (e.key === "Escape") setQuery("");
                }}
                placeholder="Rechercher un critère…"
                className="pl-9 pr-9"
                aria-label="Rechercher un critère"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Effacer la recherche"
                >
                  <X className="size-4" />
                </button>
              )}
              {query.trim() && (
                <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border bg-popover p-1 shadow-panel">
                  {searchResults.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">Aucun critère trouvé</p>
                  ) : (
                    searchResults.map((e) => {
                      const parents = e.path
                        .slice(0, -1)
                        .map((id) => {
                          const n = getNode(id);
                          return n ? nodeLabel(n, config) : id;
                        })
                        .join(" › ");
                      const cat = e.scope === "collectif" ? "collectif" : e.categoryId ?? "root";
                      return (
                        <button
                          key={e.node.id}
                          type="button"
                          data-cat={cat}
                          onClick={() => pickSearch(e.node.id)}
                          className="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left hover:bg-accent"
                        >
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-branch" />
                          <span className="min-w-0">
                            <span className="block text-sm">{nodeLabel(e.node, config)}</span>
                            {parents && (
                              <span className="block truncate text-xs text-muted-foreground">{parents}</span>
                            )}
                          </span>
                          <span className="ml-auto font-mono text-xs text-muted-foreground">
                            {counts.get(e.node.id) ?? 0}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <Button variant="soft" size="sm" onClick={() => setExpanded(new Set(expandableIds()))}>
              <ChevronsUpDown /> Tout développer
            </Button>
            <Button variant="soft" size="sm" onClick={() => setExpanded(new Set())}>
              <ChevronsDownUp /> Tout réduire
            </Button>
          </div>
          <div className="pitch-canvas min-h-0 flex-1 overflow-auto">
            <MindMap
              expanded={expanded}
              onToggle={toggle}
              selectedId={selectedId}
              onSelect={select}
              counts={counts}
              matches={matchSet}
              config={config}
            />
          </div>
        </section>

        <div className="order-3 flex min-h-[24rem] flex-col lg:col-start-2 lg:row-start-2 lg:min-h-0">
          <ResultsPanel
            nodeId={selectedId}
            actions={filtered}
            activeId={activeId}
            config={config}
            onPlay={play}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onEdit={(a) => {
              videoRef.current?.pause();
              setDraft({ action: a, videoTime: a.videoTime });
              setFormOpen(true);
            }}
            onDelete={(a) => {
              setActions((prev) => prev.filter((x) => x.id !== a.id));
              if (activeId === a.id) setActiveId(null);
              toast("Action supprimée");
            }}
          />
        </div>
      </main>

      <ActionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        draft={draft}
        config={config}
        actorsIndividual={actorsIndividual}
        actorsCollective={actorsCollective}
        lastPeriod={lastPeriod}
        getCurrentTime={currentTime}
        onSave={save}
      />
      <StaffSettings open={settingsOpen} onOpenChange={setSettingsOpen} config={config} onSave={setConfig} />
    </div>
  );
}
