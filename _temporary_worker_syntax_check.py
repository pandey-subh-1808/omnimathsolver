
import re as regex
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor, function_exponentiation
x,y,z,t,s,a,b,c,n = sp.symbols('x y z t s a b c n')
TRANS = standard_transformations + (implicit_multiplication_application, convert_xor, function_exponentiation)
# Deliberately small parser namespace: never expose the entire SymPy module.
LOCALS = {
    'pi':sp.pi, 'e':sp.E, 'ln':sp.log, 'log':sp.log, 'log10':lambda q:sp.log(q,10),
    'sin':sp.sin, 'cos':sp.cos, 'tan':sp.tan, 'asin':sp.asin, 'acos':sp.acos, 'atan':sp.atan,
    'sinh':sp.sinh, 'cosh':sp.cosh, 'tanh':sp.tanh, 'exp':sp.exp, 'sqrt':sp.sqrt,
    'abs':sp.Abs, 'Abs':sp.Abs, 'factorial':sp.factorial, 'Matrix':sp.Matrix,
    'sec':sp.sec, 'csc':sp.csc, 'cot':sp.cot, 'acot':sp.acot, 'asec':sp.asec, 'acsc':sp.acsc,
    'gamma':sp.gamma, 'erf':sp.erf, 'erfc':sp.erfc, 'zeta':sp.zeta, 'besselj':sp.besselj, 'bessely':sp.bessely,
    'besseli':sp.besseli, 'besselk':sp.besselk, 'LambertW':sp.LambertW, 'floor':sp.floor, 'ceiling':sp.ceiling,
    'min':sp.Min, 'max':sp.Max, 'sign':sp.sign, 'conjugate':sp.conjugate, 're':sp.re, 'im':sp.im,
    'summation':sp.summation, 'product':sp.product, 'laplace':sp.laplace_transform, 'ilaplace':sp.inverse_laplace_transform,
    'fourier':sp.fourier_transform, 'ifourier':sp.inverse_fourier_transform,
    'Ans':sp.Integer(0), 'I':sp.I, 'oo':sp.oo, 'zoo':sp.zoo, 'nan':sp.nan, 'Reals':sp.S.Reals, 'Complexes':sp.S.Complexes, 'Naturals':sp.S.Naturals, 'Integers':sp.S.Integers
}
SAFE_GLOBALS = {'Symbol':sp.Symbol,'Integer':sp.Integer,'Float':sp.Float,'Rational':sp.Rational,'Function':sp.Function,'__builtins__':{}}
ALLOWED_CALLS = {'dsolve','diff','partial','integrate','solve','limit','series','simplify','factor','expand',
                 'det','inv','rank','eigenvals','grad','sin','cos','tan','asin','acos','atan',
                 'sinh','cosh','tanh','exp','sqrt','log','ln','log10','abs','Abs','factorial','Matrix',
                 'sec','csc','cot','acot','asec','acsc','gamma','erf','erfc','zeta','besselj','bessely','besseli','besselk','LambertW',
                 'floor','ceiling','min','max','sign','conjugate','re','im','summation','product','laplace','ilaplace','fourier','ifourier',
                 'nsolve','solveset','roots','apart','cancel','trigsimp','subs','rref','eigenvects','dot','cross','divergence','curl','laplacian','jacobian','hessian','taylor','nint','pdsolve','rsolve'}
def normalize_math(q):
    # Accept common Unicode math symbols pasted from notes/keyboards.
    q=str(q).translate(str.maketrans({'⁰':'^0','¹':'^1','²':'^2','³':'^3','⁴':'^4','⁵':'^5','⁶':'^6','⁷':'^7','⁸':'^8','⁹':'^9','−':'-','–':'-','×':'*','÷':'/','π':'pi','·':'*'}))
    return q

