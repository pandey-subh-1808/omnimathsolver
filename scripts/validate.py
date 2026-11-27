import json
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
solver = (root / "solver-worker.js").read_text(encoding="utf-8")
graph = (root / "graph-worker.js").read_text(encoding="utf-8")
html = (root / "index.html").read_text(encoding="utf-8")

match = re.search(r'const PYTHON_CODE=("(?:\\.|[^"\\])*");\nfunction send', solver, re.S)
if not match:
    raise SystemExit("Could not locate the embedded symbolic-engine Python source.")
python_source = json.loads(match.group(1))
compile(python_source, "solver-worker embedded Python", "exec")
print("PASS: embedded SymPy/Pyodide Python syntax")

for filename in ("solver-worker.js", "graph-worker.js"):
    subprocess.run(["node", "--check", str(root / filename)], check=True)
    print(f"PASS: {filename} JavaScript syntax")

inline = html.rsplit("<script>", 1)[-1].split("</script>", 1)[0]
inline_path = root / ".omnimath-inline-check.js"
try:
    inline_path.write_text(inline, encoding="utf-8")
    subprocess.run(["node", "--check", str(inline_path)], check=True)
    print("PASS: index.html application JavaScript syntax")
finally:
    inline_path.unlink(missing_ok=True)

for required in ("adaptiveCurve", "function analyze", "validateGraphExpression"):
    if required not in graph:
        raise SystemExit(f"Missing graph-worker safeguard: {required}")
print("PASS: graph worker safeguards present")
