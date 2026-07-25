# Chinese-Chess-AI-Pro (WebAssembly-Powered High-Performance Xiangqi AI)

**English Version** | [中文文档](README_CN.md) | **Live Demo (GitHub Pages)**: [https://billzi2016.github.io/Chinese-Chess-AI-Pro/](https://billzi2016.github.io/Chinese-Chess-AI-Pro/)

`Chinese-Chess-AI-Pro` is a modern, high-performance Chinese Chess (Xiangqi) web application running entirely in the browser via WebAssembly (WASM).

---

## 1. Technical Innovations & Engineering Highlights

* **C++17 to WebAssembly Compilation & Multi-core Parallelism (`pthread` & `SharedArrayBuffer`)**:
  Cross-compiles the C++17 engine core into WebAssembly binaries using Emscripten. Utilizes `SharedArrayBuffer` and `WebAssembly pthreads` shared memory to automatically allocate ~90% of available logical CPU cores for multi-threaded parallel Alpha-Beta search locally in the browser.

* **NNUE Neural Network Evaluation (HalfKA_v2_hm Feature Network)**:
  Integrates the specialized HalfKA_v2_hm neural network feature extraction network, providing master-level position evaluation and piece valuation down to centipawn precision.

* **256MB Zobrist Lock-less High-Concurrency Transposition Table**:
  Allocates a 256MB Zobrist transposition table in WebAssembly memory for position deduplication, coupled with Principal Variation Search (PVS), Quiescence Search, Null Move Pruning, and History Heuristics to avoid duplicate sub-tree searching.

* **Bitboard Operations & WASM SIMD128 Vector Acceleration**:
  Employs 64-bit/128-bit Bitboards for fast bitwise move generation, combined with Emscripten SIMD128 vector instructions to accelerate neural network feature processing and boost NPS (Nodes Per Second).

* **Web Worker Thread Decoupling & Standard UCI Protocol**:
  Search and move validation run entirely in a dedicated background Web Worker, communicating asynchronously via the Universal Chess Interface (UCI) protocol to maintain a smooth 60fps UI rendering rate.

* **GitHub Pages Cross-Origin Isolation (COOP / COEP) Static Deployment**:
  Integrates `coi-serviceworker.js` to automatically inject `Cross-Origin-Opener-Policy: same-origin` (COOP) and `Cross-Origin-Embedder-Policy: require-corp` (COEP) headers, enabling zero-server-cost pure client-side deployment on static web hosts like GitHub Pages.

---

## 2. NNUE Asset Management & Origin

Strictly adheres to **DRY (Don't Repeat Yourself)** architecture principles, storing the 51MB NNUE weights in a single dedicated asset folder:

* **Location**: [`nnue/pikafish-9e20a9a44415.nnue`](nnue/pikafish-9e20a9a44415.nnue)
* **Standard Naming**: Retains the official 12-character SHA256 hash (`9e20a9a44415`) for version tracking and automatic browser Cache Busting.
* **Official Origin**: Sourced from official releases (see [`third-party/pikafish/scripts/net.sh`](third-party/pikafish/scripts/net.sh)).

---

## 2. Core Highlights & Features

* **Zero Server Computation Cost**: The Pikafish engine runs in WebAssembly with NNUE evaluation, fully executing in the local browser.
* **Zero Main-Thread Lag**: Engine computation is offloaded to a Web Worker, ensuring 60fps UI responsiveness during deep searches.
* **Modular CSS Architecture**: Design Tokens + localized component scoping prevent style pollution.
* **Real-time UCI Engine Evaluation Panel**: Streams and parses UCI output in real-time (`nodes`, `nps`, `time`, `score`, `depth`), displaying authentic search metrics.

---

## 3. Local Development Server

The repository includes a multi-process static development server [server.py](server.py) bound to port **`6324`**, automatically configuring Cross-Origin Isolation headers (COOP/COEP) required for WASM:

```bash
# Start multi-process development server (default port 6324)
python3 server.py

# Access via browser:
# http://127.0.0.1:6324/
```

---

## 4. Architecture & Data Flow

The application follows a **"View UI - Business Rules - Engine Computation" 3-layer decoupled architecture**:

```text
+---------------------------------------------------------+
|                    Web UI (View Layer)                  |
|  xiangqiboard.js (DOM Board) + App State (js/app.js)    |
+----------------------------+----------------------------+
                             | (User Interaction / UCI)
                             v
+---------------------------------------------------------+
|             Web Worker & UCI Message Bridge             |
|       (js/worker/pikafish-engine.js + pre-js bridge)    |
+----------------------------+----------------------------+
                             | (WASM / pthread / SharedArrayBuffer)
                             v
+---------------------------------------------------------+
|            Pikafish WASM Engine (C++17 Engine)          |
|    - 51MB NNUE Eval Network (/pikafish.nnue)            |
|    - Multi-thread Parallel Search (~90% CPU Cores)      |
|    - UCI Protocol (go movetime 5000, info, bestmove)    |
+---------------------------------------------------------+
```

---

## 5. Appendix: Open Source License & Migration History

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**.

* **Engine Migration History**: The project originally used ElephantEye (Eleeye). It has now been completely upgraded and migrated to **Pikafish** (the state-of-the-art Xiangqi engine based on Stockfish and NNUE neural network evaluation).
* **Pikafish Engine Core**: Copyright (C) official-pikafish / Stockfish authors, licensed under GPLv3. See [LICENSE](LICENSE) or [third-party/pikafish/Copying.txt](third-party/pikafish/Copying.txt).
* **xiangqi.js Rule Engine**: BSD 2-Clause License. See [third-party/xiangqi.js](third-party/xiangqi.js).
* **xiangqiboardjs Component**: MIT License. See [third-party/xiangqiboardjs](third-party/xiangqiboardjs).

