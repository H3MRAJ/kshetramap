import { Suspense } from "react";
import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import path from "path";

import BoothMapLoader from "@/components/BoothMapLoader";
import type { BoothCollection, Meta, PlaceCollection } from "@/lib/types";

async function loadAc(
  acNo: string
): Promise<{
  meta: Meta;
  booths: BoothCollection;
  places: PlaceCollection | null;
  boundary: GeoJSON.Feature | GeoJSON.FeatureCollection | null;
} | null> {
  const dir = path.join(process.cwd(), "public", "data", `ac-${acNo}`);
  try {
    const [metaRaw, boothsRaw, placesRaw, boundaryRaw] = await Promise.all([
      readFile(path.join(dir, "meta.json"), "utf-8"),
      readFile(path.join(dir, "booths.geojson"), "utf-8"),
      readFile(path.join(dir, "places.geojson"), "utf-8").catch(() => null),
      readFile(path.join(dir, "boundary.geojson"), "utf-8").catch(() => null),
    ]);
    return {
      meta: JSON.parse(metaRaw) as Meta,
      booths: JSON.parse(boothsRaw) as BoothCollection,
      places: placesRaw ? (JSON.parse(placesRaw) as PlaceCollection) : null,
      boundary: boundaryRaw
        ? (JSON.parse(boundaryRaw) as
            | GeoJSON.Feature
            | GeoJSON.FeatureCollection)
        : null,
    };
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
  const data = await loadAc(acNo);
  if (!data) return { title: "AC not found · KshetraMap" };
  return {
    title: `${data.meta.constituency.ac_no} ${data.meta.constituency.name} · Map · KshetraMap`,
    description: `Booth-wise results map — ${data.meta.election.name}`,
  };
}

export default async function AcPage({
  params,
}: {
  params: Promise<{ acNo: string }>;
}) {
  const { acNo } = await params;
  const data = await loadAc(acNo);
  if (!data) notFound();

  return (
    <main className="relative h-full min-h-0 w-full">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Loading map…
          </div>
        }
      >
        <BoothMapLoader
          meta={data.meta}
          booths={data.booths}
          places={data.places}
          boundary={data.boundary}
        />
      </Suspense>
    </main>
  );
}
