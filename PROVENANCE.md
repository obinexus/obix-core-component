# OBIX — Provenance & Development Record

## What This Repository Is

**OBIX** (OBINexus Interface Experience) is the UI/UX SDK layer of the
[OBINexus Computing](https://github.com/obinexusmk2) constitutional computing
framework, developed and maintained by **Nnamdi Okpalan** (okpalan@protonmail.com).

**OBI** (Igbo: *Obi*) means **Heart** and **Soul** in the Igbo language of
south-eastern Nigeria. OBIX is built on this foundation: a UI/UX SDK that
treats the human interface as the heart of any software system — not an
afterthought, but the core.

This repository (`github.com/obinexusmk2/obix`) contains the source for all
packages published to npm under the `@obinexusltd` organisation scope.

---

## Repository Identity

| Field            | Value                                          |
|------------------|------------------------------------------------|
| GitHub (source)  | https://github.com/obinexusmk2/obix            |
| npm scope        | https://www.npmjs.com/org/obinexusltd          |
| Author           | Nnamdi Okpalan / OBINexus Computing            |
| Contact          | okpalan@protonmail.com                         |
| License          | MIT                                            |
| Monorepo root    | `@obinexusltd/obix-monorepo`                   |

---

## Package Registry (29 packages published — March 2026)

### Drivers (platform interface layer)

| Package                                         | Description                                                 |
|-------------------------------------------------|-------------------------------------------------------------|
| `@obinexusltd/obix-driver-accessibility-tree`   | ARIA/live region management and screen reader bridge        |
| `@obinexusltd/obix-driver-animation-frame`      | requestAnimationFrame scheduling and timeline orchestration |
| `@obinexusltd/obix-driver-compositor`           | Layer management, z-index optimisation, occlusion culling   |
| `@obinexusltd/obix-driver-dom-mutation`         | Deterministic patch generation and snapshot updates         |
| `@obinexusltd/obix-driver-font-layout`          | Font metrics and layout measurement                         |
| `@obinexusltd/obix-driver-gpu-acceleration`     | WebGL/WebGPU canvas rendering and shader management         |
| `@obinexusltd/obix-driver-input-event`          | Pointer, keyboard and gesture normalisation                 |
| `@obinexusltd/obix-driver-media-query`          | Responsive breakpoint detection and safe-area handling      |
| `@obinexusltd/obix-driver-network-stream`       | WebSocket/SSE for telemetry and real-time state sync        |
| `@obinexusltd/obix-driver-storage-persistence`  | LocalStorage/IndexedDB wrapper for state caching            |

### Bindings (cross-language bridge layer)

| Package                                    | Description                                        |
|--------------------------------------------|----------------------------------------------------|
| `@obinexusltd/obix-binding-go`             | Backend microservices, concurrent state management |
| `@obinexusltd/obix-binding-swift`          | iOS/macOS native rendering bridge                  |
| `@obinexusltd/obix-binding-cpp`            | Legacy system integration, embedded targets        |
| `@obinexusltd/obix-binding-python`         | ML/AI integration, data science workflows          |
| `@obinexusltd/obix-binding-zig`            | Systems programming, compile-time optimisation     |
| `@obinexusltd/obix-binding-java-kotlin`    | Android native, enterprise backend                 |
| `@obinexusltd/obix-binding-csharp`         | .NET/Unity integration                             |
| `@obinexusltd/obix-binding-typescript`     | TypeScript-native API surface                      |
| `@obinexusltd/obix-binding-rust`           | Memory-safe systems integration                    |
| `@obinexusltd/obix-binding-lua`            | Scripting and embedded runtime (Love2D, Roblox)    |

### SDK Core (application layer)

| Package                             | Description                                                               |
|-------------------------------------|---------------------------------------------------------------------------|
| `@obinexusltd/obix-core`            | Heart/Soul UI/UX runtime — component lifecycle, state halting, data-oriented architecture |
| `@obinexusltd/obix-components`      | Base UI primitives — accessibility-first, FUD-mitigating components       |
| `@obinexusltd/obix-state`           | State machine minimisation (automata-based state management)              |
| `@obinexusltd/obix-router`          | SPA navigation with scroll restoration, deep linking                      |
| `@obinexusltd/obix-telemetry`       | State tracking, policy decorators, QA matrix integration                  |
| `@obinexusltd/obix-forms`           | Validation, autocomplete, progressive enhancement                         |
| `@obinexusltd/obix-accessibility`   | WCAG 2.2 enforcement, focus management, ARIA automation                   |
| `@obinexusltd/obix-adapter`         | Data-oriented paradigm translation layer                                  |
| `@obinexusltd/obix-cli`             | Build tooling, schema validation, SemVerX management                      |

---

## Build & Test Verification

Recorded 13 March 2026, 20:17 BST:

```
Build: PASS — all 29 packages compiled via tsc with no errors
Tests:
  obix-core        31/31 passed
  obix-components  51/51 passed  (incl. FUD compliance, ARIA, touch target policies)
  obix-state       36/36 passed
  obix-router       1/1  passed
  obix-telemetry    1/1  passed
  obix-forms        1/1  passed
  obix-motion       1/1  passed
  All drivers:      1/1  passed each
```

---

## Authorship Declaration

This work was conceived, architected, and implemented by **Nnamdi Okpalan**,
founder of OBINexus Computing, operating under the GitHub accounts
`obinexusmk2` and `obinexus`.

All commits, package publications, and architectural decisions reflect original
independent authorship. The `@obinexusltd` npm organisation is the publishing
identity for work originating from this repository.

---

*Last updated: 21 March 2026*
