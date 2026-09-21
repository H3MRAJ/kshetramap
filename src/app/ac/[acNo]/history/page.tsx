import { Suspense } from "react";
import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import path from "path";

import { HistoryWorkspace } from "@/components/history/HistoryWorkspace";
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

export async function generateStaticParams() {
  return [{ acNo: "178" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ acNo: string }>;
}) {
  const { acNo } = await params;
  const meta = await loadMeta(acNo);
  if (!meta) return { title: "History · KshetraMap" };
  return {
    title: `${meta.constituency.ac_no} ${meta.constituency.name} · History · KshetraMap`,
    description: `Multi-election booth history — ${meta.constituency.name}`,
  };
}

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ acNo: string }>;
}) {
  const { acNo } = await params;
  const meta = await loadMeta(acNo);
  if (!meta) notFound();

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-zinc-500">
          Loading history…
        </div>
      }
    >
      <HistoryWorkspace
        acNo={meta.constituency.ac_no}
        acName={meta.constituency.name}
        electionsAvailable={meta.elections_available ?? [2025]}
      />
    </Suspense>
  );
}
