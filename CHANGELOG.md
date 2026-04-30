# Change Log

All notable changes to the **vscode-proto3-tools** extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2]

### Fixed

- Refactor definition provider registration in extension.ts to use createProto3DefinitionProvider function, removing the previous inline provideDefinition function for improved clarity and maintainability.

## [0.2.1]

### Added

- **Go to Definition** (`DefinitionProvider`): jump to `message`, `enum`, `service`, and `rpc` declarations; resolves symbols from `import "relative/path.proto"` when the file exists on disk.

## [0.1.5] - 2026-04-30

Enhance proto3 extension with improved completion item provider and error handling.

### Added

- Additional **completion** items for the `proto3` language (`CompletionItemProvider`: keywords, scalar types, symbols in the current file, common `google.protobuf.*`, service / `rpc` / `returns` contexts, and trigger characters `.`, `"`, `(`).
- **GitHub Actions**: CI workflow (install, compile, lint on push/PR to `main` or `master`); release workflow on `v*` tags (VSIX, GitHub Release, publish to VS Code Marketplace when `VSCE_PAT` is set).

### Fixed

- **Document generation**: safer async flow for `proto-doc` (`execFile` / promises) and fewer unhandled rejections.
- **Directory creation**: `createDir` returns a `Promise` and no longer throws from callbacks after showing errors.
- **Download / install paths**: avoid throwing inside `https` / mkdir / decompress error handlers.

### Changed

- **`formatFile`**: wrap `clang-format` / `execSync` in `try` / `catch`, show an error message, and return no edits on failure.
- **`rightClickGenDoc`**: surface failures via `catch` / logging instead of leaving floating promises.
- **`.gitignore`**: ignore `.direnv/`.
- **Docs**: `CHANGELOG` / readme previously referenced a mistaken **1.0.5**; the published line on `main` is **0.1.5** (`v0.1.5`).
- **Dependencies**: added `@vscode/vsce` and scripts `ci`, `vsix` for packaging and automation.


## [0.1.3]

- Format code (clang-format).

## [0.1.2]

- Generate API documentation (external `proto-doc` CLI).

## [0.1.0.1018_beta]

- Snippets.
- Syntax highlighting.
