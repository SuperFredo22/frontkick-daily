import { useEffect, useState } from 'react';

export default function Modal({ open, onClose, title, children, footer }) {
  // Keyboard overlap (px) + visible viewport height, tracked via the
  // VisualViewport API. iOS doesn't resize the layout viewport when the
  // keyboard opens, so a bottom-anchored sheet (align-items: flex-end) would
  // sit *behind* the keyboard and hide the focused field. We pad the overlay
  // by the keyboard height and cap the sheet to the visible area.
  const [kb, setKb] = useState(0);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setKb(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
      setVh(vv.height);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      setKb(0);
    };
  }, [open]);

  if (!open) return null;

  // Keep the just-focused field visible above the keyboard.
  const handleFocus = (e) => {
    const el = e.target;
    if (el && typeof el.scrollIntoView === 'function') {
      setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ paddingBottom: kb, transition: 'padding-bottom 150ms ease' }}>
      <div
        className="modal-sheet"
        onClick={e => e.stopPropagation()}
        onFocusCapture={handleFocus}
        style={kb > 0 && vh ? { maxHeight: `${vh - 16}px` } : undefined}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
            <h3 className="font-display font-bold text-base" style={{ color: 'var(--ink)' }}>{title}</h3>
            <button onClick={onClose} className="text-xl leading-none p-1" style={{ color: 'var(--ink-3)' }}>✕</button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
