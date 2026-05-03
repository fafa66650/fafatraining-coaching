# FAFATRAINING — V51 LINKED FILES

But : relier les fichiers entre eux sans intégrer les images lourdes maintenant.

## Ce que tu dois uploader sur GitHub
Remplace les fichiers actuels par ceux-ci :
- index.html
- style.css
- app.js
- manifest.json
- service-worker.js
- data/
- assets/
- templates/

## Ce qui est déjà relié
- `data/avatar_map.json` -> `assets/avatars/{style}/avatar.jpg`
- `data/menu_map.json` -> `assets/menus/{menu_id}/cover.jpg`
- `data/exercises.json` -> `assets/exercises/{exercise_key}/image.jpg`
- programmes -> menu_id + avatar_key + menu_image
- export PDF -> avatar + menu cover + logo + exercices

## Nommage des images à ajouter plus tard

### Avatars
Mets chaque avatar ici :
assets/avatars/hiit/avatar.jpg
assets/avatars/boxe/avatar.jpg
assets/avatars/musculation/avatar.jpg
assets/avatars/mobilite/avatar.jpg
assets/avatars/recovery/avatar.jpg
assets/avatars/hyrox/avatar.jpg
etc.

### Menus sport
Mets chaque menu ici :
assets/menus/seance_01_full_body/cover.jpg
assets/menus/seance_02_explosivite/cover.jpg
...
assets/menus/seance_31_menu_challenge/cover.jpg

### Exercices
Mets chaque image ici :
assets/exercises/pompes/image.jpg
assets/exercises/squat/image.jpg
etc.

## Contenu
- Programmes : 31
- Exercices : 5
- Menus prévus : 31
- Avatars prévus : 19
