import { useRef, useState } from 'react';
import Modal from './Modal';
import { collectData, exportAllData, daysSinceLastBackup } from '../utils/backup';
import { useStorage } from '../hooks/useStorage';
import { useObjectifs, DEFAULT_OBJECTIFS } from '../hooks/useObjectifs';
import { getThemePref, setThemePref } from '../utils/theme';
import { syncBackup } from '../utils/autoBackup';

const THEME_OPTIONS = [
  { id: 'auto',  label: '🌗 Auto' },
  { id: 'light', label: '☀️ Clair' },
  { id: 'dark',  label: '🌙 Sombre' },
];

const OBJECTIF_FIELDS = [
  { key: 'sport',      emoji: '🥊', label: 'Séances sport' },
  { key: 'tiktok',     emoji: '🎬', label: 'Vidéos TikTok' },
  { key: 'fightfocus', emoji: '🌐', label: 'Tâches FightFocus' },
  { key: 'marque',     emoji: '👕', label: 'Actions Marque' },
];

function Stepper({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(0, value - 1))}
        className="w-7 h-7 rounded-lg font-bold btn-press flex items-center justify-center"
        style={{ background: 'var(--surface)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>−</button>
      <span className="text-sm font-bold w-5 text-center" style={{ color: value > 0 ? 'var(--ink)' : 'var(--ink-3)' }}>
        {value > 0 ? value : '—'}
      </span>
      <button onClick={() => onChange(Math.min(14, value + 1))}
        className="w-7 h-7 rounded-lg font-bold btn-press flex items-center justify-center"
        style={{ background: 'var(--surface)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>+</button>
    </div>
  );
}

export default function SettingsModal({ open, onClose }) {
  const fileRef = useRef(null);
  const [exportDone, setExportDone] = useState(false);
  const [importError, setImportError] = useState('');
  const [theme, setTheme] = useState(() => getThemePref());
  const [autoBackup, setAutoBackup] = useStorage('autobackup', false);
  const [objectifs, setObjectifs] = useObjectifs();
  const [syncing, setSyncing] = useState(false);

  const handleTheme = (id) => {
    setTheme(id);
    setThemePref(id);
  };

  const backupConfigured = !!import.meta.env.VITE_BACKUP_SECRET;

  const handleAutoBackupToggle = async () => {
    const next = !autoBackup;
    setAutoBackup(next);
    if (next && backupConfigured) {
      setSyncing(true);
      await syncBackup({ force: true });
      setSyncing(false);
    }
  };

  const lastBackupDays = daysSinceLastBackup();

  const handleExport = () => {
    const count = exportAllData();
    if (count === 0) { alert('Aucune donnée à exporter.'); return; }
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setImportError('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const keys = Object.keys(data);
        if (!keys.some(k => k.startsWith('fk_'))) {
          setImportError('Fichier invalide — ce n\'est pas une sauvegarde Frontkick.');
          return;
        }
        if (!window.confirm(
          `Restaurer ${keys.length} entrées ?\n\nTes données actuelles seront remplacées. Cette action est irréversible.`
        )) return;

        // Clear existing fk_ keys
        const toDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k.startsWith('fk_')) toDelete.push(k);
        }
        toDelete.forEach(k => localStorage.removeItem(k));

        // Restore
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
        window.location.reload();
      } catch {
        setImportError('Erreur de lecture — vérifie que c\'est bien un fichier .json valide.');
      }
    };
    reader.readAsText(file);
  };

  const dataCount = open ? Object.keys(collectData()).length : 0;

  return (
    <Modal open={open} onClose={onClose} title="Paramètres & Données">
      <div className="flex flex-col gap-4 py-1">

        {/* Apparence */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--line-2)' }}>
          <p className="text-sm font-semibold mb-2.5" style={{ color: 'var(--ink)' }}>🎨 Apparence</p>
          <div className="flex gap-2">
            {THEME_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleTheme(opt.id)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold btn-press"
                style={theme === opt.id
                  ? { background: 'var(--red)', color: 'white' }
                  : { background: 'var(--surface)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Objectifs hebdo */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--line-2)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>🎯 Objectifs hebdo</p>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--ink-3)' }}>
            Fixe un objectif par semaine (— = désactivé). La progression s'affiche sur l'écran Aujourd'hui.
          </p>
          <div className="flex flex-col gap-2.5">
            {OBJECTIF_FIELDS.map(({ key, emoji, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--ink-2)' }}>{emoji} {label}</span>
                <Stepper
                  value={objectifs?.[key] ?? 0}
                  onChange={v => setObjectifs(prev => ({ ...DEFAULT_OBJECTIFS, ...prev, [key]: v }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sauvegarde automatique en ligne */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--line-2)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>☁️ Sauvegarde auto en ligne</p>
            <button
              onClick={handleAutoBackupToggle}
              className="w-12 h-6 rounded-full relative transition-colors shrink-0"
              style={{ background: autoBackup ? 'var(--green)' : 'var(--line)' }}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoBackup ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-3)' }}>
            Copie chiffrée en transit de tes données vers ton espace Vercel (7 sauvegardes glissantes, une par jour de la semaine).
            Active aussi les <strong>notifications intelligentes</strong> : les rappels déjà accomplis ne sont plus envoyés.
            La clé API et le code PIN ne sont jamais envoyés.
          </p>
          {autoBackup && !backupConfigured && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--orange)' }}>
              ⚠️ Configure les variables BACKUP_SECRET (Vercel) et VITE_BACKUP_SECRET (build) pour activer la sauvegarde.
            </p>
          )}
          {syncing && <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--ink-2)' }}>Synchronisation…</p>}
          {!syncing && backupConfigured && lastBackupDays !== null && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--ink-2)' }}>
              Dernière sauvegarde : {lastBackupDays === 0 ? "aujourd'hui" : `il y a ${lastBackupDays} jour${lastBackupDays > 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        {/* Export */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--line-2)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">💾</span>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Sauvegarder mes données</p>
          </div>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--ink-3)' }}>
            Exporte toutes tes données en fichier JSON — journal, séances sport, projets, agenda.
            Mets-le dans <strong>iCloud</strong> ou <strong>Google Drive</strong> pour ne jamais perdre tes données.
          </p>
          {dataCount > 0 && (
            <p className="text-xs mb-2 font-medium" style={{ color: 'var(--ink-2)' }}>
              {dataCount} entrée{dataCount > 1 ? 's' : ''} à exporter
            </p>
          )}
          <button
            onClick={handleExport}
            className="w-full py-2.5 rounded-xl font-semibold text-sm btn-press text-white"
            style={{ background: exportDone ? 'var(--green)' : 'var(--red)' }}
          >
            {exportDone ? '✅ Fichier téléchargé !' : '⬇️ Exporter mes données'}
          </button>
        </div>

        {/* Import */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--line-2)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">📂</span>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Restaurer une sauvegarde</p>
          </div>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--ink-3)' }}>
            Sélectionne un fichier exporté depuis cette app.{' '}
            <span style={{ color: 'var(--red)', fontWeight: 600 }}>Les données actuelles seront remplacées.</span>
          </p>
          {importError && (
            <p className="text-xs mb-2 font-medium" style={{ color: 'var(--red)' }}>{importError}</p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2.5 rounded-xl font-semibold text-sm btn-press"
            style={{ background: 'var(--surface)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}
          >
            ⬆️ Importer une sauvegarde
          </button>
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--ink-3)' }}>
          🔒 Tes données restent sur ton appareil{autoBackup ? ', plus une copie de secours sur ton espace Vercel' : " — rien n'est envoyé en ligne"}.
        </p>
      </div>
    </Modal>
  );
}
