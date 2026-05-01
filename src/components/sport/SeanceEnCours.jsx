import { useState, useEffect } from 'react';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

export default function SeanceEnCours({ seance, onTerminer, onAbandon }) {
  const [chrono, setChrono] = useState(0);
  const [restTime, setRestTime] = useState(null);
  const [currentEx, setCurrentEx] = useState(0);
  const [checked, setChecked] = useState({});

  const exercices = seance.exercices;
  const ex = exercices[currentEx];
  const totalSeries = exercices.reduce((s, e) => s + e.series, 0);
  const doneSeries = Object.values(checked).filter(Boolean).length;
  const progress = totalSeries > 0 ? doneSeries / totalSeries : 0;

  useEffect(() => {
    const id = setInterval(() => {
      setChrono(c => c + 1);
      setRestTime(prev => {
        if (prev === null) return null;
        if (prev <= 1) { playBeep(); return null; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const toggleSerie = (exIdx, sIdx) => {
    const key = `${exIdx}-${sIdx}`;
    const willCheck = !checked[key];
    setChecked(prev => ({ ...prev, [key]: willCheck }));
    if (willCheck && exercices[exIdx].repos > 0) {
      setRestTime(exercices[exIdx].repos);
    }
  };

  const handleTerminer = () => {
    const exercicesCompletes = exercices.filter((e, i) =>
      Array.from({ length: e.series }, (_, s) => checked[`${i}-${s}`]).every(Boolean)
    ).length;
    onTerminer({
      duree_reelle: Math.max(1, Math.round(chrono / 60)),
      exercices_completes: exercicesCompletes,
      exercices_totaux: exercices.length,
      series_cochees: doneSeries,
      series_totales: totalSeries,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-[9999]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <button onClick={onAbandon} className="text-gray-400 text-sm font-medium py-1 px-2">
          ✕ Abandon
        </button>
        <span className="text-white text-xl font-bold font-mono">{fmt(chrono)}</span>
        <span className="text-gray-400 text-sm">{doneSeries}/{totalSeries}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800 shrink-0">
        <div className="h-1 bg-green-500 transition-all duration-300" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-5 pt-6 pb-4 overflow-y-auto">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
          Exercice {currentEx + 1} / {exercices.length}
        </p>
        <h2 className="text-2xl font-bold text-white mb-1 leading-tight">{ex.nom}</h2>
        <p className="text-sm text-gray-400 mb-6">{ex.series} série{ex.series > 1 ? 's' : ''} · {ex.reps}</p>

        {/* Series buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Array.from({ length: ex.series }, (_, i) => {
            const done = !!checked[`${currentEx}-${i}`];
            return (
              <button
                key={i}
                onClick={() => toggleSerie(currentEx, i)}
                className={`w-13 h-13 w-[52px] h-[52px] rounded-full text-base font-bold transition-all active:scale-95 ${
                  done ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {done ? '✓' : i + 1}
              </button>
            );
          })}
        </div>

        {/* Rest timer */}
        {restTime !== null && (
          <div className="bg-gray-800 rounded-2xl p-5 text-center mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Repos</p>
            <p className="text-5xl font-bold font-mono text-green-400 mb-3">{fmt(restTime)}</p>
            <button
              onClick={() => setRestTime(null)}
              className="text-xs text-gray-500 underline"
            >
              Passer
            </button>
          </div>
        )}

        {/* Nav arrows */}
        <div className="flex gap-3 mt-auto pt-4">
          <button
            onClick={() => setCurrentEx(i => Math.max(0, i - 1))}
            disabled={currentEx === 0}
            className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 font-medium text-sm disabled:opacity-30 active:bg-gray-700"
          >
            ◄ Précédent
          </button>
          <button
            onClick={() => setCurrentEx(i => Math.min(exercices.length - 1, i + 1))}
            disabled={currentEx === exercices.length - 1}
            className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 font-medium text-sm disabled:opacity-30 active:bg-gray-700"
          >
            Suivant ►
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-8 pt-2 shrink-0">
        <button
          onClick={handleTerminer}
          className="w-full py-4 rounded-2xl font-bold text-white text-base active:opacity-90"
          style={{ background: '#27AE60' }}
        >
          💪 Terminer la séance
        </button>
      </div>
    </div>
  );
}
