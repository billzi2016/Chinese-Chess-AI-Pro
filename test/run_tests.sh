#!/usr/bin/env bash
# 一键运行项目所有单元测试

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "      Chinese-Chess-AI 全量单元测试      "
echo "=========================================="
echo ""

# 1. 运行 JavaScript/Shell 静态语法检查
echo "-> 运行 [1/4] JavaScript & Shell 静态语法检查..."
bash -n "$PROJECT_ROOT/scripts/build_wasm.sh"
node --check "$PROJECT_ROOT/js/app.js"
node --check "$PROJECT_ROOT/js/xiangqi.js"
node --check "$PROJECT_ROOT/coi-serviceworker.js"
echo "语法检查全部通过！"
echo ""

# 2. 运行 xiangqi.js 规则与坐标转换测试
echo "-> 运行 [2/4] xiangqi.js 规则与坐标转换测试..."
node "$SCRIPT_DIR/test_xiangqi.js"
echo ""

# 3. 运行 6324 端口服务器响应头探测
echo "-> 运行 [3/4] 6324 端口服务器响应头探针测试..."
python3 "$SCRIPT_DIR/test_server_launch.py"
python3 "$SCRIPT_DIR/test_running_server.py"
echo ""

# 4. 运行 Pikafish 真实 Chromium 浏览器多线程 WASM 集成测试
echo "-> 运行 [4/4] Pikafish 真实 Chromium 浏览器集成测试..."
/opt/anaconda3/bin/python3 "$SCRIPT_DIR/test_pikafish_browser.py"
echo ""

echo "=========================================="
echo "     所有单元测试已成功通过 (ALL PASS)     "
echo "=========================================="
