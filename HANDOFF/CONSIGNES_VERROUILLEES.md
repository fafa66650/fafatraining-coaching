# FAFATRAINING — Consignes verrouillées

## Socle et méthode
- Toujours partir du dernier socle fonctionnel complet disponible et conserver les fonctions utiles déjà validées.
- Une nouvelle version doit améliorer sans supprimer ou dégrader une fonction existante, sauf demande explicite.
- Nettoyer les anciennes couches de code : une seule source de vérité, aucun composant/fonction runtime concurrent, aucun ancien asset ou ancien fichier de version inutile.
- Avant livraison : audit fonctionnel, données, syntaxe, assets, responsive, cache/PWA, ZIP final et test après extraction.

## Posture professionnelle attendue
Travailler simultanément comme :
- architecte/programmeur d'application web/PWA ;
- spécialiste UX/UI, ergonomie mobile/desktop, performance et accessibilité ;
- directeur artistique FAFATRAINING ;
- spécialiste réseaux sociaux Instagram/TikTok ;
- coach sportif/préparateur physique pour la cohérence des prescriptions.

## UX
- 1 action = 1 résultat immédiatement visible.
- Aucun contenu important ne doit apparaître hors viewport ou sous le dock.
- Bouton Retour cohérent et conservation de l'endroit précédent.
- Mobile iOS/Android + ordinateur réellement adaptés, pas seulement « responsive ».
- Micro-interactions et animations utiles, 3D légère uniquement si elle apporte un feedback.
- Pas de doublons de navigation, de blocs ou d'informations sans valeur décisionnelle.

## Accueil
- Cockpit Coach compact et clair.
- Écran « Aujourd'hui » utile : rendez-vous, prochaine séance, séances à préparer, cycle en cours.
- Univers d'entraînement avec grands visuels FAFATRAINING correctement cadrés, homogènes, visages/sujets non coupés.
- Ne pas afficher le numéro de version dans l'interface publique.

## Navigation cible
- Accueil
- Adhérents
- Créer
- Programmes
- Mouvements
- Cycles/programmation à l'intérieur de Programmes et/ou de la fiche Adhérent.
- Timer accessible rapidement.
- Studio Social accessible depuis Programmes et/ou accueil.

## Programmes
- Programmes FAFATRAINING déjà prêts + section « Mes programmes ».
- Programmes complets : objectif, durée, fréquence, matériel, échauffement, blocs, exercices, séries, répétitions/durée, repos, tempo/rythme si utile, intensité, retour au calme, consignes et FAFA TIPS.
- Filtres principaux simples : Univers → Objectif → Matériel → Durée.
- Filtres avancés : zone corporelle, format, fréquence, lieu si utile.
- Taxonomie matériel claire : Sans matériel / Maison & transportable / Salle de sport / Équipement spécifique.
- Accessible / Standard / Intensif doivent réellement changer volume, repos, intensité et, quand pertinent, variantes/régressions/progressions.
- Ne jamais créer trois faux programmes identiques juste pour changer le niveau.
- Programmes ciblés diversifiés : full body, haut/bas, push/pull, pectoraux, dos, épaules, bras, biceps, triceps, abdos/gainage, fessiers, quadriceps, ischios, mollets, chaîne postérieure, cardio, running, trail, HIIT, WOD/Cross Training, HYROX, boxe, mobilité, collectif, etc.
- Programmes 1 à 6 séances/semaine réellement structurés et différents.

## Mouvements
- Bibliothèque très riche et diversifiée par toutes les grandes disciplines.
- Classement clair : zone corporelle → groupe musculaire → univers → matériel.
- Termes grand public en façade (ex. « Abdos & gainage » plutôt que « Core »), jargon Coach dans un glossaire optionnel.
- Chaque fiche doit être spécifique : technique, respiration, amplitude/placement, erreur, correction, vigilance, FAFA TIP, régressions, standard, progressions, alternatives, usages/prescriptions.
- Pas de texte générique recyclé entre les mouvements.
- Une famille de mouvement n'est pas enfermée dans un seul niveau ; le niveau se gère via les variantes/prescriptions.
- Possibilité « Mes mouvements » pour ajouter un mouvement personnalisé.

## Mode séance
- Plein écran terrain, exercice actuel, séries/reps/charge, timer repos, RPE, inconfort, PR, note, FAFA TIP, adapter, remplacer, passer aujourd'hui, suivant, bilan final.

## Adhérents
- Profil, contraintes, préférences, historique, readiness, mensurations, évolution, performances/records.
- Planning avec vraie date/heure des séances.
- Recherche globale doit trouver adhérents, séances, programmes, mouvements, cycles et blocs.

## Collectif
- Participants, ateliers, rotations, temps, matériel disponible.
- Resource planner : éviter les conflits de matériel simultanés entre ateliers.
- Variantes adaptées pour groupes mixtes.

## Studio Social
- Export image depuis un programme prêt ou personnalisé.
- Instagram 1080×1350, Story/TikTok 1080×1920, Reel Cover, fiche adhérent.
- Nombre de slides automatique selon contenu et lisibilité.
- Édition titre, accroche, CTA, image, densité, ordre des slides, masquage, drag & drop.
- Plusieurs templates FAFATRAINING premium.
- Aucun renseignement personnel dans les exports réseaux.

## Données et architecture
- GitHub Pages / PWA, compatible Safari iOS, Android et desktop.
- Cache/Service Worker versionné proprement.
- Sauvegarde locale + export/import JSON ; synchronisation multi-appareils seulement si un vrai backend est ajouté plus tard.
- Aucune référence morte, aucun asset manquant, aucun ancien runtime empilé.
