// Central JSDoc type definitions for the app's persisted data shapes.
// This file contains no runtime code — it exists so editors and `checkJs`
// tooling can type-check and autocomplete the structures stored in
// localStorage. Reference a type from anywhere with:
//   /** @type {import('../types').Journal} */
//
// Conventions: all data lives under localStorage keys prefixed with `fk_`
// (see hooks/useStorage.js). Dates are 'YYYY-MM-DD' strings (utils/date.js).

/**
 * @typedef {'tiktok'|'fightfocus'|'marque'|'projet'} Banque
 * Source d'une tâche. `projet` = tâche issue d'un projet (voir Projet).
 */

/**
 * @typedef {'a_faire'|'fait'|'reporte'} TacheStatut
 */

/**
 * @typedef {Object} Tache
 * @property {number} id
 * @property {Banque} banque
 * @property {string} label                Libellé affiché.
 * @property {TacheStatut} statut
 * @property {number} [projetId]            Renseigné si banque === 'projet'.
 * @property {string} [projetNom]
 */

/**
 * @typedef {Object} Bonus
 * Une "action importante" loguée hors-liste.
 * @property {number} id
 * @property {string} texte
 */

/**
 * @typedef {Object} Habitudes
 * @property {number} prieres
 * @property {boolean} sport       Legacy : booléen "a fait du sport". Les
 *                                 séances détaillées vivent dans Journal.sport.
 * @property {number} cigarettes
 * @property {string} note
 */

/**
 * @typedef {'club'|'gym'|'maison'|'autre'} SportType
 */

/**
 * @typedef {Object} Sport
 * Séance d'entraînement détaillée du jour.
 * @property {SportType} type
 * @property {number} [duree_reelle]   Durée en minutes (sert au calcul d'XP).
 * @property {string} [seance_nom]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} Journal
 * État d'une journée (clé localStorage `fk_journal_<date>`).
 * @property {string} date                'YYYY-MM-DD'
 * @property {Tache[]} taches
 * @property {Habitudes} habitudes
 * @property {Bonus[]} bonus
 * @property {Sport} [sport]
 * @property {Array<Object>} [agendaBlocs]
 */

/**
 * @typedef {Object} AgendaEvent
 * Rendez-vous de l'agenda (clé localStorage `fk_agenda`).
 * @property {number} id
 * @property {string} titre
 * @property {string} date                'YYYY-MM-DD'
 * @property {string} heureDebut          'HH:MM'
 * @property {string} heureFin            'HH:MM'
 * @property {string} [lieu]
 * @property {string} [note]
 * @property {boolean} [recurrent]        Récurrent chaque semaine.
 * @property {number} [recurrentId]       Identifiant partagé des occurrences.
 * @property {Banque} [type]              Si créé depuis une tâche.
 * @property {string} [color]
 * @property {boolean} [fromTask]
 */

/**
 * @typedef {Object} ProjetTache
 * @property {number} id
 * @property {string} description
 * @property {TacheStatut} statut
 */

/**
 * @typedef {Object} Projet
 * (clé localStorage `fk_projets`)
 * @property {number} id
 * @property {string} nom
 * @property {string} emoji
 * @property {string} couleur             Une des PROJET_PALETTE.
 * @property {string} [echeance]          'YYYY-MM-DD'
 * @property {ProjetTache[]} taches
 */

/**
 * @typedef {Object} Jalon
 * Objectif chiffré (clé localStorage `fk_jalons`). Voir data/jalons.js.
 * @property {number} id
 * @property {string} titre
 * @property {string} categorie           Contenu | Sport | Marque | Perso
 * @property {number} cible
 * @property {number} actuel              Valeur manuelle, ou ajustement pour
 *                                        un jalon à source automatique.
 * @property {string} unite
 * @property {string} [echeance]
 * @property {string} [source]            Clé de suivi auto (JALON_SOURCES).
 */

export {};
