import { Suspense } from "react";
import StoryEditorClient from "./editor-client";

export default function StoryEditorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading editor…</div>}>
      <StoryEditorClient />
    </Suspense>
  );
}

