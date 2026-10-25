"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";

export default function ContentRail({ title, children }: { title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const t = useT();
  const [edges, setEdges] = useState({ overflow: false, start: true, end: false });

  useEffect(() => {
    const node = ref.current!;
    const measure = () => {
      const max = node.scrollWidth - node.clientWidth;
      const position = Math.abs(node.scrollLeft);
      const next = { overflow: max > 2, start: position < 2, end: position >= max - 2 };
      setEdges((current) => current.overflow === next.overflow && current.start === next.start && current.end === next.end ? current : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    const frame = requestAnimationFrame(measure);
    node.addEventListener("scroll", measure, { passive: true });
    return () => { observer.disconnect(); cancelAnimationFrame(frame); node.removeEventListener("scroll", measure); };
  }, []);

  function move(direction: number) {
    const node = ref.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: direction * (t.locale === "ar" ? -1 : 1) * node.clientWidth * 0.8, behavior: reduced ? "instant" : "smooth" });
  }

  return <div className="relative">
    {edges.overflow && <div className="mb-3 flex justify-end gap-2">
      <button type="button" aria-controls={id} aria-label={t("home.previous", { title })} disabled={edges.start} onClick={() => move(-1)} className="rail-arrow">
        <svg viewBox="0 0 24 24" className="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
      </button>
      <button type="button" aria-controls={id} aria-label={t("home.next", { title })} disabled={edges.end} onClick={() => move(1)} className="rail-arrow">
        <svg viewBox="0 0 24 24" className="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
      </button>
    </div>}
    <div ref={ref} id={id} role="region" aria-label={title} tabIndex={0} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-xl pb-4 pt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
      {children}
    </div>
  </div>;
}
