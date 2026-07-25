# Chinese-Chess-AI-Pro (WebAssembly 驱动的高性能中国象棋 AI 系统)

[English Version](README.md) | **中文文档**

**在线体验 (GitHub Pages)**: [https://billzi2016.github.io/Chinese-Chess-AI-Pro/](https://billzi2016.github.io/Chinese-Chess-AI-Pro/)

`Chinese-Chess-AI-Pro` 是一款采用纯前端技术构建、基于 WebAssembly (WASM) 运行的高性能中国象棋对弈与算力分析系统。

---

## 1. 核心技术架构与硬核工程亮点

* **C++17 到 WebAssembly 编译与多核并行 (`pthread` & `SharedArrayBuffer`)**：
  使用 Emscripten 将 C++17 算力核心交叉编译为 WASM 二进制产物。利用 `SharedArrayBuffer` 与 `WebAssembly pthreads` 共享内存技术，在浏览器本地自动分配约 90% 的 CPU 逻辑核心进行多线程并行 Alpha-Beta 搜索。

* **NNUE 神经网络评估（HalfKA_v2_hm 特征提取网）**：
  集成中国象棋专属的 HalfKA_v2_hm 半皇/半将神经网络特征提取网，将局势评估精确至厘分级别，实现大师级位置感与棋局掌控。

* **256MB Zobrist 无锁高并发哈希置换表 (Lock-less Hash TT)**：
  在 WASM 内存中分配合适的 256MB Zobrist 局势去重缓存，配合 PVS (Principal Variation Search) 主要变例搜索、静态搜索 (Quiescence Search)、空步剪枝 (Null Move Pruning) 与历史启发 (History Heuristics)，避免重复搜寻相同子树。

* **Bitboard 位棋盘与 WASM SIMD128 向量指令集加速**：
  采用 64 位/128 位 Bitboard 位棋盘进行高效位运算，结合 Emscripten SIMD128 向量指令集加速神经网络特征并行计算，极大地提升了每秒搜寻节点数 (NPS)。

* **Web Worker 线程解耦与 UCI 标准协议通信**：
  算力搜索与规则校验完全在独立的后台 Web Worker 中运行，基于标准 Universal Chess Interface (UCI) 协议进行异步通信，主 UI 线程维持 60fps 极速顺畅响应。

* **GitHub Pages 跨源隔离 (COOP / COEP) 静态部署**：
  集成 `coi-serviceworker.js` 自动注入 `Cross-Origin-Opener-Policy: same-origin` (COOP) 与 `Cross-Origin-Embedder-Policy: require-corp` (COEP) 响应头，突破浏览器安全限制，实现在 GitHub Pages 等静态托管平台上零服务端算力纯前端开箱即用。

---

## 2. 神经网络评估网络 (NNUE) 资产管理与溯源

本项目严格遵循 **DRY (Don't Repeat Yourself)** 架构原则，将 51MB 神经网络评估权重集中存储在根目录的资产文件夹中：

* **存放位置**：[`nnue/pikafish-9e20a9a44415.nnue`](nnue/pikafish-9e20a9a44415.nnue)
* **规范命名**：文件名保留了官方 12 位 SHA256 哈希值（`9e20a9a44415`），支持版本追溯与浏览器 Cache Busting 自动刷新。
* **官方溯源**：权重文件源自官方神经网络发布节点（详见 [`third-party/pikafish/scripts/net.sh`](third-party/pikafish/scripts/net.sh)）。

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

## 5. 附录：开源许可证与引擎演进历史

本项目遵循 **GNU General Public License v3.0 (GPLv3)** 开源许可。

* **引擎演进历史**：项目最初采用 ElephantEye (象眼) 引擎，现已全面升级并完整迁移至基于 Stockfish 架构与 NNUE 神经网络的 **Pikafish** C++17 开源引擎核心。
* **Pikafish 引擎核心**：Copyright (C) official-pikafish / Stockfish authors，遵循 GPLv3 协议。详见 [LICENSE](LICENSE) 或 [third-party/pikafish/Copying.txt](third-party/pikafish/Copying.txt)。
* **xiangqi.js 规则库**：遵循 BSD 2-Clause 协议。详见 [third-party/xiangqi.js](third-party/xiangqi.js)。
* **xiangqiboardjs 棋盘组件**：遵循 MIT 协议。详见 [third-party/xiangqiboardjs](third-party/xiangqiboardjs)。

