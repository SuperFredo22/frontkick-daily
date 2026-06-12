import { useState } from 'react';

const PIN_KEY  = 'fk_pin';
const SESSION_KEY = 'fk_unlocked';

// ── Hash SHA-256 salé (format v2:<salt>:<hash>) ──────────────────────────────
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function setPinHash(pin) {
  const salt = randomSalt();
  const hash = await sha256Hex(`${salt}:${pin}`);
  localStorage.setItem(PIN_KEY, `v2:${salt}:${hash}`);
}

async function checkPin(pin) {
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return false;
  if (stored.startsWith('v2:')) {
    const [, salt, hash] = stored.split(':');
    return (await sha256Hex(`${salt}:${pin}`)) === hash;
  }
  // Ancien format (btoa réversible) : vérifier puis migrer silencieusement vers v2
  if (stored === btoa(pin.split('').reverse().join('') + '_fk')) {
    await setPinHash(pin);
    return true;
  }
  return false;
}

function unlock() {
  sessionStorage.setItem(SESSION_KEY, '1');
}

export function isUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function hasPinSet() {
  return !!localStorage.getItem(PIN_KEY);
}

// ── Numeric keypad ────────────────────────────────────────────────────────────
function Keypad({ onDigit, onDelete }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {keys.map((k, i) => (
        k === '' ? <div key={`empty-${i}`} /> :
        <button
          key={`key-${k}`}
          onClick={() => k === '⌫' ? onDelete() : onDigit(k)}
          className="btn-press"
          style={{
            height: 68,
            borderRadius: 18,
            fontSize: k === '⌫' ? 22 : 24,
            fontWeight: 600,
            color: 'var(--ink)',
            background: k === '⌫' ? 'var(--line-2)' : 'var(--surface)',
            boxShadow: 'var(--shadow-card)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

// ── Dot indicators ────────────────────────────────────────────────────────────
function PinDots({ value, length = 4, error }) {
  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 14, height: 14, borderRadius: '50%',
            background: error ? 'var(--red)' : i < value.length ? 'var(--ink)' : 'var(--line)',
            transition: 'background 0.15s',
          }}
        />
      ))}
    </div>
  );
}

// ── Main PinLock component ────────────────────────────────────────────────────
export default function PinLock({ onUnlocked }) {
  const pinAlreadySet = hasPinSet();
  const [mode, setMode]     = useState(pinAlreadySet ? 'enter' : 'set');
  const [step, setStep]     = useState(1); // 1 = first entry, 2 = confirm
  const [pin, setPin]       = useState('');
  const [first, setFirst]   = useState('');
  const [error, setError]   = useState('');
  const [shake, setShake]   = useState(false);

  const PIN_LENGTH = 4;

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setPin('');
    setTimeout(() => setShake(false), 500);
    setTimeout(() => setError(''), 1800);
  };

  const handleDigit = (d) => {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      setTimeout(() => submit(next), 120);
    }
  };

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError('');
  };

  const submit = async (value) => {
    if (mode === 'enter') {
      if (await checkPin(value)) {
        unlock();
        onUnlocked();
      } else {
        triggerError('Code incorrect');
      }
    } else {
      // mode === 'set'
      if (step === 1) {
        setFirst(value);
        setPin('');
        setStep(2);
      } else {
        if (value === first) {
          await setPinHash(value);
          unlock();
          onUnlocked();
        } else {
          setStep(1);
          setFirst('');
          triggerError('Les codes ne correspondent pas');
        }
      }
    }
  };

  const title  = mode === 'enter' ? 'Déverrouiller' : step === 1 ? 'Choisir un code PIN' : 'Confirmer le code';
  const subtitle = mode === 'enter'
    ? 'Saisis ton code à 4 chiffres'
    : step === 1
    ? 'Ce code protège tes données'
    : 'Saisis à nouveau le même code';

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'var(--bg)', zIndex: 9999 }}
    >
      {/* Logo / App name */}
      <div className="mb-10 text-center">
        <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Frontkick Daily
        </h1>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>{subtitle}</p>
        {error && (
          <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 6, fontWeight: 500 }}>{error}</p>
        )}
      </div>

      {/* Dots */}
      <div
        className="mb-10"
        style={{
          transform: shake ? 'translateX(0)' : undefined,
          animation: shake ? 'pinShake 0.4s ease' : undefined,
        }}
      >
        <PinDots value={pin} length={PIN_LENGTH} error={!!error} />
      </div>

      {/* Keypad */}
      <div style={{ width: '100%', maxWidth: 300, padding: '0 16px' }}>
        <Keypad onDigit={handleDigit} onDelete={handleDelete} />
      </div>

      {/* Reset link (only in 'enter' mode).
          Le reset efface TOUTES les données : sans ça, le PIN serait contournable
          en 2 taps par n'importe qui ayant le téléphone en main. */}
      {mode === 'enter' && (
        <button
          onClick={() => {
            if (!window.confirm(
              'Code oublié ?\n\nPar sécurité, réinitialiser le PIN effacera TOUTES les données de l\'app (journal, projets, banques, agenda).\n\nContinuer ?'
            )) return;
            if (!window.confirm(
              'Dernière confirmation.\n\nAs-tu une sauvegarde exportée ? Tu pourras la réimporter après. Sans sauvegarde, tout sera perdu définitivement.'
            )) return;
            const toDelete = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k?.startsWith('fk_')) toDelete.push(k);
            }
            toDelete.forEach(k => localStorage.removeItem(k));
            setMode('set');
            setStep(1);
            setPin('');
            setFirst('');
          }}
          style={{ marginTop: 32, fontSize: 12, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Code oublié ? Réinitialiser
        </button>
      )}

      <style>{`
        @keyframes pinShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
