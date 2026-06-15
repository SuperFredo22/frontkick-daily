export const seancesMaison = [
  {
    id: "maison_court_1",
    nom: "Cardio express",
    duree: 15,
    materiel: "Aucun matériel",
    type: "Cardio",
    niveau: "Débutant",
    exercices: [
      { nom: "Échauffement articulaire", series: 1, reps: "2 min", repos: 0 },
      { nom: "Jumping jacks", series: 3, reps: "30 reps", repos: 20 },
      { nom: "Mountain climbers", series: 3, reps: "20 reps", repos: 20 },
      { nom: "Burpees", series: 3, reps: "8 reps", repos: 30 },
    ]
  },
  {
    id: "maison_court_2",
    nom: "Mobilité et gainage",
    duree: 20,
    materiel: "Aucun matériel",
    type: "Mobilité",
    niveau: "Débutant",
    exercices: [
      { nom: "Échauffement mobilité", series: 1, reps: "5 min", repos: 0 },
      { nom: "Gainage planche", series: 3, reps: "30 sec", repos: 20 },
      { nom: "Gainage latéral", series: 2, reps: "30 sec/côté", repos: 20 },
      { nom: "Superman", series: 2, reps: "12 reps", repos: 20 },
      { nom: "Étirements", series: 1, reps: "3 min", repos: 0 },
    ]
  },
  {
    id: "maison_court_3",
    nom: "Réveil musculaire",
    duree: 15,
    materiel: "Aucun matériel",
    type: "Full body",
    niveau: "Débutant",
    exercices: [
      { nom: "Échauffement articulaire", series: 1, reps: "2 min", repos: 0 },
      { nom: "Squat poids du corps", series: 3, reps: "15 reps", repos: 20 },
      { nom: "Pompes (genoux si besoin)", series: 3, reps: "10 reps", repos: 30 },
      { nom: "Fentes alternées", series: 3, reps: "10 reps/jambe", repos: 20 },
      { nom: "Gainage planche", series: 2, reps: "30 sec", repos: 20 },
    ]
  },
  {
    id: "maison_court_4",
    nom: "Abdos & gainage focus",
    duree: 15,
    materiel: "Aucun matériel",
    type: "Core",
    niveau: "Débutant",
    exercices: [
      { nom: "Échauffement", series: 1, reps: "2 min", repos: 0 },
      { nom: "Crunchs", series: 3, reps: "20 reps", repos: 20 },
      { nom: "Relevés de jambes", series: 3, reps: "15 reps", repos: 20 },
      { nom: "Gainage planche", series: 3, reps: "40 sec", repos: 20 },
      { nom: "Gainage latéral", series: 2, reps: "30 sec/côté", repos: 20 },
    ]
  },
  {
    id: "maison_moyen_1",
    nom: "Upper body dips",
    duree: 30,
    materiel: "Barres de dips",
    type: "Force",
    niveau: "Intermédiaire",
    exercices: [
      { nom: "Échauffement", series: 1, reps: "3 min", repos: 0 },
      { nom: "Dips", series: 4, reps: "10 reps", repos: 90 },
      { nom: "Pompes", series: 4, reps: "15 reps", repos: 60 },
      { nom: "Pompes inclinées", series: 3, reps: "12 reps", repos: 60 },
      { nom: "Gainage", series: 3, reps: "45 sec", repos: 30 },
    ]
  },
  {
    id: "maison_moyen_2",
    nom: "Combat conditioning",
    duree: 30,
    materiel: "Barres de dips",
    type: "Combat",
    niveau: "Intermédiaire",
    exercices: [
      { nom: "Échauffement shadow boxing", series: 1, reps: "3 min", repos: 0 },
      { nom: "Shadow boxing", series: 3, reps: "3 min", repos: 60 },
      { nom: "Dips explosifs", series: 3, reps: "8 reps", repos: 60 },
      { nom: "Burpees", series: 3, reps: "10 reps", repos: 45 },
      { nom: "Gainage", series: 2, reps: "45 sec", repos: 30 },
    ]
  },
  {
    id: "maison_moyen_3",
    nom: "Full body bandes",
    duree: 30,
    materiel: "Bandes de résistance",
    type: "Force",
    niveau: "Intermédiaire",
    exercices: [
      { nom: "Échauffement", series: 1, reps: "3 min", repos: 0 },
      { nom: "Squat avec bandes", series: 3, reps: "15 reps", repos: 45 },
      { nom: "Rowing bandes", series: 3, reps: "12 reps", repos: 45 },
      { nom: "Pompes", series: 3, reps: "12 reps", repos: 45 },
      { nom: "Fentes avec bandes", series: 3, reps: "10 reps/jambe", repos: 45 },
      { nom: "Gainage", series: 2, reps: "45 sec", repos: 30 },
    ]
  },
  {
    id: "maison_moyen_4",
    nom: "Pyramide poids du corps",
    duree: 30,
    materiel: "Aucun matériel",
    type: "Conditionnement",
    niveau: "Intermédiaire",
    exercices: [
      { nom: "Échauffement", series: 1, reps: "3 min", repos: 0 },
      { nom: "Pompes (pyramide 10-8-6-8-10)", series: 5, reps: "pyramide", repos: 45 },
      { nom: "Squats sautés", series: 4, reps: "15 reps", repos: 45 },
      { nom: "Mountain climbers", series: 4, reps: "30 reps", repos: 30 },
      { nom: "Burpees", series: 3, reps: "12 reps", repos: 45 },
      { nom: "Gainage", series: 3, reps: "1 min", repos: 30 },
    ]
  },
  {
    id: "maison_long_1",
    nom: "MMA Conditioning complet",
    duree: 50,
    materiel: "Barres de dips + bandes",
    type: "Combat",
    niveau: "Avancé",
    exercices: [
      { nom: "Échauffement", series: 1, reps: "5 min", repos: 0 },
      { nom: "Shadow boxing", series: 5, reps: "3 min", repos: 60 },
      { nom: "Dips", series: 4, reps: "10 reps", repos: 75 },
      { nom: "Burpees", series: 4, reps: "10 reps", repos: 45 },
      { nom: "Pompes explosives", series: 3, reps: "10 reps", repos: 45 },
      { nom: "Gainage", series: 3, reps: "1 min", repos: 30 },
      { nom: "Étirements", series: 1, reps: "5 min", repos: 0 },
    ]
  },
  {
    id: "maison_long_2",
    nom: "Force et endurance",
    duree: 45,
    materiel: "Barres de dips + bandes",
    type: "Force",
    niveau: "Avancé",
    exercices: [
      { nom: "Échauffement", series: 1, reps: "5 min", repos: 0 },
      { nom: "Dips", series: 4, reps: "12 reps", repos: 90 },
      { nom: "Pompes", series: 4, reps: "15 reps", repos: 75 },
      { nom: "Squat avec bandes", series: 4, reps: "15 reps", repos: 60 },
      { nom: "Rowing bandes", series: 3, reps: "12 reps", repos: 60 },
      { nom: "Fentes avec bandes", series: 3, reps: "12 reps", repos: 45 },
      { nom: "Gainage latéral", series: 2, reps: "45 sec/côté", repos: 30 },
      { nom: "Étirements", series: 1, reps: "5 min", repos: 0 },
    ]
  },
  {
    id: "maison_long_3",
    nom: "Guerrier — circuit avancé",
    duree: 50,
    materiel: "Barres de dips + bandes",
    type: "Combat / Conditionnement",
    niveau: "Avancé",
    exercices: [
      { nom: "Échauffement dynamique", series: 1, reps: "5 min", repos: 0 },
      { nom: "Shadow boxing intensif", series: 5, reps: "3 min", repos: 45 },
      { nom: "Burpees pompes", series: 5, reps: "12 reps", repos: 45 },
      { nom: "Dips explosifs", series: 4, reps: "10 reps", repos: 60 },
      { nom: "Squats sautés", series: 4, reps: "20 reps", repos: 45 },
      { nom: "Sprint sur place genoux hauts", series: 4, reps: "45 sec", repos: 30 },
      { nom: "Gainage dynamique", series: 3, reps: "1 min", repos: 30 },
      { nom: "Étirements", series: 1, reps: "5 min", repos: 0 },
    ]
  },
];
