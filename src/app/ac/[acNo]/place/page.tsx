import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import path from "path";

import PlacementLoader from "@/components/place/PlacementLoader";
import type { BoothCollection, Meta } from "@/lib/types";

export function generateStaticParams() {
  return [{ acNo: "178" }];
}

export const metadata = {
  title: "Booth placement · KshetraMap",
  robots: { index: false },
};

async function load(acNo: string): Promise<{
  meta: Meta;
  booths: BoothCollection;
  manifest: Record<string, string[]>;
} | null> {
  const dir = path.join(process.cwd(), "public", "data", `ac-${acNo}`);
  try {
    const [metaRaw, boothsRaw] = await Promise.all([
      readFile(path.join(dir, "meta.json"), "utf-8"),
      readFile(path.join(dir, "booths.geojson"), "utf-8"),
    ]);
    let manifest: Record<string, string[]> = {};
    try {
      const mRaw = await readFile(
        path.join(process.cwd(), "public", "booth_assets", `ac-${acNo}`, "manifest.json"),
        "utf-8"
      );
      manifest = JSON.parse(mRaw).booths ?? {};
    } catch {
      /* manifest optional */
    }
    return {
      meta: JSON.parse(metaRaw) as Meta,
      booths: JSON.parse(boothsRaw) as BoothCollection,
      manifest,
    };
  } catch {
    return null;
  }
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ acNo: string }>;
}) {
  const { acNo } = await params;
  const data = await load(acNo);
  if (!data) notFound();
  return (
    <PlacementLoader meta={data.meta} booths={data.booths} manifest={data.manifest} />
  );
}
