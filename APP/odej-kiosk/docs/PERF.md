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
| Frames en 3 s sur l'accueil, avant la rotation continue | 0 | 28 à 85 | 0 à 5, le temps que les dernières tuiles arrivent |
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
- La borne sera au plus en 1080p : le 4K n'est pas une cible.
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
- Plus d'animation infinie sur la carte. La rotation à 360° rend la carte en continu derrière l'accueil : c'est le seul rendu sans action de l'utilisateur, à la demande du propriétaire.
- Le relief reste actif derrière l'accueil : l'activer au toucher du bouton gelait l'écran 723 ms. Sans ce changement de relief, l'animation démarre en moins de 10 ms.

## À respecter

- Ne jamais appeler `setState` depuis un écouteur `move`, `render` ou `zoom`.
- Un `setStyle` efface les couches et les images : `installMarkers()` les remet à chaque `style.load`.
- Le relief doit être retiré avant un `setStyle`, sinon le rendu plante pendant le chargement du nouveau style.
- L'entrée dans la carte et le retour n'animent que `transform` et `opacity` : quatre paysages, quatre calques de nuages, la brume et le texte. Ils restent fluides même si la carte charge.
- Les nuages de l'accueil sont peints une fois, en petit, à chaque changement d'orientation. Les paysages pèsent 1,2 Mio en tout.
- La lueur d'un paysage touché est un `drop-shadow` sur une seule image, fixe une fois allumée : aucune animation ne tourne.
- Une boucle `requestAnimationFrame` ne tourne que pendant une action demandée, comme la visite à 360°, ou derrière l'accueil.

## Relief auto-hébergé

Le relief vient de `public/terrain/` (`tools/dem`) : 134 tuiles, 13,8 Mio, zooms 8 à 11, en `high` environ 200 FPS en médiane et 145 au 5ᵉ centile, sur la même machine.

## Perte du contexte WebGL

Le contexte WebGL s'est perdu pendant le zoom vers un établissement : souvent dans Chrome sans limite de cadence, 1 fois sur 6 à cadence normale, avec un portable à court de mémoire. La cause exacte n'est pas établie. Le masque de la wilaya n'y est pour rien : la perte se produit aussi sans lui. Le contexte ne revient pas seul : la page se recharge après 5 s et repart de l'accueil.

## Tuiles

- **Satellite :** sous le zoom 12, Esri sert une imagerie générique d'une autre couleur. Le détail ne descend jamais sous ce zoom, même au loin. Une sous-couche de quelques tuiles, au zoom 9, évite un trou le temps qu'il arrive. À cache vide, la wilaya est couverte en 3 s et le détail complet arrive en 25 s.
- **Préchargement :** sur l'accueil, environ 6 000 tuiles entrent dans le cache du navigateur en 5 minutes : vue d'ensemble, puis abords des 67 établissements. Il s'arrête dès qu'on touche la carte et reprend au retour à l'accueil.
- **Mesure :** 6 survols rapides en satellite, 1920×1080. Stabilisation à l'arrivée : plus de 15 s à cache vide, 2 s à cache plein, avec 83 % des tuiles lues dans le cache.
- **Satellite sur le scénario :** 200 FPS en médiane, 143 au 5ᵉ centile, avec la même machine.

Tant que les tuiles viennent d'internet, on ne peut pas garantir qu'aucune ne se charge sous les yeux, surtout hors des zones préchargées. Seul un fond hébergé localement le garantit : c'est l'étape 10.

## Mémoire sur la durée

60 allers-retours accueil, fiche, galerie, accueil, en 1920×1080, avec un ramasse-miettes forcé tous les 10 cycles : le tas JavaScript passe de 47 Mo à 98 Mo, puis reste entre 105 et 108 Mo de 20 à 60 cycles. Le nombre de nœuds DOM ne bouge pas (1109). Aucune fuite visible sur ce parcours. Une session réelle de plusieurs heures reste à mesurer sur la borne.

## Galerie

Le carrousel 3D charge uniquement les vignettes de 480 px, et ne rend que 7 cartes : la photo courante et 3 de chaque côté (`CONFIG.carousel.radius`), aucune image pleine. Pendant le glissement, les positions s'écrivent directement dans le DOM (`transform`, `opacity`) : aucun rendu React par image. Si une vignette manque, l'image pleine la remplace. Les vidéos sont en `preload="metadata"`, et une seule existe à la fois, dans la visionneuse.

## Verre de l'écran carte

`backdrop-filter` floute ce qui est derrière l'élément : sur la carte WebGL, ce flou est recalculé à chaque image où la carte bouge, sur toute la surface de l'élément. Il est donc limité aux panneaux : la liste (environ 30 % de l'écran en paysage), la barre et les résultats de recherche, le clavier virtuel, et la fenêtre d'aperçu du marqueur sélectionné. Les boutons et la colonne de contrôles ont un verre sans flou (blanc translucide, reflet, liseré). La barre de recherche repliée est en `visibility: hidden` : son flou ne coûte rien.

Au niveau de qualité `low`, aucun élément n'a de flou : le verre devient opaque (`.quality-low`). Le coût réel reste à mesurer sur la borne : FPS du survol avec la liste ouverte, puis masquée.

Les animations de l'écran carte jouent une seule fois par geste (ouverture d'un panneau, d'une fenêtre, d'une liste), en `transform`, `opacity` et `clip-path`. Aucune n'est infinie.

## Titre animé de l'accueil

- Le titre est un SVG dessiné une fois (`src/wordmark`). Pendant sa construction, environ 2,5 s, une boucle `requestAnimationFrame` change seulement les attributs `stroke-dashoffset` et `fill-opacity` de ses lettres (une trentaine), sans rendu React. Elle s'arrête ensuite et reprend toutes les `CONFIG.wordmarkRepeatMs` (10 s), ou jamais si la valeur vaut 0.
- Le dégradé de « Béjaia » défile en continu par SMIL (`animateTransform`), sans JavaScript. Son halo est un filtre SVG sur ce seul mot : c'est le seul effet redessiné en permanence. Si la borne peine, c'est lui à retirer en premier.
- `prefers-reduced-motion` : le titre s'affiche complet, sans animation.
- Bouton vert : sa lueur blanche tourne, un reflet le traverse et il grossit un peu toutes les 5 s, en CSS sur ce seul élément (`@property --cta-angle`, `scale`, `background-position`). Arrêté à la sortie vers la carte et avec `prefers-reduced-motion`.
- Chiffres : ils montent en compteur à chaque arrivée sur l'accueil (`CountUp`), en écrivant le texte directement, pendant 1,4 s seulement.
- Entrée de l'accueil : en-tête, ligne de l'événement, texte, chiffres et boutons montent l'un après l'autre (`land-in`, `translate` et `opacity` seulement, une fois chacun). Le contenu est redessiné à chaque retour sur l'accueil et à chaque changement de langue, ce qui rejoue toutes ses animations.
