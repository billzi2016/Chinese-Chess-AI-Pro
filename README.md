**English Version** | [中文文档](README_CN.md) | 🌐 **Live Demo (GitHub Pages)**: [https://billzi2016.github.io/Chinese-Chess-AI-Pro/](https://billzi2016.github.io/Chinese-Chess-AI-Pro/)

# Chinese-Chess-AI (WebAssembly-Powered High-Performance Xiangqi AI)

`Chinese-Chess-AI` is a modern, high-performance Chinese Chess (Xiangqi) web application running entirely in the browser via WebAssembly (WASM).

> **Note on Engine Migration**: The project originally used ElephantEye (Eleeye). It has now been completely upgraded and migrated to **Pikafish** (the state-of-the-art Xiangqi engine based on Stockfish and NNUE neural network evaluation), compiled to multi-threaded WebAssembly with `pthread` and `SharedArrayBuffer` support.

---

## 1. Technical Innovations & Engineering Highlights

* **Pikafish C++ Engine & Multi-threaded WASM**:
  Cross-compiled official Pikafish (C++17) using Emscripten with `pthread` and `SharedArrayBuffer` support. It allocates approximately 90% of available CPU logical cores in the browser for high-performance multi-core parallel search.

* **NNUE Neural Network Evaluation**:
  Loads the official 51MB NNUE weights (`pikafish.nnue`) directly in WebAssembly memory, delivering grandmaster-level position evaluation and search depth locally in the browser without any backend computation server.

* **Web Worker Thread Decoupling & UCI Protocol**:
  The engine runs in a dedicated Web Worker using the Universal Chess Interface (UCI) protocol, completely decoupling heavy AI calculation from the UI thread to ensure a smooth 60fps interaction.

* **GitHub Pages & Browser COOP / COEP Compatibility**:
  Integrated with `coi-serviceworker.js` and a custom local development server (`server.py`) to inject `Cross-Origin-Opener-Policy: same-origin` (COOP) and `Cross-Origin-Embedder-Policy: require-corp` (COEP) headers, enabling `SharedArrayBuffer` on static web hosts like GitHub Pages.

* **Rule Authority Engine**:
  Pikafish handles rule validation (`pikafish_validate_move`) and legal move counting (`pikafish_legal_move_count`), guaranteeing 100% adherence to standard Xiangqi rules.

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

## 5. Open Source License & Compliance

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**.

- **Pikafish Engine**: Copyright (C) official-pikafish / Stockfish authors, licensed under GPLv3. See [LICENSE](LICENSE) or [third-party/pikafish/Copying.txt](third-party/pikafish/Copying.txt).
- **xiangqi.js**: BSD 2-Clause License. See [third-party/xiangqi.js](third-party/xiangqi.js).
- **xiangqiboardjs**: MIT License. See [third-party/xiangqiboardjs](third-party/xiangqiboardjs).

