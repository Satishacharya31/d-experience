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
import { useFullscreen } from "@/hooks/useFullscreen";

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
  const [showFullscreenHint, setShowFullscreenHint] = useState(false);
  const interactRef = useRef(false);
  const { isFullscreen, requestFullscreen } = useFullscreen();

  // Show fullscreen hint briefly on touch devices
  useEffect(() => {
    const isTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    if (isTouch && !isFullscreen) {
      const t = setTimeout(() => setShowFullscreenHint(true), 2000);
      const hide = setTimeout(() => setShowFullscreenHint(false), 7000);
      return () => { clearTimeout(t); clearTimeout(hide); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleCli = useCallback(() => {
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
  }, []);

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
        handleToggleCli();
      } else if ((e.key === "e" || e.key === "E") && !openZone) {
        interactRef.current = true;
      } else if (e.key === "q" || e.key === "Q") {
        if (openZone) setOpenZone(null);
      } else if (e.key === "Escape") {
        if (cliOpen) setCliOpen(false);
      } else if (e.key === "m" || e.key === "M") {
        gameStore.toggleMute();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openZone, cliOpen, handleToggleCli]);

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
    <main className="relative bg-background overflow-hidden scanlines noise" style={{ width: "100vw", height: "100vh" }}>

      {/* ── 3D World canvas — this div rotates in portrait to simulate landscape ── */}
      {mounted && (
        <div className="world-canvas-container">
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
        </div>
      )}

      {/* ── All UI overlays — always in TRUE viewport space, never rotated ── */}
      <HUD />
      <WorldHUD zone={zone} cliOpen={cliOpen} onToggleCli={handleToggleCli} />
      {mounted && <QuestTracker />}
      {mounted && cliOpen && <CLI />}
      {openZone && <ZonePanel zone={openZone} onClose={() => setOpenZone(null)} />}
      {mounted && <Cursor />}

      {/* Level-up cinematic */}
      {currentLevelUp !== null && (
        <LevelUpOverlay level={currentLevelUp} onDone={dismissLevelUp} />
      )}

      {!booted && <BootSequence onDone={() => setBooted(true)} />}

      {/* ── Fullscreen nudge button (touch only, fades after a few seconds) ── */}
      {showFullscreenHint && !isFullscreen && (
        <button
          onClick={() => { requestFullscreen(); setShowFullscreenHint(false); }}
          onTouchStart={(e) => { e.preventDefault(); requestFullscreen(); setShowFullscreenHint(false); }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-auto select-none"
          style={{
            background: "rgba(0,255,136,0.07)",
            border: "1px solid rgba(0,255,136,0.3)",
            borderRadius: 8,
            padding: "10px 20px",
            color: "rgba(0,255,136,0.85)",
            fontFamily: "monospace",
            fontSize: 11,
            letterSpacing: "0.15em",
            backdropFilter: "blur(8px)",
            boxShadow: "0 0 24px rgba(0,255,136,0.15)",
            animation: "pulse 2s ease-in-out infinite",
            cursor: "pointer",
          }}
        >
          ⛶ TAP FOR FULLSCREEN
        </button>
      )}

      {/* ── Viewport & orientation styles ── */}
      <style>{`
        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          touch-action: none;
          /* iOS safe area insets — fills notch/home-bar area with game bg */
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
          box-sizing: border-box;
          background: #04070a;
        }

        /* Canvas container: fills full screen in landscape */
        .world-canvas-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }

        /* Fullscreen: canvas expands to cover notch/status bar */
        :fullscreen .world-canvas-container,
        :-webkit-full-screen .world-canvas-container {
          width: 100vw;
          height: 100vh;
        }

        /* Portrait: rotate only the 3D canvas 90deg so it appears as landscape */
        @media (orientation: portrait) {
          .world-canvas-container {
            top: 50%;
            left: 50%;
            width: 100vh;
            height: 100vw;
            transform: translate(-50%, -50%) rotate(90deg);
            transform-origin: center center;
          }
        }
      `}</style>
    </main>
  );
}
