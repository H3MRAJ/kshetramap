"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: (password: string) => void | Promise<void>;
  onCancel: () => void;
  error?: string | null;
};

export function PasswordDialog({
  open,
  title = "Confirm move",
  message = "Enter password to save the new booth position.",
  onConfirm,
  onCancel,
  error,
}: Props) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPassword("");
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    try {
      await onConfirm(password);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-zinc-700 bg-black p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-zinc-400">{message}</p>
        <label className="mt-4 flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
          Password
          <input
            ref={inputRef}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            placeholder="••••"
          />
        </label>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !password}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
