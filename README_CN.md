[English Version](README.md) | **中文文档** | 🌐 **在线体验 (GitHub Pages)**: [https://billzi2016.github.io/Chinese-Chess-AI-Pro/](https://billzi2016.github.io/Chinese-Chess-AI-Pro/)

# Chinese-Chess-AI-Pro (WebAssembly 驱动的高性能中国象棋 AI 系统)

`Chinese-Chess-AI-Pro` 是一款采用纯前端技术构建、基于 WebAssembly (WASM) 运行的高性能中国象棋对弈与算力分析系统。

> **引擎升级迁移说明**：项目原先使用象眼（ElephantEye）引擎，现已全面升级并完整迁移至 **Pikafish**（基于 Stockfish 和 NNUE 神经网络评估的顶级中国象棋引擎），并编译为支持 `pthread` 多线程与 `SharedArrayBuffer` 的 WebAssembly 二进制。

---

## 1. 核心技术创新与工程亮点

* **Pikafish C++ 引擎与多线程 WebAssembly**：
  使用 Emscripten 将官方 Pikafish (C++17) 源码编译为带 `pthread` 线程池的 WASM 产物，在浏览器本地自动调用约 90% 的逻辑 CPU 核心进行高效多核并行搜索。

* **NNUE 神经网络估值**：
  在 WASM 内存中直接加载 51MB 官方 NNUE 评估权重文件 (`pikafish.nnue`)，无需后端算力服务器即可实现大师级棋局估值与极深搜索。

* **Web Worker 线程解耦与 UCI 协议通信**：
  引擎常驻运行在独立 Web Worker 中，基于标准 Universal Chess Interface (UCI) 协议与前端进行异步通信，主 UI 线程维持 60fps 顺畅响应。

* **GitHub Pages 跨源隔离兼容性 (COOP / COEP)**：
  集成 `coi-serviceworker.js` 与 Python 开发服务器 (`server.py`)，注入 `Cross-Origin-Opener-Policy: same-origin` (COOP) 与 `Cross-Origin-Embedder-Policy: require-corp` (COEP) 响应头，在 GitHub Pages 等静态托管平台上激活 `SharedArrayBuffer`。

* **规则权威引擎**：
  由 Pikafish 接管着法合法性校验 (`pikafish_validate_move`) 与合法着法计数 (`pikafish_legal_move_count`)，保证 100% 符合象棋规则。

---

## 2. 核心亮点与设计特色

* **零服务器算力开销**：Pikafish 神经网络引擎在玩家本地浏览器内高效运行。
* **主线程零卡顿**：引擎搜索放入 Web Worker，多核密集计算不阻塞主界面交互。
* **防“屎山” CSS 模块化体系**：采用 Design Tokens (CSS 原生变量) + 局部作用域组件拆分，彻底杜绝硬编码与样式混乱。
* **真实 UCI AI 搜索评估面板**：侧边栏实时解析 UCI 文本流，展示步数、落子方、来源、着法、深度 (depth)、节点数 (nodes)、NPS、用时与评估分数，**绝不伪造假数据**。

---

## 3. 本地开发服务器启动

项目内置多进程并发静态开发服务器 [server.py](server.py)，固定绑定 **`6324`** 端口，并自动配置 WASM 所需的 Cross-Origin 隔离响应头 (COOP/COEP)：

```bash
# 启动多进程并发服务器 (默认 6324 端口)
python3 server.py

# 启动后访问地址：
# http://127.0.0.1:6324/
```

---

## 4. 技术架构与解耦分层

应用遵循 **“视图 UI - 业务裁判 - 算力引擎” 三层解耦架构**：

```text
+---------------------------------------------------------+
|                    Web UI (视图层)                       |
|  xiangqiboard.js (DOM 棋盘) + 应用状态 (js/app.js)      |
+----------------------------+----------------------------+
                             | (交互事件 / UCI 指令)
                             v
+---------------------------------------------------------+
|             Web Worker 与 UCI 协议通信桥接              |
|       (js/worker/pikafish-engine.js + pre-js 桥接)       |
+----------------------------+----------------------------+
                             | (WASM / pthread / SharedArrayBuffer)
                             v
+---------------------------------------------------------+
|            Pikafish WASM 引擎 (C++17 算力核心)          |
|    - 51MB NNUE 神经网络评估网络 (/pikafish.nnue)        |
|    - 多线程并行搜索 (自动使用约 90% CPU 核心)           |
|    - UCI 标准协议 (go movetime 5000, info, bestmove)    |
+---------------------------------------------------------+
```

---

## 5. 开源许可证与合规声明

本项目遵循 **GNU General Public License v3.0 (GPLv3)** 开源许可。

- **Pikafish 引擎**：Copyright (C) official-pikafish / Stockfish authors，遵循 GPLv3 协议。详见 [LICENSE](LICENSE) 或 [third-party/pikafish/Copying.txt](third-party/pikafish/Copying.txt)。
- **xiangqi.js**：遵循 BSD 2-Clause 协议。详见 [third-party/xiangqi.js](third-party/xiangqi.js)。
- **xiangqiboardjs**：遵循 MIT 协议。详见 [third-party/xiangqiboardjs](third-party/xiangqiboardjs)。

