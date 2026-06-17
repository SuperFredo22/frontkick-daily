import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Modal from '../Modal';
import SwipeableRow from '../SwipeableRow';
import ItemMenu from './ItemMenu';
import { TABS } from '../../data/banqueTabs';

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
            {banque === 'tiktok' && item.serie && !isDejaFait && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>
                📅 {item.serie}
              </span>
            )}
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
            {banque === 'tiktok' && item.serie && !isDejaFait && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>
                📅 {item.serie}
              </span>
            )}
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

export default function BanqueList({ banque, items, setItems, searchQuery = '', filterStatus = 'all' }) {
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Liste/Talking head, Tuto/Défi, Format court" /></label>
            <label><span className="text-xs text-gray-500 block mb-1">Série hebdo (optionnel)</span>
              <input value={form.serie || ''} onChange={e => setForm(f => ({ ...f, serie: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ex: Lundi Technique" /></label>
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

