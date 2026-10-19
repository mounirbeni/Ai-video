"use client";

import { useState } from "react";

export default function UploadField({
  name, label, kind, defaultValue, required, hint,
}: { name: string; label: string; kind: "video" | "image"; defaultValue?: string | null; required?: boolean; hint?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState("");

  function send(method: string, url: string, file: File, contentType: string | null, done: (xhr: XMLHttpRequest) => void) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => e.lengthComputable && setPct(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => { setPct(null); done(xhr); };
    xhr.onerror = () => { setPct(null); setErr("فشل الرفع"); };
    xhr.send(file);
  }

  async function upload(file: File) {
    setErr("");
    setPct(0);
    const qs = `kind=${kind}&name=${encodeURIComponent(file.name)}`;
    const init = await fetch(`/api/admin/upload?${qs}`, { method: "POST" }).then((r) => r.json()).catch(() => null);
    if (!init || init.error) { setPct(null); setErr(init?.error || "فشل الرفع"); return; }

    if (init.direct) {
      // رفع مباشر إلى حاوية Neon عبر رابط موقّع
      send("PUT", init.uploadUrl, file, init.contentType, (xhr) =>
        xhr.status >= 200 && xhr.status < 300 ? setValue(init.value) : setErr(`فشل الرفع (${xhr.status})`));
      return;
    }
    send("PUT", `/api/admin/upload?${qs}`, file, null, (xhr) => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status === 200) setValue(res.value);
        else setErr(res.error || "فشل الرفع");
      } catch {
        setErr("فشل الرفع");
      }
    });
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        <input name={name} value={value} onChange={(e) => setValue(e.target.value)} required={required} className="input" dir="ltr" placeholder="https://… أو ارفع ملفًا" />
        <label className="btn-ghost cursor-pointer whitespace-nowrap">
          رفع
          <input type="file" hidden accept={kind === "video" ? "video/*" : "image/*"} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      </div>
      {pct !== null && (
        <div className="mt-2 h-2 overflow-hidden rounded bg-white/10"><div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} /></div>
      )}
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
      {err && <p className="mt-1 text-sm text-red-400">{err}</p>}
      {kind === "image" && value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-2 h-24 rounded object-cover" />
      )}
    </div>
  );
}
