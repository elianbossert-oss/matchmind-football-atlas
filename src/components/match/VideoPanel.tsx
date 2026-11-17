import { FileVideo, Link2, RotateCcw } from "lucide-react";
import { useRef, useState, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface VideoSource {
  kind: "file" | "url";
  url: string;
  name: string;
}

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  source: VideoSource | null;
  onSource: (s: VideoSource) => void;
  preRoll: number;
}

export function VideoPanel({ videoRef, source, onSource, preRoll }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState("");
  const [open, setOpen] = useState(false);
  const missingFile = source?.kind === "file" && !source.url;

  const pick = (
    <div className="flex flex-wrap gap-2">
      <input
        ref={fileInput}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSource({ kind: "file", url: URL.createObjectURL(f), name: f.name });
          e.target.value = "";
        }}
      />
      <Button size="sm" variant="soft" onClick={() => fileInput.current?.click()}>
        <FileVideo /> {missingFile ? "Recharger le fichier" : "Fichier vidéo"}
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="soft">
            <Link2 /> Lien vidéo
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!link.trim()) return;
              onSource({
                kind: "url",
                url: link.trim(),
                name: link.trim().split("/").pop() || "Vidéo",
              });
              setOpen(false);
            }}
          >
            <p className="text-xs text-muted-foreground">
              Lien direct vers un fichier vidéo (MP4, WebM…).
            </p>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…/match.mp4"
              autoFocus
            />
            <Button type="submit" size="sm" className="w-full">
              Charger
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-panel">
      <div className="relative aspect-video bg-background">
        {source?.url ? (
          <video
            ref={videoRef}
            src={source.url}
            controls
            playsInline
            preload="metadata"
            crossOrigin={source.kind === "url" ? "anonymous" : undefined}
            className="h-full w-full bg-background"
          />
        ) : (
          <div className="pitch-canvas flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="font-display text-2xl uppercase tracking-wide">
              {missingFile ? "Rechargez la vidéo" : "Aucune vidéo chargée"}
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {missingFile
                ? `Sélectionnez à nouveau « ${source?.name} » pour retrouver les séquences codées.`
                : "Chargez la vidéo du match pour coder les actions et les revoir."}
            </p>
            {pick}
          </div>
        )}
      </div>
      {source?.url && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2">
          <p className="min-w-0 truncate text-xs text-muted-foreground" title={source.name}>
            <span className="text-foreground">{source.name}</span>
            <span className="ml-2 inline-flex items-center gap-1">
              <RotateCcw className="size-3" /> lecture {preRoll} s avant l’action
            </span>
          </p>
          {pick}
        </div>
      )}
    </section>
  );
}
