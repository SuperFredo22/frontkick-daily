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

export default function SuggestionCard({ banque, item, onFait, onReporte, onAutre, onSuivante, config: configOverride, exhaustedToday }) {
  const [showAutre, setShowAutre] = useState(false);
  const [autreText, setAutreText] = useState('');
  const [showHeure, setShowHeure] = useState(false);
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');

  const config = configOverride || BANQUE_CONFIG[banque] || BANQUE_CONFIG.tiktok;

  if (!item) {
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
            ? 'Plus de suggestions disponibles aujourd\'hui dans cette catégorie'
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
              style={{ background: config.bg || '#F5F5F5', color: config.color }}>
              {badge}
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-gray-800 leading-snug mb-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mb-3">{sub}</p>}

        {/* Boutons principaux */}
        <div className="flex gap-2">
          <button
            onClick={handleFait}
            className="flex-1 text-sm font-medium py-2 px-3 rounded-lg text-white transition-opacity active:opacity-80"
            style={{ background: config.color }}
          >
            ✅ Fait
          </button>
          <button
            onClick={() => onReporte(item)}
            className="flex-1 text-sm font-medium py-2 px-3 rounded-lg bg-gray-100 text-gray-600 transition-opacity active:opacity-80"
          >
            🔄 Reporté
          </button>
          <button
            onClick={() => setShowAutre(true)}
            className="flex-1 text-sm font-medium py-2 px-3 rounded-lg bg-gray-100 text-gray-600 transition-opacity active:opacity-80"
          >
            ✏️ Autre
          </button>
        </div>

        {/* Bouton Suivante — discret */}
        {onSuivante && (
          <button
            onClick={() => onSuivante(item)}
            className="mt-2 w-full text-xs text-gray-400 py-1.5 rounded-lg hover:bg-gray-50 transition-colors active:opacity-60"
          >
            ⏭️ Suivante
          </button>
        )}
      </Card>

      {/* Modal heure */}
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

      {/* Modal autre chose */}
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
}
