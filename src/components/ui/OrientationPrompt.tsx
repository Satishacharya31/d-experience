import { useEffect, useState } from "react";

export function OrientationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
      const isPortrait = window.innerHeight > window.innerWidth;
      // Only show orientation prompt if touch screen AND in portrait mode
      setShow(isTouch && isPortrait);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#04070a]/95 backdrop-blur-md px-6 text-center select-none animate-fade-in">
      <div className="max-w-md w-full border border-primary/20 bg-background/50 p-8 rounded-lg backdrop-blur-lg relative overflow-hidden"
        style={{
          boxShadow: "0 0 40px rgba(0, 255, 136, 0.1), inset 0 0 20px rgba(0, 255, 136, 0.05)",
        }}
      >
        {/* Animated matrix scanline behind */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none opacity-20 animate-pulse" />

        {/* Floating/rotating phone animation */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-28 border-[3px] border-primary/35 rounded-[12px] flex items-center justify-center animate-rotate-phone">
            {/* Phone screen details */}
            <div className="w-[85%] h-[82%] border border-primary/20 rounded-[6px] bg-primary/5 relative flex items-center justify-center">
              <span className="text-[10px] text-primary/60 font-mono tracking-widest uppercase">3D</span>
            </div>
            {/* Camera notch */}
            <div className="absolute top-1.5 w-6 h-2 bg-primary/25 rounded-full" />
            {/* Home indicator bar (bottom) */}
            <div className="absolute bottom-1 w-8 h-1 bg-primary/25 rounded-full" />
          </div>
        </div>

        <h2 className="text-primary font-mono text-sm md:text-base font-bold tracking-widest uppercase text-glow mb-3">
          // LANDSCAPE REQUIRED
        </h2>
        <p className="text-primary/70 font-mono text-xs leading-relaxed mb-6">
          For the optimal open-world virtual joystick controls and visual layout, please rotate your mobile device to <span className="text-accent font-bold">Landscape mode</span>.
        </p>

        <div className="text-[9px] text-terminal-dim font-mono tracking-widest uppercase animate-pulse">
          ‹ WAITING FOR DEVICE ROTATION ›
        </div>
      </div>

      {/* Embedded device rotation animation stylesheet keyframe directly in component to keep it robust and standalone! */}
      <style>{`
        @keyframes rotate-phone {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(0deg); }
          75% { transform: rotate(-90deg); }
          100% { transform: rotate(-90deg); }
        }
        .animate-rotate-phone {
          animation: rotate-phone 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
