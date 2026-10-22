"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { ExpandIcon } from "@/components/Icons";

type Props = {
  src: string;
  poster?: string;
  progressKey?: string;
  startAt: number;
  nextHref?: string;
  watermark?: string;
};

export default function Player({ src, poster, progressKey, startAt, nextHref, watermark }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [mark, setMark] = useState({ top: 10, left: 10 });
  const [blocked, setBlocked] = useState(false);
  const retry = useRef({ at: 0, count: 0 });
  const t = useT();

  // حفظ موضع المشاهدة
  useEffect(() => {
    const v = ref.current;
    if (!v || !progressKey) return;
    let last = 0;
    const save = () => {
      if (Math.abs(v.currentTime - last) < 5) return;
      last = v.currentTime;
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: progressKey, seconds: v.currentTime }),
        keepalive: true,
      }).catch(() => {});
    };
    v.addEventListener("timeupdate", save);
    v.addEventListener("pause", save);
    return () => {
      v.removeEventListener("timeupdate", save);
      v.removeEventListener("pause", save);
    };
  }, [progressKey]);

  // العلامة المائية تتنقل عشوائيًا حتى لا يسهل قصّها
  useEffect(() => {
    if (!watermark) return;
    const id = setInterval(() => setMark({ top: 5 + Math.random() * 80, left: 5 + Math.random() * 60 }), 7000);
    return () => clearInterval(id);
  }, [watermark]);

  // ملء الشاشة للحاوية (لا للفيديو وحده) حتى تبقى العلامة المائية ظاهرة
  useEffect(() => {
    const onFs = () => {
      if (document.fullscreenElement === ref.current && box.current) {
        document.exitFullscreen().then(() => box.current?.requestFullscreen()).catch(() => {});
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // نبضة كل 30 ثانية أثناء التشغيل لمنع مشاركة الحساب
  useEffect(() => {
    if (!watermark) return;
    const v = ref.current!;
    const beat = () =>
      fetch("/api/heartbeat", { method: "POST", body: "{}" })
        .then((r) => {
          if (r.status === 429) {
            v.pause();
            setBlocked(true);
          }
        })
        .catch(() => {});
    const id = setInterval(() => !v.paused && beat(), 30000);
    const stop = () => navigator.sendBeacon?.("/api/heartbeat", JSON.stringify({ stop: true }));
    window.addEventListener("pagehide", stop);
    return () => {
      clearInterval(id);
      window.removeEventListener("pagehide", stop);
    };
  }, [watermark]);

  // قد يفشل التحميل قبل أن يُربط معالج الخطأ (الفيديو يبدأ قبل اكتمال تحميل الصفحة)
  useEffect(() => {
    if (ref.current?.error) onError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // عند انتهاء الرابط يتوقف المتصفح عن التحميل دون خطأ؛ إن طال الانتظار نجدد الرابط
  useEffect(() => {
    const v = ref.current!;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const waiting = () => {
      clearTimeout(timer);
      timer = setTimeout(() => v.readyState < 3 && !v.paused && onError(), 3000);
    };
    const resumed = () => clearTimeout(timer);
    v.addEventListener("waiting", waiting);
    v.addEventListener("playing", resumed);
    return () => {
      clearTimeout(timer);
      v.removeEventListener("waiting", waiting);
      v.removeEventListener("playing", resumed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleFullscreen() {
    const el = box.current!;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    // iPhone لا يدعم ملء الشاشة لغير الفيديو: نستخدم ملء الشاشة الأصلي (تختفي العلامة المائية هناك)
    else (ref.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.();
  }

  // الرابط الموقّع قصير العمر: عند انتهائه نطلب رابطًا جديدًا ونكمل من نفس الموضع
  function onError() {
    const v = ref.current!;
    const now = Date.now();
    if (now - retry.current.at > 60000) retry.current.count = 0;
    if (retry.current.count >= 3) return;
    retry.current = { at: now, count: retry.current.count + 1 };
    const t = v.currentTime;
    const playing = !v.paused || v.autoplay;
    // redirect: "manual" — لا نتبع التحويل إلى التخزين (نطاق آخر)، يكفينا معرفة إن كان الوصول مرفوضًا
    fetch(src, { method: "HEAD", redirect: "manual" })
      .then((r) => r.status)
      .catch(() => 0)
      .then((status) => {
        if (status === 429) return setBlocked(true);
        v.src = `${src}?r=${now}`;
        v.addEventListener("loadedmetadata", () => { v.currentTime = t; if (playing) v.play().catch(() => {}); }, { once: true });
        v.load();
      });
  }

  return (
    <div ref={box} className="relative overflow-hidden rounded-xl bg-black shadow-2xl">
      <video
        ref={ref}
        src={src}
        poster={poster}
        controls
        autoPlay
        playsInline
        controlsList="nodownload noremoteplayback nofullscreen"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onDoubleClick={(e) => {
          e.preventDefault();
          toggleFullscreen();
        }}
        onLoadedMetadata={(e) => {
          if (startAt > 5 && startAt < e.currentTarget.duration - 10 && retry.current.count === 0)
            e.currentTarget.currentTime = startAt;
        }}
        onError={onError}
        onEnded={() => nextHref && router.push(nextHref)}
        className="aspect-video h-full w-full"
      />
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={t("player.fullscreen")}
        className="absolute end-3 top-3 rounded-md bg-black/50 px-2.5 py-1 text-sm text-white/80 hover:bg-black/70"
      >
        <ExpandIcon />
      </button>
      {watermark && (
        <span
          className="pointer-events-none absolute select-none whitespace-nowrap text-xs text-white/30 transition-all duration-1000 sm:text-sm"
          style={{ top: `${mark.top}%`, left: `${mark.left}%` }}
          dir="ltr"
        >
          {watermark}
        </span>
      )}
      {blocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center">
          <p className="text-lg font-bold">{t("player.blockedTitle")}</p>
          <p className="text-sm text-neutral-400">{t("player.blockedText")}</p>
          <button className="btn-primary" onClick={() => location.reload()}>{t("player.retry")}</button>
        </div>
      )}
    </div>
  );
}
