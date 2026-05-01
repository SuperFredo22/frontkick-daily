import { useState } from 'react';
import SeanceSelector from './SeanceSelector';
import SeanceEnCours from './SeanceEnCours';
import SeanceRecap from './SeanceRecap';

const SPORT_TYPES = [
  { key: 'club',   emoji: '🥊', label: 'Club MMA' },
  { key: 'gym',    emoji: '🏋️', label: 'Gym' },
  { key: 'maison', emoji: '🏠', label: 'Maison' },
  { key: 'autre',  emoji: '✅', label: 'Autre' },
];

const TYPE_LABELS = { club: 'Club MMA', gym: 'Gym', maison: 'Maison', autre: 'Autre' };

function SportDoneRow({ sport }) {
  const label = sport.seance_nom || TYPE_LABELS[sport.type] || 'Sport';
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50">
      <span className="text-sm font-medium text-gray-700">🥊 Sport</span>
      <span className="text-sm font-medium text-green-600">
        ✓ {label}{sport.duree_reelle ? ` · ${sport.duree_reelle} min` : ''}
      </span>
    </div>
  );
}

export default function SportModule({ journal, onSportSave, setAgenda, viewDate }) {
  const [step, setStep] = useState(null); // null | 'select' | 'training' | 'recap'
  const [type, setType] = useState(null);
  const [seance, setSeance] = useState(null);
  const [recapData, setRecapData] = useState(null);

  const sportDone = journal?.sport;
  const legacySport = !sportDone && journal?.habitudes?.sport;

  if (sportDone) return <SportDoneRow sport={sportDone} />;
  if (legacySport) return <SportDoneRow sport={{ type: 'autre' }} />;

  const handleType = (key) => {
    setType(key);
    if (key === 'autre') {
      onSportSave({ type: 'autre', duree_reelle: 0 });
    } else {
      setStep('select');
    }
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
        color: '#27AE60',
      }]);
    }
    setStep(null);
    setSeance(null);
    setRecapData(null);
  };

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
