import { readFile } from "fs/promises";
import path from "path";
import type { Meta } from "@/lib/types";
import { HomePageClient } from "@/components/HomePageClient";

async function loadPilotMeta(): Promise<Meta | null> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "public", "data", "ac-178", "meta.json"),
      "utf-8"
    );
    return JSON.parse(raw) as Meta;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const meta = await loadPilotMeta();
  return <HomePageClient meta={meta} />;
}
