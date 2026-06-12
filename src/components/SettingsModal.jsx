import { useRef, useState } from 'react';
import Modal from './Modal';
import { collectData, exportAllData } from '../utils/backup';

export default function SettingsModal({ open, onClose }) {
  const fileRef = useRef(null);
  const [exportDone, setExportDone] = useState(false);
  const [importError, setImportError] = useState('');

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
          🔒 Toutes tes données restent sur ton appareil — rien n'est envoyé en ligne.
        </p>
      </div>
    </Modal>
  );
}
