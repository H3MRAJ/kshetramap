"use client";

import type { BasemapId, MapMode, MapSettings } from "@/lib/types";
import { BASEMAPS } from "@/lib/mapStyles";
import { ModeToggle } from "./ModeToggle";

type Props = {
  open: boolean;
  onToggle: () => void;
  settings: MapSettings;
  onChange: (patch: Partial<MapSettings>) => void;
  onReset: () => void;
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  basemap: BasemapId;
  onBasemapChange: (id: BasemapId) => void;
  memberName?: string;
};

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span>{label}</span>
        <span className="tabular-nums font-medium text-zinc-800 dark:text-zinc-200">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-emerald-700"
      />
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 py-1">
      <div>
        <div className="text-sm text-zinc-800 dark:text-zinc-100">{label}</div>
        {description && (
          <div className="text-[11px] leading-snug text-zinc-400">
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
    </label>
  );
}

export function AdvancedSettings({
  open,
  onToggle,
  settings,
  onChange,
  onReset,
  mode,
  onModeChange,
  basemap,
  onBasemapChange,
  memberName,
}: Props) {
  return (
    <div className="pointer-events-auto w-[min(92vw,320px)] rounded-xl border border-zinc-200/80 bg-white/95 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Advanced settings
        </span>
        <span className="text-xs text-zinc-400">{open ? "Hide ▲" : "Show ▼"}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-zinc-100 px-3 py-3 dark:border-zinc-800">
          <div>
            <div className="mb-1.5 text-xs font-medium text-zinc-500">Mode</div>
            <ModeToggle mode={mode} onChange={onModeChange} />
          </div>

          <div>
            <div className="mb-1.5 text-xs font-medium text-zinc-500">Basemap</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(BASEMAPS) as BasemapId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onBasemapChange(id)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                    basemap === id
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-100"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {BASEMAPS[id].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-medium text-zinc-500">Markers</div>
            <SliderRow
              label="Size"
              value={settings.markerScale}
              min={0.5}
              max={2.5}
              step={0.1}
              display={`${settings.markerScale.toFixed(1)}×`}
              onChange={(markerScale) => onChange({ markerScale })}
            />
            <SliderRow
              label="Opacity"
              value={settings.markerOpacity}
              min={0.25}
              max={1}
              step={0.05}
              display={`${Math.round(settings.markerOpacity * 100)}%`}
              onChange={(markerOpacity) => onChange({ markerOpacity })}
            />
            <SliderRow
              label="Min votes filter"
              value={settings.minVotes}
              min={0}
              max={1200}
              step={25}
              display={
                settings.minVotes === 0 ? "All" : `≥ ${settings.minVotes}`
              }
              onChange={(minVotes) => onChange({ minVotes })}
            />
            <SliderRow
              label="Fly-to zoom"
              value={settings.flyZoom}
              min={11}
              max={17}
              step={0.5}
              display={String(settings.flyZoom)}
              onChange={(flyZoom) => onChange({ flyZoom })}
            />
          </div>

          <div className="space-y-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
            <ToggleRow
              label="Booth number labels"
              description="Show booth # next to markers (busy at full AC zoom)"
              checked={settings.showLabels}
              onChange={(showLabels) => onChange({ showLabels })}
            />
            <ToggleRow
              label="Marker halo"
              description="White ring behind circles for contrast"
              checked={settings.showHalo}
              onChange={(showHalo) => onChange({ showHalo })}
            />
            <ToggleRow
              label="Flag uncertain pins"
              description="Highlight less certain pin positions"
              checked={settings.flagUnverified}
              onChange={(flagUnverified) => onChange({ flagUnverified })}
            />
            <ToggleRow
              label="Highlight member wins"
              description={
                memberName
                  ? `Dim booths not won by ${memberName}`
                  : "Dim booths not won by selected member"
              }
              checked={settings.highlightMemberWins}
              onChange={(highlightMemberWins) =>
                onChange({ highlightMemberWins })
              }
            />
            <ToggleRow
              label="Only member wins"
              description="Hide booths the selected member did not win"
              checked={settings.onlyMemberWins}
              onChange={(onlyMemberWins) => onChange({ onlyMemberWins })}
            />
          </div>

          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-lg border border-zinc-200 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Reset settings
          </button>
        </div>
      )}
    </div>
  );
}
