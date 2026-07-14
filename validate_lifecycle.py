import subprocess
import sys
import time

STARTUP_LOG = "server up on port 3000"
SHUTDOWN_LOG = "exiting"
CONTAINER = "node-express-realworld-example-app-api-1"


def run(cmd):
    return subprocess.run(cmd, shell=True,capture_output=True, text=True)


def log(msg):
    print(f"[validate_lifecycle] {msg}")


def main():
    log("Starting containers...")
    result = run("docker compose -f C:\\Users\\marta.biesuz\\dev\\node-express-realworld-example-app\\docker-compose.yml up -d")
    if result.returncode != 0:
        log(f"ERROR: docker compose up failed: {result.stderr}")
        sys.exit(1)

    log("Waiting for startup log...")
    for i in range(40):
        time.sleep(3)
        logs = run(f"docker logs {CONTAINER} 2>&1")
        if STARTUP_LOG in logs.stdout:
            log(f"OK: startup log found after {(i+1)*3}s")
            break
    else:
        log(f"ERROR: startup log not found after 120s")
        run("docker compose -f C:\\Users\\marta.biesuz\\dev\\node-express-realworld-example-app\\docker-compose.yml down")
        sys.exit(1)

    log("Stopping containers...")
    result = run("docker compose -f C:\\Users\\marta.biesuz\\dev\\node-express-realworld-example-app\\docker-compose.yml down")
    if result.returncode != 0:
        log(f"ERROR: docker compose down failed: {result.stderr}")
        sys.exit(1)

    log("Lifecycle validation passed.")
    sys.exit(0)


if __name__ == "__main__":
    main()