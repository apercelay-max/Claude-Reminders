# Idées Claude

Petite PWA pour noter ses idées de projets Claude en déplacement.
Aucune dépendance, aucun build : HTML + CSS + JS.

- Capture rapide (projet + texte), dictée vocale si le navigateur la gère
- Filtre par projet, recherche, marquer « fait », modifier, supprimer
- Fonctionne hors ligne, installable sur l'écran d'accueil
- Données stockées sur l'appareil (localStorage) ; export/import JSON et copie Markdown

## Essayer en local

    python3 -m http.server 8000   # puis ouvrir http://localhost:8000

## Mettre en ligne (GitHub Pages)

Réglages du dépôt → Pages → Source : branche `main`, dossier `/ (root)`.
Ouvrir l'URL sur le téléphone, puis « Ajouter à l'écran d'accueil ».

Notes : les données sont propres à chaque appareil/navigateur (pas de synchronisation) ;
si vous changez les fichiers, incrémentez `CACHE` dans `sw.js`.
