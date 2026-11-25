# OmniMath Solver

A single-file, browser-only math solver with step-by-step explanations, graphs, a function library and solve history.

## Run locally
Open `index.html` in a browser (needs internet for the CDN scripts: MathJax, math.js, Nerdamer).

## Deploy on GitHub Pages
1. Create a repo and upload `index.html` (and this README).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then Save.
4. Your site appears at `https://<your-username>.github.io/<repo-name>/`.

## Example inputs
- `solve(x^2-5x+6=0, x)`
- `diff(x^3*sin(x), x)`
- `integrate(sin(x), x, 0, pi)`
- `limit(sin(x)/x, x, 0)`
- `det([[2,1],[5,3]])`
