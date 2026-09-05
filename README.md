# FAFATRAINING V85 — CLEAN REBUILD

Cette version remplace les V83/V84. Elle est conçue pour GitHub Pages sans Firebase, Supabase, Vercel ni autre serveur.

## Cause de la page noire corrigée
La V84 contenait encore une instruction `export async function` dans un script chargé en mode classique. Un navigateur bloquait donc tout le fichier avant l’affichage de l’application. La V85 est testée avec un parseur JavaScript classique (`new Function`) en plus des contrôles syntaxiques habituels.

## Déploiement GitHub Pages
1. Supprimer de préférence les anciens fichiers `index.html`, `src/app.bundle.js`, `styles/app.css` et l’ancien `service-worker.js` du dépôt.
2. Envoyer **tout le contenu** du ZIP V85 à la racine du dépôt.
3. Vérifier que `index.html` est bien visible à la racine, comme sur ta capture GitHub.
4. Attendre la fin du déploiement GitHub Pages puis faire une actualisation forcée de Safari.

Le nouvel `index.html` utilise uniquement :
- `styles/fafatraining-v85.css?v=85`
- `src/fafatraining-v85.js?v=85`

Les anciens noms de fichiers ne sont donc plus nécessaires au fonctionnement.

## Fonctions principales
- séance ponctuelle ;
- programme de plusieurs semaines/mois ;
- cours collectif ;
- profils adhérents + suppression ;
- bibliothèque pédagogique ;
- 3 niveaux : Débutant / Intermédiaire / Avancé ;
- choix de plusieurs matériels ;
- quantités de matériel pour les groupes ;
- séries, répétitions, charge et RPE ;
- IMC ;
- suivi ;
- impression / PDF ;
- partage natif, e-mail et SMS ;
- export/import des données locales.

Voir `AUDIT_V85_COMPLET.txt` pour le contrôle détaillé.
