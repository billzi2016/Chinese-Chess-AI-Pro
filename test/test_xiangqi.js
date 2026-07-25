/**
 * test_xiangqi.js - xiangqi.js 规则裁判引擎单元测试
 */

const assert = require('assert');
const path = require('path');

// 引入被测单元
const Xiangqi = require(path.join(__dirname, '../js/xiangqi.js')).Xiangqi;

console.log('== 单元测试开始: js/xiangqi.js ==');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// 1. 测试开局标准 FEN 加载与序列化
runTest('初始标准 FEN 码加载与匹配', () => {
  const game = new Xiangqi();
  const initialFen = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
  assert.strictEqual(game.fen(), initialFen);
});

// 2. 测试别马腿规则阻断
runTest('马走日别马腿阻断检测', () => {
  const game = new Xiangqi();
  // 初始局面下，红马在 h0 (8 * 9 + 7 = 79)，准备走到 g2 (7 * 9 + 6 = 69)，马腿在 h1 (79)，无阻挡
  // 测试一个被别马腿的动作：如果马腿在 70 (h2) 有子，则跳往 61 被阻断
  game.board[70] = { type: 'r', color: 'r' }; // 放置别腿子
  const moveResult = game.applyMove(79, 61);
  assert.strictEqual(moveResult, null, '别马腿时应拒绝非法落子');
});

// 3. 测试红相过河限制与塞象眼
runTest('红相过河限制检测', () => {
  const game = new Xiangqi();
  // 红相在 c0 (81)，尝试过河到过河位置
  game.board[38] = { type: 'b', color: 'r' }; // 4*9+2=38
  const moveResult = game.isLegalMove(38, 20); // 过河到 row 2
  assert.strictEqual(moveResult, false, '相过河应被严格拒绝');
});

// 4. 测试仕/士九宫格界限限制
runTest('仕/士九宫格范围界限检测', () => {
  const game = new Xiangqi();
  // 红仕在 d0 (8 * 9 + 3 = 75)，尝试走九宫格外部
  const isLegal = game.isLegalMove(75, 65);
  assert.strictEqual(isLegal, false, '士走出九宫格应被拒绝');
});

// 5. 测试悔棋 undo 功能
runTest('悔棋 undo 状态恢复', () => {
  const game = new Xiangqi('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1');
  // 炮二平五 (row 7 col 7 -> 70 到 row 7 col 4 -> 67)
  const ucci = game.applyMove(70, 67);
  assert.ok(ucci, '炮二平五应该执行成功');
  assert.strictEqual(game.turn, 'b');

  const undone = game.undo();
  assert.ok(undone, '悔棋应当成功返回');
  assert.strictEqual(game.turn, 'r');
});

// 6. 测试兵/卒未过河只能直走且不能倒退
runTest('兵未过河限制直走与不可倒退检测', () => {
  const q = new Xiangqi();
  // 中兵 (Row 6, Col 4 -> 58) 进一 (Row 5, Col 4 -> 49) 合法
  assert.ok(q.isLegalMove(58, 49), '中兵直进一格合法');
  // 中兵平移 (sq 58 到 sq 59) 在未过河时非法
  assert.ok(!q.isLegalMove(58, 59), '中兵未过河不可横走');
  // 中兵退一 (sq 58 到 sq 67) 非法
  assert.ok(!q.isLegalMove(58, 67), '兵不可倒退');
});

// 7. 测试炮不吃子需无子阻隔，吃子需隔一子
runTest('炮不吃子无障碍与吃子隔一子检测', () => {
  const q = new Xiangqi();
  // 炮二 (Row 7, Col 1 -> 64) 平五 (Row 7, Col 4 -> 67) 路径中间无障碍合法
  assert.ok(q.isLegalMove(64, 67), '炮平五无障碍合法');
  // 炮二进七 (sq 64 到 sq 1 敌马) 中间隔黑炮(sq 19) 恰好 1 子 -> 隔山打炮合法
  assert.ok(q.isLegalMove(64, 1), '炮隔 1 子打敌马合法');
  // 炮二进五 (sq 64 到 sq 19 敌炮) 路径中间无隔子直接吃 -> 非法
  assert.ok(!q.isLegalMove(64, 19), '炮无隔子吃敌炮非法');
});

console.log(`\n测试汇总: ${passedTests} / ${totalTests} 通过.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
