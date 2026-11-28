/* OmniMath graph and analysis worker. All sampling and curve analysis run off the UI thread. */
'use strict';
let mathReady=false;
try {
  try{importScripts('https://cdn.jsdelivr.net/npm/mathjs@14.0.1/lib/browser/math.js')}
  catch(_){importScripts('https://unpkg.com/mathjs@14.0.1/lib/browser/math.js')}
  mathReady=!!(self.math&&math.compile);
} catch(e) {
  self.postMessage({ok:false,error:'Could not load the graph mathematics library from either CDN. Check your connection and retry.'});
}
const LIMITS={expr:240,curves:6,plot2d:1600,surface:42,implicit:27,analysis:2400,vector:5};
function fail(message){throw new Error(message);}
const GRAPH_SYMBOLS=new Set(['x','y','z','t','u','v','theta','phi','pi','e']);
const GRAPH_FUNCTIONS=new Set(['sin','cos','tan','asin','acos','atan','sinh','cosh','tanh','asinh','acosh','atanh','exp','log','log10','sqrt','abs','sign','floor','ceil','round','min','max','pow','nthRoot','factorial','gamma']);
function validateGraphExpression(source){
 let root;try{root=math.parse(source)}catch(e){fail('Invalid graph expression: '+e.message)}
 let count=0;
 root.traverse((node)=>{
  if(++count>350)fail('Graph expression is too complex (maximum 350 syntax nodes).');
  if(!['ConstantNode','SymbolNode','OperatorNode','FunctionNode','ParenthesisNode'].includes(node.type))fail('Unsupported graph syntax: '+node.type+'. Use arithmetic, constants and mathematical functions only.');
  if(node.type==='SymbolNode'&&!GRAPH_SYMBOLS.has(node.name)&&!GRAPH_FUNCTIONS.has(node.name))fail('Unsupported graph symbol "'+node.name+'". Allowed variables: x, y, z, t, u, v, theta and phi.');
  if(node.type==='FunctionNode'&&(!node.fn||node.fn.type!=='SymbolNode'||!GRAPH_FUNCTIONS.has(node.fn.name)))fail('Only approved mathematical functions can be called in graph expressions.');
 });
 return root.compile();
}
function compileLines(lines){
 if(!mathReady)fail('Graph mathematics library did not load. Check your connection and retry.');
 return lines.map(s=>{if(s.length>LIMITS.expr)fail('Each expression is limited to 240 characters.');return validateGraphExpression(s.trim())});
}
function val(c,scope){
 try{const v=c.evaluate(scope);return typeof v==='number'&&Number.isFinite(v)?v:NaN}catch(_){return NaN}
}
function seq(a,b,n){return Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1))}
function range(a,b,name){a=Number(a);b=Number(b);if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b||Math.abs(a)>1e6||Math.abs(b)>1e6)fail(name+' range must be finite, increasing and within ±1,000,000.');return[a,b]}
function normalizeEq(q){const parts=q.split('=');if(parts.length>2)fail('Use at most one equals sign.');return parts.length===2?'('+parts[0]+')-('+parts[1]+')':q}
function baseScope(extra={}){return {pi:Math.PI,e:Math.E,...extra}}
function adaptiveCurve(f,a,b){
 const points=[];
 const sample=x=>val(f,baseScope({x}));
 function split(x0,y0,x1,y1,depth){
  const xm=(x0+x1)/2,ym=sample(xm);
  const finite0=Number.isFinite(y0),finite1=Number.isFinite(y1),finitem=Number.isFinite(ym);
  const scale=Math.max(1,Math.abs(y0)||0,Math.abs(y1)||0,Math.abs(ym)||0);
  const bend=finite0&&finite1&&finitem?Math.abs(ym-(y0+y1)/2):Infinity;
  const refine=depth<6&&(!finite0||!finite1||!finitem||bend>0.004*scale);
  if(refine){split(x0,y0,xm,ym,depth+1);split(xm,ym,x1,y1,depth+1)}
  else{points.push([x0,y0]);}
 }
 const initial=32;
 for(let i=0;i<initial;i++){const x0=a+(b-a)*i/initial,x1=a+(b-a)*(i+1)/initial;split(x0,sample(x0),x1,sample(x1),0)}
 points.push([b,sample(b)]);
 points.sort((p,q)=>p[0]-q[0]);
 return {x:points.map(p=>p[0]),y:points.map(p=>p[1])};
}
function plot(m){
 const mode=m.mode,lines=(m.expressions||[]).map(v=>String(v).trim()).filter(Boolean);
 if(!lines.length)fail('Enter an expression before plotting.');
 if(lines.length>LIMITS.curves)fail('At most six expressions are allowed.');
 if(lines.some(s=>s.length>LIMITS.expr))fail('Each expression is limited to 240 characters.');
 const [xmin,xmax]=range(m.xmin,m.xmax,'X'),[ymin,ymax]=range(m.ymin,m.ymax,'Y'),[zmin,zmax]=range(m.zmin,m.zmax,'Z'),traces=[];
 if(mode==='2d'){
  const explicitAssignments=lines.map(s=>s.replace(/^[A-Za-z_]\w*\(\s*x\s*\)\s*=\s*/i,'')),implicit=/\by\b/.test(lines[0])||lines[0].includes('=')&&explicitAssignments[0]===lines[0];
  if(implicit){if(lines.length!==1)fail('Plot one implicit equation at a time.');const f=compileLines([normalizeEq(lines[0])])[0],xs=seq(xmin,xmax,150),ys=seq(ymin,ymax,150),zz=ys.map(y=>xs.map(x=>val(f,baseScope({x,y}))));traces.push({type:'contour',name:lines[0],x:xs,y:ys,z:zz,contours:{coloring:'lines',start:0,end:0,size:1},showscale:false,line:{width:2}})}
  else{const fs=compileLines(explicitAssignments);fs.forEach((f,i)=>{const pts=adaptiveCurve(f,xmin,xmax),clipped=pts.y.map(v=>Number.isFinite(v)&&v>=ymin&&v<=ymax?v:NaN);traces.push({type:'scatter',mode:'lines',name:lines[i],x:pts.x,y:clipped,connectgaps:false})})}
 }else if(mode==='polar'){
  const polarLines=lines.map(s=>s.replace(/^r(?:\s*\([^)]*\))?\s*=\s*/i,'')),fs=compileLines(polarLines),theta=seq(xmin,xmax,1400);fs.forEach((f,i)=>{const r=theta.map(t=>val(f,baseScope({theta:t,t})));traces.push({type:'scatter',mode:'lines',name:lines[i],x:r.map((v,j)=>v*Math.cos(theta[j])),y:r.map((v,j)=>v*Math.sin(theta[j])),connectgaps:false})});
 }else if(mode==='surface'){
  if(lines.length!==1)fail('3D explicit surface mode accepts exactly one z=f(x,y) expression.');
  const f=compileLines([lines[0].replace(/^z\s*=\s*/i,'')])[0],xs=seq(xmin,xmax,LIMITS.surface),ys=seq(ymin,ymax,LIMITS.surface),zz=ys.map(y=>xs.map(x=>val(f,baseScope({x,y}))));
  traces.push({type:'surface',x:xs,y:ys,z:zz,colorscale:'Viridis',connectgaps:false});
 }else if(mode==='curve3d'){
  if(lines.length!==3)fail('Enter exactly three expressions: x(t), y(t), z(t), one per line.');
  const [ta,tb]=range(m.tmin,m.tmax,'Parameter'),fs=compileLines(lines.map(s=>s.replace(/^[xyz]\s*(?:\([^)]*\))?\s*=\s*/i,''))),ts=seq(ta,tb,900),xyz=fs.map(f=>ts.map(t=>val(f,baseScope({t}))));
  traces.push({type:'scatter3d',mode:'lines',name:'r(t)',x:xyz[0],y:xyz[1],z:xyz[2],connectgaps:false,line:{width:5}});
 }else if(mode==='paramSurface'){
  if(lines.length!==3)fail('Enter exactly three expressions: x(u,v), y(u,v), z(u,v), one per line.');
  const fs=compileLines(lines.map(s=>s.replace(/^[xyz]\s*(?:\([^)]*\))?\s*=\s*/i,''))),us=seq(xmin,xmax,38),vs=seq(ymin,ymax,38),xx=[],yy=[],zz=[];
  for(const v of vs){const xr=[],yr=[],zr=[];for(const u of us){const sc=baseScope({u,v});xr.push(val(fs[0],sc));yr.push(val(fs[1],sc));zr.push(val(fs[2],sc))}xx.push(xr);yy.push(yr);zz.push(zr)}
  traces.push({type:'surface',x:xx,y:yy,z:zz,colorscale:'Viridis',connectgaps:false});
 }else if(mode==='implicit'){
  if(lines.length!==1)fail('3D implicit surface mode accepts exactly one expression F(x,y,z)=0. Enter the left side minus right side, e.g. x^2+y^2+z^2-9.');
  const f=compileLines([normalizeEq(lines[0])])[0],xs=seq(xmin,xmax,LIMITS.implicit),ys=seq(ymin,ymax,LIMITS.implicit),zs=seq(zmin,zmax,LIMITS.implicit),xx=[],yy=[],zz=[],vv=[];
  for(const z of zs)for(const y of ys)for(const x of xs){xx.push(x);yy.push(y);zz.push(z);vv.push(val(f,baseScope({x,y,z})))}
  const finite=vv.filter(Number.isFinite);if(!finite.length)fail('The implicit expression is undefined throughout the selected volume.');
  const scale=Math.max(...finite.map(Math.abs)),eps=Math.max(scale*0.008,1e-8);
  traces.push({type:'isosurface',x:xx,y:yy,z:zz,value:vv,isomin:-eps,isomax:eps,surface:{count:1},caps:{x:{show:false},y:{show:false},z:{show:false}},colorscale:'Viridis',showscale:false});
 }else if(mode==='cylindrical'){
  if(lines.length!==1)fail('Cylindrical mode accepts one expression r(theta,z).');
  const f=compileLines([lines[0].replace(/^r(?:\s*\([^)]*\))?\s*=\s*/i,'')])[0],th=seq(0,2*Math.PI,56),zs=seq(zmin,zmax,34),xx=[],yy=[],zz=[];
  for(const z of zs){const xr=[],yr=[],zr=[];for(const theta of th){const r=val(f,baseScope({theta,z}));xr.push(r*Math.cos(theta));yr.push(r*Math.sin(theta));zr.push(z)}xx.push(xr);yy.push(yr);zz.push(zr)}
  traces.push({type:'surface',x:xx,y:yy,z:zz,colorscale:'Viridis',connectgaps:false});
 }else if(mode==='spherical'){
  if(lines.length!==1)fail('Spherical mode accepts one expression r(theta,phi).');
  const f=compileLines([lines[0].replace(/^r(?:\s*\([^)]*\))?\s*=\s*/i,'')])[0],th=seq(0,2*Math.PI,52),ph=seq(0,Math.PI,34),xx=[],yy=[],zz=[];
  for(const phi of ph){const xr=[],yr=[],zr=[];for(const theta of th){const r=val(f,baseScope({theta,phi}));xr.push(r*Math.sin(phi)*Math.cos(theta));yr.push(r*Math.sin(phi)*Math.sin(theta));zr.push(r*Math.cos(phi))}xx.push(xr);yy.push(yr);zz.push(zr)}
  traces.push({type:'surface',x:xx,y:yy,z:zz,colorscale:'Viridis',connectgaps:false});
 }else if(mode==='vector3d'){
  if(lines.length!==3)fail('Enter exactly three vector components P, Q, R, one per line.');
  const fs=compileLines(lines.map(s=>s.replace(/^[PQR]\s*(?:\([^)]*\))?\s*=\s*/i,''))),xs=seq(xmin,xmax,LIMITS.vector),ys=seq(ymin,ymax,LIMITS.vector),zs=seq(zmin,zmax,LIMITS.vector),x=[],y=[],z=[],u=[],v=[],w=[];
  for(const z0 of zs)for(const y0 of ys)for(const x0 of xs){const sc=baseScope({x:x0,y:y0,z:z0});x.push(x0);y.push(y0);z.push(z0);u.push(val(fs[0],sc));v.push(val(fs[1],sc));w.push(val(fs[2],sc))}
  traces.push({type:'cone',x,y,z,u,v,w,anchor:'tail',sizemode:'absolute',sizeref:Math.max(xmax-xmin,ymax-ymin,zmax-zmin)/9,colorscale:'Viridis',showscale:false});
 }else fail('Choose a supported graph type.');
 return {traces,mode};
}
function bisect(f,a,b,fa,fb){for(let i=0;i<65;i++){const mid=(a+b)/2,fm=f(mid);if(!Number.isFinite(fm))return null;if(Math.abs(fm)<1e-11||Math.abs(b-a)<1e-11*Math.max(1,Math.abs(mid)))return mid;if(fa*fm<=0){b=mid;fb=fm}else{a=mid;fa=fm}}return(a+b)/2}
function residualLooksLikeRoot(f,x,step){
 const center=f(x),left=f(x-step),right=f(x+step);
 if(!Number.isFinite(center))return false;
 const neighbor=Math.min(Math.abs(left),Math.abs(right));
 return Math.abs(center)<1e-7||(Number.isFinite(neighbor)&&Math.abs(center)<=1e-4*Math.max(1e-12,neighbor));
}
function goldenMin(g,a,b){const r=(Math.sqrt(5)-1)/2;let c=b-r*(b-a),d=a+r*(b-a),fc=g(c),fd=g(d);for(let i=0;i<55;i++){if(!Number.isFinite(fc)||!Number.isFinite(fd))return null;if(fc<fd){b=d;d=c;fd=fc;c=b-r*(b-a);fc=g(c)}else{a=c;c=d;fc=fd;d=a+r*(b-a);fd=g(d)}}return(a+b)/2}
function analyze(m){
 const rawLines=(m.expressions||[]).map(String).map(s=>s.trim()).filter(Boolean),kind=m.analysis;
 if(!rawLines.length)fail('Enter at least one function.');
 const lines=rawLines.map(s=>s.replace(/^[A-Za-z_]\w*\(\s*x\s*\)\s*=\s*/i,''));
 if(lines.some(s=>/\by\b/.test(s)||s.includes('=')))fail('Curve analysis requires explicit functions of x, not implicit equations.');
 const [a,b]=range(m.xmin,m.xmax,'X'),[ymin,ymax]=range(m.ymin,m.ymax,'Y'),fs=compileLines(lines),N=LIMITS.analysis,dx=(b-a)/N,fmt=v=>Number(v).toPrecision(9),out=[];
 const fns=fs.map(f=>x=>val(f,baseScope({x})));
 const derivative=(f,x,h)=>{const p=f(x+h),q=f(x-h);return Number.isFinite(p)&&Number.isFinite(q)?(p-q)/(2*h):NaN};
 if(kind==='roots'){
  fns.forEach((f,j)=>{let x0=a,y0=f(x0);for(let i=1;i<=N;i++){const x=a+i*dx,y=f(x);if(Number.isFinite(y0)&&Number.isFinite(y)){if(y0===0)out.push('f'+(j+1)+' root ≈ '+fmt(x0));else if(y0*y<0){const r=bisect(f,x0,x,y0,y);if(r!==null&&residualLooksLikeRoot(f,r,Math.max(dx*0.1,1e-7)))out.push('f'+(j+1)+' root ≈ '+fmt(r))}}x0=x;y0=y}
   // Search local minima of |f| to catch even-multiplicity/tangential roots.
   const abs=x=>Math.abs(f(x));for(let i=1;i<N;i++){const x=a+i*dx,l=abs(x-dx),c=abs(x),r=abs(x+dx);if([l,c,r].every(Number.isFinite)&&c<=l&&c<=r&&c<Math.max(1,Math.abs(l),Math.abs(r))*0.015){const root=goldenMin(abs,x-dx,x+dx);if(root!==null&&Math.abs(f(root))<1e-7*Math.max(1,Math.abs(l),Math.abs(r)))out.push('f'+(j+1)+' tangential root ≈ '+fmt(root))}}
  });
  return {title:'Numerical roots',body:out.length?[...new Set(out)].slice(0,80).join(' · '):'No roots detected at the selected resolution. This is numerical evidence, not proof of no roots.'};
 }
 if(kind==='intersections'){
  if(fns.length<2)fail('Enter at least two explicit functions, one per line.');
  for(let j=0;j<fns.length;j++)for(let k=j+1;k<fns.length;k++){
   const d=x=>fns[j](x)-fns[k](x),ad=x=>Math.abs(d(x));let x0=a,y0=d(x0);
   for(let i=1;i<=N;i++){const x=a+i*dx,y=d(x);if(Number.isFinite(y0)&&Number.isFinite(y)&&y0*y<0){const r=bisect(d,x0,x,y0,y);if(r!==null&&residualLooksLikeRoot(d,r,Math.max(dx*0.1,1e-7))&&Number.isFinite(fns[j](r))&&Number.isFinite(fns[k](r)))out.push('f'+(j+1)+' ∩ f'+(k+1)+': ('+fmt(r)+', '+fmt(fns[j](r))+')')}x0=x;y0=y}
   for(let i=1;i<N;i++){const x=a+i*dx,l=ad(x-dx),v=ad(x),r0=ad(x+dx),scale=Math.max(1,l||0,r0||0);if([l,v,r0].every(Number.isFinite)&&v<=l&&v<=r0&&v<0.015*scale){const root=goldenMin(ad,x-dx,x+dx);if(root!==null&&ad(root)<1e-7*scale)out.push('f'+(j+1)+' tangent intersection f'+(k+1)+': ('+fmt(root)+', '+fmt(fns[j](root))+')')}}
  }
  return {title:'Curve intersections',body:out.length?[...new Set(out)].slice(0,100).join(' · '):'No intersections detected at the selected resolution. This is numerical evidence, not proof.'};
 }
 if(kind==='extrema'||kind==='inflections'){
  fns.forEach((f,j)=>{const d1=x=>derivative(f,x,Math.max(1e-5,Math.abs(x)*1e-5,dx*0.05)),d2=x=>derivative(d1,x,Math.max(1e-4,Math.abs(x)*1e-4,dx*0.1));const g=kind==='extrema'?d1:d2;let px=a,py=g(px);for(let i=1;i<=N;i++){const x=a+i*dx,y=g(x);if(Number.isFinite(py)&&Number.isFinite(y)&&py*y<0){const r=bisect(g,px,x,py,y);if(r!==null){if(kind==='extrema'){const eps=Math.max(dx*0.25,1e-6),left=d1(r-eps),right=d1(r+eps),label=left>0&&right<0?'Local maximum':left<0&&right>0?'Local minimum':'Stationary candidate';out.push(label+' f'+(j+1)+': ('+fmt(r)+', '+fmt(f(r))+')')}else out.push('Inflection candidate f'+(j+1)+': ('+fmt(r)+', '+fmt(f(r))+')')}}px=x;py=y}});
  return {title:kind==='extrema'?'Critical points / extrema candidates':'Inflection candidates',body:out.length?out.slice(0,100).join(' · '):'No candidates detected at the selected resolution. Classification requires checking derivative sign changes.'};
 }
 if(kind==='tangent'){
  const x0=Number(m.parameter);if(!Number.isFinite(x0))fail('Enter a finite x value.');
  const f=fns[0],y=f(x0),h=Math.max(1e-5,Math.abs(x0)*1e-5),slope=derivative(f,x0,h);if(!Number.isFinite(y)||!Number.isFinite(slope))fail('Function is undefined near the selected x value.');
  const tx=[a,b],ty=tx.map(x=>y+slope*(x-x0)),overlay=[{type:'scatter',mode:'lines',name:'Tangent',x:tx,y:ty,line:{dash:'dash'}}];
  if(Math.abs(slope)<1e-12)overlay.push({type:'scatter',mode:'lines',name:'Normal',x:[x0,x0],y:[ymin,ymax],line:{dash:'dot'}});
  else{const ns=-1/slope;overlay.push({type:'scatter',mode:'lines',name:'Normal',x:tx,y:tx.map(x=>y+ns*(x-x0)),line:{dash:'dot'}})}
  return {title:'Tangent and normal',body:'At ('+fmt(x0)+', '+fmt(y)+'): slope ≈ '+fmt(slope)+'. Tangent: y - ('+fmt(y)+') = '+fmt(slope)+'(x - ('+fmt(x0)+')). Normal: '+(Math.abs(slope)<1e-12?'x = '+fmt(x0):'y - ('+fmt(y)+') = '+fmt(-1/slope)+'(x - ('+fmt(x0)+')).'),overlay};
 }
 if(kind==='area'){
  const lo=Number(m.lower),hi=Number(m.upper);if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>=hi)fail('Area lower bound must be finite and smaller than upper bound.');
  const f=fns[0],simpson=n=>{const h=(hi-lo)/n;let sum=0;for(let i=0;i<=n;i++){const y=f(lo+i*h);if(!Number.isFinite(y))fail('Function is undefined inside the interval. Split the integral at singularities.');sum+=(i===0||i===n?1:i%2?4:2)*y}return sum*h/3};const coarse=simpson(2000),fine=simpson(4000),err=Math.abs(fine-coarse)
  return {title:'Numerical signed area',body:'Composite Simpson approximation ≈ '+fmt(fine)+' on ['+lo+', '+hi+']. Difference between 2,000 and 4,000 panels: '+fmt(err)+'. '+(err<=1e-7*Math.max(1,Math.abs(fine))?'The two resolutions agree within the displayed tolerance.':'Convergence is not established; increase resolution or split at discontinuities/singularities.')};
 }
 if(kind==='asymptotes'){
  fns.forEach((f,j)=>{for(let i=1;i<N;i++){const x=a+i*dx,y=f(x),yl=f(x-dx),yr=f(x+dx);if(!Number.isFinite(y)||Math.abs(y)>1e5*Math.max(1,Math.abs(yl),Math.abs(yr)))out.push('Possible vertical asymptote of f'+(j+1)+' near x='+fmt(x))}const L=f(b-dx),R=f(b);if(Number.isFinite(L)&&Number.isFinite(R)&&Math.abs(L-R)<1e-3*Math.max(1,Math.abs(L),Math.abs(R)))out.push('Possible horizontal asymptote near y='+fmt((L+R)/2)+' as x approaches upper range')}
  );
  return {title:'Asymptote candidates (heuristic)',body:out.length?[...new Set(out)].slice(0,80).join(' · '):'No asymptote candidates detected in this interval. Numerical detection is heuristic, not proof.'};
 }
 fail('Unknown analysis method.');
}
self.onmessage=e=>{
 try{const m=e.data||{};if(m.type==='analyse'){self.postMessage({ok:true,analysis:analyze(m)});return}const result=plot(m);self.postMessage({ok:true,...result})}
 catch(err){self.postMessage({ok:false,error:err&&err.message?err.message:String(err)})}
};
