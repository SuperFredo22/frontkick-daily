// Jalons = milestones that turn the broad yearly objectives into precise,
// trackable targets. Each has a category, a numeric target (cible) and a
// current value (actuel) so progression is measurable. This is only the
// initial seed — the user creates / edits their own from the Progression tab.

export const JALON_CATEGORIES = {
  Contenu: { color: 'var(--red)' },
  Sport:   { color: 'var(--cyan)' },
  Marque:  { color: 'var(--orange)' },
  Perso:   { color: 'var(--violet)' },
};

// `source` (optionnel) = suivi automatique branché sur les données réelles de
// l'app (voir JALON_SOURCES dans components/Jalons.jsx). Sans source, le jalon
// se compte à la main avec les boutons +/−.
export const jalonsInitial = [
  { id: 1, titre: 'Publier 20 vidéos ce mois', categorie: 'Contenu', cible: 20, actuel: 0, unite: 'vidéos', echeance: '', source: 'videos_mois' },
  { id: 2, titre: 'Lancer 3 séries thématiques hebdo', categorie: 'Contenu', cible: 3, actuel: 0, unite: 'séries', echeance: '' },
  { id: 3, titre: '30 entraînements ce trimestre', categorie: 'Sport', cible: 30, actuel: 0, unite: 'séances', echeance: '', source: 'seances_trim' },
  { id: 4, titre: 'Passer toutes les séances au niveau avancé', categorie: 'Sport', cible: 10, actuel: 0, unite: 'séances', echeance: '' },
];
