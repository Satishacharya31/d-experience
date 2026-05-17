import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { BootSequence } from "@/components/lab/BootSequence";
import { HUD } from "@/components/lab/HUD";
import { CLI } from "@/components/lab/CLI";
import { CenterTitle } from "@/components/lab/CenterTitle";
import { Cursor } from "@/components/lab/Cursor";

const Scene = lazy(() =>
  import("@/components/lab/Scene").then((m) => ({ default: m.Scene })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "THE_LAB // satish.com.np" },
      {
        name: "description",
        content:
          "An immersive WebGL terminal — experiments in rendering, systems and late-night code by Satish.",
      },
      { property: "og:title", content: "THE_LAB // satish.com.np" },
      {
        property: "og:description",
        content: "Interactive 3D portfolio. Type a command. Engage.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [booted, setBooted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <main className="relative min-h-screen bg-background overflow-hidden scanlines noise">
      {mounted && (
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      )}
      <CenterTitle />
      <HUD />
      <CLI />
      {mounted && <Cursor />}
      {!booted && <BootSequence onDone={() => setBooted(true)} />}
    </main>
  );
}