def validate_input(q):
    q=normalize_math(q)
    if len(q)>320: raise ValueError("Expression is too long (maximum 320 characters).")
    if any(token in q for token in ('__',"'",'"',';','{','}','\\',':')):
        raise ValueError("Unsupported syntax. Enter a mathematical expression, not Python code.")
    if regex.search(r'\.[A-Za-z_]',q):
        raise ValueError("Attribute access is not supported.")
    if not regex.fullmatch(r'[A-Za-z0-9_+*/^().,\[\]=\s-]+',q):
        raise ValueError("Unsupported character in expression.")
    if len(regex.findall(r'[A-Za-z][A-Za-z0-9_]*|\d+|[^\s]',q))>120:
        raise ValueError("Expression is too complex (maximum 120 tokens).")
    if q.count('(')!=q.count(')') or q.count('[')!=q.count(']'):
        raise ValueError("Check the brackets.")
    depth=0
    for ch in q:
        if ch in '([':
            depth+=1
            if depth>16: raise ValueError("Expression nesting is too deep (maximum 16 levels).")
        elif ch in ')]':
            depth-=1
            if depth<0: raise ValueError("Check the brackets.")
    if depth: raise ValueError("Check the brackets.")
    for name in regex.findall(r'\b([A-Za-z][A-Za-z0-9_]*)\s*\(',q):
        if name not in ALLOWED_CALLS: raise ValueError("Function '"+name+"' is not supported.")
    for number in regex.findall(r'\b\d+\b',q):
        if len(number)>12: raise ValueError("Numeric literals are limited to 12 digits.")
    for power in regex.findall(r'(?:\^|\*\*)\s*(\d+)',q):
        if int(power)>20: raise ValueError("Powers above 20 are blocked to prevent excessive symbolic expansion.")
def P(q):
    q=normalize_math(q).strip()
    if not q: raise ValueError("Enter an expression.")
    validate_input(q)
    return parse_expr(q, local_dict=LOCALS, global_dict=SAFE_GLOBALS, transformations=TRANS, evaluate=True)
def guard_complexity(expr,limit=120):
    if sp.count_ops(expr)>limit:
        raise ValueError("This expression is too complex for a safe symbolic operation. Simplify it or split it into smaller steps.")
