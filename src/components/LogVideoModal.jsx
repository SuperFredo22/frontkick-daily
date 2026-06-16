import { useState } from 'react';
import Modal from './Modal';
import { VIDEO_FORMATS } from '../data/videoFormats';

export default function LogVideoModal({ open, onClose, onSave }) {
  const [titre, setTitre] = useState('');
  const [format, setFormat] = useState('Actualité');

  const reset = () => { setTitre(''); setFormat('Actualité'); };
  const handleClose = () => { reset(); onClose(); };

  const handleSave = () => {
    onSave({ titre: titre.trim(), format });
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="🎬 Vidéo tournée"
      footer={
        <button
          onClick={handleSave}
          className="btn-press w-full py-2.5 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: 'var(--grad-fire)' }}
        >
          <span>⚔ Tournée</span>
          <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(255,255,255,0.22)', padding: '2px 7px', borderRadius: 999 }}>+20 XP</span>
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
          Enregistre une vidéo que tu as tournée mais qui n'était pas dans ta liste (actu, réaction…). Elle compte comme une mission et alimente tes stats.
        </p>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--ink-3)' }}>Type</p>
          <div className="grid grid-cols-2 gap-2">
            {VIDEO_FORMATS.map(({ key, emoji }) => {
              const active = format === key;
              return (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  className="btn-press py-2 rounded-lg text-sm font-medium transition-colors"
                  style={active
                    ? { background: 'var(--red)', color: '#fff' }
                    : { background: 'var(--line-2)', color: 'var(--ink-2)' }}
                >
                  {emoji} {key}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--ink-3)' }}>Titre (optionnel)</p>
          <input
            autoFocus
            value={titre}
            onChange={e => setTitre(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            placeholder="Ex : Réaction à l'actu UFC 300"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50"
          />
        </div>
      </div>
    </Modal>
  );
}
