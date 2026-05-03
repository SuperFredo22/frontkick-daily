import { useState } from 'react';
import Modal from '../Modal';
import SeanceSelector from './SeanceSelector';
import SeanceEnCours from './SeanceEnCours';
import SeanceRecap from './SeanceRecap';

const TYPE_LABELS = { club: 'Club MMA', gym: 'Gym', maison: 'Maison', autre: 'Autre' };

function ClubModal({ open, onClose, onSave }) {
  const [notes, setNotes] = useState('');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🥊 Club MMA"
      footer={
        <button
          onClick={() => { onSave(notes); setNotes(''); }}
          className="w-full py-2.5 rounded-lg text-white font-medium text-sm"
          style={{ background: 'var(--green)' }}
        >
          Enregistrer
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">Séance au club enregistrée ✓</p>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Ce qu'on a travaillé aujourd'hui (optionnel)</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Boxe, sparring, clinch…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none bg-gray-50"
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
}

function AutreModal({ open, onClose, onSave }) {
  const [texte, setTexte] = useState('');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="✅ Autre sport"
      footer={
        <button
          onClick={() => { if (texte.trim()) { onSave(texte.trim()); setTexte(''); } }}
          disabled={!texte.trim()}
          className="w-full py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40"
          style={{ background: 'var(--green)' }}
        >
          Enregistrer
        </button>
      }
    >
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">Quelle activité ?</p>
        <input
          autoFocus
          value={texte}
          onChange={e => setTexte(e.target.value)}
          placeholder="Course, vélo, natation…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50"
        />
      </div>
    </Modal>
  );
}

function SportDoneRow({ sport, onClear }) {
  const label = sport.seance_nom || sport.notes || TYPE_LABELS[sport.type] || 'Sport';
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50">
      <span className="text-sm font-medium text-gray-700">🥊 Sport</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-green-600">
          ✓ {label}{sport.duree_reelle ? ` · ${sport.duree_reelle} min` : ''}
        </span>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 px-2 py-1 rounded-lg bg-gray-100 active:bg-gray-200"
        >
          ↩️ Modifier
        </button>
      </div>
    </div>
  );
}

export default function SportModule({ journal, onSportSave, onSportClear, setAgenda, viewDate }) {
  const [step, setStep] = useState(null); // null | 'club' | 'autre' | 'select' | 'training' | 'recap'
  const [type, setType] = useState(null);
  const [seance, setSeance] = useState(null);
  const [recapData, setRecapData] = useState(null);

  const sportDone = journal?.sport;
  const legacySport = !sportDone && journal?.habitudes?.sport;

  if (sportDone) return <SportDoneRow sport={sportDone} onClear={onSportClear} />;
  if (legacySport) return <SportDoneRow sport={{ type: 'autre' }} onClear={onSportClear} />;

  const handleType = (key) => {
    setType(key);
    if (key === 'club') {
      setStep('club');
    } else if (key === 'autre') {
      setStep('autre');
    } else {
      setStep('select');
    }
  };

  const handleClubSave = (notes) => {
    onSportSave({ type: 'club', duree_reelle: 0, notes });
    setStep(null);
  };

  const handleAutreSave = (texte) => {
    onSportSave({ type: 'autre', duree_reelle: 0, notes: texte });
    setStep(null);
  };

  const handleSave = (notes, timeSlot) => {
    const entry = { ...recapData, notes, type, seance_id: seance?.id, seance_nom: seance?.nom };
    onSportSave(entry);
    if (timeSlot?.debut && timeSlot?.fin && setAgenda) {
      setAgenda(prev => [...(prev || []), {
        id: Date.now(),
        titre: `🥊 ${seance?.nom || 'Sport'}`,
        date: viewDate,
        heureDebut: timeSlot.debut,
        heureFin: timeSlot.fin,
        type: 'sport',
        color: 'var(--green)',
      }]);
    }
    setStep(null);
    setSeance(null);
    setRecapData(null);
  };

  const SPORT_TYPES = [
    { key: 'club',   emoji: '🥊', label: 'Club MMA' },
    { key: 'gym',    emoji: '🏋️', label: 'Gym' },
    { key: 'maison', emoji: '🏠', label: 'Maison' },
    { key: 'autre',  emoji: '✅', label: 'Autre' },
  ];

  return (
    <>
      <div className="py-2 border-b border-gray-50">
        <span className="text-sm font-medium text-gray-700 block mb-2">🥊 Sport</span>
        <div className="grid grid-cols-2 gap-2">
          {SPORT_TYPES.map(({ key, emoji, label }) => (
            <button
              key={key}
              onClick={() => handleType(key)}
              className="py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 active:bg-gray-100 transition-colors"
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      <ClubModal
        open={step === 'club'}
        onClose={() => setStep(null)}
        onSave={handleClubSave}
      />

      <AutreModal
        open={step === 'autre'}
        onClose={() => setStep(null)}
        onSave={handleAutreSave}
      />

      <SeanceSelector
        open={step === 'select'}
        lieu={type}
        onSelect={s => { setSeance(s); setStep('training'); }}
        onClose={() => setStep(null)}
      />

      {step === 'training' && seance && (
        <SeanceEnCours
          seance={seance}
          onTerminer={data => { setRecapData(data); setStep('recap'); }}
          onAbandon={() => { setStep(null); setSeance(null); }}
        />
      )}

      <SeanceRecap
        open={step === 'recap'}
        seance={seance}
        data={recapData}
        onSave={handleSave}
        onClose={() => setStep(null)}
      />
    </>
  );
}
