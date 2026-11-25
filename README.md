# OmniMath Solver

OmniMath Solver is a browser-based mathematics workbench for scientific calculations, symbolic algebra and calculus.

## Run the project

Open **[index.html](./index.html)** in a modern browser, or enable GitHub Pages from the repository's `main` branch and `/(root)`.

The symbolic engine loads Pyodide and SymPy from their public CDNs, so an internet connection is required on first load. The application runs the symbolic calculations in the browser; it does not send expressions to a separate server.

## Supported commands

| Command | Example |
|---|---|
| Differentiate | `diff(x^3*sin(x), x)` |
| Integrate | `integrate(sin(x), x)` |
| Definite integral | `integrate(sin(x), x, 0, pi)` |
| Solve equations | `solve(x^2 - 5*x + 6 = 0, x)` |
| Limits | `limit(sin(x)/x, x, 0)` |
| Taylor series | `series(exp(x), x, 0, 6)` |
| Simplify / factor / expand | `simplify((x^2-1)/(x-1))` |
| Matrix determinant | `det([[2,1],[5,3]])` |
| Matrix inverse | `inv([[2,1],[5,3]])` |
| Matrix rank / eigenvalues | `rank(Matrix([[1,2],[3,4]]))`, `eigenvals(Matrix([[1,2],[3,4]]))` |

## Notes

- Expressions use standard mathematical notation; use `^` for powers.
- Trigonometric functions use radians.
- Exact symbolic results are preferred when SymPy can determine them.
- Some integrals and equations may remain unevaluated or require assumptions; no computer algebra system can guarantee a closed form for every input.
- The step panel reports the parsed mathematical objects and operations returned by the symbolic engine. It is not a claim that every line is a human-style derivation.

## Technology

- **Pyodide + SymPy:** symbolic mathematics in the browser
- **MathJax:** mathematical typesetting
- **HTML/CSS/JavaScript:** interface and interaction

## Project status

This is an educational project. Verify important results independently before using them in assessed or safety-critical work.
