import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTikTok, useFightFocus, useMarque } from '../hooks/useBanques';
import { useProjets, PROJET_PALETTE } from '../hooks/useProjets';
import Modal from '../components/Modal';
import SwipeableRow from '../components/SwipeableRow';

const TABS = [
  { id: 'tiktok',     label: 'TikTok',     color: 'var(--red)',    bg: 'var(--red-50)' },
  { id: 'fightfocus', label: 'FightFocus', color: 'var(--cyan)',   bg: 'var(--cyan-soft)' },
  { id: 'marque',     label: 'Marque',     color: 'var(--orange)', bg: 'var(--orange-soft)' },
  { id: 'projets',    label: 'Projets',    color: '#8E44AD',       bg: '#F3E5F5' },
];

// ─── Item context menu ──────────────────────────────────────────────────────

function ItemMenu({ open, onClose, itemLabel, color, onModifier, onDejaFait, onSupprimer }) {
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

// ─── Static item row (no drag — used for deja_fait items outside SortableContext) ─

function StaticItem({ item, banque, tab, onModifier, onDejaFait, onSupprimer }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDejaFait = item.statut === 'deja_fait';
  const isDone = item.statut === 'publiee' || item.statut === 'fait';

  const label = banque === 'tiktok' ? item.titre
    : banque === 'fightfocus' ? `${item.code} — ${item.description}`
    : item.description;
  const badge = banque === 'tiktok' ? item.priorite
    : banque === 'fightfocus' ? item.priorite
    : item.phase;
  const statusLabel = isDejaFait ? '✅ Déjà réalisé'
    : isDone ? (item.statut === 'publiee' ? '✅ Publiée' : '✅ Fait')
    : item.statut === 'a_tourner' ? 'À tourner' : 'À faire';

  return (
    <>
      <div className={`flex items-start gap-2 bg-white rounded-xl shadow-card p-3 mb-2 ${isDejaFait ? 'opacity-40' : 'opacity-60'}`}>
        <span className="w-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-snug line-through">{label}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {badge && !isDejaFait && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: tab.bg, color: tab.color }}>
                {badge}
              </span>
            )}
            <span className={`text-[10px] ${isDejaFait ? 'text-gray-300' : 'text-gray-400'}`}>{statusLabel}</span>
          </div>
        </div>
        <button onClick={() => setMenuOpen(true)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 flex-shrink-0 text-sm">
          ···
        </button>
      </div>
      <ItemMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        itemLabel={label}
        color={tab.color}
        onModifier={() => onModifier?.(item)}
        onDejaFait={() => onDejaFait(item.id)}
        onSupprimer={() => onSupprimer(item.id)}
      />
    </>
  );
}

// ─── Sortable item row ──────────────────────────────────────────────────────

function SortableItem({ item, banque, tab, onEdit, onDejaFait, onSupprimer, hidden, wrapped = false, dragDisabled = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: dragDisabled });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const [menuOpen, setMenuOpen] = useState(false);

  const isDejaFait = item.statut === 'deja_fait';
  const isDone = item.statut === 'publiee' || item.statut === 'fait';

  if (hidden) return null;

  const label = banque === 'tiktok' ? item.titre
    : banque === 'fightfocus' ? `${item.code} — ${item.description}`
    : item.description;

  const badge = banque === 'tiktok' ? item.priorite
    : banque === 'fightfocus' ? item.priorite
    : item.phase;

  const statusLabel = isDejaFait ? '✅ Déjà réalisé'
    : isDone ? (item.statut === 'publiee' ? '✅ Publiée' : '✅ Fait')
    : item.statut === 'a_tourner' ? 'À tourner' : 'À faire';

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-start gap-2 bg-white rounded-xl p-3 ${wrapped ? '' : 'mb-2 shadow-card'} ${isDejaFait ? 'opacity-40' : isDone ? 'opacity-60' : ''}`}
      >
        {!isDejaFait && !dragDisabled && (
          <span {...attributes} {...listeners} className="drag-handle text-gray-300 text-lg mt-0.5 flex-shrink-0 select-none">⠿</span>
        )}
        {(isDejaFait || dragDisabled) && <span className="w-5 flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-800 leading-snug ${(isDone || isDejaFait) ? 'line-through' : ''}`}>{label}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {badge && !isDejaFait && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: tab.bg, color: tab.color }}>
                {badge}
              </span>
            )}
            <span className={`text-[10px] ${isDejaFait ? 'text-gray-300' : 'text-gray-400'}`}>{statusLabel}</span>
          </div>
        </div>

        {/* "..." button */}
        <button
          onClick={() => setMenuOpen(true)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 flex-shrink-0 text-sm"
        >
          ···
        </button>
      </div>

      <ItemMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        itemLabel={label}
        color={tab.color}
        onModifier={() => onEdit(item)}
        onDejaFait={() => onDejaFait(item.id)}
        onSupprimer={() => onSupprimer(item.id)}
      />
    </>
  );
}

