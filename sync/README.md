# Synchronisation vers Claude

Chemin des idées : **téléphone → feuille Google → Claude → dépôts GitHub**.

## 1. Créer la feuille et le script (une seule fois, ~5 min)

1. Créez une feuille Google (par ex. « Idées Claude »).
2. Menu **Extensions → Apps Script**. Supprimez le code par défaut et collez `sync/apps-script.gs`.
3. **Paramètres du projet** (engrenage) → **Propriétés du script** → ajoutez `SECRET` = un code long et aléatoire
   (par ex. 24 caractères). Gardez-le : l'appli en a besoin.
4. **Déployer → Nouveau déploiement** → type **Application Web** :
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
   Autorisez l'accès demandé, puis copiez l'**URL** qui se termine par `/exec`.
5. Ouvrez la feuille : les onglets **Idées** et **Projets** sont créés au premier envoi.
   Dans **Projets**, associez chaque nom de projet utilisé dans l'appli à son dépôt (`propriétaire/nom`).

## 2. Brancher l'appli

Dans l'appli, ouvrez **Synchro**, collez l'URL `/exec` et le code secret, puis **Enregistrer**.
Les idées partent automatiquement (et au retour du réseau si vous étiez hors ligne).

## 3. Faire trier par Claude

Voir `../TRIAGE.md`.

## Sécurité et limites

- L'URL est publique par construction ; seul le code secret autorise l'écriture. Il est stocké dans le navigateur du
  téléphone. S'il fuite, changez la propriété `SECRET` et ressaisissez-le dans l'appli.
- L'appli **envoie** seulement : supprimer une idée sur le téléphone ne la supprime pas de la feuille.
- Modifier une idée déjà triée la repasse au statut `modifié` pour qu'elle soit retraitée.
