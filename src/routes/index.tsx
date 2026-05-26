import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { BootSequence } from "@/components/lab/BootSequence";
import { HUD } from "@/components/lab/HUD";
import { CLI } from "@/components/lab/CLI";
import { Cursor } from "@/components/lab/Cursor";
import { WorldHUD } from "@/components/world/WorldHUD";
import { ZonePanel } from "@/components/world/ZonePanel";
import { QuestTracker } from "@/components/lab/QuestTracker";
import { LevelUpOverlay } from "@/components/lab/LevelUpOverlay";
import type { ZoneId } from "@/components/world/Buildings";
import { gameStore } from "@/lib/gameStore";
import { audio } from "@/lib/audio";

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
  const [levelUpQueue, setLevelUpQueue] = useState<number[]>([]);
  const interactRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Sync audio mute state from store
  useEffect(() => {
    const unsub = gameStore.subscribe((gs) => {
      audio.setMuted(gs.muted);
    });
    audio.setMuted(gameStore.get().muted);
    return unsub;
  }, []);

  // Global key handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`" || e.code === "Backquote") {
        e.preventDefault();
        setCliOpen((v) => {
          if (!v) {
            // Quest: open CLI
            const result = gameStore.completeQuest("open_cli");
            if (result.levelUp) {
              setLevelUpQueue((q) => [...q, result.newLevel]);
              audio.levelUp();
            } else if (result.didComplete) {
              audio.questComplete();
            }
          }
          return !v;
        });
      } else if ((e.key === "e" || e.key === "E") && !openZone) {
        interactRef.current = true;
      } else if (e.key === "Escape") {
        if (openZone) setOpenZone(null);
        else if (cliOpen) setCliOpen(false);
      } else if (e.key === "m" || e.key === "M") {
        gameStore.toggleMute();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openZone, cliOpen]);

  // Zone enter event → open panel, complete quest
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<ZoneId>).detail;
      setOpenZone(id);
      audio.interact();
    };
    window.addEventListener("world:enter", handler as EventListener);
    return () => window.removeEventListener("world:enter", handler as EventListener);
  }, []);

  // Level-up handler from VoxelWorld
  const handleLevelUp = useCallback((level: number) => {
    setLevelUpQueue((q) => [...q, level]);
    audio.levelUp();
  }, []);

  // Dismiss level-up overlay
  const dismissLevelUp = useCallback(() => {
    setLevelUpQueue((q) => q.slice(1));
  }, []);

  const currentLevelUp = levelUpQueue[0] ?? null;

  return (
    <main className="relative min-h-screen bg-background overflow-hidden scanlines noise">
      {mounted && (
        <Suspense fallback={null}>
          <VoxelWorld
            onZoneChange={setZone}
            interactRef={interactRef}
            onLevelUp={handleLevelUp}
            booted={booted}
            cliOpen={cliOpen}
            isPanelOpen={!!openZone}
            levelUpActive={currentLevelUp !== null}
          />
        </Suspense>
      )}

      <HUD />
      <WorldHUD zone={zone} cliOpen={cliOpen} />
      {mounted && <QuestTracker />}
      {mounted && cliOpen && <CLI />}
      {openZone && <ZonePanel zone={openZone} onClose={() => setOpenZone(null)} />}
      {mounted && <Cursor />}

      {/* Level-up cinematic (show one at a time from queue) */}
      {currentLevelUp !== null && (
        <LevelUpOverlay level={currentLevelUp} onDone={dismissLevelUp} />
      )}

      {!booted && <BootSequence onDone={() => setBooted(true)} />}
    </main>
  );
}
