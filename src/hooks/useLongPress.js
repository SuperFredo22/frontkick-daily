import { useRef } from 'react';

// Long-press hook: touch events on mobile (iOS doesn't cancel them for
// context-menu detection), pointer events on desktop. `delay` ms = long-press
// threshold. Returns the handlers to spread onto the target element.
export function useLongPress(onLongPress, onShortPress, delay = 500) {
  const timer = useRef(null);
  const fired = useRef(false);
  const touchHandled = useRef(false);

  const startTimer = () => {
    fired.current = false;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fired.current = true;
      onLongPress?.();
    }, delay);
  };

  return {
    // ── Mobile (touch) ────────────────────────────────────────────────────
    // iOS Safari fires pointercancel on its own long-press detection;
    // touchcancel does NOT fire for contextmenu, so touch events survive long enough.
    onTouchStart: () => {
      touchHandled.current = false;
      startTimer();
    },
    onTouchEnd: (e) => {
      touchHandled.current = true;
      e.preventDefault(); // block synthesized mouse/click events
      if (!fired.current) {
        clearTimeout(timer.current);
        onShortPress?.();
      }
      fired.current = false;
    },
    onTouchCancel: () => {
      clearTimeout(timer.current);
      fired.current = false;
    },
    // ── Desktop (mouse / pointer) ─────────────────────────────────────────
    onPointerDown: (e) => {
      if (e.pointerType === 'touch') return;
      startTimer();
    },
    onPointerUp: (e) => {
      if (e.pointerType === 'touch') return;
      if (!fired.current) clearTimeout(timer.current);
    },
    onPointerLeave: (e) => {
      if (e.pointerType === 'touch') return;
      if (!fired.current) clearTimeout(timer.current);
    },
    onClick: () => {
      if (touchHandled.current) { touchHandled.current = false; return; }
      if (!fired.current) onShortPress?.();
      fired.current = false;
    },
  };
}
