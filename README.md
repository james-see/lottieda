# LottieDa

LottieDa is an open-source native desktop editor for creating and editing Lottie animations visually. It is built with Tauri 2, React, TypeScript, Canvas 2D, and a small dependency-light Lottie JSON engine.

## MVP Features

- Open and save Lottie `.json` files
- Draw rectangle, ellipse, and basic path shape layers
- Edit fill, stroke, position, and opacity
- Add position and opacity keyframes at the current playhead
- Scrub and play the animation timeline
- Preview through bundled `lottie-web`
- Import static SVG paths, rectangles, circles, and ellipses

## Development

```bash
npm install
npm run tauri:dev
```

Frontend-only development:

```bash
npm run dev
```

Production checks:

```bash
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
npm run tauri:build
```

## Release

Tagged releases build a macOS `.dmg` through GitHub Actions. Signing and notarization require Apple Developer secrets configured in the repository.
