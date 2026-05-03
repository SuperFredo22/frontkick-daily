import { useState, useRef } from 'react';
import { Check, Trash2 } from 'lucide-react';

const MAX_SWIPE = 124;
const ACTION_W = 62;

export default function SwipeableRow({ children, onFait, onSupprimer, disabled = false }) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(null);
  const startY = useRef(null);
  const baseOffset = useRef(0);
  const isHorizontal = useRef(null);

  const close = () => setOffset(0);
  const isSwiped = offset <= -(MAX_SWIPE - 2);

  const handleTouchStart = (e) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    baseOffset.current = offset;
    isHorizontal.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (disabled || startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Determine direction on first significant move
    if (isHorizontal.current === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal.current) return;

    e.preventDefault();
    const raw = baseOffset.current + dx;
    setOffset(Math.max(-MAX_SWIPE, Math.min(0, raw)));
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsDragging(false);
    startX.current = null;
    isHorizontal.current = null;
    if (offset < -MAX_SWIPE / 2) {
      setOffset(-MAX_SWIPE);
    } else {
      setOffset(0);
    }
  };

  return (
    <div className="relative mb-2" style={{ borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
      {/* Action buttons */}
      <div
        className="absolute right-0 top-0 bottom-0 flex"
        style={{ width: MAX_SWIPE }}
      >
        <button
          onClick={() => { close(); onFait?.(); }}
          className="flex flex-col items-center justify-center gap-1"
          style={{ width: ACTION_W, background: 'var(--green)', color: 'white' }}
        >
          <Check size={18} strokeWidth={2.5} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>Fait</span>
        </button>
        <button
          onClick={() => { close(); onSupprimer?.(); }}
          className="flex flex-col items-center justify-center gap-1"
          style={{ width: ACTION_W, background: 'var(--red)', color: 'white' }}
        >
          <Trash2 size={16} strokeWidth={2} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>Suppr</span>
        </button>
      </div>

      {/* Sliding row */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 200ms ease-out',
          borderRadius: isSwiped ? '14px 0 0 14px' : 14,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
