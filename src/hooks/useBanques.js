import { useStorage } from './useStorage';
import { tiktokInitial } from '../data/tiktok';
import { fightfocusInitial } from '../data/fightfocus';
import { marqueInitial } from '../data/marque';

const ACTIVE_STATUTS = {
  tiktok: ['a_tourner'],
  fightfocus: ['a_faire'],
  marque: ['a_faire'],
};

// Une série TikTok mise en avant : son prochain item actif passe AVANT toute
// autre suggestion TikTok du jour (concept « un sport méconnu par jour »).
export const PRIORITY_SERIE = 'Sport du jour';

export function useTikTok() {
  return useStorage('tiktok', tiktokInitial);
}

export function useFightFocus() {
  return useStorage('fightfocus', fightfocusInitial);
}

export function useMarque() {
  return useStorage('marque', marqueInitial);
}

export function useAllBanques() {
  const [tiktok, setTiktok] = useTikTok();
  const [fightfocus, setFightFocus] = useFightFocus();
  const [marque, setMarque] = useMarque();

  const markDone = (banque, id) => {
    const doneStatut = banque === 'tiktok' ? 'publiee' : 'fait';
    if (banque === 'tiktok') {
      setTiktok(prev => prev.map(item => item.id === id ? { ...item, statut: doneStatut } : item));
    } else if (banque === 'fightfocus') {
      setFightFocus(prev => prev.map(item => item.id === id ? { ...item, statut: doneStatut } : item));
    } else if (banque === 'marque') {
      setMarque(prev => prev.map(item => item.id === id ? { ...item, statut: doneStatut } : item));
    }
  };

  const markUndone = (banque, id) => {
    const originalStatut = banque === 'tiktok' ? 'a_tourner' : 'a_faire';
    if (banque === 'tiktok') {
      setTiktok(prev => prev.map(item => item.id === id ? { ...item, statut: originalStatut } : item));
    } else if (banque === 'fightfocus') {
      setFightFocus(prev => prev.map(item => item.id === id ? { ...item, statut: originalStatut } : item));
    } else if (banque === 'marque') {
      setMarque(prev => prev.map(item => item.id === id ? { ...item, statut: originalStatut } : item));
    }
  };

  const markDejaFait = (banque, id) => {
    if (banque === 'tiktok') {
      setTiktok(prev => prev.map(item => item.id === id ? { ...item, statut: 'deja_fait' } : item));
    } else if (banque === 'fightfocus') {
      setFightFocus(prev => prev.map(item => item.id === id ? { ...item, statut: 'deja_fait' } : item));
    } else if (banque === 'marque') {
      setMarque(prev => prev.map(item => item.id === id ? { ...item, statut: 'deja_fait' } : item));
    }
  };

  const getNextItem = (banque, skippedToday) => {
    let items;
    if (banque === 'tiktok') items = tiktok;
    else if (banque === 'fightfocus') items = fightfocus;
    else items = marque;

    const activeStatut = ACTIVE_STATUTS[banque];
    const isActive = (item) =>
      activeStatut.includes(item.statut) &&
      !skippedToday.includes(`${banque}_${item.id}`);

    // Priorité : pour TikTok, on sert d'abord le prochain « Sport du jour ».
    if (banque === 'tiktok') {
      const prioritaire = items.find(item => item.serie === PRIORITY_SERIE && isActive(item));
      if (prioritaire) return prioritaire;
    }

    return items.find(isActive) || null;
  };

  const hasAvailableItems = (banque) => {
    let items;
    if (banque === 'tiktok') items = tiktok;
    else if (banque === 'fightfocus') items = fightfocus;
    else items = marque;
    const activeStatut = ACTIVE_STATUTS[banque];
    return items.some(item => activeStatut.includes(item.statut));
  };

  return { tiktok, setTiktok, fightfocus, setFightFocus, marque, setMarque, markDone, markUndone, markDejaFait, getNextItem, hasAvailableItems };
}
