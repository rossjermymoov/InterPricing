#!/usr/bin/env python3
# Generates ../public/index.html — the data-driven calculator front end.
# Rates + settings are fetched at runtime from /api/config (no data inlined).
import os, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PUBLIC = os.path.join(ROOT, 'public')
os.makedirs(PUBLIC, exist_ok=True)

# Copy Chart.js into /public if we can find it (served as a static asset).
for cand in [
    os.path.join(ROOT, 'node_modules', 'chart.js', 'dist', 'chart.umd.js'),
    os.path.join(os.path.dirname(ROOT), 'node_modules', 'chart.js', 'dist', 'chart.umd.js'),
]:
    if os.path.exists(cand):
        shutil.copyfile(cand, os.path.join(PUBLIC, 'chart.umd.js'))
        break

HTML = r'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>International Rate Calculator</title>
<script src="/chart.umd.js"></script>
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
.wt{display:flex;gap:20px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line);font-size:13.5px}
.wt div b{font-size:17px;letter-spacing:-.01em}
.wt .lab{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:700}
.results{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:13px;margin-top:16px}
.res{border:1px solid var(--line);border-radius:14px;padding:15px;position:relative;background:#fff}
.res .car{font-size:12.5px;font-weight:700;color:#334155;display:flex;align-items:center;gap:7px}
.res .swatch{width:10px;height:10px;border-radius:3px;flex:none}
.res .pr{font-size:25px;font-weight:800;letter-spacing:-.02em;margin:6px 0 0}
.res .sub{font-size:11px;color:var(--muted);margin-bottom:6px}
.res .brk{font-size:11.5px;color:#475569;margin-top:6px;line-height:1.65}
.res .brk .row{display:flex;justify-content:space-between;gap:8px}
.res .brk .row.sell{border-top:1px solid var(--line);margin-top:5px;padding-top:5px;font-weight:700;color:var(--ink)}
.res.win{border:2px solid var(--g);background:var(--g-bg)} .res.win .pr{color:var(--g)}
.res.lose{border:1px solid #fca5a5;background:var(--r-bg)} .res.lose .pr{color:var(--r)}
.res.mid{background:var(--a-bg)}
.res.na{background:#f8fafc;color:var(--muted)} .res.na .pr{color:#94a3b8;font-size:16px;margin:12px 0 2px}
.res.pending{background:#fffbeb;border:1px dashed #f59e0b}.res.pending .pr{color:#b45309;font-size:15px;margin:10px 0}
.badge{position:absolute;top:12px;right:12px;font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--g);color:#fff}
.verdict{margin-top:15px;font-size:14px;background:#f8fafc;border:1px solid var(--line);border-radius:10px;padding:11px 13px}
details.admin{margin-bottom:18px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:6px 20px;box-shadow:0 1px 3px rgba(15,23,42,.05)}
details.admin summary{cursor:pointer;font-size:13.5px;font-weight:700;color:#334155;padding:12px 0;list-style:none}
details.admin summary::-webkit-details-marker{display:none}
details.admin summary::before{content:'\2699  ';}
.mkgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px 16px;padding:6px 0 16px}
.mkgrid .grp{border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.mkgrid .grp h3{font-size:12px;margin:0 0 10px;color:#334155;text-transform:uppercase;letter-spacing:.04em}
.mkgrid .pair{display:flex;gap:10px}
.mkgrid .pair .f label{font-size:10.5px}
.mkgrid input{width:100%;padding:7px 8px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;text-align:right}
.adminnote{font-size:12px;color:var(--muted);padding:0 0 12px}
.chartbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px}
.legend span{display:inline-flex;align-items:center;gap:6px;color:#334155;font-weight:600}
.dot{width:12px;height:3px;border-radius:2px;display:inline-block}
.metricsel{font-size:13px}.metricsel select{padding:5px 8px;border-radius:8px;border:1px solid #cbd5e1}
.chartbox{position:relative;height:360px}
.chartnote{font-size:12.5px;color:var(--muted);margin:10px 0 0}
.loading{padding:40px 22px;color:var(--muted);font-size:14px}
</style></head>
<body><div class="wrap">
<div id="app" style="display:none">

<div class="panel">
<div class="calcrow">
  <div class="f country"><label>Country</label><select id="country"></select></div>
  <div class="f small"><label>Weight kg</label><input id="wt" type="number" min="0" step="0.1" value="5"/></div>
  <div class="f small"><label>L cm</label><input id="L" type="number" min="0" step="1" placeholder="—"/></div>
  <div class="f small"><label>W cm</label><input id="W" type="number" min="0" step="1" placeholder="—"/></div>
  <div class="f small"><label>H cm</label><input id="H" type="number" min="0" step="1" placeholder="—"/></div>
</div>
<div class="wt">
  <div><div class="lab">Volumetric</div><b id="volw">—</b></div>
  <div><div class="lab">Chargeable</div><b id="chgw">—</b></div>
  <div><div class="lab">Driven by</div><b id="driver">—</b></div>
</div>
<div class="results" id="results"></div>
<div class="verdict" id="verdict"></div>
</div>

<details class="admin">
<summary>Pricing settings (admin)</summary>
<div class="adminnote">Markups apply to carrier cost (base + fuel). "Cost" = your internal uplift; "Sell" = charge-out to the customer. Fuel is set in the background (values from the server config; UPS list fuel has your 25% discount applied and passed on to the customer).</div>
<div class="mkgrid">
  <div class="grp"><h3>DPD Road<br><span style="font-weight:400;text-transform:none;color:var(--muted)">Classic Parcel &amp; ExpressPak</span></h3>
    <div class="pair"><div class="f"><label>Cost %</label><input id="mkRoadCost" type="number" step="0.5"/></div>
      <div class="f"><label>Sell %</label><input id="mkRoadSell" type="number" step="0.5"/></div></div></div>
  <div class="grp"><h3>DPD Air<br><span style="font-weight:400;text-transform:none;color:var(--muted)">Classic Air &amp; Air Express</span></h3>
    <div class="pair"><div class="f"><label>Cost %</label><input id="mkAirCost" type="number" step="0.5"/></div>
      <div class="f"><label>Sell %</label><input id="mkAirSell" type="number" step="0.5"/></div></div></div>
  <div class="grp"><h3>UPS<br><span style="font-weight:400;text-transform:none;color:var(--muted)">Express Saver &amp; Standard</span></h3>
    <div class="pair"><div class="f"><label>Cost %</label><input id="mkUpsCost" type="number" step="0.5"/></div>
      <div class="f"><label>Sell %</label><input id="mkUpsSell" type="number" step="0.5"/></div></div></div>
</div>
</details>

<div class="panel">
<div class="chartbar">
  <div class="legend" id="legend"></div>
  <div class="metricsel">Show: <select id="metric">
    <option value="sell">Customer sell price</option>
    <option value="cost">Carrier cost (base + fuel)</option>
    <option value="base">Base rate only</option>
  </select></div>
</div>
<div class="chartbox"><canvas id="chart"></canvas></div>
<p class="chartnote" id="chartnote"></p>
</div>

</div>
<div class="loading" id="loading">Loading rates…</div>
</div>
<script>
let P, bands, FUEL, CAPS;
const money=v=>v==null?'—':'£'+v.toFixed(2), $=id=>document.getElementById(id);
const num=id=>{const v=parseFloat($(id).value);return isNaN(v)?0:v;};
const MK=()=>({dpdRoad:{cost:num('mkRoadCost'),sell:num('mkRoadSell')},
               dpdAir:{cost:num('mkAirCost'),sell:num('mkAirSell')},
               ups:{cost:num('mkUpsCost'),sell:num('mkUpsSell')}});
const SERVICES=[
 {key:'ca',name:'DPD Classic Air',       fuel:'dpd', mk:'dpdAir', type:'band',src:'dpd_classic',    color:'#2563eb'},
 {key:'ae',name:'DPD Air Express',       fuel:'dpd', mk:'dpdAir', type:'band',src:'dpd_express',    color:'#7c3aed'},
 {key:'ep',name:'DPD Classic ExpressPak',fuel:'dpd', mk:'dpdRoad',type:'flat',src:'dpd_expresspak', cap:'ep', color:'#db2777'},
 {key:'cp',name:'DPD Classic Parcel',    fuel:'dpd', mk:'dpdRoad',type:'flat',src:'dpd_parcel',     cap:'cp', color:'#0891b2'},
 {key:'ux',name:'UPS Express Saver',     fuel:'upsx',mk:'ups',    type:'zone',src:'ups',            color:'#0f766e'},
 {key:'us',name:'UPS Standard',          fuel:'upss',mk:'ups',    type:'pending',                   color:'#ea580c'},
];
const csel=$('country');
const zoneFor=c=>P.c2zone[c]||'';
function build(base,svc){
  if(base==null) return {base:null};
  const fp=FUEL[svc.fuel]||0, fuel=base*fp/100, cost=base+fuel;
  const m=MK()[svc.mk]||{cost:0,sell:0};
  return {base,fp,fuel,cost,our:cost*(1+m.cost/100),sell:cost*(1+m.sell/100)};
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
  const rows=SERVICES.map(svc=>{const b=baseRate(svc,c,chg);return{svc,b,built:build(b.price,svc)};}).filter(x=>x.b.avail);
  const sells=rows.filter(x=>x.b.price!=null).map(x=>x.built.sell);
  const min=sells.length?Math.min(...sells):null,max=sells.length?Math.max(...sells):null;
  const R=$('results');R.innerHTML='';
  rows.forEach(({svc,b,built})=>{
    const d=document.createElement('div');let cls='res';
    if(b.pending)cls+=' pending';else if(b.price==null)cls+=' na';
    else if(built.sell===min&&sells.length>1)cls+=' win';
    else if(built.sell===max&&sells.length>1)cls+=' lose';else cls+=' mid';
    d.className=cls;
    const head=`<div class="car"><span class="swatch" style="background:${svc.color}"></span>${svc.name}</div>`;
    if(b.pending)d.innerHTML=head+`<div class="pr">pending</div><div class="brk">${b.note}</div>`;
    else if(b.price==null)d.innerHTML=head+`<div class="pr">n/a</div><div class="brk">${b.note||'no rate'}</div>`;
    else{const badge=(built.sell===min&&sells.length>1)?'<span class="badge">CHEAPEST</span>':'';
      const bt=typeof b.band==='number'?b.band+' kg':b.band;
      d.innerHTML=badge+head+`<div class="pr">${money(built.sell)}</div><div class="sub">customer sell</div>
        <div class="brk">
          <div class="row"><span>Base (${bt})</span><span>${money(built.base)}</span></div>
          <div class="row"><span>Fuel ${built.fp.toFixed(1)}%</span><span>${money(built.fuel)}</span></div>
          <div class="row"><span>Carrier cost</span><span>${money(built.cost)}</span></div>
          <div class="row"><span>Your price</span><span>${money(built.our)}</span></div>
          <div class="row sell"><span>Customer sell</span><span>${money(built.sell)}</span></div></div>`;}
    R.appendChild(d);
  });
  const v=$('verdict');
  if(!chg)v.innerHTML='Enter a weight to compare.';
  else if(sells.length<2)v.innerHTML=`Only one priced service for <b>${c}</b> at <b>${chg.toFixed(2)} kg</b>.`;
  else{const w=rows.find(x=>x.b.price!=null&&x.built.sell===min);
    const o=sells.filter(p=>p!==min).sort((a,b)=>a-b),nb=o[0],save=nb-min,pct=save/nb*100;
    v.innerHTML=`Cheapest for <b>${c}</b> at <b>${chg.toFixed(2)} kg</b>: <b style="color:var(--g)">${w.svc.name}</b> — customer <b>${money(w.built.sell)}</b>, <b>£${save.toFixed(2)}</b> (${pct.toFixed(1)}%) cheaper than next best. <span style="color:var(--muted)">Your cost ${money(w.built.cost)}.</span>`;}
  drawChart(c);
}
function drawChart(c){
  const metric=$('metric').value;
  const ds=[],leg=[];
  SERVICES.forEach(svc=>{let data=null;
    if(svc.type==='band'){const arr=P[svc.src][c];if(arr)data=arr.map(p=>p==null?null:build(p,svc)[metric]);}
    else if(svc.type==='flat'){const p=P[svc.src][c];if(p!=null){const cap=CAPS[svc.cap];data=bands.map(w=>w>cap+1e-9?null:build(p,svc)[metric]);}}
    else if(svc.type==='zone'){const zone=zoneFor(c),z=P[svc.src][zone];if(zone&&z)data=bands.map(w=>{const r=baseRate(svc,c,w);return r.price==null?null:build(r.price,svc)[metric];});}
    if(data){ds.push({label:svc.name,data,borderColor:svc.color,borderWidth:2.4,tension:.12,pointRadius:0,spanGaps:false});
      leg.push(`<span><span class="dot" style="background:${svc.color}"></span>${svc.name}</span>`);}});
  $('legend').innerHTML=leg.join('');
  const lbl={sell:'Customer sell (£)',cost:'Carrier cost (£, incl. fuel)',base:'Base rate (£)'}[metric];
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
function boot(){
  bands=P.bands;
  const s=P.settings||{fuel:{dpd:18,upsxList:46.25,upssList:29,upsDiscount:0.25},caps:{cp:31.5,ep:3},markups:{dpdRoad:{cost:6,sell:12},dpdAir:{cost:12,sell:18},ups:{cost:0,sell:30}}};
  FUEL={dpd:s.fuel.dpd, upsx:s.fuel.upsxList*(1-s.fuel.upsDiscount), upss:s.fuel.upssList*(1-s.fuel.upsDiscount)};
  CAPS={cp:s.caps.cp, ep:s.caps.ep};
  P.countries.forEach(c=>csel.appendChild(new Option(c,c)));
  csel.value=P.countries.includes('USA')?'USA':P.countries[0];
  $('mkRoadCost').value=s.markups.dpdRoad.cost; $('mkRoadSell').value=s.markups.dpdRoad.sell;
  $('mkAirCost').value=s.markups.dpdAir.cost;  $('mkAirSell').value=s.markups.dpdAir.sell;
  $('mkUpsCost').value=s.markups.ups.cost;     $('mkUpsSell').value=s.markups.ups.sell;
  ['country','wt','L','W','H','metric','mkRoadCost','mkRoadSell','mkAirCost','mkAirSell','mkUpsCost','mkUpsSell']
    .forEach(id=>$(id).addEventListener('input',calc));
  $('metric').addEventListener('change',calc);
  $('loading').style.display='none'; $('app').style.display='';
  calc();
}
fetch('/api/config').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
  .then(cfg=>{P=cfg;boot();})
  .catch(e=>{$('loading').textContent='Failed to load rates: '+e.message;});
</script>
</body></html>'''

with open(os.path.join(PUBLIC, 'index.html'), 'w') as f:
    f.write(HTML)
print('wrote public/index.html', len(HTML), 'bytes; chart.umd.js present:',
      os.path.exists(os.path.join(PUBLIC, 'chart.umd.js')))
