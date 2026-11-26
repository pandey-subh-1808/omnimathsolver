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


### Calculus coverage and limits

- Differentiation: symbolic derivatives through order 12 (`diff(f, x, 4)` displays fourth-order notation); mixed partial derivatives through 12 listed variables (`partial(f, x, y, x)`).
- Integration: indefinite symbolic integration and definite integration using either `integrate(f, x, a, b)` or `integrate(f, (x, a, b))`. Definite integrals may return an exact value or a clearly labelled numerical approximation when the symbolic result remains unevaluated.
- ODEs: `dsolve(...)` supports SymPy's supported equation classes; the app does not guarantee closed-form solutions for every ODE or integral.
- Calculations run in a Web Worker with a timeout so a difficult expression does not freeze the page. A timeout is reported as such; it is not treated as a mathematical answer.
- This is a browser-based SymPy workbench, not a replacement for MATLAB's full symbolic/numeric toolboxes. No CAS can promise closed forms for every expression.
