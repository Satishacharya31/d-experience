import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { BootSequence } from "@/components/lab/BootSequence";
import { HUD } from "@/components/lab/HUD";
import { CLI } from "@/components/lab/CLI";
import { Cursor } from "@/components/lab/Cursor";
import { WorldHUD } from "@/components/world/WorldHUD";
import { ZonePanel } from "@/components/world/ZonePanel";
import type { ZoneId } from "@/components/world/Buildings";

const VoxelWorld = lazy(() =>
  import("@/components/world/VoxelWorld").then((m) => ({ default: m.VoxelWorld })),
);

const SITE_URL = "https://satish.com.np";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const TITLE = "THE_LAB // satish.com.np — open-world 3D portfolio";
const DESCRIPTION =
  "Walk through Satish's open-world portfolio: a voxel hacker world with About, Projects, Skills and Contact zones — built in WebGL with React Three Fiber.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "keywords", content: "Satish, satish.com.np, 3D portfolio, WebGL, React Three Fiber, open world, voxel, creative developer, Nepal" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: SITE_URL + "/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1216" },
      { property: "og:image:height", content: "640" },
      { property: "og:image:alt", content: "THE_LAB — open-world voxel portfolio" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Satish",
          url: SITE_URL,
          jobTitle: "Creative Frontend Engineer",
          sameAs: [SITE_URL],
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [booted, setBooted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [zone, setZone] = useState<ZoneId | null>(null);
  const [openZone, setOpenZone] = useState<ZoneId | null>(null);
  const [cliOpen, setCliOpen] = useState(false);
  const interactRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // global key handlers: E to enter zone, ` to toggle CLI
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`" || e.code === "Backquote") {
        e.preventDefault();
        setCliOpen((v) => !v);
      } else if ((e.key === "e" || e.key === "E") && !openZone) {
        interactRef.current = true;
      } else if (e.key === "Escape") {
        if (openZone) setOpenZone(null);
        else if (cliOpen) setCliOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openZone, cliOpen]);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<ZoneId>).detail;
      setOpenZone(id);
    };
    window.addEventListener("world:enter", handler as EventListener);
    return () => window.removeEventListener("world:enter", handler as EventListener);
  }, []);

  return (
    <main className="relative min-h-screen bg-background overflow-hidden scanlines noise">
      {mounted && (
        <Suspense fallback={null}>
          <VoxelWorld onZoneChange={setZone} interactRef={interactRef} />
        </Suspense>
      )}
      <HUD />
      <WorldHUD zone={zone} cliOpen={cliOpen} />
      {mounted && cliOpen && <CLI />}
      {openZone && <ZonePanel zone={openZone} onClose={() => setOpenZone(null)} />}
      {mounted && <Cursor />}
      {!booted && <BootSequence onDone={() => setBooted(true)} />}
    </main>
  );
}
