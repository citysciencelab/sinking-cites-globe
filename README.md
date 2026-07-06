# Sinking Cities Globe

An interactive 3D globe visualization exploring cities threatened by rising sea levels and subsidence. Built by the [City Science Lab Hamburg](https://www.citysciencelab.de), the application lets users discover sunken and sinking cities around the world, explore data stories, and navigate heritage sites — all rendered on an interactive globe.

## Features

- **Interactive globe** — 3D globe powered by Mapbox GL with auto-rotation and smooth fly-to animations
- **City data stories** — multi-slide narratives with text, images, videos, and pull-quotes per city
- **Heritage layer** — searchable overlay of heritage sites linked to sinking cities
- **Audio player** — background music and per-story audio tracks
- **About panel** — intro text loaded from the CMS
- **Project menu** — browse all projects in the collection
- **Legal pages** — imprint and privacy policy served from the CMS

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Vue 3](https://vuejs.org/) (Composition API) |
| Map | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) |
| 3D Globe | [globe.gl](https://globe.gl/) / [Three.js](https://threejs.org/) |
| 2D Effects | [PixiJS](https://pixijs.com/) |
| CMS | [Directus](https://directus.io/) |
| Slides | [Swiper](https://swiperjs.com/) |
| Styling | SCSS |

## Getting Started

### Prerequisites

- Node.js ≥ 16
- A running [Directus](https://directus.io/) instance with the Sinking Cities data schema

### Environment Variables

Copy the example and fill in your values:

```bash
cp .env .env.local
```

| Variable | Description |
|---|---|
| `VUE_APP_DIRECTUS_URL` | Base URL of the Directus CMS instance |

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run serve
```

The app will be available at `http://localhost:8080`.

### Production Build

```bash
npm run build
```

Output is written to the `dist/` directory.

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── assets/             # Static assets (textures, images)
├── components/
│   ├── ProjectGlobe.vue    # Main map/globe component
│   ├── UiPanel.vue         # Top-level UI chrome
│   ├── AboutPanel.vue      # Intro / about overlay
│   ├── ProjectMenu.vue     # All-projects drawer
│   ├── MainPopup.vue       # Full data-story popup
│   ├── SmallPopup.vue      # Quick-info popup
│   ├── AudioPlayer.vue     # Background audio control
│   └── slides/             # Slide type components
├── composables/        # Reusable Vue composables
│   ├── useAudio.js
│   ├── useCities.js
│   ├── useGeoJson.js
│   ├── useIntro.js
│   ├── useMapControls.js
│   ├── usePopup.js
│   └── useStorySteps.js
├── js/                 # Utility modules
│   ├── directus.js         # Directus SDK client
│   ├── geojsonLayer.js     # GeoJSON layer helpers
│   ├── hexToRGBA.js
│   ├── lightcolumn.js
│   ├── pointLabelOverlay.js
│   └── updatePoints.js
└── styles/             # Global SCSS variables and mixins
```

## Configuration Reference

See the [Vue CLI Configuration Reference](https://cli.vuejs.org/config/) for advanced build options.

## License

See [LICENSE](./LICENSE).

