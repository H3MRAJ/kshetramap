"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { appBasePath } from "@/lib/boothOverrides";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Manifest = {
  panel_order?: string[];
  booths: Record<string, string[]>;
};

// Fetch the per-AC manifest once, cache the promise across all popups.
const manifestCache: Record<number, Promise<Manifest>> = {};
function loadManifest(acNo: number): Promise<Manifest> {
  if (!manifestCache[acNo]) {
    const url = `${appBasePath()}/booth_assets/ac-${acNo}/manifest.json`;
    manifestCache[acNo] = fetch(url)
      .then((r) => (r.ok ? r.json() : { booths: {} }))
      .catch(() => ({ booths: {} }));
  }
  return manifestCache[acNo];
}

const PANEL_LABELS: Record<string, { en: string; hi: string }> = {
  google_map: { en: "Map", hi: "नक्शा" },
  ps_building_front: { en: "Building", hi: "भवन" },
  ps_front: { en: "Front", hi: "सामने" },
  cad: { en: "Layout", hi: "ख़ाका" },
  key_map: { en: "Route", hi: "रास्ता" },
  nazri_naksha: { en: "Sketch", hi: "क्षेत्र नक्शा" },
};

type Props = {
  acNo: number;
  boothNo: number;
  /** Start expanded (mobile sheet has more room) */
  defaultOpen?: boolean;
  /** Wrapper classes; nothing renders when the booth has no images */
  className?: string;
};

export function BoothAssets({
  acNo,
  boothNo,
  defaultOpen = false,
  className = "",
}: Props) {
  const { locale } = useLanguage();
  const [panels, setPanels] = useState<string[]>([]);
  const [open, setOpen] = useState(defaultOpen);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    loadManifest(acNo).then((m) => {
      if (alive) setPanels(m.booths?.[String(boothNo)] ?? []);
    });
    return () => {
      alive = false;
    };
  }, [acNo, boothNo]);

  // Reset when switching booths
  useEffect(() => {
    setOpen(defaultOpen);
    setLightbox(null);
  }, [boothNo, defaultOpen]);

  const label = (p: string) =>
    (PANEL_LABELS[p] ?? { en: p, hi: p })[locale === "hi" ? "hi" : "en"];
  const src = (p: string) =>
    `${appBasePath()}/booth_assets/ac-${acNo}/booth-number-${boothNo}/${p}.webp`;

  if (panels.length === 0) return null; // no annex images for this booth

  const title = locale === "hi" ? "बूथ तस्वीरें" : "Booth photos";
  const openLabel =
    locale === "hi"
      ? `बूथ तस्वीरें देखें (${panels.length})`
      : `View booth photos (${panels.length})`;
  const hideLabel = locale === "hi" ? "तस्वीरें छिपाएँ" : "Hide photos";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-800"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
            <path d="M5 17l4-4 3 3 3-3 4 4" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          {open ? hideLabel : openLabel}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {panels.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => setLightbox(i)}
              className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              title={label(p)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src(p)}
                alt={label(p)}
                loading="lazy"
                className="h-16 w-full object-cover transition group-hover:opacity-90"
              />
              <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-[9px] font-medium text-white">
                {label(p)}
              </span>
            </button>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <Lightbox
          panels={panels}
          index={lightbox}
          src={src}
          label={label}
          boothNo={boothNo}
          onClose={() => setLightbox(null)}
          onNav={(d) =>
            setLightbox((n) =>
              n === null ? null : (n + d + panels.length) % panels.length
            )
          }
        />
      )}
    </div>
  );
}

function Lightbox({
  panels,
  index,
  src,
  label,
  boothNo,
  onClose,
  onNav,
}: {
  panels: string[];
  index: number;
  src: (p: string) => string;
  label: (p: string) => string;
  boothNo: number;
  onClose: () => void;
  onNav: (dir: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNav(1);
      else if (e.key === "ArrowLeft") onNav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNav]);

  const p = panels[index];
  const body = (
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div className="mb-2 text-sm font-medium text-white/90">
        {`Booth ${boothNo} · ${label(p)}`}
        <span className="ml-2 text-white/50">
          {index + 1}/{panels.length}
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src(p)}
        alt={label(p)}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
      />
      {panels.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNav(-1);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-2xl leading-none text-white hover:bg-white/25"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNav(1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-2xl leading-none text-white hover:bg-white/25"
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded-full bg-white/15 px-3 py-1 text-sm text-white hover:bg-white/25"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(body, document.body);
}
