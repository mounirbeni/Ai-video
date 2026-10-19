"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = { src: string; poster?: string; progressKey?: string; startAt: number; nextHref?: string };

export default function Player({ src, poster, progressKey, startAt, nextHref }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const router = useRouter();

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

  return (
    <div className="overflow-hidden rounded-xl bg-black shadow-2xl">
      <video
        ref={ref}
        src={src}
        poster={poster}
        controls
        autoPlay
        playsInline
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={(e) => {
          if (startAt > 5 && startAt < e.currentTarget.duration - 10) e.currentTarget.currentTime = startAt;
        }}
        onEnded={() => nextHref && router.push(nextHref)}
        className="aspect-video w-full"
      />
    </div>
  );
}
