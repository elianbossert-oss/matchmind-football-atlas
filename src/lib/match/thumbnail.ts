/** Capture une image de la vidéo à l'instant donné (via un lecteur caché). */
export function captureFrame(
  src: string,
  time: number,
  remote: boolean,
): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (typeof document === "undefined" || !src) return resolve(undefined);
    const video = document.createElement("video");
    if (remote) video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "auto";
    video.playsInline = true;
    let finished = false;
    const done = (result?: string) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      resolve(result);
    };
    const timer = setTimeout(() => done(undefined), 6000);
    video.addEventListener("loadedmetadata", () => {
      const max = Number.isFinite(video.duration) ? video.duration : time;
      video.currentTime = Math.min(Math.max(0, time), Math.max(0, max - 0.05));
    });
    video.addEventListener("seeked", () => {
      try {
        const w = 240;
        const h = Math.round((w * (video.videoHeight || 9)) / (video.videoWidth || 16));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(video, 0, 0, w, h);
        done(canvas.toDataURL("image/jpeg", 0.7));
      } catch {
        done(undefined);
      }
    });
    video.addEventListener("error", () => done(undefined));
    video.src = src;
  });
}
