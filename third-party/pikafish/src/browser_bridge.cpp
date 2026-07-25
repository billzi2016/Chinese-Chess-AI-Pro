/*
  Browser entry points for the vendored Pikafish WebAssembly build.
  The engine, search, move generation and NNUE implementation remain upstream Pikafish.
*/

#ifdef __EMSCRIPTEN__

#include <emscripten/emscripten.h>

#include <memory>
#include <string>

#include "attacks.h"
#include "misc.h"
#include "position.h"
#include "tune.h"
#include "uci.h"

namespace {

std::unique_ptr<Stockfish::UCIEngine> browserEngine;

}

extern "C" {

EMSCRIPTEN_KEEPALIVE int init_pikafish() {
    if (browserEngine)
        return 0;

    Stockfish::Attacks::init();
    Stockfish::Position::init();

    auto cli      = Stockfish::CommandLine(0, nullptr);
    browserEngine = std::make_unique<Stockfish::UCIEngine>(std::move(cli));
    Stockfish::Tune::init(browserEngine->engine_options());
    return 0;
}

EMSCRIPTEN_KEEPALIVE int uci_command(const char* command) {
    if (!browserEngine || !command)
        return 1;
    browserEngine->execute(command);
    return 0;
}

EMSCRIPTEN_KEEPALIVE int pikafish_validate_move(const char* fen, const char* move) {
    if (!browserEngine || !fen || !move)
        return 0;
    return browserEngine->validate_move(fen, move) ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE unsigned long long pikafish_legal_move_count(const char* fen) {
    if (!browserEngine || !fen)
        return 0;
    return browserEngine->legal_move_count(fen);
}

}

#endif
