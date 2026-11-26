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


## Expanded MATLAB-style mathematics commands

The browser engine is based on Pyodide + SymPy. It now exposes additional symbolic and numerical workflows (availability depends on SymPy's supported problem classes and assumptions):

| Area | Commands and examples |
|---|---|
| Equation solving | `solve(x^2-2=0,x)`, `solveset(x^2-2,x,Reals)`, `nsolve(cos(x)-x,x,0.7)`, `roots(x^3-1,x)` |
| Calculus | `diff(exp(x)*sin(x),x,4)`, `integrate(x^2,x)`, `integrate(sin(x),x,0,pi)`, `nint(exp(-x^2),x,0,1)` |
| Series and sequences | `taylor(exp(x),x,0,8)`, `summation(k^2,(k,1,10))`, `product(k,(k,1,5))` |
| Differential equations | `dsolve(diff(y(x),x,2)+y(x),y(x))`, `pdsolve(diff(u(x,y),x)+diff(u(x,y),y),u(x,y))`, `rsolve(a(n+1)-a(n)-1,a(n))` |
| Transforms | `laplace(t^2,t,s)`, `ilaplace(2/s^3,s,t)`, `fourier(exp(-x^2),x,k)`, `ifourier(F,k,x)` |
| Algebra | `apart(1/((x+1)*(x+2)),x)`, `cancel((x^2-1)/(x-1))`, `trigsimp(sin(x)^2+cos(x)^2)`, `subs(x^2,x,3)` |
| Matrices | `det([[1,2],[3,4]])`, `inv([[1,2],[3,4]])`, `eigenvals([[2,1],[1,2]])`, `rref([[1,2],[2,4]])` |
| Vector calculus | `grad(x^2*y,x,y)`, `divergence([x^2,y^2],x,y)`, `curl([-y,x,0],x,y,z)`, `laplacian(x^2+y^2,x,y)` |
| Special functions | `gamma(x)`, `erf(x)`, `besselj(0,x)`, `zeta(2)`, `LambertW(x)` |

The app is not a complete clone of MATLAB or every MATLAB toolbox. Numerical methods are approximations and must be checked for convergence, singularities, conditioning, and domain assumptions. Some symbolic integrals, PDEs, nonlinear systems, and ODEs may remain unevaluated or require additional initial/boundary conditions.
