# vscode proto3 tools

<p align="center">
    <img src="./images/logo.png">
</p>


<div align="center">

[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Release](https://img.shields.io/github/v/release/kalifun/vscode-proto3-tools?style=flat-square)](https://github.com/kalifun/vscode-proto3-tools/releases)

</div>

> proto3 language service

I'm sure you're no stranger to API documentation, but when there's no common place to store it, it can lead to a variety of formats and fragmentation. That makes collecting API docs painful. This extension helps you capture structure and comments in `proto` files, and generate docs where it fits your workflow.

## Features

### Implemented

| Area | Description |
|------|-------------|
| **Snippets** | Common `proto3` patterns (messages, RPCs, fields, etc.). |
| **Syntax** | TextMate grammar for `.proto` (language id `proto3`). |
| **Generate doc** | Commands / context menu to run the external [**proto-doc**](https://github.com/kalifun/proto-doc) CLI; configurable output path and `zh` / `en` template language. |
| **Format** | Document formatting via **clang-format** (style options in settings). |
| **Completion** | Keyword / scalar / file-local types, service keywords, and types in `rpc` / `returns` parentheses; trigger characters include `.`, `"`, `(`. |
| **Go to Definition** | Jump to `message`, `enum`, `service`, and `rpc` definitions in the current file and in imported `.proto` files (relative `import` paths on disk). |
| **CI / release** | GitHub Actions: lint + compile on PR/push; tag `v*.*.*` builds a VSIX, creates a GitHub Release, and can publish to the Marketplace (requires `VSCE_PAT`). |

Screenshots: snippets, syntax, doc, and format — see sections below.

### Snippets

![](images/snippets.gif)

### Syntaxes

![](images/syntaxes.png)

### Doc

![](images/doc.png)

### Format

![](images/format.gif)

## Roadmap / not yet done

- [ ] **AIP / api-linter**: `proto3.disable_rules` exists in settings but is not wired to a linter or diagnostics in the editor.
- [ ] **clang-format detection**: reliably detect whether `clang-format` is on `PATH` before offering format (today formatting may no-op or error depending on environment).
- [ ] **References & symbols**: “Find all references”, document outline / workspace symbol list from parsed protos.
- [ ] **Imports**: `buf.work.yaml` / multi-root–aware and `protoc` include paths for imports beyond simple relative files.
- [ ] **Tests**: automated `@vscode/test-electron` (or similar) suite in CI.
- [ ] **Optional**: Open VSX / other registries, semantic highlighting, deeper comment-aware parsing.

## Todo checklist (high level)

- [x] Snippets  
- [x] Syntaxes  
- [x] Gen API doc (via proto-doc)  
- [x] Format code (clang-format)  
- [x] Completion  
- [x] Go to Definition (basic + import)  
- [x] CI & release automation  

# Acknowledgement

[vscode-proto3](https://github.com/zxh0/vscode-proto3)  
[language_grammars](https://macromates.com/manual/en/language_grammars#naming_conventions)
