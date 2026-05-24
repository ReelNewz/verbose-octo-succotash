"""
/api/query-claude.py — Vercel Python serverless endpoint
Wraps Claude Messages API. Auth: Bearer token matching ADMIN_PASSWORD.
POST body: { "prompt": "...", "model": "...", "max_tokens": 1024 }
"""
import os
import json
import requests
from http.server import BaseHTTPRequestHandler


def query_claude(api_key, prompt, model="claude-opus-4-5", max_tokens=1024):
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    data = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}]
    }
    response = requests.post(url, json=data, headers=headers, timeout=60)
    response.raise_for_status()
    return response.json()


class handler(BaseHTTPRequestHandler):

    def _send(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode())

    def do_OPTIONS(self):
        self._send(200, {})

    def do_POST(self):
        auth = self.headers.get("authorization", "")
        token = auth.replace("Bearer ", "").strip()
        if not token or token != os.environ.get("ADMIN_PASSWORD", ""):
            return self._send(401, {"error": "Unauthorized"})

        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode() or "{}")
        except Exception as e:
            return self._send(400, {"error": f"Bad JSON: {e}"})

        prompt = body.get("prompt", "").strip()
        if not prompt:
            return self._send(400, {"error": "Missing 'prompt' field"})

        model = body.get("model", "claude-opus-4-5")
        max_tokens = int(body.get("max_tokens", 1024))

        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return self._send(500, {"error": "ANTHROPIC_API_KEY not configured"})

        try:
            result = query_claude(api_key, prompt, model=model, max_tokens=max_tokens)
            text = result.get("content", [{}])[0].get("text", "")
            return self._send(200, {
                "text": text,
                "model": result.get("model"),
                "stop_reason": result.get("stop_reason"),
                "usage": result.get("usage", {})
            })
        except requests.HTTPError as e:
            return self._send(e.response.status_code, {
                "error": "Claude API error",
                "detail": e.response.text
            })
        except Exception as e:
            return self._send(500, {"error": str(e)})
