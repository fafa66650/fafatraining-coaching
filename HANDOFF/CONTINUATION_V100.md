# FAFATRAINING — Continuation V100 CLEAN CORE

## État constaté dans l'environnement

La dernière archive complète réellement retrouvée est `FAFATRAINING_V98_FINAL_CLEAN.zip`.
Elle contient l'application complète (assets, data, src, styles, manifest, Service Worker).

Un état V100 CLEAN CORE a ensuite été préparé avec index/README/changelog, mais dans la copie présente dans l'environnement il manque encore les dossiers runtime/data/assets complets. La prochaine discussion doit donc reconstruire V100 à partir de la base complète V98 + des exigences ci-dessous, et ne pas considérer le dossier V100 partiel comme déployable seul.

## Cible de la nouvelle base V100

### Architecture
- Runtime nettoyé et consolidé : une seule définition par composant/fonction importante.
- Renommer proprement les fichiers runtime/data/styles en V100.
- Clé de stockage neutre `fafatraining_coach` avec migration/import des anciennes sauvegardes.
- Service Worker/cache V100 propre.

### Bibliothèque mouvements
Cible large inspirée des meilleures pratiques internationales sans copier les contenus propriétaires :
- musculation libre, machines, poulies, haltères, barres ;
- poids du corps / calisthenics ;
- kettlebell ;
- Cross Training / WOD / conditioning ;
- haltérophilie ;
- HYROX ;
- strongman/carries ;
- TRX/suspension ;
- cardio machine : rameur, SkiErg, Bike/Assault Bike ;
- running/trail ;
- plyométrie, vitesse, agilité, coordination ;
- boxe / combat / shadow / sac ;
- mobilité, prévention, récupération ;
- yoga / Pilates ;
- élastiques, sliders, Swiss ball ;
- cours collectifs / step / indoor cycling ;
- autres familles pertinentes si elles ajoutent une vraie valeur.

Chaque mouvement doit avoir des données cohérentes et spécifiques. Vérifier particulièrement la cohérence matériel/muscles/univers : aucun Face Pull, Pulldown, Block Pull, carry, tyre flip, etc. ne doit être mal classé « poids du corps ».

### Programmothèque
Cible : plusieurs centaines de vrais programmes complets et différents, couvrant les 8 univers et les demandes courantes.
- Ne pas gonfler le catalogue avec des clones.
- Chaque programme doit être sportivement cohérent avec son objectif, sa zone, son matériel, sa fréquence, sa durée et son univers.
- Les exercices de programme doivent correspondre aux fiches techniques quand ce sont de vrais mouvements ; les consignes de séance doivent rester des blocs/consignes Coach.
- Accessible / Standard / Intensif réellement différents.

### Contrôle qualité exigé avant livraison
- mouvements : IDs/noms uniques ; champs essentiels présents ; matériel/muscles/univers cohérents ; textes non génériques ; régressions/progressions pertinentes ;
- programmes : IDs/titres uniques ; prescriptions complètes ; pas de programme vide ; pas de signature complète dupliquée ; niveaux réellement différents ; matériel cohérent ; fréquences 1–6 j/semaine couvertes ;
- liens programme ↔ mouvements : aucun véritable exercice orphelin ;
- UX : aucun contenu masqué par le dock, drawers scrollables, retour cohérent, responsive ;
- Studio Social, Timer, Mode séance, Planning, recherche globale, Adhérents, Cycles, sauvegarde : tous revalidés ;
- PWA/GitHub Pages : index à la racine, manifest, icons, Service Worker, cache-busting ;
- ZIP final : extraire puis revalider syntaxe JS, JSON, références, assets et `unzip -t`.

## Priorité absolue
Ne pas déclarer une version « FINAL CLEAN » si le package ne contient pas réellement tous les fichiers nécessaires à l'exécution.
