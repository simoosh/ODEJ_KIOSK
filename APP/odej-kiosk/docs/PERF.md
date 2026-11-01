# Performance du rendu

Cibles, mesures et réglages de la carte. La borne aura probablement un GPU intégré : c'est la référence.

## Cibles et résultats

Machine : portable sur secteur, AMD Radeon 780M (GPU intégré, confirmé par `WEBGL_debug_renderer_info`), Chrome en Direct3D 11. Écran 1920×1080, `pixelRatio` 1, relief activé, fond `plan`, 67 marqueurs affichés. Médiane de 3 passages du scénario.

| Mesure | Cible | Avant | Après (`high`) |
|---|---|---|---|
| FPS médian | ≥ 50 | 34,5 | 106,4 |
| FPS au 5ᵉ centile | ≥ 30 | 22,6 | 80 |
| Rendus React pendant le scénario de 9 s | ≤ 5 par geste de 3 s | 167 | 0 (5 au plus) |
| Frames au repos, sur la carte | 0 | 0 | 0 |
| Frames en 3 s sur l'accueil, avant le tour de l'étape 6 | 0 | 28 à 85 | 0 à 5, le temps que les dernières tuiles arrivent |
| Bundle JS initial (gzip) | pas plus de 10 % | 383,3 Ko | 385,4 Ko (+0,5 %) |

Les cibles sont atteintes sur cette machine. Elles restent à confirmer sur la borne (D8).

Ce tableau a été mesuré avec MapLibre 5.24. Après le passage à MapLibre 6.16, mêmes scénarios, la médiane de `high` monte à 196 FPS et le 5ᵉ centile à 137. Une partie de cet écart peut venir de l'état de la machine : les deux séries n'ont pas été mesurées au même moment. Le bundle initial passe à 395,7 Ko (+2,7 %), et le worker devient un fichier séparé de 519 Ko, hors gzip.

| Niveau | FPS médian | 5ᵉ centile |
|---|---|---|
| `high` | 106,4 | 80 |
| `medium` | 156,2 | 120,5 |
| `low` (`pixelRatio` 0,75) | 190,7 | 139,1 |

Limites de ces mesures :

- Chrome tournait sans écran et sans limite de cadence. Un écran à 60 Hz plafonne à 60 FPS : le chiffre utile est la marge, pas la valeur.
- Le premier passage de `low` n'a pas fini dans le temps imparti (réseau instable) : le tableau donne la moyenne des deux autres.
- Le 4K (3840×2160) n'a pas pu être mesuré : le scénario n'a pas abouti dans le temps imparti. Il faut le refaire sur la borne si son écran est en 4K.
- Sur batterie, Chrome plafonne à 30 FPS (Économiseur d'énergie). Le niveau automatique descend alors à `medium`. Mesurez toujours sur secteur.

## Mesurer

Avec Chrome au premier plan et sur secteur :

1. Ouvrez `?debug=1` et notez le GPU dans `chrome://gpu`.
2. Entrez sur la carte. Le panneau en bas de l'écran donne chaque seconde les FPS, le temps de frame, les tuiles chargées, le `pixelRatio`, le niveau de qualité et le nombre de rendus.
3. Touchez **scénario**, ou lancez `await odejPerf.run()` dans la console. Il enchaîne 3 s de panoramique, 3 s de rotation et 3 s d'inclinaison, puis compte les frames sur 3 s de repos.
4. Répétez trois fois : le premier passage charge les tuiles.

`await odejPerf.idle()` compte les frames rendues en 3 s, par exemple sur l'accueil.

Le scénario attend que les tuiles soient chargées. Sur une connexion instable, il peut ne jamais finir : rechargez la page.

## Niveaux de qualité

Réglages dans `src/config.ts` (`QUALITY`).

| Niveau | `pixelRatio` maximal | Relief par défaut |
|---|---|---|
| `high` | 1 | oui |
| `medium` | 1 | non, activable |
| `low` | 0,75 | non, bloqué |

La carte démarre en `high`. Le FPS est mesuré pendant les 3 s qui suivent l'entrée : sous 40, on descend d'un niveau ; sous 25, on passe à `low`. Le niveau ne remonte pas avant le rechargement de la page. `?quality=high`, `medium` ou `low` impose un niveau et coupe le réglage automatique.

## Ce qui a changé

- Aucun `setState` pendant un mouvement : la boussole s'écrit directement dans le DOM, l'état 2D/3D attend `moveend`.
- Les 67 marqueurs DOM sont remplacés par des couches WebGL (`src/map/markers.ts`). Les images sont rasterisées une fois au démarrage. Seule l'étiquette de l'établissement sélectionné est un élément HTML.
- `pixelRatio` plafonné, antialiasing coupé, `fadeDuration` à 0, inclinaison limitée à 70°, relief sans exagération, ombrage coupé quand le relief est actif.
- Accueil sans relief. Plus d'animation infinie sur la carte. Le tour de l'étape 6 rend la carte en continu derrière l'accueil, sans relief : c'est le seul rendu sans action de l'utilisateur.

## À respecter

- Ne jamais appeler `setState` depuis un écouteur `move`, `render` ou `zoom`.
- Un `setStyle` efface les couches et les images : `installMarkers()` les remet à chaque `style.load`.
- Le relief doit être retiré avant un `setStyle`, sinon le rendu plante pendant le chargement du nouveau style.
- Une boucle `requestAnimationFrame` ne tourne que pendant une action demandée, comme la visite à 360°.

## Relief auto-hébergé

Le relief vient de `public/terrain/` (`tools/dem`) : 134 tuiles, 13,8 Mio, zooms 8 à 11, en `high` environ 200 FPS en médiane et 145 au 5ᵉ centile, sur la même machine.
