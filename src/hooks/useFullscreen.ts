import { useEffect, useCallback, useState } from "react";

/**
 * Auto-requests Fullscreen API + Screen Wake Lock on first user gesture.
 * Works on Android Chrome / Firefox. iOS Safari uses standalone meta tags
 * (apple-mobile-web-app-capable) — no JS API needed.
 *
 * Returns:
 *   isFullscreen — whether fullscreen is currently active
 *   requestFullscreen — manually trigger fullscreen (requires user gesture)
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  const requestFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: "hide" });
      } else if ((el as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (el as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      }
    } catch {
      // Fullscreen refused — silently ignore (e.g. iOS Safari)
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        const lock = await navigator.wakeLock.request("screen");
        setWakeLock(lock);
      }
    } catch {
      // Wake lock not supported — silently ignore
    }
  }, []);

  // Re-acquire wake lock if tab becomes visible again (it releases on hide)
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState === "visible" && wakeLock === null) {
        await requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [wakeLock, requestWakeLock]);

  // Track fullscreen state changes
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // On first ANY user gesture (touch/click/key), auto-request fullscreen + wake lock
  useEffect(() => {
    let triggered = false;

    const onFirstGesture = async () => {
      if (triggered) return;
      triggered = true;

      // Only auto-fullscreen on touch devices (phones/tablets)
      const isTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
      if (isTouch) {
        await requestFullscreen();
      }
      await requestWakeLock();

      // Clean up listeners after first gesture
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("click", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };

    window.addEventListener("touchstart", onFirstGesture, { passive: true });
    window.addEventListener("click", onFirstGesture);
    window.addEventListener("keydown", onFirstGesture);

    return () => {
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("click", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, [requestFullscreen, requestWakeLock]);

  return { isFullscreen, requestFullscreen };
}
