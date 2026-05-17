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

const SITE_URL = "https://satish.com.np";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const TITLE = "THE_LAB // satish.com.np — experiments in code, rendering & systems";
const DESCRIPTION =
  "An immersive WebGL terminal portfolio by Satish — interactive 3D, shaders, generative systems, and late-night engineering. Type a command. Engage.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      {
        name: "keywords",
        content:
          "Satish, satish.com.np, THE_LAB, WebGL portfolio, React Three Fiber, creative developer, 3D portfolio, shaders, generative, frontend engineer, Nepal developer",
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: SITE_URL + "/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1216" },
      { property: "og:image:height", content: "640" },
      { property: "og:image:alt", content: "THE_LAB — satish.com.np terminal portfolio" },
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
