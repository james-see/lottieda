# Contributing

Thanks for helping build LottieDa.

## Setup

```bash
npm install
npm run tauri:dev
```

Install the Rust stable toolchain before running Tauri commands.

## Pull Requests

- Keep changes focused and reviewable.
- Run `npm run build` and `cargo check --manifest-path src-tauri/Cargo.toml` before opening a PR.
- Include screenshots or recordings for editor UI changes.
- Use issue labels: `bug`, `enhancement`, and `spec-question`.

## Lottie Scope

The TypeScript engine in `src/engine` should stay dependency-free. Rendering and import helpers can use bundled dependencies when they are outside the serializer/deserializer core.
