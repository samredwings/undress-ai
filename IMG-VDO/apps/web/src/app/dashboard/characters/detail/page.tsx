import { Suspense } from "react";
import CharacterDetailClient from "./character-detail-client";

export default function CharacterDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading…</div>}>
      <CharacterDetailClient />
    </Suspense>
  );
}

