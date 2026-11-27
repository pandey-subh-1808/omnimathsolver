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


## Expanded symbolic command coverage

The browser solver exposes the following commands where SymPy can solve the supplied problem class:

| Area | Commands and examples |
|---|---|
| Equation solving | `solve(x^2-2=0,x)`, `solveset(x^2-2,x,Reals)`, `nsolve(cos(x)-x,x,0.7)`, `roots(x^3-1,x)` |
| Calculus | `diff(exp(x)*sin(x),x,4)`, `partial(x^2*y,x,y)`, `integrate(x^2,x)`, `integrate(sin(x),x,0,pi)`, `nint(exp(-x^2),x,0,1)` |
| Series and sequences | `series(exp(x),x,0,8)`, `taylor(exp(x),x,0,8)`, `summation(k^2,(k,1,10))`, `product(k,(k,1,5))` |
| Differential equations | `dsolve(diff(y(x),x,2)+y(x),y(x))`, `pdsolve(diff(u(x,y),x)+diff(u(x,y),y),u(x,y))`, `rsolve(a(n+1)-a(n)-1,a(n))` |
| Transforms | `laplace(t^2,t,s)`, `ilaplace(2/s^3,s,t)`, `fourier(exp(-x^2),x,k)`, `ifourier(F,k,x)` |
| Algebra and special functions | `apart(1/((x+1)*(x+2)),x)`, `cancel((x^2-1)/(x-1))`, `trigsimp(sin(x)^2+cos(x)^2)`, `subs(x^2,x,3)`, `gamma(x)`, `erf(x)`, `besselj(0,x)`, `zeta(2)`, `LambertW(x)` |
| Matrices | `det([[1,2],[3,4]])`, `inv([[1,2],[3,4]])`, `eigenvals([[2,1],[1,2]])`, `eigenvects([[2,1],[1,2]])`, `rref([[1,2],[2,4]])` |
| Vector calculus | `grad(x^2*y,x,y)`, `divergence([x^2,y^2],x,y)`, `curl([-y,x,0],x,y,z)`, `laplacian(x^2+y^2,x,y)`, `jacobian([x*y,x+y],x,y)`, `hessian(x^2+y^2,x,y)`, `dot([1,2,3],[4,5,6])`, `cross([1,0,0],[0,1,0])` |

## Graphing and numerical analysis

- 2D Cartesian and implicit curves, polar curves, explicit 3D surfaces, 3D parametric curves and surfaces, implicit 3D surfaces, cylindrical and spherical surfaces, and 3D vector fields.
- Expensive graph sampling and numerical curve analysis execute in dedicated Web Workers. 2D explicit curves use adaptive subdivision; 3D surfaces and implicit volumes use bounded fixed grids to control memory and rendering time.
- Numerical 2D analysis includes roots, pairwise intersections, critical-point candidates, inflection candidates, tangent/normal estimates, signed area, and heuristic asymptote candidates.
- Numerical results are approximations. Tangential roots/intersections, closely spaced features, singularities, discontinuities and highly oscillatory functions can still evade finite sampling. The app reports sampling/convergence caveats rather than claiming proof.

## Safety, performance and known boundaries

- Expressions are deliberately bounded by length, token count, nesting depth, exponent size, result size and symbolic-operation complexity. These limits protect the browser; they are not mathematical guarantees.
- Matrix operations are limited to 8 × 8. ODE order is limited to 6; ordinary derivatives and mixed partials are limited to 12; series order is limited to 20.
- Numerical integration is accepted only when two working precisions agree within a tolerance. This check is evidence of numerical stability, not a proof of accuracy; singular and oscillatory integrals need special treatment.
- The previous-answer token `Ans` uses the last result in the current page session. Calculation history is stored locally in this browser and can be cleared from the History section.
- The symbolic engine and graphing libraries are downloaded from public CDNs. First load and graphing require an internet connection; fully offline operation is not currently supported.
- Initial/boundary-value ODE/PDE workflows, symbolic assumptions, units, certified root isolation, rigorous interval arithmetic, adaptive 3D meshing and guaranteed convergence are not implemented. Some PDEs, recurrences, nonlinear systems, transforms and integrals may remain unevaluated.
- This educational workbench is not a complete MATLAB clone or a replacement for MATLAB's toolboxes. Independently verify important results before using them in assessed or safety-critical work.
