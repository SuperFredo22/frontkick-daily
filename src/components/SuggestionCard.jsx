import { useState } from 'react';
import Card from './Card';
import Modal from './Modal';

const BANQUE_CONFIG = {
  tiktok:     { label: 'TikTok',     color: 'var(--red)',    bg: 'var(--red-50)',      emoji: '🎬' },
  fightfocus: { label: 'FightFocus', color: 'var(--cyan)',   bg: 'var(--cyan-soft)',   emoji: '🌐' },
  marque:     { label: 'Marque',     color: 'var(--orange)', bg: 'var(--orange-soft)', emoji: '👕' },
};

function getLabel(banque, item, config) {
  if (config?.getLabel) return config.getLabel(item);
  if (banque === 'tiktok') return item.titre;
  if (item.code) return `${item.code} — ${item.description}`;
  return item.description;
}

function getSub(banque, item, config) {
  if (config?.getSub) return config.getSub(item);
  if (banque === 'tiktok') return `${item.format} · ${item.discipline}`;
  if (banque === 'fightfocus') return item.priorite ? `Priorité ${item.priorite}` : null;
  if (banque === 'marque') return item.phase || null;
  return null;
}

export default function SuggestionCard({
  banque, item, onFait, onReporte, onAutre, onSuivante,
  config: configOverride, exhaustedToday,
  hero = false, fadingOut = false,
}) {
  const [showAutre, setShowAutre] = useState(false);
  const [autreText, setAutreText] = useState('');
  const [showHeure, setShowHeure] = useState(false);
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');

  const config = configOverride || BANQUE_CONFIG[banque] || BANQUE_CONFIG.tiktok;

  if (!item) {
    if (hero) return null;
    return (
      <Card className="opacity-60">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{config.emoji}</span>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>
        <p className="text-sm text-gray-400 italic">
          {exhaustedToday
            ? "Plus de suggestions disponibles aujourd'hui dans cette catégorie"
            : 'Toutes les tâches sont accomplies 🎉'}
        </p>
      </Card>
    );
  }

  const handleFait = () => setShowHeure(true);

  const confirmFait = (withTime) => {
    setShowHeure(false);
    onFait(item, withTime ? { debut: heureDebut, fin: heureFin } : null);
  };

  const handleAutreSubmit = () => {
    onAutre(item, autreText);
    setShowAutre(false);
    setAutreText('');
  };

  const label = getLabel(banque, item, configOverride);
  const sub = getSub(banque, item, configOverride);
  const badge = configOverride?.badge ? configOverride.badge(item) : item.priorite;

  const modals = (
    <>
      <Modal
        open={showHeure}
        onClose={() => setShowHeure(false)}
        title="À quelle heure ?"
        footer={
          <>
            <button
              onClick={() => confirmFait(true)}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm"
              style={{ background: config.color }}
            >
              Ajouter à l'agenda
            </button>
            <button
              onClick={() => confirmFait(false)}
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm"
            >
              Passer
            </button>
          </>
        }
      >
        <div className="flex gap-4">
          <label className="flex-1">
            <span className="text-xs text-gray-500 block mb-1">Début</span>
            <input type="time" value={heureDebut} onChange={e => setHeureDebut(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </label>
          <label className="flex-1">
            <span className="text-xs text-gray-500 block mb-1">Fin</span>
            <input type="time" value={heureFin} onChange={e => setHeureFin(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </label>
        </div>
      </Modal>

      <Modal
        open={showAutre}
        onClose={() => setShowAutre(false)}
        title="J'ai fait autre chose"
        footer={
          <>
            <button onClick={handleAutreSubmit} disabled={!autreText.trim()}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40"
              style={{ background: config.color }}>
              Enregistrer
            </button>
            <button onClick={() => setShowAutre(false)}
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
              Annuler
            </button>
          </>
        }
      >
        <textarea autoFocus value={autreText} onChange={e => setAutreText(e.target.value)}
          placeholder="Décris ce que tu as fait à la place..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={4} />
      </Modal>
    </>
  );

  // ── Hero variant ──────────────────────────────────────────────────────────
  if (hero) {
    return (
      <>
        <div
          style={{
            background: `linear-gradient(165deg, #fff 0%, ${config.bg} 100%)`,
            borderRadius: 22,
            padding: 20,
            boxShadow: 'var(--shadow-lift)',
            opacity: fadingOut ? 0 : 1,
            transform: fadingOut ? 'translateY(-8px)' : 'translateY(0)',
            transition: fadingOut ? 'opacity 280ms ease-in, transform 280ms ease-in' : 'opacity 280ms ease-out, transform 280ms ease-out',
          }}
        >
          {/* Card header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex items-center justify-center text-xl shrink-0"
                style={{ width: 32, height: 32, borderRadius: 10, background: config.bg }}
              >
                {config.emoji}
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: config.color }}>
                  {config.label}
                </div>
                {sub && (
                  <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>{sub}</div>
                )}
              </div>
            </div>
            {badge && (
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background: config.color, color: 'white', letterSpacing: '0.02em' }}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Title */}
          <p
            className="leading-snug mb-5"
            style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.3 }}
          >
            {label}
          </p>

          {/* Primary action */}
          <button
            onClick={handleFait}
            className="w-full btn-press"
            style={{
              padding: '15px',
              borderRadius: 14,
              background: config.color,
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            ✓ Marquer comme fait
          </button>

          {/* Secondary actions */}
          <div className="flex gap-2">
            {[
              { label: '↻ Reporté', action: () => onReporte(item) },
              { label: '✎ Autre',   action: () => setShowAutre(true) },
              { label: '⏭ Skip',    action: () => onSuivante?.(item) },
            ].map(({ label: l, action }) => (
              <button
                key={l}
                onClick={action}
                className="flex-1 py-2 rounded-xl btn-press"
                style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-2)', background: 'transparent' }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        {modals}
      </>
    );
  }

  // ── Normal (compact queue row) variant ───────────────────────────────────
  return (
    <>
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{config.emoji}</span>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: config.color }}>
            {config.label}
          </span>
          {badge && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: config.bg || 'var(--line-2)', color: config.color }}>
              {badge}
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-gray-800 leading-snug mb-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mb-3">{sub}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleFait}
            className="flex-1 text-sm font-medium py-2 px-3 rounded-lg text-white btn-press"
            style={{ background: config.color }}
          >
            ✅ Fait
          </button>
          <button
            onClick={() => onReporte(item)}
            className="flex-1 text-sm font-medium py-2 px-3 rounded-lg bg-gray-100 text-gray-600 btn-press"
          >
            🔄 Reporté
          </button>
          <button
            onClick={() => setShowAutre(true)}
            className="flex-1 text-sm font-medium py-2 px-3 rounded-lg bg-gray-100 text-gray-600 btn-press"
          >
            ✏️ Autre
          </button>
        </div>

        {onSuivante && (
          <button
            onClick={() => onSuivante(item)}
            className="mt-2 w-full text-xs text-gray-400 py-1.5 rounded-lg hover:bg-gray-50 btn-press"
          >
            ⏭️ Suivante
          </button>
        )}
      </Card>
      {modals}
    </>
  );
}
