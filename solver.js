const $ = id => document.getElementById(id);
let last = null, lastAns = '0', memVal = 0;

window.addEventListener('DOMContentLoaded', () => {
  const st = $('cas-status');
  if (typeof nerdamer === 'undefined') {
    st.textContent = 'Fallback Mode';
    st.classList.add('warn');
  } else {
    st.textContent = 'CAS Engine Active';
  }
  initUI();
});

const EXAMPLES = [
  ['Product Rule (x*y)', 'diff(x*y, x)'],
  ['Chain + Product', 'diff(x^3 * sin(x^2 + 1), x)'],
  ['Quotient Rule', 'diff((x^2 + 1) / ln(x), x)'],
  ['Log Diff (x^x)', 'diff(x^x, x)'],
  ['Partial ∂f/∂x', 'partial(x^3*y^2 + sin(x*y), x)'],
  ['Mixed Partial ∂²f/∂x∂y', 'partial(x^3*y^2 + e^(x*y), x, y)'],
  ['Gradient ∇f', 'grad(x^2*y + y*z^3, x, y, z)'],
  ['Logarithms', 'log(1024, 2) + log10(1000) + ln(e^4)'],
  ['Integral acos(x)', 'integrate(acos(x), x)'],
  ['Taylor Series', 'taylor(sin(x), x, 0, 7)'],
  ['Laplace Transform', 'laplace(t^2 * e^(-3*t), t, s)'],
  ['Definite Integral', 'integrate(sin(x), x, 0, pi)'],
  ['Solve Equation', 'solve(x^2 - 5x + 6 = 0, x)'],
  ['Limit', 'limit(sin(x)/x, x, 0)']
];

const SYMS = [
  ['d/dx', 'diff('], ['∂/∂x', 'partial('], ['∇f', 'grad('], ['∫ dx', 'integrate('],
  ['∫ₐᵇ', 'integrate(f, x, 0, 1)'], ['lim', 'limit('], ['Taylor', 'taylor('],
  ['Laplace', 'laplace('], ['Implicit', 'implicit('], ['LogExpand', 'logexpand('],
  ['Solve', 'solve('], ['Matrix', '[[1,2],[3,4]]']
];

const KEYS = [
  {l:'MC',v:'MC',cls:'mem'},{l:'MR',v:'MR',cls:'mem'},{l:'M+',v:'M+',cls:'mem'},{l:'M-',v:'M-',cls:'mem'},{l:'Ans',v:'Ans',cls:'op'},
  {l:'(',v:'('},{l:')',v:')'},{l:'π',v:'pi'},{l:'e',v:'e'},{l:'i',v:'i'},{l:'∞',v:'Infinity'},
  {l:'x²',v:'^2'},{l:'x³',v:'^3'},{l:'xʸ',v:'^',cls:'op'},{l:'√',v:'sqrt('},{l:'³√',v:'cbrt('},{l:'ⁿ√',v:'nthRoot('},
  {l:'ln',v:'ln(',cls:'op'},{l:'log₁₀',v:'log10(',cls:'op'},{l:'log₂',v:'log2(',cls:'op'},{l:'log_b',v:'log(x, b)',cls:'op'},{l:'eˣ',v:'exp('},{l:'10ˣ',v:'10^'},
  {l:'sin',v:'sin('},{l:'cos',v:'cos('},{l:'tan',v:'tan('},{l:'sin⁻¹',v:'asin('},{l:'cos⁻¹',v:'acos('},{l:'tan⁻¹',v:'atan('},
  {l:'sec',v:'sec('},{l:'csc',v:'csc('},{l:'cot',v:'cot('},{l:'deg',v:' deg'},{l:'rad',v:' rad'},{l:'atan2',v:'atan2('},
  {l:'sinh',v:'sinh('},{l:'cosh',v:'cosh('},{l:'tanh',v:'tanh('},{l:'asinh',v:'asinh('},{l:'acosh',v:'acosh('},{l:'atanh',v:'atanh('},
  {l:'n!',v:'!',cls:'op'},{l:'|x|',v:'abs('},{l:'⌊x⌋',v:'floor('},{l:'⌈x⌉',v:'ceil('},{l:'mod',v:'mod('},{l:'EE',v:'e'},
  {l:'nCr',v:'combinations('},{l:'nPr',v:'permutations('},{l:'gcd',v:'gcd('},{l:'lcm',v:'lcm('},{l:'Γ(x)',v:'gamma('},{l:'erf',v:'erf('},
  {l:'det',v:'det(',cls:'adv'},{l:'inv',v:'inv(',cls:'adv'},{l:'eigs',v:'eigs(',cls:'adv'},{l:'rref',v:'rref(',cls:'adv'},{l:'dot',v:'dot(',cls:'adv'},{l:'cross',v:'cross(',cls:'adv'}
];

