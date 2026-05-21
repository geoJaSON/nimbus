"""
Nimbus sidecar — JSON-RPC 2.0 over stdin/stdout.

Phase 1: alert fetch, LSR parse.
Phase 2: NEXRAD Level II decode (MetPy/Py-ART).
Phase 3: SCIT Level III decode.

During development, invoked directly: python3 sidecar/main.py
For distribution: frozen via PyInstaller into a single executable.
"""

import sys
import json
import logging
from typing import Any

logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("nimbus-sidecar")


def send(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def error_response(id: Any, code: int, message: str) -> dict:
    return {"jsonrpc": "2.0", "id": id, "error": {"code": code, "message": message}}


def dispatch(request: dict) -> dict:
    method = request.get("method", "")
    params = request.get("params", {})
    req_id = request.get("id")

    handlers = {
        "ping": handle_ping,
        "fetch_alerts": handle_fetch_alerts,
        "parse_lsr": handle_parse_lsr,
        "decode_level2": handle_decode_level2,
        "decode_scit": handle_decode_scit,
    }

    handler = handlers.get(method)
    if handler is None:
        return error_response(req_id, -32601, f"Method not found: {method}")

    try:
        result = handler(params)
        return {"jsonrpc": "2.0", "id": req_id, "result": result}
    except Exception as exc:
        log.exception("Handler error for %s", method)
        return error_response(req_id, -32000, str(exc))


def handle_ping(_params: dict) -> dict:
    return {"status": "ok", "version": "0.1.0"}


def handle_fetch_alerts(params: dict) -> dict:
    import urllib.request

    lat = params.get("lat", 29.76)
    lon = params.get("lon", -95.37)
    radius_km = params.get("radius_km", 400)

    url = f"https://api.weather.gov/alerts/active?point={lat},{lon}"
    req = urllib.request.Request(url, headers={"User-Agent": "nimbus-sidecar/0.1"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())

    alerts = []
    for feature in data.get("features", []):
        p = feature.get("properties", {})
        alerts.append({
            "id": p.get("id", ""),
            "event": p.get("event", ""),
            "severity": p.get("severity", "Unknown"),
            "headline": p.get("headline", ""),
            "description": p.get("description", ""),
            "instruction": p.get("instruction", "") or "",
            "issued": p.get("sent", ""),
            "expires": p.get("expires", ""),
            "wfo": p.get("senderName", ""),
            "geometry": feature.get("geometry"),
        })
    return {"alerts": alerts, "count": len(alerts)}


def handle_parse_lsr(params: dict) -> dict:
    # Stub — Phase 1 implementation pending
    wfo = params.get("wfo", "HGX")
    hours_back = params.get("hours_back", 6)
    log.info("LSR parse requested: wfo=%s hours=%d", wfo, hours_back)
    return {"lsrs": [], "note": "LSR parsing not yet implemented"}


def handle_decode_level2(params: dict) -> dict:
    # Stub — Phase 2 implementation
    station = params.get("station", "KHGX")
    log.info("Level II decode requested: %s", station)
    return {"error": "Level II decode available in Phase 2"}


def handle_decode_scit(params: dict) -> dict:
    # Stub — Phase 3 implementation
    station = params.get("station", "KHGX")
    log.info("SCIT decode requested: %s", station)
    return {"cells": [], "note": "SCIT decode available in Phase 3"}


def main() -> None:
    log.info("Nimbus sidecar started")
    send({"jsonrpc": "2.0", "method": "ready", "params": {"version": "0.1.0"}})

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
        except json.JSONDecodeError as exc:
            send(error_response(None, -32700, f"Parse error: {exc}"))
            continue

        response = dispatch(request)
        send(response)


if __name__ == "__main__":
    main()
