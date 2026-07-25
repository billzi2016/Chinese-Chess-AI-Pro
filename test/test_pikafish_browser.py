#!/usr/bin/env python3
"""在真实 Chromium 中验证 Pikafish pthread WASM、NNUE 与 Worker。"""

from __future__ import annotations

import json
import os
import sys

from playwright.sync_api import sync_playwright


URL = os.environ.get("CHINESE_CHESS_URL", "http://127.0.0.1:6324/")
START_FEN = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1"


def main() -> None:
    console_errors: list[str] = []
    page_errors: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        )
        page = browser.new_page()
        page.on(
            "console",
            lambda message: console_errors.append(message.text)
            if message.type == "error"
            else None,
        )
        page.on("pageerror", lambda error: page_errors.append(str(error)))

        page.add_init_script(
            """
            (() => {
              const NativeWorker = window.Worker;
              window.__trackedWorkers = [];
              function TrackedWorker(...args) {
                const worker = new NativeWorker(...args);
                window.__trackedWorkers.push(worker);
                return worker;
              }
              TrackedWorker.prototype = NativeWorker.prototype;
              Object.setPrototypeOf(TrackedWorker, NativeWorker);
              window.Worker = TrackedWorker;
            })();
            """
        )
        page.goto(URL, wait_until="domcontentloaded", timeout=120_000)

        result = page.evaluate(
            """
            async ({ fen }) => {
              const worker = window.__trackedWorkers[0];
              if (!worker) throw new Error('页面没有创建 Pikafish Worker');

              return await new Promise((resolve, reject) => {
                const state = {
                  isolated: window.crossOriginIsolated,
                  hardwareConcurrency: navigator.hardwareConcurrency || 1,
                  threads: 0,
                  infoCount: 0,
                  bestmove: null,
                  error: null
                };
                const timeout = setTimeout(() => {
                  reject(new Error('Pikafish 浏览器搜索超时'));
                }, 180000);

                worker.addEventListener('message', (event) => {
                  const data = event.data || {};
                  if (data.type === 'READY') {
                    state.threads = data.threads;
                    worker.postMessage({
                      type: 'SEARCH',
                      fen,
                      movetime: 1000
                    });
                  } else if (data.type === 'INFO') {
                    state.infoCount += 1;
                  } else if (data.type === 'BEST_MOVE') {
                    state.bestmove = data.move;
                    clearTimeout(timeout);
                    resolve(state);
                  } else if (data.type === 'ERROR') {
                    state.error = data.message;
                    clearTimeout(timeout);
                    reject(new Error(data.message));
                  }
                });

                worker.postMessage({ type: 'INIT' });
              });
            }
            """,
            {"fen": START_FEN},
        )
        browser.close()

    expected_threads = max(1, int(result["hardwareConcurrency"] * 0.9))
    assert result["isolated"] is True, "页面必须处于 crossOriginIsolated 环境"
    assert result["threads"] == expected_threads, (
        f"线程数应为逻辑核心约 90%：期望 {expected_threads}，实际 {result['threads']}"
    )
    assert result["infoCount"] > 0, "Pikafish 必须输出真实 info 搜索数据"
    assert (
        isinstance(result["bestmove"], str)
        and len(result["bestmove"]) == 4
        and result["bestmove"][0] in "abcdefghi"
        and result["bestmove"][2] in "abcdefghi"
    ), f"bestmove 格式无效：{result['bestmove']}"
    assert not page_errors, f"页面 JavaScript 异常：{page_errors}"
    assert not console_errors, f"浏览器控制台错误：{console_errors}"

    print("Pikafish 浏览器集成测试通过：")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Pikafish 浏览器集成测试失败：{error}", file=sys.stderr)
        raise
