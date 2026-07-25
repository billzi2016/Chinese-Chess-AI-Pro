#!/usr/bin/env python3
"""
test_server_launch.py - 专门测试 server.py 启动 6324 端口服务及处理请求的能力
"""

import sys
import unittest
import urllib.request
import threading
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import server


class TestServerLaunch(unittest.TestCase):
    """测试 server.py 动态端口绑定、响应 200 及 COOP/COEP 的启动能力"""

    @classmethod
    def setUpClass(cls):
        cls.host = "127.0.0.1"
        cls.port = server.find_first_available_port(cls.host, 6324)

        cls.httpd_started = True
        handler = server.functools.partial(
            server.MultiProcessStaticHandler, directory=str(PROJECT_ROOT)
        )
        cls.httpd = server.ThreadingHTTPServer((cls.host, cls.port), handler)
        cls.server_thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.server_thread.start()
        time.sleep(0.3)

    @classmethod
    def tearDownClass(cls):
        if getattr(cls, "httpd_started", False) and hasattr(cls, "httpd"):
            cls.httpd.shutdown()
            cls.httpd.server_close()

    def test_launch_and_fetch_index(self):
        """测试 6324 端口服务器响应 index.html 200 OK"""
        url = f"http://{self.host}:{self.port}/index.html"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)

    def test_launch_coop_coep_headers(self):
        """测试 6324 端口服务器返回 WASM 跨源隔离响应头"""
        url = f"http://{self.host}:{self.port}/index.html"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            headers = resp.headers
            self.assertEqual(headers.get("Cross-Origin-Opener-Policy"), "same-origin")
            self.assertEqual(headers.get("Cross-Origin-Embedder-Policy"), "require-corp")


if __name__ == "__main__":
    unittest.main(verbosity=2)
