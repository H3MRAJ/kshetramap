"use client";

import { useT } from "@/lib/i18n/LanguageProvider";

type Props = {
  boothNo: number | null;
  dragEnabled: boolean;
  hasPending: boolean;
  pendingLat?: number;
  pendingLng?: number;
  onEnableDrag: () => void;
  onDisableDrag: () => void;
  onConfirm: () => void;
  onReset: () => void;
};

export function BoothDragControls({
  boothNo,
  dragEnabled,
  hasPending,
  pendingLat,
  pendingLng,
  onEnableDrag,
  onDisableDrag,
  onConfirm,
  onReset,
}: Props) {
  const t = useT();
  if (boothNo == null) {
    return (
      <p className="text-[11px] text-zinc-500">{t("drag.selectFirst")}</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[10px] leading-snug text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200/90">
        {t("drag.personalOnly")}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-zinc-900 dark:text-white">
          {t("booth.booth", { n: boothNo })}
        </div>
        {!dragEnabled ? (
          <button
            type="button"
            onClick={onEnableDrag}
            className="rounded-lg border border-amber-500/60 bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-200 dark:border-amber-600/60 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
          >
            {t("drag.enable")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onDisableDrag}
            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {t("drag.exit")}
          </button>
        )}
      </div>

      {dragEnabled && !hasPending && (
        <p className="text-[11px] text-amber-800 dark:text-amber-200/90">
          {t("drag.dragHint")}
        </p>
      )}

      {hasPending && pendingLat != null && pendingLng != null && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2 dark:border-emerald-800 dark:bg-emerald-950/50">
          <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
            {t("drag.previewPos")}{" "}
            <span className="tabular-nums text-zinc-900 dark:text-white">
              {pendingLat.toFixed(5)}, {pendingLng.toFixed(5)}
            </span>
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onConfirm}
              title={t("drag.saveHint")}
              className="flex h-10 flex-1 items-center justify-center rounded-lg bg-emerald-600 text-lg font-bold text-white hover:bg-emerald-500"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={onReset}
              title={t("common.close")}
              className="flex h-10 flex-1 items-center justify-center rounded-lg bg-red-700 text-lg font-bold text-white hover:bg-red-600"
            >
              ✕
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-zinc-500">{t("drag.saveHint")}</p>
        </div>
      )}
    </div>
  );
}
