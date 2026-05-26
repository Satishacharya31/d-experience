import { useEffect, useRef, useState } from "react";

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const trail = useRef({ x: 0, y: 0 });
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("custom-cursor-active");
    const handleLock = () => setIsLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", handleLock);
    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      document.removeEventListener("pointerlockchange", handleLock);
    };
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };
    window.addEventListener("pointermove", move);

    let raf = 0;
    const loop = () => {
      trail.current.x += (pos.current.x - trail.current.x) * 0.15;
      trail.current.y += (pos.current.y - trail.current.y) * 0.15;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${trail.current.x}px, ${trail.current.y}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (isLocked) return null;

  return (
    <>
      <div
        ref={ring}
        className="fixed top-0 left-0 z-[9999] pointer-events-none w-8 h-8 -ml-4 -mt-4 border border-primary/70 rounded-full mix-blend-screen"
        style={{ boxShadow: "0 0 12px var(--terminal-green)" }}
      />
      <div
        ref={dot}
        className="fixed top-0 left-0 z-[9999] pointer-events-none w-1.5 h-1.5 -ml-[3px] -mt-[3px] bg-primary rounded-full"
        style={{ boxShadow: "0 0 8px var(--terminal-green)" }}
      />
    </>
  );
}
