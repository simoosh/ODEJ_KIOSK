# Motion graphics ODEJ (Remotion)

Vidéos et maquettes d'animation programmées en React avec [Remotion](https://www.remotion.dev/) 4.0.541. Ce dossier est un projet npm à part : il n'est jamais déployé et ne change rien à la borne.

Licence : Remotion est gratuit pour une personne ou une structure de 3 personnes au plus. Au-delà, il faut une licence entreprise (https://remotion.pro/license).

Les consignes pour les agents sont dans [CLAUDE.md](CLAUDE.md).

## Commandes

Depuis `tools/motion` :

```bash
npm ci                                                     # installer
npm run studio                                             # Remotion Studio : http://localhost:3000
npx remotion render src/index.ts Showcase out/showcase.mp4 # exporter en MP4
npx remotion still src/index.ts Showcase out/frame.png --frame=60   # une seule image
npm run typecheck
npm run wordmark                                           # redessiner le titre de l'accueil (après un changement de texte ou de police)
npx remotion render src/index.ts TitleAr out/title-ar.mp4  # titre animé, arabe (TitleEn : anglais)
npm run logo -- "<chemin>/ODEJ-logo-transparent.svg"     # redécouper le logo officiel
npx remotion render src/index.ts Logo out/logo.mp4         # logo qui se dessine
```

Le titre utilise Tajawal ExtraBold, avec Great Vibes pour « of » et Dancing Script pour « Béjaia ». Ces polices libres viennent de paquets npm : aucun fichier de police n'est dans le dépôt.

## Changer le format

- Taille et débit de toutes les vidéos : `VIDEO` dans `src/config.ts`.
- Durée de l'exemple : `SHOWCASE_TIMING` dans `src/compositions/Showcase.tsx`, en secondes.
- Une composition peut avoir sa propre taille : `width` et `height` de sa `<Composition>` dans `src/Root.tsx`.

## Créer une composition

1. Créer `src/compositions/MaVideo.tsx` (copier `Showcase.tsx` comme point de départ).
2. L'ajouter dans `src/Root.tsx` avec un `id` unique.
3. `npm run studio`, puis l'exporter avec `npx remotion render src/index.ts MaVideo out/ma-video.mp4`.

Les médias (musique, images, vidéos) vont dans `public/` et ne sont jamais commités. Les rendus vont dans `out/`.

Documentation suivie :
- https://www.remotion.dev/docs/brownfield
- https://www.remotion.dev/docs/cli/studio
- https://www.remotion.dev/docs/transitions/transitionseries
- https://www.remotion.dev/docs/fonts/
- https://remotion.pro/license
