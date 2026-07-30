import json
P = open('calc_payload.json').read()
lib = open('node_modules/chart.js/dist/chart.umd.js').read()

HTML = r'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>DPD vs UPS — Rate Calculator</title>
<script>__LIB__</script>
<style>
:root{--ink:#0f172a;--muted:#64748b;--line:#e2e8f0;--bg:#f1f5f9;--card:#fff;
--g:#15803d;--g-bg:#dcfce7;--a:#b45309;--a-bg:#fef3c7;--r:#b91c1c;--r-bg:#fee2e2;}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.5}
.wrap{max-width:1160px;margin:0 auto;padding:22px 22px 56px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(15,23,42,.05);margin-bottom:18px}
h2{font-size:15px;margin:0 0 14px;letter-spacing:-.01em}
.calcrow{display:flex;flex-wrap:wrap;gap:12px;align-items:end}
.f label{display:block;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
.f input,.f select{padding:9px 10px;border:1px solid #cbd5e1;border-radius:9px;font-size:14px;background:#fff;color:var(--ink)}
.f input:focus,.f select:focus{outline:2px solid #0f766e;border-color:#0f766e}
.f.country{flex:1;min-width:200px}.f.country select{width:100%}
.f.small input{width:78px;text-align:right;font-variant-numeric:tabular-nums}
.f.mk input{width:88px;text-align:right}
.wt{display:flex;gap:20px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line);font-size:13.5px}
.wt div b{font-size:17px;letter-spacing:-.01em}
.wt .lab{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:700}
.results{display:grid;grid-template-columns:repeat(auto-fit,minmax(195px,1fr));gap:13px;margin-top:16px}
.res{border:1px solid var(--line);border-radius:14px;padding:15px;position:relative;background:#fff}
.res .car{font-size:12.5px;font-weight:700;color:#334155;display:flex;align-items:center;gap:7px}
.res .swatch{width:10px;height:10px;border-radius:3px;flex:none}
.res .pr{font-size:26px;font-weight:800;letter-spacing:-.02em;margin:6px 0 2px}
.res .brk{font-size:11.5px;color:#475569;margin-top:8px;line-height:1.7}
.res .brk .row{display:flex;justify-content:space-between;gap:8px}
.res .brk .row.sell{border-top:1px solid var(--line);margin-top:5px;padding-top:5px;font-weight:700;color:var(--ink)}
.res.win{border:2px solid var(--g);background:var(--g-bg)} .res.win .pr{color:var(--g)}
.res.lose{border:1px solid #fca5a5;background:var(--r-bg)} .res.lose .pr{color:var(--r)}
.res.mid{background:var(--a-bg)}
.res.na{background:#f8fafc;color:var(--muted)} .res.na .pr{color:#94a3b8;font-size:16px;margin:12px 0 2px}
.res.pending{background:#fffbeb;border:1px dashed #f59e0b}.res.pending .pr{color:#b45309;font-size:15px;margin:10px 0}
.badge{position:absolute;top:12px;right:12px;font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--g);color:#fff}
.verdict{margin-top:15px;font-size:14px;background:#f8fafc;border:1px solid var(--line);border-radius:10px;padding:11px 13px}
.chartbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px}
.legend span{display:inline-flex;align-items:center;gap:6px;color:#334155;font-weight:600}
.dot{width:12px;height:3px;border-radius:2px;display:inline-block}
.metricsel{font-size:13px}.metricsel select{padding:5px 8px;border-radius:8px;border:1px solid #cbd5e1}
.chartbox{position:relative;height:360px}
.chartnote{font-size:12.5px;color:var(--muted);margin:10px 0 0}
</style></head>
<body><div class="wrap">

<div class="panel">
<div class="calcrow">
  <div class="f country"><label>Country</label><select id="country"></select></div>
  <div class="f small"><label>Weight kg</label><input id="wt" type="number" min="0" step="0.1" value="5"/></div>
  <div class="f small"><label>L cm</label><input id="L" type="number" min="0" step="1" placeholder="—"/></div>
  <div class="f small"><label>W cm</label><input id="W" type="number" min="0" step="1" placeholder="—"/></div>
  <div class="f small"><label>H cm</label><input id="H" type="number" min="0" step="1" placeholder="—"/></div>
  <div class="f mk"><label>Markup %</label><input id="markup" type="number" min="0" step="1" value="0"/></div>
</div>
<div class="wt">
  <div><div class="lab">Volumetric</div><b id="volw">—</b></div>
  <div><div class="lab">Chargeable</div><b id="chgw">—</b></div>
  <div><div class="lab">Driven by</div><b id="driver">—</b></div>
</div>
<div class="results" id="results"></div>
<div class="verdict" id="verdict"></div>
</div>

<div class="panel">
<div class="chartbar">
  <div class="legend" id="legend"></div>
  <div class="metricsel">Show: <select id="metric">
    <option value="sell">Sell (base + fuel + markup)</option>
    <option value="cost">Cost (base + fuel)</option>
    <option value="base">Base rate only</option>
  </select></div>
</div>
<div class="chartbox"><canvas id="chart"></canvas></div>
<p class="chartnote" id="chartnote"></p>
</div>

</div>
<script>
const P=__DATA__;
const bands=P.bands, money=v=>v==null?'—':'£'+v.toFixed(2), $=id=>document.getElementById(id);
const FUEL={dpd:18, upsx:46.25*0.75, upss:29*0.75};   // effective % (UPS already ×0.75 for 25% off)
const CAPS={cp:31.5, ep:3};
const SERVICES=[
 {key:'ca',name:'DPD Classic Air',       group:'dpd', type:'band',src:'dpd_classic',    color:'#2563eb'},
 {key:'ae',name:'DPD Air Express',       group:'dpd', type:'band',src:'dpd_express',    color:'#7c3aed'},
 {key:'ep',name:'DPD Classic ExpressPak',group:'dpd', type:'flat',src:'dpd_expresspak', cap:'ep', color:'#db2777'},
 {key:'cp',name:'DPD Classic Parcel',    group:'dpd', type:'flat',src:'dpd_parcel',     cap:'cp', color:'#0891b2'},
 {key:'ux',name:'UPS Express Saver',     group:'upsx',type:'zone',src:'ups',            color:'#0f766e'},
 {key:'us',name:'UPS Standard',          group:'upss',type:'pending',                   color:'#ea580c'},
];
const csel=$('country');
P.countries.forEach(c=>csel.appendChild(new Option(c,c)));
csel.value=P.countries.includes('USA')?'USA':P.countries[0];
const num=id=>{const v=parseFloat($(id).value);return isNaN(v)?0:v;};
const zoneFor=c=>P.c2zone[c]||'';
function build(base,group){
  if(base==null) return {base:null};
  const fp=FUEL[group]||0, fuel=base*fp/100, cost=base+fuel, sell=cost*(1+num('markup')/100);
  return {base,fp,fuel,cost,sell};
}
function baseRate(svc,c,chg){
  if(svc.type==='band'){const arr=P[svc.src][c];if(!arr)return{price:null,avail:false};
    if(chg>bands[bands.length-1]+1e-9)return{price:null,avail:true,note:'over '+bands[bands.length-1]+' kg'};
    for(let i=0;i<bands.length;i++)if(bands[i]>=chg-1e-9)return{price:arr[i],avail:true,band:bands[i]};
    return{price:null,avail:true};}
  if(svc.type==='flat'){const p=P[svc.src][c];if(p==null)return{price:null,avail:false};
    const cap=CAPS[svc.cap];if(chg>cap+1e-9)return{price:null,avail:true,note:'over '+cap+' kg cap'};
    return{price:p,avail:true,band:'flat ≤'+cap+'kg'};}
  if(svc.type==='zone'){const zone=zoneFor(c),z=P[svc.src][zone];
    if(!zone)return{price:null,avail:false};if(!z)return{price:null,avail:false};
    const b=z.bands,mB=b[b.length-1][0];
    if(chg<=mB+1e-9){for(const[w,pr]of b)if(w>=chg-1e-9)return{price:pr,avail:true,band:w};}
    const pr=Math.max(chg*z.perkg,z.min);return{price:Math.round(pr*100)/100,avail:true,band:'>'+mB+' per-kg'};}
  if(svc.type==='pending'){return{price:null,avail:P.dpd_parcel[c]!=null,pending:true,note:'awaiting rate card'};}
  return{price:null,avail:false};
}
let chart;
function calc(){
  const c=csel.value,actual=num('wt'),L=num('L'),W=num('W'),H=num('H');
  const vol=(L&&W&&H)?(L*W*H)/P.divisor:0, chg=Math.max(actual,vol);
  $('volw').textContent=vol?vol.toFixed(2)+' kg':'—';
  $('chgw').textContent=chg?chg.toFixed(2)+' kg':'—';
  $('driver').textContent=!chg?'—':(vol>actual?'volumetric':'actual weight');
  const rows=SERVICES.map(svc=>{const b=baseRate(svc,c,chg);return{svc,b,built:build(b.price,svc.group)};}).filter(x=>x.b.avail);
  const costs=rows.filter(x=>x.b.price!=null).map(x=>x.built.cost);
  const min=costs.length?Math.min(...costs):null,max=costs.length?Math.max(...costs):null;
  const R=$('results');R.innerHTML='';
  rows.forEach(({svc,b,built})=>{
    const d=document.createElement('div');let cls='res';
    if(b.pending)cls+=' pending';else if(b.price==null)cls+=' na';
    else if(built.cost===min&&costs.length>1)cls+=' win';
    else if(built.cost===max&&costs.length>1)cls+=' lose';else cls+=' mid';
    d.className=cls;
    const head=`<div class="car"><span class="swatch" style="background:${svc.color}"></span>${svc.name}</div>`;
    if(b.pending)d.innerHTML=head+`<div class="pr">pending</div><div class="brk">${b.note}</div>`;
    else if(b.price==null)d.innerHTML=head+`<div class="pr">n/a</div><div class="brk">${b.note||'no rate'}</div>`;
    else{const badge=(built.cost===min&&costs.length>1)?'<span class="badge">CHEAPEST</span>':'';
      const bt=typeof b.band==='number'?b.band+' kg':b.band;
      d.innerHTML=badge+head+`<div class="pr">${money(built.sell)}</div><div class="brk">
        <div class="row"><span>Base (${bt})</span><span>${money(built.base)}</span></div>
        <div class="row"><span>Fuel ${built.fp.toFixed(1)}%</span><span>${money(built.fuel)}</span></div>
        <div class="row"><span>Cost</span><span>${money(built.cost)}</span></div>
        <div class="row sell"><span>Sell +${num('markup')}%</span><span>${money(built.sell)}</span></div></div>`;}
    R.appendChild(d);
  });
  const v=$('verdict');
  if(!chg)v.innerHTML='Enter a weight to compare.';
  else if(costs.length<2)v.innerHTML=`Only one priced service for <b>${c}</b> at <b>${chg.toFixed(2)} kg</b>.`;
  else{const w=rows.find(x=>x.b.price!=null&&x.built.cost===min);
    const o=costs.filter(p=>p!==min).sort((a,b)=>a-b),nb=o[0],save=nb-min,pct=save/nb*100;
    v.innerHTML=`Cheapest for <b>${c}</b> at <b>${chg.toFixed(2)} kg</b>: <b style="color:var(--g)">${w.svc.name}</b> at <b>${money(w.built.sell)}</b> — <b>£${save.toFixed(2)}</b> (${pct.toFixed(1)}%) cheaper than next best.`;}
  drawChart(c);
}
function drawChart(c){
  const metric=$('metric').value;
  const ds=[],leg=[];
  SERVICES.forEach(svc=>{let data=null;
    if(svc.type==='band'){const arr=P[svc.src][c];if(arr)data=arr.map(p=>p==null?null:build(p,svc.group)[metric]);}
    else if(svc.type==='flat'){const p=P[svc.src][c];if(p!=null){const cap=CAPS[svc.cap];data=bands.map(w=>w>cap+1e-9?null:build(p,svc.group)[metric]);}}
    else if(svc.type==='zone'){const zone=zoneFor(c),z=P[svc.src][zone];if(zone&&z)data=bands.map(w=>{const r=baseRate(svc,c,w);return r.price==null?null:build(r.price,svc.group)[metric];});}
    if(data){ds.push({label:svc.name,data,borderColor:svc.color,borderWidth:2.4,tension:.12,pointRadius:0,spanGaps:false});
      leg.push(`<span><span class="dot" style="background:${svc.color}"></span>${svc.name}</span>`);}});
  $('legend').innerHTML=leg.join('');
  const lbl={sell:'Sell (£, incl. fuel + markup)',cost:'Cost (£, incl. fuel)',base:'Base rate (£)'}[metric];
  const notes=[];
  if(!zoneFor(c))notes.push('UPS Express hidden — no zone mapped for this country.');
  if(P.dpd_parcel[c]!=null)notes.push('UPS Standard omitted (rate card pending).');
  $('chartnote').textContent=notes.join(' ');
  if(chart){chart.data.labels=bands;chart.data.datasets=ds;chart.options.scales.y.title.text=lbl;chart.update();return;}
  chart=new Chart($('chart'),{type:'line',data:{labels:bands,datasets:ds},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
      plugins:{legend:{display:false},tooltip:{callbacks:{title:i=>i[0].label+' kg',label:x=>x.dataset.label+': '+money(x.parsed.y)}}},
      scales:{x:{title:{display:true,text:'Chargeable weight (kg)'},ticks:{maxTicksLimit:16}},
        y:{title:{display:true,text:lbl},ticks:{callback:v=>'£'+v}}}}});
}
['country','wt','L','W','H','markup','metric'].forEach(id=>$(id).addEventListener('input',calc));
$('metric').addEventListener('change',calc);
calc();
</script>
</body></html>'''
HTML=HTML.replace('__LIB__',lib).replace('__DATA__',P)
open('dpd_vs_ups_calculator.html','w').write(HTML)
print('written',len(HTML),'bytes')
