import { useState } from 'react';
import Modal from '../Modal';

// ─── Item context menu ──────────────────────────────────────────────────────

export default function ItemMenu({ open, onClose, itemLabel, onModifier, onDejaFait, onSupprimer }) {
  const [step, setStep] = useState('menu'); // 'menu' | 'confirm'

  const handleClose = () => { setStep('menu'); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 'confirm' ? 'Confirmation' : null}
      footer={
        step === 'menu' ? null : (
          <div className="flex gap-2 w-full">
            <button
              onClick={() => { onDejaFait(); handleClose(); }}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm"
              style={{ background: 'var(--red)' }}
            >
              Confirmer
            </button>
            <button onClick={() => setStep('menu')} className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
              Annuler
            </button>
          </div>
        )
      }
    >
      {step === 'menu' ? (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-400 mb-2 leading-snug line-clamp-2">{itemLabel}</p>
          <button onClick={() => { onModifier(); handleClose(); }}
            className="w-full text-left py-3 px-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-3">
            <span>✏️</span> Modifier
          </button>
          <button onClick={() => setStep('confirm')}
            className="w-full text-left py-3 px-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-3">
            <span>✅</span> Déjà réalisé
          </button>
          <button onClick={() => { onSupprimer(); handleClose(); }}
            className="w-full text-left py-3 px-3 rounded-xl hover:bg-red-50 text-sm font-medium flex items-center gap-3"
            style={{ color: 'var(--red)' }}>
            <span>🗑️</span> Supprimer
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-600 leading-relaxed">
          Cet item ne sera plus jamais proposé en suggestion. Il restera visible dans la banque avec le label "Déjà réalisé".<br /><br />
          <strong>Confirmer ?</strong>
        </p>
      )}
    </Modal>
  );
}

