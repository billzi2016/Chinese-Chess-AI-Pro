/**
 * test_pikafish_engine.js - Pikafish WASM 算力引擎全量集成与真实搜索测试
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');

console.log('== 核心单元测试: Pikafish WASM C++17 引擎 + NNUE 真实算力搜索 ==');

const workerPath = path.join(__dirname, '../js/worker/pikafish-engine.js');
const wasmPath = path.join(__dirname, '../js/worker/pikafish-engine.wasm');
const nnuePath = path.join(__dirname, '../js/worker/pikafish.nnue');

// 1. 静态产物存在性与体积校验
console.log('-> 步骤 [1/2] 校验 Pikafish WASM 引擎产物与 51MB NNUE 权重...');
assert.ok(fs.existsSync(workerPath), 'pikafish-engine.js 必须存在');
assert.ok(fs.existsSync(wasmPath), 'pikafish-engine.wasm 必须存在');
assert.ok(fs.existsSync(nnuePath), 'pikafish.nnue 必须存在');

const wasmStats = fs.statSync(wasmPath);
const nnueStats = fs.statSync(nnuePath);
assert.ok(wasmStats.size > 200000, `pikafish-engine.wasm 体积应合理 (${wasmStats.size} bytes)`);
assert.ok(nnueStats.size > 40000000, `pikafish.nnue 体积应约为 51MB (${nnueStats.size} bytes)`);
console.log('静态产物校验全部通过！\n');

// 2. 真实算力搜索与 UCI 消息校验
console.log('-> 步骤 [2/2] 启动 Pikafish WASM 引擎，进行 1000ms 真实 AI 算力搜索...');
const startFen = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

let infoCount = 0;
let bestMoveReceived = null;
let configuredThreads = 0;

const worker = new Worker(workerPath, {
  name: 'em-pthread',
  workerData: { scriptName: workerPath }
});

const timeout = setTimeout(() => {
  console.error('\n[FAIL] Pikafish WASM 算力搜索测试超时!');
  worker.terminate();
  process.exit(1);
}, 30000);

worker.on('message', (data) => {
  if (!data) return;

  if (data.type === 'READY') {
    configuredThreads = data.threads;
    console.log(`[Pikafish 引擎就绪] 成功挂载 NNUE, 线程池配置: ${configuredThreads} 线程.`);
    console.log(`[测试搜索] 发送起始局面 FEN 码, 进行 1 秒真实 AI 算力搜索...`);
    worker.postMessage({
      type: 'SEARCH',
      fen: startFen,
      movetime: 1000
    });
  } else if (data.type === 'INFO') {
    infoCount++;
    if (infoCount % 5 === 1) {
      console.log(`[引擎搜索日志] depth: ${data.info.depth || 0}, nodes: ${data.info.nodes || 0}, nps: ${data.info.nps || 0}`);
    }
  } else if (data.type === 'BEST_MOVE') {
    bestMoveReceived = data.move;
    clearTimeout(timeout);

    console.log(`\n[引擎计算完成] 收集到 info 搜索日志 ${infoCount} 条, 最佳着法: ${bestMoveReceived}`);

    assert.ok(configuredThreads >= 1, 'Pikafish 应当识别并开启线程池');
    assert.ok(infoCount > 0, 'Pikafish 引擎在搜索中必须输出真实的 info 日志');
    assert.ok(bestMoveReceived, 'Pikafish 引擎计算完成后必须返回有效的 bestmove');
    assert.strictEqual(bestMoveReceived.length, 4, `bestmove 格式必须为 4 位 UCI 坐标 (当前: ${bestMoveReceived})`);

    console.log('==========================================');
    console.log(' [PASS] Pikafish WASM 引擎算力测试完全成功!');
    console.log('==========================================\n');

    worker.terminate();
    process.exit(0);
  } else if (data.type === 'ERROR') {
    console.error('\n[FAIL] Pikafish 引擎抛出错误:', data.message);
    clearTimeout(timeout);
    worker.terminate();
    process.exit(1);
  }
});

worker.on('error', (err) => {
  console.error('\n[FAIL] Worker 发生致命异常:', err);
  clearTimeout(timeout);
  worker.terminate();
  process.exit(1);
});

worker.postMessage({ type: 'INIT' });
