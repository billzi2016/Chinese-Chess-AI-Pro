/*
 * Browser command queue adapted from lichess-org/stockfish.wasm (GPLv3).
 * Pikafish NNUE is fetched before the exported engine initializer is called.
 */

;(function () {
  'use strict';

  var listeners = [];
  var queue = [];
  var running = false;
  var engineReady = false;
  var configuredThreads = 1;
  var currentStats = null;

  if (typeof self === 'undefined') {
    if (typeof globalThis !== 'undefined') {
      globalThis.self = globalThis;
    } else if (typeof global !== 'undefined') {
      global.self = global;
    }
  }

  var globalScope = typeof self !== 'undefined' ? self : globalThis;

  Module.locateFile = function (pathName, prefix) {
    if (typeof __dirname !== 'undefined' && typeof require !== 'undefined') {
      try {
        var fs = require('fs');
        var path = require('path');
        var fullPath = path.join(__dirname, pathName);
        if (fs.existsSync(fullPath)) return fullPath;
      } catch (e) {}
    }
    return prefix + pathName;
  };

  if (typeof globalScope.Worker === 'undefined' && typeof require !== 'undefined') {
    try {
      globalScope.Worker = require('worker_threads').Worker;
    } catch (e) {}
  }

  if (typeof __filename !== 'undefined') {
    Module.mainScriptUrlOrBlob = __filename;
    globalScope._scriptName = __filename;
    try { _scriptName = __filename; } catch (e) {}
  }

  function postMsg(msg) {
    if (typeof globalScope.postMessage === 'function') {
      globalScope.postMessage(msg);
    } else {
      try {
        require('worker_threads').parentPort.postMessage(msg);
      } catch (e) {}
    }
  }

  Module.noInitialRun = true;

  Module.print = function (line) {
    var text = String(line);
    if (!listeners.length) {
      console.log(text);
      return;
    }
    setTimeout(function () {
      listeners.slice().forEach(function (listener) { listener(text); });
    });
  };

  Module.printErr = function (line) {
    console.warn('[Pikafish]', line);
  };

  Module.addMessageListener = function (listener) {
    listeners.push(listener);
  };

  Module.removeMessageListener = function (listener) {
    var index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };

  function poll() {
    var command = queue.shift();
    if (!running || command === undefined) return;
    Module.ccall('uci_command', 'number', ['string'], [command]);
    setTimeout(poll, 0);
  }

  Module.postMessage = function (command) {
    queue.push(String(command));
    if (running && queue.length === 1) poll();
  };

  function postError(message) {
    postMsg({ type: 'ERROR', message: message });
  }

  function send(command) {
    Module.postMessage(command);
  }

  function parseUciInfoLine(line) {
    var tokens = line.split(/\s+/);
    var result = {};

    for (var index = 1; index < tokens.length; index++) {
      var key = tokens[index];
      var value = tokens[index + 1];
      if (key === 'depth') result.depth = Number.parseInt(value, 10);
      else if (key === 'seldepth') result.seldepth = Number.parseInt(value, 10);
      else if (key === 'nodes') result.nodes = Number.parseInt(value, 10);
      else if (key === 'nps') result.nps = Number.parseInt(value, 10);
      else if (key === 'time') result.time = Number.parseInt(value, 10);
      else if (key === 'score' && value === 'cp') {
        result.score = Number.parseInt(tokens[index + 2], 10);
      } else if (key === 'score' && value === 'mate') {
        var mate = Number.parseInt(tokens[index + 2], 10);
        result.mate = mate;
        result.score = mate > 0 ? 100000 - mate : -100000 - mate;
      }
    }

    return Object.keys(result).length ? result : null;
  }

  function handleEngineLine(rawLine) {
    var line = String(rawLine || '').trim();
    if (!line) return;

    if (line.indexOf('ERROR NNUE_LOAD_FAILED') >= 0) {
      postError(line);
    } else if (line === 'uciok') {
      var logicalCores = Math.max(1, Number(globalScope.navigator && globalScope.navigator.hardwareConcurrency) || 1);
      configuredThreads = Math.max(1, Math.floor(logicalCores * 0.9));
      send('setoption name EvalFile value /pikafish-9e20a9a44415.nnue');
      send('setoption name Threads value ' + configuredThreads);
      send('setoption name Hash value 256');
      send('isready');
    } else if (line === 'readyok') {
      engineReady = true;
      postMsg({ type: 'READY', threads: configuredThreads });
    } else if (line.indexOf('info ') === 0) {
      var info = parseUciInfoLine(line);
      if (info) {
        currentStats = Object.assign(currentStats || {}, info);
        postMsg({ type: 'INFO', info: currentStats });
      }
    } else if (line.indexOf('bestmove ') === 0) {
      var move = line.split(/\s+/)[1] || '(none)';
      postMsg({ type: 'BEST_MOVE', move: move, info: currentStats });
      currentStats = null;
    }
  }

  Module.addMessageListener(handleEngineLine);

  function handleIncomingMessage(data) {
    data = data || {};

    if (data.type === 'INIT') {
      if (engineReady) {
        postMsg({ type: 'READY', threads: configuredThreads });
      } else {
        send('uci');
      }
    } else if (data.type === 'SEARCH') {
      if (!engineReady) {
        postError('引擎尚未就绪');
        return;
      }
      currentStats = null;
      send('position fen ' + data.fen);
      send('go movetime ' + (data.movetime || 5000));
    } else if (data.type === 'VALIDATE') {
      var legal = engineReady
        ? Module.ccall(
            'pikafish_validate_move',
            'number',
            ['string', 'string'],
            [data.fen, data.move]
          ) === 1
        : false;
      postMsg({ type: 'VALIDATION_RESULT', move: data.move, legal: legal });
    } else if (data.type === 'STATUS') {
      var legalMoves = engineReady
        ? Number(Module.ccall(
            'pikafish_legal_move_count',
            'bigint',
            ['string'],
            [data.fen]
          ))
        : 0;
      postMsg({ type: 'STATUS_RESULT', legalMoves: legalMoves });
    } else if (data.type === 'STOP') {
      send('stop');
    }
  }

  if (globalThis.name !== 'em-pthread') {
    if (typeof globalScope.addEventListener === 'function') {
      globalScope.addEventListener('message', function (event) {
        handleIncomingMessage(event.data);
      });
    } else {
      try {
        var parentPort = require('worker_threads').parentPort;
        if (parentPort) {
          parentPort.on('message', handleIncomingMessage);
        }
      } catch (e) {}
    }
  }

  Module.postRun = function () {
    var nnueUrl = Module.locateFile
      ? Module.locateFile('nnue/pikafish-9e20a9a44415.nnue', '')
      : 'nnue/pikafish-9e20a9a44415.nnue';

    fetch(nnueUrl, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.arrayBuffer();
      })
      .then(function (buffer) {
        Module.FS.writeFile('/pikafish-9e20a9a44415.nnue', new Uint8Array(buffer));
        Module.ccall('init_pikafish', 'number', [], []);
        running = true;
        poll();
      })
      .catch(function (error) {
        Module.printErr('NNUE 加载失败: ' + error.message);
        Module.print('info string ERROR NNUE_LOAD_FAILED ' + error.message);
      });
  };
})();
