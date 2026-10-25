"""Initial Fireball Launcher helper. Only environment status is implemented."""
import argparse
import json
import platform


def main():
    parser = argparse.ArgumentParser(description="Fireball Launcher helper")
    parser.add_argument("--status", action="store_true", help="report Python helper status")
    args = parser.parse_args()
    if not args.status:
        parser.error("Choose --status")
    print(json.dumps({
        "available": True,
        "pythonVersion": platform.python_version(),
        "platform": platform.system().lower(),
        "message": f"Python {platform.python_version()} helper is ready."
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
