"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type Hls from "hls.js";
import type { Subtitle } from "@/lib/subtitles";
import { useT } from "@/lib/i18n/client";
import { ExpandIcon } from "@/components/Icons";

type Props = {
  src: string; poster?: string; progressKey?: string; startAt: number;
  nextHref?: string; watermark?: string; format?: "file" | "hls"; subtitles?: Subtitle[];
};
type Failure = "blocked" | "access" | "error" | null;

export default function Player({ src, poster, progressKey, startAt, nextHref, watermark, format = "file", subtitles = [] }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const hls = useRef<Hls | null>(null);
  const retries = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resume = useRef(startAt);
  const recovering = useRef(false);
  const router = useRouter();
  const [mark, setMark] = useState({ top: 10, left: 10 });
  const [failure, setFailure] = useState<Failure>(null);
  const [generation, setGeneration] = useState(0);
  const [levels, setLevels] = useState<{ height: number; bitrate: number }[]>([]);
  const [quality, setQuality] = useState(-1);
  const t = useT();

  const recover = useCallback(async () => {
    const v = ref.current;
    if (!v || recovering.current) return;
    recovering.current = true;
    resume.current = Number.isFinite(v.currentTime) && v.currentTime > 0 ? v.currentTime : resume.current;
    v.pause();
    try {
      const response = await fetch(src, { method: "HEAD", redirect: "manual" });
      if (response.status === 429) { setFailure("blocked"); return; }
      if (response.status === 401 || response.status === 403) { setFailure("access"); return; }
    } catch { /* A network failure is retried below. */ }
    if (retries.current >= 3) { setFailure("error"); return; }
    retries.current++;
    timer.current = setTimeout(() => { recovering.current = false; setGeneration((n) => n + 1); }, retries.current * 1000);
  }, [src]);

  useEffect(() => {
    const v = ref.current!;
    let disposed = false;
    recovering.current = false;
    const url = generation ? `${src}${src.includes("?") ? "&" : "?"}r=${Date.now()}` : src;
    const loaded = () => {
      if (resume.current > 5 && resume.current < v.duration - 10) v.currentTime = resume.current;
      v.play().catch(() => {});
    };
    v.addEventListener("loadedmetadata", loaded);
    async function load() {
      if (format === "hls" && !v.canPlayType("application/vnd.apple.mpegurl")) {
        const { default: Hls } = await import("hls.js");
        if (disposed) return;
        if (!Hls.isSupported()) { setFailure("error"); return; }
        const engine = new Hls();
        hls.current = engine;
        engine.on(Hls.Events.MANIFEST_PARSED, () => {
          setLevels(engine.levels.map((l) => ({ height: l.height, bitrate: l.bitrate })));
          setQuality(-1);
        });
        engine.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) void recover(); });
        engine.loadSource(url);
        engine.attachMedia(v);
      } else {
        v.src = url;
        v.load();
      }
    }
    load().catch(() => setFailure("error"));
    return () => {
      disposed = true;
      clearTimeout(timer.current);
      v.removeEventListener("loadedmetadata", loaded);
      hls.current?.destroy();
      hls.current = null;
      v.removeAttribute("src");
      v.load();
    };
  }, [src, format, generation, recover]);

  useEffect(() => {
    const v = ref.current!;
    let lastSaved = -10;
    const save = (completed = false, force = false) => {
      if (!progressKey || !Number.isFinite(v.currentTime) || (!force && Math.abs(v.currentTime - lastSaved) < 10)) return;
      lastSaved = v.currentTime;
      fetch("/api/progress", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: progressKey, seconds: v.currentTime, completed }), keepalive: true,
      }).catch(() => {});
    };
    const update = () => save();
    const paused = () => save(false, true);
    const ended = () => { save(true, true); if (nextHref) router.push(nextHref); };
    v.addEventListener("timeupdate", update);
    v.addEventListener("pause", paused);
    v.addEventListener("ended", ended);
    window.addEventListener("pagehide", paused);
    return () => {
      v.removeEventListener("timeupdate", update);
      v.removeEventListener("pause", paused);
      v.removeEventListener("ended", ended);
      window.removeEventListener("pagehide", paused);
    };
  }, [progressKey, nextHref, router]);

  useEffect(() => {
    if (!watermark) return;
    const id = setInterval(() => setMark({ top: 5 + Math.random() * 80, left: 5 + Math.random() * 60 }), 7000);
    return () => clearInterval(id);
  }, [watermark]);

  useEffect(() => {
    if (!watermark) return;
    const v = ref.current!;
    const beat = () => fetch("/api/heartbeat", { method: "POST", body: "{}" }).then((r) => {
      if (r.status === 429 || r.status === 401 || r.status === 403) {
        v.pause(); setFailure(r.status === 429 ? "blocked" : "access");
      }
    }).catch(() => {});
    const id = setInterval(() => { if (!v.paused) void beat(); }, 30000);
    const stop = () => navigator.sendBeacon?.("/api/heartbeat", JSON.stringify({ stop: true }));
    window.addEventListener("pagehide", stop);
    return () => { clearInterval(id); window.removeEventListener("pagehide", stop); stop(); };
  }, [watermark]);

  useEffect(() => {
    const v = ref.current!;
    let waiting: ReturnType<typeof setTimeout> | undefined;
    const stall = () => { clearTimeout(waiting); waiting = setTimeout(() => { if (!v.paused && v.readyState < 3) void recover(); }, 10000); };
    const playing = () => { clearTimeout(waiting); };
    v.addEventListener("waiting", stall);
    v.addEventListener("playing", playing);
    return () => { clearTimeout(waiting); v.removeEventListener("waiting", stall); v.removeEventListener("playing", playing); };
  }, [recover]);

  useEffect(() => {
    const onFullscreen = () => {
      if (document.fullscreenElement === ref.current && box.current) {
        document.exitFullscreen().then(() => box.current?.requestFullscreen()).catch(() => {});
      }
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (box.current?.requestFullscreen) box.current.requestFullscreen().catch(() => {});
    else (ref.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void })?.webkitEnterFullscreen?.();
  }

  return <div ref={box} className="relative overflow-hidden rounded-xl bg-black shadow-2xl">
    <video ref={ref} poster={poster} controls playsInline crossOrigin={subtitles.length ? "anonymous" : undefined}
      controlsList="nodownload noremoteplayback nofullscreen" disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()} onDoubleClick={(e) => { e.preventDefault(); toggleFullscreen(); }}
      onError={() => { if (ref.current?.getAttribute("src") || hls.current) void recover(); }}
      className="aspect-video h-full w-full">
      {subtitles.map((s) => <track key={`${s.language}:${s.src}`} kind="subtitles" src={s.src} srcLang={s.language} label={s.label} />)}
    </video>
    <div className="absolute end-3 top-3 flex gap-2">
      {levels.length > 1 && <label className="rounded bg-black/70 p-1 text-sm">{t("player.quality")}
        <select className="ms-2 bg-black text-white" value={quality} onChange={(e) => { const n = Number(e.target.value); if (hls.current) hls.current.currentLevel = n; setQuality(n); }}>
          <option value={-1}>{t("player.auto")}</option>{levels.map((l, i) => <option value={i} key={i}>{l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)} kbps`}</option>)}
        </select>
      </label>}
      <button type="button" onClick={toggleFullscreen} aria-label={t("player.fullscreen")} className="rounded-md bg-black/50 px-2.5 py-1 text-white/80"><ExpandIcon /></button>
    </div>
    {watermark && <span className="pointer-events-none absolute select-none whitespace-nowrap text-xs text-white/30 transition-all duration-1000 sm:text-sm" style={{ top: `${mark.top}%`, left: `${mark.left}%` }} dir="ltr">{watermark}</span>}
    {failure && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center">
      <p className="text-lg font-bold">{t(failure === "blocked" ? "player.blockedTitle" : failure === "access" ? "player.access" : "player.error")}</p>
      {failure === "blocked" && <p className="text-sm text-neutral-400">{t("player.blockedText")}</p>}
      <button className="btn-primary" onClick={() => { clearTimeout(timer.current); retries.current = 0; recovering.current = false; setFailure(null); setGeneration((n) => n + 1); }}>{t("player.retry")}</button>
      {failure === "access" && <a className="btn-ghost" href="/account">{t("nav.account")}</a>}
    </div>}
  </div>;
}