function splitTop(s) {
  let d = 0, o = [], c = '';
  for (const ch of s) {
    if ('([{'.includes(ch)) d++;
    if (')]}'.includes(ch)) d--;
    if (ch === ',' && d === 0) { o.push(c.trim()); c = ''; }
    else c += ch;
  }
  o.push(c.trim());
  return o;
}

function norm(s) {
  s = s.trim().replace(/\blog\s*\(([^(),]+),\s*([^()]+)\)/g, '(log($1)/log($2))');
  return s.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/θ/g, 'theta')
          .replace(/∞/g, 'Infinity').replace(/√\(/g, 'sqrt(').replace(/\bln\(/g, 'log(')
          .replace(/\blog10\(/g, '(log(10)^(-1))*log(').replace(/\blog2\(/g, '(log(2)^(-1))*log(')
          .replace(/²/g, '^2').replace(/³/g, '^3').replace(/−/g, '-').replace(/\bAns\b/g, `(${lastAns})`);
}

function normNumeric(s) {
  return s.trim().replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/θ/g, 'theta')
          .replace(/∞/g, 'Infinity').replace(/√\(/g, 'sqrt(').replace(/\bln\(/g, 'log(')
          .replace(/²/g, '^2').replace(/³/g, '^3').replace(/−/g, '-').replace(/\bAns\b/g, `(${lastAns})`);
}

function tex(s) {
  const str = String(s);
  try { if (typeof nerdamer !== 'undefined') return nerdamer(str).toTeX(); } catch (e) {}
  try { return math.parse(str).toTex(); } catch (e2) { return '\\text{' + str.replace(/[{}\\_^%#&$]/g, ' ') + '}'; }
}

function vars(s) {
  const set = new Set();
  try {
    const root = math.parse(s);
    const fnNames = new Set();
    root.traverse(n => { if (n.isFunctionNode && n.fn && n.fn.name) fnNames.add(n.fn.name); });
    root.traverse(n => {
      if (n.isSymbolNode && !fnNames.has(n.name) && !['pi', 'e', 'i', 'Infinity', 'tau', 'phi', 'deg', 'rad'].includes(n.name)) {
        set.add(n.name);
      }
    });
  } catch (e) {}
  return [...set];
}

function fmt(x) {
  try { return math.format(x, { precision: 10 }); } catch (e) { return String(x); }
}

function fnOf(expr, v) {
  const c = math.compile(normNumeric(expr));
  return x => {
    try { const y = c.evaluate({ [v]: x }); return typeof y === 'number' ? y : NaN; }
    catch (e) { return NaN; }
  };
}

function symDiff(expr, v) {
  if (typeof nerdamer !== 'undefined') {
    const out = nerdamer.diff(expr, v).toString();
    if (out && !/Error/i.test(out)) return out;
  }
  return math.derivative(expr, v).toString();
}

function diffSteps(f, v) {
  const st = [], T = tex, D = z => symDiff(z, v);
  let n;
  try { n = math.parse(f); } catch (e) { return []; }
  while (n.isParenthesisNode) n = n.content;
  const hasVar = (node, target) => vars(node.toString()).includes(target);

  if (!hasVar(n, v)) {
    st.push(['<span class="rule-badge">Constant Rule</span> Derivative w.r.t. \\(' + v + '\\) of an expression without \\(' + v + '\\) is \\(0\\):', '\\frac{d}{d' + v + '}\\left[' + T(f) + '\\right]=0']);
    return st;
  }

  if (n.isOperatorNode && n.args.length === 2) {
    const [A, B] = n.args, a = A.toString(), b = B.toString();
    const depA = hasVar(A, v), depB = hasVar(B, v);
    const da = depA ? D(a) : '0', db = depB ? D(b) : '0', o = n.op;

    if (o === '+' || o === '-') {
      st.push(['<span class="rule-badge">Sum / Difference Rule</span> \\((u\\pm w)\\prime = u\\prime \\pm w\\prime\\)', 'u=' + T(a) + ',\\quad w=' + T(b)]);
      st.push(['Differentiate each term:', 'u\\prime=' + T(da) + ',\\quad w\\prime=' + T(db)]);
    } else if (o === '*' && depA && depB) {
      st.push(['<span class="rule-badge">Product Rule</span> \\((u\\cdot w)\\prime = u\\prime w + u\\,w\\prime\\)', 'u=' + T(a) + ',\\quad w=' + T(b)]);
      st.push(['Differentiate each factor:', 'u\\prime=' + T(da) + ',\\quad w\\prime=' + T(db)]);
      st.push(['Substitute into product rule:', '(' + T(da) + ')(' + T(b) + ') + (' + T(a) + ')(' + T(db) + ')']);
    } else if (o === '*') {
      const c = depA ? b : a, u = depA ? a : b;
      st.push(['<span class="rule-badge">Constant Multiple Rule</span> \\((c\\cdot u)\\prime = c\\,u\\prime\\)', 'c=' + T(c) + ',\\quad u=' + T(u) + ',\\quad u\\prime=' + T(D(u))]);
    } else if (o === '/' && depB) {
      st.push(['<span class="rule-badge">Quotient Rule</span> \\(\\left(\\tfrac{u}{w}\\right)\\prime = \\tfrac{u\\prime w - u\\,w\\prime}{w^2}\\)', 'u=' + T(a) + ',\\quad w=' + T(b)]);
      st.push(['Differentiate numerator and denominator:', 'u\\prime=' + T(da) + ',\\quad w\\prime=' + T(db)]);
      st.push(['Apply quotient rule:', '\\frac{(' + T(da) + ')(' + T(b) + ') - (' + T(a) + ')(' + T(db) + ')}{(' + T(b) + ')^2}']);
    } else if (o === '/') {
      st.push(['<span class="rule-badge">Constant Divisor</span>', '\\frac{1}{' + T(b) + '}\\cdot (' + T(da) + ')']);
    } else if (o === '^' && depA && !depB) {
      const isComp = !A.isSymbolNode;
      st.push([isComp ? '<span class="rule-badge">Power + Chain Rule</span> \\((u^n)\\prime = n\\,u^{n-1}\\,u\\prime\\)' : '<span class="rule-badge">Power Rule</span> \\((' + v + '^n)\\prime = n\\,' + v + '^{n-1}\\)', 'u=' + T(a) + ',\\quad n=' + T(b) + (isComp ? ',\\quad u\\prime=' + T(da) : '')]);
    } else if (o === '^' && !depA && depB) {
      st.push(['<span class="rule-badge">Exponential Rule</span> \\((a^u)\\prime = a^u\\ln(a)\\cdot u\\prime\\)', 'a=' + T(a) + ',\\quad u=' + T(b) + ',\\quad u\\prime=' + T(db)]);
    } else if (o === '^' && depA && depB) {
      st.push(['<span class="rule-badge">Logarithmic Differentiation</span>', '(u^w)\\prime = u^w\\left(w\\prime\\ln u + \\tfrac{w\\,u\\prime}{u}\\right)']);
    }
  } else if (n.isFunctionNode && n.args.length === 1) {
    const g = n.args[0], gs = g.toString(), nm = n.fn.name;
    if (g.isSymbolNode && g.name === v) {
      st.push(['<span class="rule-badge">Standard Derivative</span>', '\\frac{d}{d' + v + '}' + T(f) + '=' + T(D(f))]);
    } else if (hasVar(g, v)) {
      const outerTex = nm === 'log' ? '\\ln(u)' : T(nm + '(u)');
      const outerDeriv = nm === 'log' ? '\\frac{1}{u}' : T(symDiff(nm + '(zz)', 'zz')).replace(/zz/g, 'u');
      st.push(['<span class="rule-badge">Chain Rule</span> \\(\\tfrac{d}{d' + v + '}f(g) = f\\prime(g)\\cdot g\\prime\\)', 'f(u)=' + outerTex + ',\\quad u=' + T(gs)]);
      st.push(['Outer and inner derivatives:', 'f\\prime(u)=' + outerDeriv + ',\\quad g\\prime(' + v + ')=' + T(D(gs))]);
    }
  }
  return st;
}

function doDiff(a) {
  const f = a[0], v = a[1] || vars(f)[0] || 'x';
  const r = symDiff(f, v);
  const st = [['Differentiate with respect to \\(' + v + '\\):', '\\frac{d}{d' + v + '}\\left[' + tex(f) + '\\right]'], ...diffSteps(f, v)];
  st.push(['Simplified result:', '\\frac{d}{d' + v + '}\\left[' + tex(f) + '\\right]=' + tex(r)]);
  return { answer: tex(r), steps: st, plot: { fns: [{ f: fnOf(f, v), c: '#3b82f6', l: 'f(' + v + ')' }, { f: fnOf(r, v), c: '#f97316', l: 'f′(' + v + ')' }] }, plain: r };
}

function doPartial(a, isGrad = false) {
  const f = a[0], V = a.slice(1).filter(Boolean);
  if (!V.length) V.push(vars(f)[0] || 'x');
  const st = [];
  if (isGrad) {
    const G = V.map(v => symDiff(f, v));
    G.forEach((g, i) => st.push(['Partial w.r.t. \\(' + V[i] + '\\):', '\\frac{\\partial}{\\partial ' + V[i] + '}\\left[' + tex(f) + '\\right]=' + tex(g)]));
    return { answer: '\\nabla f = \\left(' + G.map(tex).join(',\\ ') + '\\right)', steps: st, plot: null, plain: '(' + G.join(', ') + ')' };
  }
  let r = f;
  V.forEach(v => { const nxt = symDiff(r, v); st.push(['Differentiate w.r.t. \\(' + v + '\\):', '\\frac{\\partial}{\\partial ' + v + '}\\left[' + tex(r) + '\\right]=' + tex(nxt)]); r = nxt; });
  const num = V.length > 1 ? '\\partial^{' + V.length + '}f' : '\\partial f';
  const den = V.map(v => '\\partial ' + v).join('\\,');
  return { answer: '\\frac{' + num + '}{' + den + '}=' + tex(r), steps: st, plot: null, plain: r };
}

function tryCustomIntegrate(f, v) {
  let n;
  try { n = math.parse(f); } catch (e) { return null; }
  while (n.isParenthesisNode) n = n.content;
  if (n.isFunctionNode && n.args.length === 1 && n.args[0].isSymbolNode && n.args[0].name === v) {
    const fn = n.fn.name;
    if (fn === 'acos') return { F: `${v}*acos(${v}) - sqrt(1 - (${v})^2)`, rule: `Integration by parts: \\(\\int \\cos^{-1}(${v})\\,d${v} = ${v}\\cos^{-1}(${v}) - \\sqrt{1-${v}^2}+C\\)` };
    if (fn === 'asin') return { F: `${v}*asin(${v}) + sqrt(1 - (${v})^2)`, rule: `Integration by parts: \\(\\int \\sin^{-1}(${v})\\,d${v} = ${v}\\sin^{-1}(${v}) + \\sqrt{1-${v}^2}+C\\)` };
    if (fn === 'atan') return { F: `${v}*atan(${v}) - (1/2)*log(1 + (${v})^2)`, rule: `Integration by parts: \\(\\int \\tan^{-1}(${v})\\,d${v} = ${v}\\tan^{-1}(${v}) - \\tfrac{1}{2}\\ln(1+${v}^2)+C\\)` };
    if (fn === 'log') return { F: `${v}*log(${v}) - ${v}`, rule: `Integration by parts: \\(\\int \\ln(${v})\\,d${v} = ${v}\\ln(${v}) - ${v}+C\\)` };
  }
  return null;
}

function doInt(a) {
  const f = a[0], v = (a[1] && isNaN(+a[1]) && /^[a-z]\w*$/i.test(a[1])) ? a[1] : (vars(f)[0] || 'x');
  const definite = a.length >= 4;
  const st = [['Integral setup:', '\\int ' + tex(f) + '\\,d' + v]];
  let F = null;
  const custom = tryCustomIntegrate(f, v);
  if (custom) { F = custom.F; st.push(['<span class="rule-badge">By Parts</span> ' + custom.rule, '']); }
  else { try { F = nerdamer.integrate(f, v).toString(); if (/integrate\(/.test(F)) F = null; } catch (e) { F = null; } }
  if (!definite) {
    if (!F) throw new Error('No closed-form antiderivative found.');
    st.push(['Antiderivative:', '\\int ' + tex(f) + '\\,d' + v + '=' + tex(F) + '+C']);
    return { answer: tex(F) + '+C', steps: st, plot: { fns: [{ f: fnOf(f, v), c: '#3b82f6', l: 'f' }, { f: fnOf(F, v), c: '#f97316', l: 'F' }] }, plain: F + ' + C' };
  }
  const lo = a[2], hi = a[3];
  const loN = math.evaluate(normNumeric(lo)), hiN = math.evaluate(normNumeric(hi));
  const h = (hiN - loN) / 2000, g = fnOf(f, v);
  let s = g(loN) + g(hiN);
  for (let i = 1; i < 2000; i++) s += g(loN + i * h) * (i % 2 ? 4 : 2);
  const num = s * h / 3;
  return { answer: fmt(num), steps: [...st, ['Numerical integral:', fmt(num)]], plot: { fns: [{ f: g, c: '#3b82f6', l: 'f' }], shade: [loN, hiN] }, plain: fmt(num) };
}

function doSolve(eq, vv) {
  const parts = eq.split('=');
  const f = `(${parts[0]})-(${parts[1] || '0'})`, v = vv || vars(f)[0] || 'x';
  const sols = splitTop(nerdamer.solve(f + '=0', v).toString().replace(/^\[|\]$/g, '')).filter(Boolean);
  if (!sols.length) throw new Error('No solution found.');
  return { answer: sols.map((s, i) => v + '_{' + (i + 1) + '}=' + tex(s)).join(',\\ '), steps: [['Solutions:', sols.join(', ')]], plot: null, plain: sols.join(', ') };
}

function doLimit(a) {
  const f = a[0], v = a[1] || vars(f)[0] || 'x', pt = a[2] || '0';
  const val = nerdamer(`limit(${f},${v},${pt})`).toString();
  return { answer: tex(val), steps: [['Limit:', '\\lim_{' + v + '\\to ' + tex(pt) + '}' + tex(f) + '=' + tex(val)]], plot: null, plain: val };
}

function doTaylor(a) {
  const f = a[0], v = a[1] || vars(f)[0] || 'x', pt = a[2] || '0', deg = parseInt(a[3] || '5', 10);
  const p0 = math.evaluate(normNumeric(pt)), terms = [];
  let cur = f;
  for (let k = 0; k <= deg; k++) {
    const val = nerdamer(cur, { [v]: String(p0) }).evaluate().toString();
    if (val !== '0') terms.push(k === 0 ? val : `(${val}/${math.factorial(k)})*(${v}-(${p0}))^${k}`);
    if (k < deg) cur = symDiff(cur, v);
  }
  const poly = nerdamer(terms.join('+') || '0').expand().toString();
  return { answer: tex(poly), steps: [['Taylor polynomial:', tex(poly)]], plot: null, plain: poly };
}

function doLaplace(a, inv = false) {
  const f = a[0], v = a[1] || (inv ? 's' : 't'), w = a[2] || (inv ? 't' : 's');
  const res = nerdamer(inv ? `ilt(${f}, ${v}, ${w})` : `laplace(${f}, ${v}, ${w})`).toString();
  return { answer: tex(res), steps: [['Transform:', tex(res)]], plot: null, plain: res };
}

function doGeneral(raw, s) {
  try {
    const r0 = math.evaluate(normNumeric(raw));
    if (r0 !== undefined && typeof r0 !== 'function') {
      const p = fmt(r0);
      return { answer: tex(p), steps: [['Evaluated:', tex(p)]], plot: null, plain: p };
    }
  } catch (e) {}
  const r = nerdamer(`simplify(${s})`).toString();
  return { answer: tex(r), steps: [['Simplified:', tex(r)]], plot: null, plain: r };
}

function solveProblem(raw) {
  const s = norm(raw);
  const m = s.match(/^(diff|derivative|partial|pdiff|grad|integrate|int|solve|limit|lim|taylor|laplace|ilaplace)\s*\(([\s\S]*)\)$/i);
  if (m) {
    const k = m[1].toLowerCase(), a = splitTop(m[2]);
    if (k === 'diff' || k === 'derivative') return doDiff(a);
    if (k === 'partial' || k === 'pdiff') return doPartial(a, false);
    if (k === 'grad') return doPartial(a, true);
    if (k === 'integrate' || k === 'int') return doInt(a);
    if (k === 'solve') return doSolve(a[0], a[1]);
    if (k === 'limit' || k === 'lim') return doLimit(a);
    if (k === 'taylor') return doTaylor(a);
    if (k === 'laplace') return doLaplace(a, false);
    if (k === 'ilaplace') return doLaplace(a, true);
  }
  if (s.includes('=')) return doSolve(s);
  return doGeneral(raw, s);
}

async function render(res) {
  lastAns = res.plain;
  const out = $('out');
  let h = '<div class="card"><div class="ans"><div class="lbl">Final Result</div><div style="font-size:1.2rem">\\[' + res.answer + '\\]</div></div><div class="lbl">Steps</div>';
  res.steps.forEach((s, i) => { h += '<div class="step"><span class="n">' + (i + 1) + '</span><div>' + s[0] + (s[1] ? '<div>\\[' + s[1] + '\\]</div>' : '') + '</div></div>'; });
  h += '</div>';
  out.innerHTML = h;
  last = res;
  try { await MathJax.typesetPromise([out]); } catch (e) {}
}

function run() {
  const v = $('in').value.trim();
  if (!v) return;
  try { render(solveProblem(v)); }
  catch (e) { $('out').innerHTML = '<div class="card err-box">' + e.message + '</div>'; }
}

function insertText(val) {
  const t = $('in'), a = t.selectionStart, z = t.selectionEnd;
  if (['MC', 'MR', 'M+', 'M-'].includes(val)) {
    const cur = parseFloat(lastAns) || 0;
    if (val === 'MC') memVal = 0;
    if (val === 'M+') memVal += cur;
    if (val === 'M-') memVal -= cur;
    if (val === 'MR') insertText(String(memVal));
    $('mem-ind').textContent = memVal !== 0 ? `M = ${memVal}` : '';
    return;
  }
  t.value = t.value.slice(0, a) + val + t.value.slice(z);
  t.focus(); t.setSelectionRange(a + val.length, a + val.length);
}

function initUI() {
  $('go').onclick = run;
  $('clr').onclick = () => { $('in').value = ''; $('out').innerHTML = ''; };
  $('bksp').onclick = () => { const t = $('in'), a = t.selectionStart; if (a > 0) { t.value = t.value.slice(0, a - 1) + t.value.slice(a); t.setSelectionRange(a - 1, a - 1); } };
  $('toggle-pad').onclick = () => { const p = $('pad-wrap'); p.hidden = !p.hidden; };
  $('theme').onclick = () => { const r = document.documentElement; r.setAttribute('data-theme', r.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); };
  SYMS.forEach(([l, v]) => { const b = document.createElement('button'); b.className = 'btn chip'; b.textContent = l; b.onclick = () => insertText(v); $('syms').appendChild(b); });
  KEYS.forEach(k => { const b = document.createElement('button'); b.className = 'btn ' + (k.cls || ''); b.textContent = k.l; b.onclick = () => insertText(k.v); $('keys').appendChild(b); });
  EXAMPLES.forEach(([l, v]) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = l; b.onclick = () => { $('in').value = v; run(); }; $('ex').appendChild(b); });
  ['Solver'].forEach(t => { const b = document.createElement('button'); b.className = 'tab on'; b.textContent = t; $('tabs').appendChild(b); });
}
