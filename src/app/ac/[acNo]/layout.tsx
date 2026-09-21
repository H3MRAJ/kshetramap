import { Suspense } from "react";
import { readFile } from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";

import { AcWorkspaceNav } from "@/components/AcWorkspaceNav";
import type { Meta } from "@/lib/types";

async function loadMeta(acNo: string): Promise<Meta | null> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "public", "data", `ac-${acNo}`, "meta.json"),
      "utf-8"
    );
    return JSON.parse(raw) as Meta;
  } catch {
    return null;
  }
}

export default async function AcLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ acNo: string }>;
}) {
  const { acNo } = await params;
  const meta = await loadMeta(acNo);
  if (!meta) notFound();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Suspense
        fallback={
          <header className="shrink-0 border-b border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
            AC {meta.constituency.ac_no} — {meta.constituency.name}
          </header>
        }
      >
        <AcWorkspaceNav
          acNo={meta.constituency.ac_no}
          acName={meta.constituency.name}
        />
      </Suspense>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}
