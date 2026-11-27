/* OmniMath graph sampler: all expensive expression sampling runs off the UI thread. */
try {
  importScripts('https://cdn.jsdelivr.net/npm/mathjs@14.0.1/lib/browser/math.js');
} catch (e) {
  self.postMessage({error:'Could not load the graph mathematics library. Check your connection and retry.'});
}
function compiled(lines) {
  if (!self.math || !math.compile) throw new Error('Graph mathematics library did not load.');
  return lines.map(s => math.compile(s.trim()));
}
function value(c, scope) {
  const v = c.evaluate(scope);
  return typeof v === 'number' && Number.isFinite(v) ? v : NaN;
}
function range(a,b,name) {
  a=Number(a); b=Number(b);
  if (!Number.isFinite(a)||!Number.isFinite(b)||a>=b) throw new Error(name+' minimum must be smaller than maximum.');
  return [a,b];
}
function seq(a,b,n) { return Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1)); }
function run(m) {
  const mode=m.mode, lines=(m.expressions||[]).map(x=>String(x).trim()).filter(Boolean);
  if (!lines.length) throw new Error('Enter an expression before plotting.');
  if (lines.some(x=>x.length>240)) throw new Error('Each expression is limited to 240 characters for responsive plotting.');
  const [xmin,xmax]=range(m.xmin,m.xmax,'X');
  const [ymin,ymax]=range(m.ymin,m.ymax,'Y');
  const [zmin,zmax]=range(m.zmin,m.zmax,'Z');
  const traces=[];
  if (mode==='2d') {
    if(lines.length>4) throw new Error('For smooth performance, plot at most four 2D functions at once.');
    const fs=compiled(lines), xs=seq(xmin,xmax,700);
    fs.forEach((f,i)=>traces.push({type:'scatter',mode:'lines',name:lines[i],x:xs,y:xs.map(x=>value(f,{x,pi:Math.PI,e:Math.E})),connectgaps:false}));
  } else if(mode==='surface') {
    const f=compiled([lines[0]])[0],xs=seq(xmin,xmax,38),ys=seq(ymin,ymax,38);
    const zz=ys.map(y=>xs.map(x=>value(f,{x,y,pi:Math.PI,e:Math.E})));
    traces.push({type:'surface',x:xs,y:ys,z:zz,colorscale:'Viridis',connectgaps:false});
  } else if(mode==='curve3d') {
    if(lines.length!==3) throw new Error('Enter exactly three expressions: x(t), y(t), z(t), one per line.');
    const fs=compiled(lines),ts=seq(Number(m.tmin),Number(m.tmax),650);
    if(!Number.isFinite(Number(m.tmin))||!Number.isFinite(Number(m.tmax))||Number(m.tmin)>=Number(m.tmax)) throw new Error('Parameter minimum must be smaller than maximum.');
    const xyz=fs.map(f=>ts.map(t=>value(f,{t,pi:Math.PI,e:Math.E})));
    traces.push({type:'scatter3d',mode:'lines',name:'r(t)',x:xyz[0],y:xyz[1],z:xyz[2],line:{width:5}});
  } else if(mode==='paramSurface') {
    if(lines.length!==3) throw new Error('Enter exactly three expressions: x(u,v), y(u,v), z(u,v), one per line.');
    const fs=compiled(lines),us=seq(xmin,xmax,28),vs=seq(ymin,ymax,28);
    const xx=[],yy=[],zz=[];
    for(const v of vs){const xr=[],yr=[],zr=[];for(const u of us){const sc={u,v,pi:Math.PI,e:Math.E};xr.push(value(fs[0],sc));yr.push(value(fs[1],sc));zr.push(value(fs[2],sc));}xx.push(xr);yy.push(yr);zz.push(zr);}
    traces.push({type:'surface',x:xx,y:yy,z:zz,colorscale:'Viridis',connectgaps:false});
  } else if(mode==='implicit') {
    const f=compiled([lines[0]])[0],xs=seq(xmin,xmax,23),ys=seq(ymin,ymax,23),zs=seq(zmin,zmax,23);
    const x=[],y=[],z=[],v=[];
    for(const zz of zs)for(const yy of ys)for(const xx of xs){x.push(xx);y.push(yy);z.push(zz);v.push(value(f,{x:xx,y:yy,z:zz,pi:Math.PI,e:Math.E}));}
    const finite=v.filter(Number.isFinite),scale=finite.length?Math.max(...finite.map(Math.abs)):1,eps=Math.max(scale*0.012,1e-6);
    traces.push({type:'isosurface',x,y,z,value:v,isomin:-eps,isomax:eps,surface:{count:1},caps:{x:{show:false},y:{show:false},z:{show:false}},colorscale:'Viridis',showscale:false});
  } else if(mode==='cylindrical') {
    const f=compiled([lines[0]])[0],theta=seq(0,2*Math.PI,48),zs=seq(zmin,zmax,30),xx=[],yy=[],zz=[];
    for(const z0 of zs){const xr=[],yr=[],zr=[];for(const th of theta){const r=value(f,{theta:th,z:z0,pi:Math.PI,e:Math.E});xr.push(r*Math.cos(th));yr.push(r*Math.sin(th));zr.push(z0);}xx.push(xr);yy.push(yr);zz.push(zr);}
    traces.push({type:'surface',x:xx,y:yy,z:zz,colorscale:'Viridis',connectgaps:false});
  } else if(mode==='spherical') {
    const f=compiled([lines[0]])[0],theta=seq(0,2*Math.PI,42),phi=seq(0,Math.PI,28),xx=[],yy=[],zz=[];
    for(const ph of phi){const xr=[],yr=[],zr=[];for(const th of theta){const r=value(f,{theta:th,phi:ph,pi:Math.PI,e:Math.E});xr.push(r*Math.sin(ph)*Math.cos(th));yr.push(r*Math.sin(ph)*Math.sin(th));zr.push(r*Math.cos(ph));}xx.push(xr);yy.push(yr);zz.push(zr);}
    traces.push({type:'surface',x:xx,y:yy,z:zz,colorscale:'Viridis',connectgaps:false});
  } else if(mode==='vector3d') {
    if(lines.length!==3) throw new Error('Enter exactly three components: P(x,y,z), Q(x,y,z), R(x,y,z), one per line.');
    const fs=compiled(lines),xs=seq(xmin,xmax,5),ys=seq(ymin,ymax,5),zs=seq(zmin,zmax,5),x=[],y=[],z=[],u=[],v=[],w=[];
    for(const zz of zs)for(const yy of ys)for(const xx of xs){const sc={x:xx,y:yy,z:zz,pi:Math.PI,e:Math.E};x.push(xx);y.push(yy);z.push(zz);u.push(value(fs[0],sc));v.push(value(fs[1],sc));w.push(value(fs[2],sc));}
    traces.push({type:'cone',x,y,z,u,v,w,anchor:'tail',sizemode:'absolute',sizeref:Math.max(xmax-xmin,ymax-ymin,zmax-zmin)/9,colorscale:'Viridis',showscale:false});
  } else throw new Error('Choose a supported graph type.');
  return {traces,mode};
}
self.onmessage=e=>{
  try { const result=run(e.data); self.postMessage({ok:true,...result}); }
  catch(err) { self.postMessage({ok:false,error:err&&err.message?err.message:String(err)}); }
};