// ─── Banque list (TikTok / FightFocus / Marque) ─────────────────────────────

function BanqueList({ banque, items, setItems, searchQuery = '', filterStatus = 'all' }) {
  const [editItem, setEditItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});
  const [showDone, setShowDone] = useState(false);
  const tab = TABS.find(t => t.id === banque);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const isFiltered = !!searchQuery.trim() || filterStatus !== 'all';

  const matchesSearch = (item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const text = banque === 'tiktok' ? (item.titre || '')
      : banque === 'fightfocus' ? `${item.code || ''} ${item.description || ''}`
      : (item.description || '');
    return text.toLowerCase().includes(q);
  };

  const matchesFilter = (item) => {
    if (filterStatus === 'all') return true;
    return item.statut === filterStatus;
  };

  // Full arrays for DnD ordering
  const allActive  = items.filter(i => i.statut !== 'publiee' && i.statut !== 'fait' && i.statut !== 'deja_fait');
  const allDone    = items.filter(i => i.statut === 'publiee' || i.statut === 'fait');
  const allDejaFait = items.filter(i => i.statut === 'deja_fait');

  // Filtered arrays for display
  const active   = allActive.filter(i => matchesSearch(i) && matchesFilter(i));
  const done     = allDone.filter(i => matchesSearch(i) && matchesFilter(i));
  const dejaFait = allDejaFait.filter(i => matchesSearch(i));
  const draggable = [...active, ...done];

  const handleDragEnd = ({ active: a, over }) => {
    if (!over || a.id === over.id) return;
    const allDraggable = [...allActive, ...allDone];
    const oldIdx = allDraggable.findIndex(i => i.id === a.id);
    const newIdx = allDraggable.findIndex(i => i.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(allDraggable, oldIdx, newIdx);
    setItems([...reordered, ...allDejaFait]);
  };

  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setShowAdd(false); };

  const openAdd = () => {
    setEditItem(null);
    if (banque === 'tiktok') setForm({ statut: 'a_tourner', priorite: 'HAUTE', discipline: 'Tous', format: '', titre: '' });
    else if (banque === 'fightfocus') setForm({ statut: 'a_faire', priorite: 'P1', code: '', description: '' });
    else setForm({ statut: 'a_faire', phase: 'Phase 1', description: '' });
    setShowAdd(true);
  };

  const save = () => {
    if (editItem) {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...form, id: editItem.id } : i));
    } else {
      const newId = Math.max(0, ...items.map(i => i.id)) + 1;
      setItems(prev => [...prev, { ...form, id: newId }]);
    }
    setEditItem(null); setShowAdd(false);
  };

  const handleDejaFait = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, statut: 'deja_fait' } : i));
  const handleSupprimer = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const isOpen = !!editItem || showAdd;

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 sticky top-0 bg-bg pt-1 pb-2 z-10">
        <span className="text-sm text-gray-500">{active.length} à faire · {done.length} fait</span>
        <button onClick={openAdd}
          className="w-8 h-8 rounded-full text-white text-lg font-bold flex items-center justify-center shadow-md"
          style={{ background: tab.color }}>+</button>
      </div>

      {/* Toggle deja_fait */}
      {dejaFait.length > 0 && (
        <button
          onClick={() => setShowDone(v => !v)}
          className="mb-3 text-xs text-gray-400 flex items-center gap-1.5 hover:text-gray-600"
        >
          <span>{showDone ? '▼' : '▶'}</span>
          {showDone ? 'Masquer' : 'Afficher'} les items déjà réalisés ({dejaFait.length})
        </button>
      )}

      {/* Draggable active + done items */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={draggable.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {draggable.map(item => (
            <SwipeableRow
              key={item.id}
              onFait={() => handleDejaFait(item.id)}
              onSupprimer={() => handleSupprimer(item.id)}
            >
              <SortableItem item={item} banque={banque} tab={tab}
                onEdit={openEdit} onDejaFait={handleDejaFait} onSupprimer={handleSupprimer}
                wrapped dragDisabled={isFiltered} />
            </SwipeableRow>
          ))}
        </SortableContext>
      </DndContext>

      {/* Deja fait items (non-draggable, outside SortableContext intentionally) */}
      {showDone && dejaFait.length > 0 && (
        <div className="mt-1">
          <div className="h-px bg-gray-100 mb-3" />
          {dejaFait.map(item => (
            <StaticItem key={item.id} item={item} banque={banque} tab={tab}
              onModifier={openEdit} onDejaFait={handleDejaFait} onSupprimer={handleSupprimer} />
          ))}
        </div>
      )}

      {/* Edit / Add modal */}
      <Modal open={isOpen} onClose={() => { setEditItem(null); setShowAdd(false); }}
        title={editItem ? 'Modifier' : 'Nouvel item'}
        footer={
          <div className="flex gap-2 w-full">
            <button onClick={save} disabled={banque === 'tiktok' ? !form.titre?.trim() : !form.description?.trim()}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40"
              style={{ background: tab.color }}>
              Enregistrer
            </button>
            <button onClick={() => { setEditItem(null); setShowAdd(false); }}
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
              Annuler
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {banque === 'tiktok' && <>
            <label><span className="text-xs text-gray-500 block mb-1">Titre</span>
              <input value={form.titre || ''} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Titre de la vidéo" /></label>
            <label><span className="text-xs text-gray-500 block mb-1">Format</span>
              <input value={form.format || ''} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Liste/Talking head" /></label>
            <label><span className="text-xs text-gray-500 block mb-1">Discipline</span>
              <input value={form.discipline || ''} onChange={e => setForm(f => ({ ...f, discipline: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="BJJ, MMA, Muay Thai..." /></label>
            <label><span className="text-xs text-gray-500 block mb-1">Priorité</span>
              <select value={form.priorite || 'HAUTE'} onChange={e => setForm(f => ({ ...f, priorite: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option>HAUTE</option><option>MOYENNE</option><option>FAIBLE</option>
              </select></label>
            <label><span className="text-xs text-gray-500 block mb-1">Statut</span>
              <select value={form.statut || 'a_tourner'} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="a_tourner">À tourner</option><option value="publiee">Publiée</option>
              </select></label>
          </>}
          {banque === 'fightfocus' && <>
            <label><span className="text-xs text-gray-500 block mb-1">Code</span>
              <input value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: BUG-01" /></label>
            <label><span className="text-xs text-gray-500 block mb-1">Description</span>
              <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3} /></label>
            <label><span className="text-xs text-gray-500 block mb-1">Priorité</span>
              <select value={form.priorite || 'P1'} onChange={e => setForm(f => ({ ...f, priorite: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option>P1</option><option>P2</option><option>P3</option>
              </select></label>
            <label><span className="text-xs text-gray-500 block mb-1">Statut</span>
              <select value={form.statut || 'a_faire'} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="a_faire">À faire</option><option value="fait">Fait</option>
              </select></label>
          </>}
          {banque === 'marque' && <>
            <label><span className="text-xs text-gray-500 block mb-1">Description</span>
              <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={3} /></label>
            <label><span className="text-xs text-gray-500 block mb-1">Phase</span>
              <select value={form.phase || 'Phase 1'} onChange={e => setForm(f => ({ ...f, phase: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option>Phase 1</option><option>Phase 2</option><option>Phase 3</option>
              </select></label>
            <label><span className="text-xs text-gray-500 block mb-1">Statut</span>
              <select value={form.statut || 'a_faire'} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="a_faire">À faire</option><option value="fait">Fait</option>
              </select></label>
          </>}
        </div>
      </Modal>
    </>
  );
}

// ─── Projets tab ─────────────────────────────────────────────────────────────

const PROJET_FORM_EMPTY = { nom: '', emoji: '📁', couleur: PROJET_PALETTE[0], taches: [] };

function ProjetTaskRow({ tache, projetCouleur, onModifier, onDejaFait, onSupprimer }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDejaFait = tache.statut === 'deja_fait';
  const isDone = tache.statut === 'fait';

  return (
    <>
      <div className={`flex items-center gap-2 py-2 px-2 rounded-lg ${isDejaFait ? 'opacity-40' : ''}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ background: isDone || isDejaFait ? '#D1D5DB' : projetCouleur }} />
        <span className={`flex-1 text-sm text-gray-700 leading-snug ${(isDone || isDejaFait) ? 'line-through text-gray-400' : ''}`}>
          {tache.description}
        </span>
        {isDejaFait && <span className="text-[10px] text-gray-300">Déjà réalisé</span>}
        <button onClick={() => setMenuOpen(true)} className="w-6 h-6 flex items-center justify-center text-gray-400 text-xs rounded hover:bg-gray-100 flex-shrink-0">
          ···
        </button>
      </div>

      <ItemMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        itemLabel={tache.description}
        color={projetCouleur}
        onModifier={() => onModifier?.(tache)}
        onDejaFait={() => onDejaFait(tache.id)}
        onSupprimer={() => onSupprimer(tache.id)}
      />
    </>
  );
}

function ProjetCard({ projet, onEdit, onDelete, onUpdateTaches }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [showDoneTask, setShowDoneTasks] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');

  const activeTaches = (projet.taches || []).filter(t => t.statut === 'a_faire');
  const doneTaches   = (projet.taches || []).filter(t => t.statut === 'fait' || t.statut === 'deja_fait');

  const addTask = () => {
    if (!newTask.trim()) return;
    const id = Math.max(0, ...(projet.taches || []).map(t => t.id)) + 1;
    onUpdateTaches([...(projet.taches || []), { id, description: newTask.trim(), statut: 'a_faire' }]);
    setNewTask('');
    setShowAddTask(false);
  };

  const markTaskDejaFait = (tacheId) => {
    onUpdateTaches(projet.taches.map(t => t.id === tacheId ? { ...t, statut: 'deja_fait' } : t));
  };

  const removeTask = (tacheId) => {
    onUpdateTaches(projet.taches.filter(t => t.id !== tacheId));
  };

  const openEditTask = (tache) => { setEditTask(tache); setEditTaskText(tache.description); };

  const saveEditTask = () => {
    if (!editTaskText.trim()) return;
    onUpdateTaches(projet.taches.map(t => t.id === editTask.id ? { ...t, description: editTaskText.trim() } : t));
    setEditTask(null);
    setEditTaskText('');
  };

  return (
    <div className="bg-white rounded-xl shadow-card mb-3 overflow-hidden relative">
      {/* Left color bar */}
      <div className="absolute left-0 top-0 bottom-0" style={{ width: 3, background: projet.couleur }} />
      {/* Project header */}
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: projet.couleur + '22' }}>
          {projet.emoji}
        </div>
        <div className="flex-1 min-w-0" onClick={() => setExpanded(v => !v)}>
          <p className="font-semibold text-sm text-gray-800">{projet.nom}</p>
          <p className="text-xs text-gray-400">{activeTaches.length} tâche{activeTaches.length !== 1 ? 's' : ''} restante{activeTaches.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setExpanded(v => !v)}
            className="w-7 h-7 flex items-center justify-center text-gray-400 text-sm">
            {expanded ? '▲' : '▼'}
          </button>
          <button onClick={() => onEdit(projet)} className="w-7 h-7 flex items-center justify-center text-gray-400 text-xs rounded hover:bg-gray-100">
            ✏️
          </button>
          <button onClick={() => onDelete(projet.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-xs" style={{ color: 'var(--red)' }}>
            🗑️
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 px-3 pb-2 pt-1">
          {activeTaches.map(t => (
            <ProjetTaskRow key={t.id} tache={t} projetCouleur={projet.couleur}
              onModifier={openEditTask} onDejaFait={markTaskDejaFait} onSupprimer={removeTask} />
          ))}

          {doneTaches.length > 0 && (
            <button onClick={() => setShowDoneTasks(v => !v)}
              className="text-xs text-gray-300 mt-1 mb-1 hover:text-gray-500">
              {showDoneTask ? '▼' : '▶'} {doneTaches.length} réalisé{doneTaches.length !== 1 ? 's' : ''}
            </button>
          )}
          {showDoneTask && doneTaches.map(t => (
            <ProjetTaskRow key={t.id} tache={t} projetCouleur={projet.couleur}
              onModifier={openEditTask} onDejaFait={markTaskDejaFait} onSupprimer={removeTask} />
          ))}

          {showAddTask ? (
            <div className="flex gap-2 mt-2">
              <input autoFocus value={newTask} onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setShowAddTask(false); }}
                placeholder="Description de la tâche..." className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
              <button onClick={addTask} disabled={!newTask.trim()}
                className="px-3 py-1.5 rounded-lg text-white text-sm font-medium disabled:opacity-40"
                style={{ background: projet.couleur }}>OK</button>
            </div>
          ) : (
            <button onClick={() => setShowAddTask(true)}
              className="mt-2 text-sm flex items-center gap-1.5 font-medium" style={{ color: projet.couleur }}>
              + Ajouter une tâche
            </button>
          )}
        </div>
      )}
      {/* Edit task modal */}
      <Modal
        open={!!editTask}
        onClose={() => { setEditTask(null); setEditTaskText(''); }}
        title="Modifier la tâche"
        footer={
          <div className="flex gap-2 w-full">
            <button onClick={saveEditTask} disabled={!editTaskText.trim()}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40"
              style={{ background: projet.couleur }}>
              Enregistrer
            </button>
            <button onClick={() => { setEditTask(null); setEditTaskText(''); }}
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
              Annuler
            </button>
          </div>
        }
      >
        <textarea
          autoFocus value={editTaskText}
          onChange={e => setEditTaskText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEditTask(); } }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          rows={3}
        />
      </Modal>
    </div>
  );
}

function ProjetsList({ projets, setProjets }) {
  const [showForm, setShowForm] = useState(false);
  const [editProjet, setEditProjet] = useState(null);
  const [form, setForm] = useState(PROJET_FORM_EMPTY);

  const openAdd = () => { setEditProjet(null); setForm(PROJET_FORM_EMPTY); setShowForm(true); };
  const openEdit = (p) => { setEditProjet(p); setForm({ ...p }); setShowForm(true); };

  const save = () => {
    if (!form.nom.trim()) return;
    if (editProjet) {
      setProjets(prev => prev.map(p => p.id === editProjet.id ? { ...p, nom: form.nom, emoji: form.emoji, couleur: form.couleur } : p));
    } else {
      const id = Math.max(0, ...(projets || []).map(p => p.id), 0) + 1;
      setProjets(prev => [...(prev || []), { id, nom: form.nom, emoji: form.emoji, couleur: form.couleur, taches: [] }]);
    }
    setShowForm(false);
  };

  const deleteProjet = (id) => setProjets(prev => prev.filter(p => p.id !== id));

  const updateTaches = (projetId, taches) => {
    setProjets(prev => prev.map(p => p.id === projetId ? { ...p, taches } : p));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3 sticky top-0 bg-bg pt-1 pb-2 z-10">
        <span className="text-sm text-gray-500">{(projets || []).length} projet{(projets || []).length !== 1 ? 's' : ''}</span>
        <button onClick={openAdd}
          className="w-8 h-8 rounded-full text-white text-lg font-bold flex items-center justify-center shadow-md"
          style={{ background: '#8E44AD' }}>+</button>
      </div>

      {(projets || []).length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-gray-400 text-sm">Aucun projet pour l'instant</p>
          <p className="text-gray-300 text-xs mt-1">Crée ton premier projet avec le bouton +</p>
        </div>
      )}

      {(projets || []).map(projet => (
        <ProjetCard
          key={projet.id}
          projet={projet}
          onEdit={openEdit}
          onDelete={deleteProjet}
          onUpdateTaches={(taches) => updateTaches(projet.id, taches)}
        />
      ))}

      {/* Create / Edit project modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editProjet ? 'Modifier le projet' : 'Nouveau projet'}
        footer={
          <div className="flex gap-2 w-full">
            <button onClick={save} disabled={!form.nom.trim()}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40"
              style={{ background: '#8E44AD' }}>
              Enregistrer
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm">
              Annuler
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <label>
            <span className="text-xs text-gray-500 block mb-1">Nom du projet *</span>
            <input autoFocus value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="Ex: Lancement boutique" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="text-xs text-gray-500 block mb-1">Emoji</span>
            <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-xl text-center" maxLength={2} />
          </label>
          <div>
            <span className="text-xs text-gray-500 block mb-2">Couleur</span>
            <div className="flex gap-3">
              {PROJET_PALETTE.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, couleur: c }))}
                  className="w-8 h-8 rounded-full flex-shrink-0 transition-transform"
                  style={{
                    background: c,
                    transform: form.couleur === c ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: form.couleur === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none',
                  }} />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Main Banques page ────────────────────────────────────────────────────────

export default function Banques({ pendingCompose, onPendingConsumed }) {
  const [activeTab, setActiveTab] = useState('tiktok');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tiktok, setTiktok] = useTikTok();
  const [fightfocus, setFightFocus] = useFightFocus();
  const [marque, setMarque] = useMarque();
  const [projets, setProjets] = useProjets();

  useEffect(() => {
    if (!pendingCompose) return;
    if (['tiktok', 'fightfocus', 'marque', 'projets'].includes(pendingCompose)) {
      setActiveTab(pendingCompose);
      setFilterStatus('all');
      onPendingConsumed?.();
    }
  }, [pendingCompose]);

  const setters = { tiktok: setTiktok, fightfocus: setFightFocus, marque: setMarque };
  const data = { tiktok, fightfocus, marque };

  const activeTabConfig = TABS.find(t => t.id === activeTab);

  const filterOptions = activeTab === 'tiktok'
    ? [{ id: 'all', label: 'Toutes' }, { id: 'a_tourner', label: 'À tourner' }, { id: 'publiee', label: 'Publiées' }]
    : activeTab === 'projets'
    ? []
    : [{ id: 'all', label: 'Toutes' }, { id: 'a_faire', label: 'À faire' }, { id: 'fait', label: 'Faites' }];

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center gap-2 rounded-2xl px-3 py-2 shadow-card" style={{ background: 'var(--surface)' }}>
          <Search size={15} color="var(--ink-3)" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: 'var(--ink)' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs leading-none" style={{ color: 'var(--ink-3)' }}>✕</button>
          )}
        </div>
      </div>

      {/* Pill tabs */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setFilterStatus('all'); setSearchQuery(''); }}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold btn-press transition-colors"
            style={activeTab === t.id
              ? { background: t.color, color: 'white' }
              : { background: 'var(--line-2)', color: 'var(--ink-2)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter chips */}
      {filterOptions.length > 0 && (
        <div className="flex gap-2 items-center px-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium btn-press"
              style={filterStatus === f.id
                ? { background: activeTabConfig?.color, color: 'white' }
                : { background: 'var(--line-2)', color: 'var(--ink-2)' }}
            >
              {f.label}
            </button>
          ))}
          <button
            className="ml-auto flex items-center gap-1 flex-shrink-0 btn-press"
            style={{ fontSize: 12, color: 'var(--ink-3)' }}
          >
            <SlidersHorizontal size={12} />
            Trier
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto px-4 pt-1 pb-nav" style={{ background: 'var(--bg)' }}>
        {activeTab !== 'projets' ? (
          <BanqueList
            key={activeTab}
            banque={activeTab}
            items={data[activeTab]}
            setItems={setters[activeTab]}
            searchQuery={searchQuery}
            filterStatus={filterStatus}
          />
        ) : (
          <ProjetsList projets={projets} setProjets={setProjets} />
        )}
      </div>
    </div>
  );
}