def latex(q): return sp.latex(q)
def run(q):
    q=normalize_math(q).strip()
    validate_input(q)
    # Friendly first-order ODE shorthand: dsolve(diff(u,x)) = sin(x)
    shorthand=regex.match(r'^dsolve\s*\(\s*diff\s*\(\s*([A-Za-z]\w*)\s*,\s*([A-Za-z]\w*)\s*(?:,\s*([1-6])\s*)?\)\s*\)(?:\s*=\s*(.+))?$',q,regex.S)
    if shorthand:
        fname,varname,order_text,rhs_text=shorthand.groups()
        ode_order=int(order_text or 1)
        rhs_text=rhs_text or '0'
        independent=sp.Symbol(varname)
        dependent=sp.Function(fname)
        function=dependent(independent)
        local=dict(LOCALS)
        local[varname]=independent
        rhs=parse_expr(rhs_text,local_dict=local,global_dict=SAFE_GLOBALS,transformations=TRANS,evaluate=True)
        guard_complexity(rhs)
        equation=sp.Eq(sp.diff(function,independent,ode_order),rhs)
        solution=sp.dsolve(equation,function)
        return ('Differential equation solution',solution,[('Differential equation',equation),('Dependent function',function),('General solution',solution)])
    m=regex.match(r'^(diff|partial|integrate|solve|dsolve|limit|series|taylor|simplify|factor|expand|det|inv|rank|eigenvals|grad|solveset|roots|nsolve|summation|product|laplace|ilaplace|fourier|ifourier|apart|cancel|trigsimp|subs|rref|eigenvects|dot|cross|divergence|curl|laplacian|jacobian|hessian|nint|pdsolve|rsolve)\s*\((.*)\)$',q,regex.S)
    if m:
        op=m.group(1); body=m.group(2)
        args=[]; depth=0; start=0
        for i,ch in enumerate(body):
            if ch in '([': depth+=1
            elif ch in ')]': depth-=1
            elif ch==',' and depth==0: args.append(body[start:i].strip()); start=i+1
        args.append(body[start:].strip())
        if op in ('taylor','series'):
            if len(args)<2: raise ValueError('Use taylor(expression, variable, point, order).')
            f=P(args[0]); v=P(args[1]); point=P(args[2]) if len(args)>2 else 0; order=int(args[3]) if len(args)>3 else 6
            if order<1 or order>20: raise ValueError('Series order must be between 1 and 20.')
            ans=sp.series(f,v,point,n=order); return ('Taylor series',ans,[('Function',f),('Expansion point',point),('Taylor series',ans)])
        if op in ('pdsolve','rsolve'):
            if len(args)<2: raise ValueError('Use '+op+'(equation, dependent_function).')
            dep=P(args[1]); raw=args[0]; eq=(P(raw.split('=',1)[0])-P(raw.split('=',1)[1])) if '=' in raw else P(raw)
            equation=sp.Eq(eq,0) if not isinstance(eq,sp.Equality) else eq
            ans=sp.pdsolve(equation,dep) if op=='pdsolve' else sp.rsolve(equation,dep)
            return (op+' solution',ans,[('Equation',equation),('Dependent function',dep),('Solution',ans)])
        if op=='dsolve':
            if len(args)<2: raise ValueError("Use dsolve(diff(y(x), x) + y(x), y(x))")
            func_match=regex.match(r'\s*([A-Za-z]\w*)\s*\(',args[1])
            if not func_match: raise ValueError("Use function notation for the dependent variable, e.g. y(x).")
            func_name=func_match.group(1)
            dependent=sp.Function(func_name)
            dlocals=dict(LOCALS); dlocals[func_name]=dependent; dlocals['diff']=sp.diff
            equation=parse_expr(args[0],local_dict=dlocals,global_dict=SAFE_GLOBALS,transformations=TRANS,evaluate=True)
            derivatives=equation.atoms(sp.Derivative)
            if any(len(der.variables)>6 for der in derivatives): raise ValueError("ODE order is limited to 6 to keep calculations responsive.")
            func=parse_expr(args[1],local_dict=dlocals,global_dict=SAFE_GLOBALS,transformations=TRANS,evaluate=True)
            if not isinstance(equation,sp.Equality): equation=sp.Eq(equation,0)
            ans=sp.dsolve(equation,func)
            return ('Differential equation solution',ans,[('Differential equation',equation),('Dependent function',func),('General solution',ans)])
        if op=='diff':
            if len(args)>3: raise ValueError("Use diff(expression, variable, order), with order from 1 to 6.")
            f=P(args[0]); v=P(args[1]) if len(args)>1 else next(iter(f.free_symbols),x)
            order=int(args[2]) if len(args)>2 else 1
            if order<1 or order>12: raise ValueError("Derivative order must be between 1 and 12.")
            guard_complexity(f)
            if sp.count_ops(f)>250: raise ValueError("This expression is too large to differentiate safely.")
            ans=sp.diff(f,v,order)
            ordinal={1:'first',2:'second',3:'third',4:'fourth',5:'fifth',6:'sixth',7:'seventh',8:'eighth',9:'ninth',10:'tenth',11:'eleventh',12:'twelfth'}[order]
            return ('Differentiate '+ordinal+' order with respect to '+str(v),ans,[('Input function',f),('Differentiation variable',v),('Derivative order',sp.Integer(order)),('Derivative',ans)])
        if op=='partial':
            if len(args)<2: raise ValueError("Use partial(expression, x, y, ...) and list each differentiation variable.")
            f=P(args[0]); variables=[P(vv) for vv in args[1:]]
            if len(variables)>12: raise ValueError("A mixed partial derivative is limited to 12 differentiations.")
            guard_complexity(f)
            ans=f
            for variable in variables: ans=sp.diff(ans,variable)
            return ('Partial derivative',ans,[('Input function',f),('Differentiation variables',sp.Tuple(*variables)),('Partial derivative',ans)])
        if op=='integrate':
            f=P(args[0])
            guard_complexity(f,100)
            bounds=None
            if len(args)==2 and args[1].strip().startswith('('):
                parsed_bounds=P(args[1])
                if not isinstance(parsed_bounds,(tuple,sp.Tuple)) or len(parsed_bounds)!=3:
                    raise ValueError("Use integrate(expression, (x, lower, upper)) for a definite integral.")
                v,lo,hi=parsed_bounds
                bounds=(v,lo,hi)
            else:
                v=P(args[1]) if len(args)>1 else next(iter(f.free_symbols),x)
                if len(args)>=4:
                    lo,hi=P(args[2]),P(args[3]); bounds=(v,lo,hi)
            if bounds is not None:
                v,lo,hi=bounds
                ans=sp.integrate(f,(v,lo,hi))
                if not ans.has(sp.Integral):
                    return ('Definite integral (exact)',ans,[('Integrand',f),('Bounds',sp.Tuple(lo,hi)),('Exact evaluation',ans)])
                if lo.is_real is True and hi.is_real is True and lo.is_finite is True and hi.is_finite is True:
                    try:
                        import mpmath as mp
                        numeric_fn=sp.lambdify(v,f,modules=['mpmath'])
                        approx=mp.quad(numeric_fn,[float(lo),float(hi)])
                        if mp.isfinite(approx):
                            ans=sp.Float(str(approx),15)
                            return ('Definite integral (numerical approximation)',ans,[('Integrand',f),('Bounds',sp.Tuple(lo,hi)),('Numerical evaluation',ans),('Accuracy note',sp.Symbol('Numerical approximation; verify convergence for difficult or singular integrands.'))])
                    except Exception: pass
                return ('Definite integral — not evaluated',ans,[('Integrand',f),('Bounds',sp.Tuple(lo,hi)),('Status',sp.Symbol('The symbolic engine could not evaluate this definite integral and the numerical fallback was not reliable.'))])
            ans=sp.Integral(f,v)
            # Avoid expensive symbolic searches for common non-elementary
            # compositions such as exp(cos(x)) and exp(sin(x)).
            nested_trig_exp=False
            for exp_term in f.atoms(sp.exp):
                if exp_term.args[0].has(sp.sin,sp.cos,sp.tan,sp.sinh,sp.cosh,sp.tanh):
                    nested_trig_exp=True; break
            if nested_trig_exp:
                return ('Indefinite integral — no elementary antiderivative',ans,[('Integrand',f),('Status',sp.Symbol('This integrand has no elementary antiderivative in general. The integral is retained exactly; use a definite interval for numerical evaluation.'))])
            # Run the primary SymPy integrator once. Repeated rewrites and
            # heuristic passes can consume the entire browser-worker budget.
            try:
                trial=sp.integrate(f,v)
                if not trial.has(sp.Integral): ans=trial
            except Exception: pass
            # A single conservative fallback for small rational/trigonometric forms.
            if ans.has(sp.Integral) and sp.count_ops(f)<=35 and not f.has(sp.exp,sp.log,sp.erf,sp.gamma):
                try:
                    candidate=sp.trigsimp(f) if f.has(sp.sin,sp.cos,sp.tan) else sp.cancel(sp.together(f))
                    if candidate!=f:
                        trial=sp.integrate(candidate,v)
                        if not trial.has(sp.Integral): ans=trial
                except Exception: pass
            if ans.has(sp.Integral):
                return ('Indefinite integral — no antiderivative found',ans,[('Original integrand',f),('Methods attempted',sp.Symbol('SymPy symbolic integration and one conservative simplification pass')),('Status',sp.Symbol('No closed-form antiderivative was found within the safe calculation budget. The unevaluated integral is shown, not presented as a solution.'))])
            return ('Indefinite integral',ans,[('Integrand',f),('Antiderivative',ans),('Constant of integration',sp.Symbol('C'))])
        if op=='solve':
            eq=args[0]
            if '=' in eq: L,R=eq.split('=',1); expr=P(L)-P(R)
            else: expr=P(eq)
            v=P(args[1]) if len(args)>1 else next(iter(expr.free_symbols),x)
            ans=sp.solve(expr,v)
            return ('Solve for '+str(v),ans,[('Equation reduced to zero',expr),('Solutions',sp.FiniteSet(*ans))])
        if op=='limit':
            f=P(args[0]); v=P(args[1]) if len(args)>1 else next(iter(f.free_symbols),x); point=P(args[2]) if len(args)>2 else 0
            guard_complexity(f)
            ans=sp.limit(f,v,point); return ('Limit',ans,[('Expression',f),('Approach value',point),('Limit',ans)])
        if op=='series':
            f=P(args[0]); v=P(args[1]) if len(args)>1 else next(iter(f.free_symbols),x); point=P(args[2]) if len(args)>2 else 0; order=int(args[3]) if len(args)>3 else 6
            if order<1 or order>20: raise ValueError("Taylor series order must be between 1 and 20.")
            if sp.count_ops(f)>250: raise ValueError("This expression is too large for a safe Taylor expansion.")
            ans=sp.series(f,v,point,n=order); return ('Taylor series',ans,[('Function',f),('Expansion point',point),('Series',ans)])
        if op in ('simplify','factor','expand'):
            f=P(args[0]); guard_complexity(f,80); ans=getattr(sp,op)(f); return (op.title(),ans,[('Input',f),(op.title()+' result',ans)])
        if op in ('solveset','roots','nsolve'):
            if len(args)<2: raise ValueError('Use '+op+'(equation, variable, ...).')
            raw=args[0]; expr=(P(raw.split('=',1)[0])-P(raw.split('=',1)[1])) if '=' in raw else P(raw); v=P(args[1])
            if op=='solveset':
                domain=P(args[2]) if len(args)>2 else sp.S.Complexes
                ans=sp.solveset(expr,v,domain=domain)
            elif op=='roots': ans=sp.roots(expr,v)
            else:
                if len(args)<3: raise ValueError('Use nsolve(expression, variable, initial_guess).')
                guess=P(args[2]); ans=sp.nsolve(expr,v,guess,maxsteps=100,verify=True)
            return (op+' result',ans,[('Equation',expr),('Variable',v),(op+' result',ans)])
        if op in ('summation','product'):
            if len(args)!=2: raise ValueError('Use '+op+'(expression, (index, lower, upper)).')
            f=P(args[0]); limits=P(args[1]);
            if not isinstance(limits,(tuple,sp.Tuple)) or len(limits)!=3: raise ValueError('Bounds must be (index, lower, upper).')
            ans=(sp.summation if op=='summation' else sp.product)(f,limits)
            return (op.title(),ans,[('Expression',f),('Index and bounds',limits),(op.title(),ans)])
        if op in ('laplace','ilaplace','fourier','ifourier'):
            if len(args)<3: raise ValueError('Transform needs expression, source variable and target variable.')
            f=P(args[0]); v=P(args[1]); target=P(args[2]);
            fn={'laplace':sp.laplace_transform,'ilaplace':sp.inverse_laplace_transform,'fourier':sp.fourier_transform,'ifourier':sp.inverse_fourier_transform}[op]
            ans=fn(f,v,target); return (op+' transform',ans,[('Input',f),('Transform',ans)])
        if op in ('apart','cancel','trigsimp'):
            f=P(args[0]); v=P(args[1]) if len(args)>1 else None; ans={'apart':lambda:sp.apart(f,v),'cancel':lambda:sp.cancel(f),'trigsimp':lambda:sp.trigsimp(f)}[op]()
            return (op.title(),ans,[('Input',f),('Result',ans)])
        if op=='subs':
            if len(args)<3: raise ValueError('Use subs(expression, variable, value).')
            f=P(args[0]); v=P(args[1]); value=P(args[2]); ans=f.subs(v,value)
            return ('Substitution',ans,[('Expression',f),('Substitution',sp.Eq(v,value)),('Result',ans)])
        if op in ('rref','eigenvects'):
            M=sp.Matrix(P(args[0]));
            if M.rows>8 or M.cols>8: raise ValueError('Matrix operations are limited to 8 x 8.')
            ans=M.rref() if op=='rref' else M.eigenvects()
            return ('Matrix '+op,ans,[('Input matrix',M),('Result',ans)])
        if op in ('dot','cross'):
            if len(args)!=2: raise ValueError('Use '+op+'(vector1, vector2).')
            u=sp.Matrix(P(args[0])); v=sp.Matrix(P(args[1])); ans=u.dot(v) if op=='dot' else u.cross(v)
            return ('Vector '+op,ans,[('First vector',u),('Second vector',v),('Result',ans)])
        if op in ('divergence','curl','laplacian','jacobian','hessian'):
            f=P(args[0]); vs=[P(vv) for vv in args[1:]] or sorted(f.free_symbols,key=str)
            if op=='divergence':
                vec=sp.Matrix(f); ans=sum(sp.diff(vec[i],vs[i]) for i in range(min(len(vec),len(vs))))
            elif op=='curl':
                vec=sp.Matrix(f);
                if len(vs)!=3 or len(vec)!=3: raise ValueError('curl requires a 3-component vector and x,y,z.')
                ans=sp.Matrix([sp.diff(vec[2],vs[1])-sp.diff(vec[1],vs[2]),sp.diff(vec[0],vs[2])-sp.diff(vec[2],vs[0]),sp.diff(vec[1],vs[0])-sp.diff(vec[0],vs[1])])
            elif op=='laplacian': ans=sum(sp.diff(f,vv,2) for vv in vs)
            elif op=='jacobian':
                vec=sp.Matrix(f); ans=vec.jacobian(vs)
            else: ans=sp.hessian(f,vs)
            return (op.title(),ans,[('Input',f),('Variables',sp.Tuple(*vs)),('Result',ans)])
        if op=='nint':
            if len(args)!=4: raise ValueError('Use nint(expression, variable, lower, upper).')
            f=P(args[0]); v=P(args[1]); lo=P(args[2]); hi=P(args[3]);
            if not (lo.is_real and hi.is_real and lo.is_finite and hi.is_finite): raise ValueError('Numerical integration requires finite real bounds.')
            import mpmath as mp
            fn=sp.lambdify(v,f,modules=['mpmath']); val=mp.quad(fn,[float(lo),float(hi)])
            if not mp.isfinite(val): raise ValueError('Numerical integration did not converge to a finite value.')
            ans=sp.Float(str(val),15); return ('Numerical integral',ans,[('Integrand',f),('Bounds',sp.Tuple(lo,hi)),('Approximation',ans)])
        if op=='dsolve':
            M=P(args[0]); M=sp.Matrix(M) if isinstance(M,(list,tuple)) else M
            if M.rows>8 or M.cols>8: raise ValueError("Matrix operations are limited to 8 × 8.")
            if op=='det': ans=M.det()
            elif op=='inv': ans=M.inv()
            elif op=='rank': ans=M.rank()
            else: ans=M.eigenvals()
            return ('Matrix '+op,ans,[('Input matrix',M),('Result',ans)])
        if op=='grad':
            f=P(args[0]); vs=[P(vv) for vv in args[1:]] or sorted(f.free_symbols,key=str)
            ans=sp.Matrix([sp.diff(f,vv) for vv in vs]); return ('Gradient',ans,[('Function',f),('Variables',sp.Tuple(*vs)),('Gradient vector',ans)])
    if '=' in q:
        L,R=q.split('=',1); expr=P(L)-P(R); v=sorted(expr.free_symbols,key=str)[0] if expr.free_symbols else x
        ans=sp.solve(expr,v); return ('Equation solution',ans,[('Equation reduced to zero',expr),('Solutions',sp.FiniteSet(*ans))])
    ans=P(q)
    if ans.free_symbols: ans=sp.simplify(ans)
    return ('Evaluation / simplification',ans,[('Parsed expression',P(q)),('Result',ans)])
def answer(q):
    title,ans,steps=run(q)
    plain=str(ans); tex=latex(ans)
    if len(plain)>12000 or len(tex)>20000: raise ValueError("The result is too large to display safely. Try a simpler expression or a lower series order.")
    rendered=[]
    for k,v in steps:
        step_plain=str(v); step_tex=latex(v)
        if len(step_plain)>12000 or len(step_tex)>20000: raise ValueError("The working is too large to display safely.")
        rendered.append({'label':str(k),'latex':step_tex,'plain':step_plain})
    return {'title':title,'latex':tex,'plain':plain,'steps':rendered}
