# FAFATRAINING — Real Athlete AI System V78

Application sportive web statique, responsive et installable en PWA. Aucun build n'est nécessaire : le dépôt peut être publié directement avec GitHub Pages.

## Fonctionnalités

- Logo FAFATRAINING intégré au design.
- Onboarding complet : âge, taille, poids, niveau, expérience, sport, objectifs, fréquence, durée, lieu, limites et matériel.
- Gestion locale de plusieurs adhérents avec sélection du profil actif.
- Sauvegarde/import JSON des adhérents et historiques.
- Générateur adaptatif utilisant : profil, objectif, durée, lieu, matériel, fatigue, stress, sommeil, douleur et historique.
- Calcul IMC avec interprétation prudente chez les sportifs.
- Calcul RPE cible, séries, répétitions, récupération, tempo et suggestion de charge.
- Suggestion de charge basée sur la dernière performance enregistrée et la readiness du jour.
- Boxe avec rounds 2–3 min et récupération 1 min selon niveau.
- Trail avec course, côtes, descentes et travail spécifique.
- Aérobic, poids de corps, musculation, Cross training, Hyrox, mobilité, prévention et sport santé.
- Bibliothèque de plus de 300 mouvements réels avec muscles, matériel, consignes, erreurs et variantes.
- Journal de séance : séries, reps, poids et RPE réellement réalisés.
- Progression : nombre de séances, volume, régularité et PR estimés par formule d'Epley.
- Impression/PDF optimisée avec CSS print.
- PWA et fonctionnement hors ligne après premier chargement.
- Double vérification automatisée via `scripts/qa-check.mjs` et GitHub Actions.

## Important — gestion des adhérents

Cette version est volontairement 100 % autonome et déployable sur GitHub Pages sans serveur ni clé API. Les profils et historiques sont donc stockés dans `localStorage` sur l'appareil. Pour déplacer ou sauvegarder les données, utiliser **Adhérents > Exporter** puis **Importer**.

Pour de vrais comptes synchronisés entre plusieurs appareils, il faudrait ajouter un backend/authentification (Supabase, Firebase, etc.), ce qui nécessiterait une configuration externe et ne serait plus un copier-coller GitHub Pages totalement autonome.

## Déploiement GitHub Pages

1. Créer un dépôt GitHub vide.
2. Copier **tout le contenu de ce dossier** à la racine du dépôt.
3. Commit / push.
4. Dans GitHub : **Settings > Pages > Deploy from a branch**.
5. Choisir la branche `main`, dossier `/ (root)`.
6. Ouvrir l'URL GitHub Pages fournie.

Aucune commande npm n'est nécessaire pour l'application.

## Contrôle qualité local

Avec Node.js installé :

```bash
node scripts/qa-check.mjs
```

Le même contrôle est exécuté automatiquement par `.github/workflows/qa.yml` à chaque push.
