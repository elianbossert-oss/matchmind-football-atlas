# Matchmind Football Atlas

Crée une interface web en français pour analyser un match de football à l’aide d’une carte mentale interactive.

OBJECTIF PRINCIPAL L’utilisateur doit pouvoir cliquer sur une catégorie ou un critère pour afficher toutes les actions codées correspondantes. Chaque action doit être reliée à un moment précis de la vidéo du match. En cliquant sur une action dans les résultats, la vidéo doit se positionner au timecode correspondant et se lancer quelques secondes avant l’action.

STRUCTURE DE NAVIGATION Créer cinq catégories principales :

Règlement

Physique

Technique

Mental

Tactique

Dans la catégorie Tactique, créer deux sous-onglets :

Individuel

Collectif

Le collectif doit apparaître uniquement sous Tactique.

CARTE MENTALE Afficher au centre « Analyse du match ». Afficher autour les cinq catégories principales sous forme de branches. Chaque branche et chaque sous-branche doit être cliquable. Permettre de développer et réduire les branches. Ajouter un bouton « Tout réduire » et un bouton « Tout développer ». Prévoir une recherche permettant de retrouver un critère par son nom. Garder une présentation claire, lisible et adaptée à un écran d’ordinateur comme à un téléphone.

CONTENU DE LA CARTE

RÈGLEMENT

Faute commise (selon la décision de l’arbitre)

Tacle sanctionné

Poussette / tirage sanctionné

Jeu dangereux sanctionné

Faute subie (selon la décision de l’arbitre)

Hors-jeu signalé

Carton jaune / rouge

Coup franc obtenu ou concédé

Penalty obtenu ou concédé

PHYSIQUE — INDIVIDUEL

Sprint

Avec ballon

Sans ballon

Appel

Pressing

Repli

Course à haute intensité

Seuil de 19,8 km/h

Seuil de 25 km/h

Accélération / décélération

Seuil supérieur à 2,5

Saut

Duel physique

TECHNIQUE — INDIVIDUEL

Passe

Réussie : le partenaire contrôle le ballon, ou la passe atteint la zone visée définie par le staff

Ratée : la passe est interceptée, sort du terrain ou n’atteint pas la cible définie

Courte

Longue

En profondeur

Contrôle

Réussi : le joueur garde le ballon et peut effectuer l’action suivante

Raté : le ballon lui échappe ou est immédiatement récupéré par l’adversaire

Dribble

Réussi : le joueur élimine son adversaire et conserve la possession

Raté : il perd le ballon ou ne dépasse pas son adversaire

Tir

Réussi selon l’objectif défini par le staff : tir cadré, but marqué ou zone visée atteinte

Raté si le tir ne respecte pas l’objectif défini

Centre

Réussi si le ballon atteint un partenaire ou la zone de réception prévue

Raté s’il est intercepté, sort du terrain ou n’atteint pas la zone

Jeu de tête

Réussi si le joueur dirige le ballon vers un partenaire ou la zone visée

Raté si le ballon est perdu ou envoyé hors de la cible

Interception

Réussie si le joueur récupère ou dévie le ballon et empêche la progression adverse

Ratée s’il ne touche pas le ballon ou ne gêne pas l’action

MENTAL — COMPORTEMENTS OBSERVABLES

Encourage un partenaire

Communique / donne une consigne

Réagit après une erreur

Réagit après une décision arbitrale

Continue l’effort après une action

Se replace après la perte du ballon

Conteste une décision

TACTIQUE

ONGLET INDIVIDUEL

Appel / démarquage

Réussi si le joueur se rend disponible dans la zone prévue ou libère un espace exploitable

Évaluation selon le critère défini par le staff

Soutien au porteur

Réussi si le joueur propose une solution de passe jouable

Raté si aucune solution n’est créée selon les consignes

Pressing

Réussi si le joueur gêne la relance, force une passe en arrière ou provoque une perte de balle

Raté s’il est éliminé sans effet

Repli défensif

Réussi si le joueur revient dans la zone prévue avant la progression adverse

Raté s’il ne se replace pas selon la consigne

Couverture d’un partenaire

Réussie si le joueur protège l’espace laissé libre ou peut intervenir en cas de débordement

Placement dans le bloc

Conforme / non conforme à la consigne tactique du staff

ONGLET COLLECTIF — ORGANISATION ET ENCHAÎNEMENTS DE L’ÉQUIPE

A. Organisation offensive

Sortie de balle

Courte

Longue

Mixte

Perte de balle à la relance

Circuits de passes préférentiels

Côté gauche

Côté droit

Axe

Progression

Jeu dans les couloirs

Jeu dans l’axe

Renversement de jeu

Jeu en profondeur

Création d’occasions

Centre

Passe en profondeur

Jeu combiné

Tir après récupération

Transitions offensives

Contre-attaque

Conservation après récupération

Perte rapide du ballon

B. Organisation défensive

Bloc équipe

Haut

Médian

Bas

Compact

Étiré

Pressing collectif

Déclencheur du pressing

Récupération

Pressing contourné

C. Transitions défensives

Repli collectif

Contre-pressing

Contre-attaque adverse concédée

D. Buts concédés

Perte de balle à l’origine

Espace exploité

Centre

Passe en profondeur

Jeu combiné

Tir après récupération

FONCTIONNEMENT DU CODAGE Quand l’utilisateur clique sur un critère :

Ouvrir un panneau de résultats filtré sur ce critère.

Afficher le nombre d’occurrences.

Afficher pour chaque action : période, minute, seconde, joueur concerné ou équipe, résultat, commentaire éventuel et miniature vidéo.

Cliquer sur une action doit positionner le lecteur vidéo au bon timecode et lancer la vidéo quelques secondes avant l’action.

Prévoir les boutons « Action précédente » et « Action suivante ».

Si aucun événement n’est enregistré, afficher « Aucune action codée pour ce critère ».

FORMULAIRE POUR CODER UNE ACTION Ajouter un bouton « Ajouter une action ». Le formulaire doit contenir :

Catégorie

Critère

Sous-critère, si applicable

Joueur ou équipe

Résultat : réussi, raté, conforme, non conforme, obtenu, concédé, ou autre choix adapté au critère

Période

Minute et seconde

Commentaire libre

Bouton « Enregistrer »

Au moment de créer une action, enregistrer automatiquement le timecode actuel du lecteur vidéo. Permettre de corriger le timecode manuellement.

IMPORTANT

Ne pas inventer de nouveaux critères.

Respecter les catégories et les critères indiqués.

Les seuils physiques doivent rester configurables par le staff.

Les critères d’évaluation définis par le staff doivent être modifiables.

Garder une séparation nette entre les événements individuels et les événements collectifs.

Une catégorie n’est pas seulement un indicateur statistique : chaque résultat doit renvoyer aux séquences vidéo correspondantes.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://matchmind-football-atlas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bbc43c62-bbcc-5934-93ec-b873975b2e31).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
