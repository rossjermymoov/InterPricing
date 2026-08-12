#!/usr/bin/env python3
# Generates ../public/index.html — calculator + auth + admin Settings (fuel by service, accessorials, team).
import os, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PUBLIC = os.path.join(ROOT, 'public')
os.makedirs(PUBLIC, exist_ok=True)
for cand in [
    os.path.join(ROOT, 'node_modules', 'chart.js', 'dist', 'chart.umd.js'),
    os.path.join(os.path.dirname(ROOT), 'node_modules', 'chart.js', 'dist', 'chart.umd.js'),
]:
    if os.path.exists(cand):
        shutil.copyfile(cand, os.path.join(PUBLIC, 'chart.umd.js')); break

HTML = r'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>International Rate Calculator</title>
<script src="/chart.umd.js"></script>
<style>
:root{--ink:#0f172a;--muted:#64748b;--line:#e2e8f0;--bg:#f1f5f9;--card:#fff;
--g:#15803d;--g-bg:#dcfce7;--a:#b45309;--a-bg:#fef3c7;--r:#b91c1c;--r-bg:#fee2e2;--teal:#0f766e;}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.5}
.wrap{max-width:1160px;margin:0 auto;padding:22px 22px 56px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(15,23,42,.05);margin-bottom:18px}
h2{font-size:15px;margin:0 0 14px;letter-spacing:-.01em}
.calcrow{display:flex;flex-wrap:wrap;gap:12px;align-items:end}
.f label{display:block;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
.f input,.f select{padding:9px 10px;border:1px solid #cbd5e1;border-radius:9px;font-size:14px;background:#fff;color:var(--ink)}
.f input:focus,.f select:focus{outline:2px solid var(--teal);border-color:var(--teal)}
.f.country{flex:1;min-width:180px}.f.country select{width:100%}
.f.small input{width:78px;text-align:right;font-variant-numeric:tabular-nums}
.toggles{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line)}
.tg{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:#334155}
.tg input{width:16px;height:16px;accent-color:var(--teal)}
.wt{display:flex;gap:20px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line);font-size:13.5px}
.wt div b{font-size:17px}.wt .lab{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:700}
.results{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:13px;margin-top:16px}
.res{border:1px solid var(--line);border-radius:14px;padding:15px;position:relative;background:#fff}
.res .car{font-size:12.5px;font-weight:700;color:#334155;display:flex;align-items:center;gap:7px}
.res .swatch{width:10px;height:10px;border-radius:3px;flex:none}
.res .pr{font-size:25px;font-weight:800;letter-spacing:-.02em;margin:6px 0 0}
.res .sub{font-size:11px;color:var(--muted);margin-bottom:8px}
.res .brk{font-size:11.5px;color:#475569;line-height:1.6}
.res .brk .blk{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:800;margin:8px 0 3px}
.res .brk .row{display:flex;justify-content:space-between;gap:8px}
.res .brk .row.tot{font-weight:700;color:var(--ink);border-top:1px solid var(--line);margin-top:3px;padding-top:3px}
.res.win{border:2px solid var(--g);background:var(--g-bg)} .res.win .pr{color:var(--g)}
.res.lose{border:1px solid #fca5a5;background:var(--r-bg)} .res.lose .pr{color:var(--r)}
.res.mid{background:var(--a-bg)}
.res.na{background:#f8fafc;color:var(--muted)} .res.na .pr{color:#94a3b8;font-size:16px;margin:12px 0 2px}
.badge{position:absolute;top:12px;right:12px;font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--g);color:#fff}
.verdict{margin-top:15px;font-size:14px;background:#f8fafc;border:1px solid var(--line);border-radius:10px;padding:11px 13px}
.adminnote{font-size:12.5px;color:var(--muted);margin:0 0 14px}
.chartbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px}
.legend span{display:inline-flex;align-items:center;gap:6px;color:#334155;font-weight:600}
.dot{width:12px;height:3px;border-radius:2px;display:inline-block}
.metricsel{font-size:13px}.metricsel select{padding:5px 8px;border-radius:8px;border:1px solid #cbd5e1}
.chartbox{position:relative;height:360px}
.chartnote{font-size:12.5px;color:var(--muted);margin:10px 0 0}
.loading{padding:40px 22px;color:var(--muted);font-size:14px}
.banner{display:none;background:var(--a-bg);border:1px solid #fde68a;color:var(--a);border-radius:12px;padding:12px 16px;font-size:13px;margin-bottom:16px}
.authbox{max-width:390px;margin:7vh auto;background:#fff;border:1px solid var(--line);border-radius:16px;padding:26px;box-shadow:0 4px 16px rgba(15,23,42,.07)}
.authbox h1{font-size:19px;margin:0 0 4px;letter-spacing:-.02em}
.authbox p.q{color:var(--muted);font-size:13px;margin:0 0 16px}
.authbox label{display:block;font-size:12px;font-weight:700;color:#475569;margin:12px 0 5px}
.authbox input{width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:9px;font-size:14px}
.authbox button{margin-top:18px;width:100%;padding:11px;border:0;border-radius:9px;background:var(--teal);color:#fff;font-weight:700;font-size:14px;cursor:pointer}
.err{color:var(--r);font-size:12.5px;margin-top:10px;min-height:16px}
.ok{color:var(--g);font-size:12.5px;margin-left:10px}
header#hdr{display:none;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap}
header#hdr .brand{font-weight:800;letter-spacing:-.01em;font-size:15px}
header#hdr .actions{display:flex;gap:8px;align-items:center}
header#hdr .who{color:var(--muted);font-size:13px;margin-right:4px}
.btn{padding:6px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;cursor:pointer;font-size:13px}
.btn.primary{background:var(--teal);color:#fff;border-color:var(--teal)}
.btn.danger{color:var(--r);border-color:#fca5a5}
.settingshead{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.settingshead h1{font-size:18px;margin:0}
.stable{width:100%;border-collapse:collapse;font-size:13px}
.stable th,.stable td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left}
.stable th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#475569}
.stable input{width:90px;padding:6px 8px;border:1px solid #cbd5e1;border-radius:7px;text-align:right}
.tagpill{font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:999px;background:#eef2ff;color:#3730a3}
.tagpill.auto{background:var(--a-bg);color:var(--a)}
.utable{width:100%;border-collapse:collapse;font-size:13px}
.utable th,.utable td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line)}
.utable th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#475569}
.utable select,.utable input{padding:6px 8px;border:1px solid #cbd5e1;border-radius:7px;font-size:13px}
.miniform{display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin-top:16px;padding-top:14px;border-top:1px dashed var(--line)}
.miniform .f input,.miniform .f select{padding:8px}.miniform .f label{font-size:10.5px}
.rolechip{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#3730a3}
textarea{font-family:inherit;padding:9px 10px;border:1px solid #cbd5e1;border-radius:9px;font-size:13px;resize:vertical}
textarea:focus{outline:2px solid var(--teal);border-color:var(--teal)}
</style></head>
<body><div class="wrap">

<header id="hdr">
  <div class="brand">International Rate Calculator</div>
  <div class="actions">
    <span class="who" id="who"></span>
    <button class="btn" id="settingsBtn" style="display:none">Settings</button>
    <button class="btn" id="pwBtn">Change password</button>
    <button class="btn" id="logoutBtn">Log out</button>
  </div>
</header>

<div class="banner" id="banner"><b>Database not connected.</b> Running in preview mode — logins, admin roles and saving are off. Attach the Postgres service's <code>DATABASE_URL</code> to this app in Railway to enable Settings, users and saving.</div>

<div class="loading" id="loading">Loading…</div>

<div class="authbox" id="setup" style="display:none">
  <h1>Create your admin account</h1>
  <p class="q">First-time setup — this becomes the owner/admin login.</p>
  <label>Your name</label><input id="suName" type="text" autocomplete="name"/>
  <label>Email</label><input id="suEmail" type="email" autocomplete="username"/>
  <label>Password (min 8 characters)</label><input id="suPass" type="password" autocomplete="new-password"/>
  <button id="suBtn">Create admin &amp; sign in</button>
  <div class="err" id="suErr"></div>
</div>

<div class="authbox" id="login" style="display:none">
  <h1>Sign in</h1>
  <p class="q">International Rate Calculator</p>
  <label>Email</label><input id="liEmail" type="email" autocomplete="username"/>
  <label>Password</label><input id="liPass" type="password" autocomplete="current-password"/>
  <button id="liBtn">Sign in</button>
  <div class="err" id="liErr"></div>
</div>

<div class="panel" id="pwPanel" style="display:none">
  <h2>Change your password</h2>
  <div class="miniform">
    <div class="f"><label>Current</label><input id="pwCur" type="password"/></div>
    <div class="f"><label>New (min 8)</label><input id="pwNew" type="password"/></div>
    <button class="btn primary" id="pwSave">Update</button>
    <button class="btn" id="pwCancel">Close</button>
    <span class="ok" id="pwMsg"></span>
  </div>
</div>

<!-- SETTINGS -->
<div id="settings" style="display:none">
  <div class="settingshead"><button class="btn" id="backBtn">← Back to calculator</button><h1>Settings</h1></div>
  <div class="panel">
    <h2>Fuel by service</h2>
    <p class="adminnote">Fuel is applied to the base rate. <b>Cost %</b> = the fuel you pay; <b>Sell %</b> = the fuel you charge the customer. UPS cost and sell are the same (your discounted rate, passed on).</p>
    <table class="stable"><thead><tr><th>Service</th><th>Fuel cost %</th><th>Fuel sell %</th></tr></thead><tbody id="fuelBody"></tbody></table>
  </div>
  <div class="panel">
    <h2>Accessorials</h2>
    <p class="adminnote">UPS accessorial charges. <b>Net</b> = list × (1 − discount). <span class="tagpill">toggle</span> ones apply when ticked on the calculator; <span class="tagpill auto">auto</span> ones apply automatically from weight &amp; dimensions. DPD £ defaults to 0 (DPD accessorials not loaded). Accessorials are added to the base and fuel applies on top.</p>
    <table class="stable"><thead><tr><th>Accessorial</th><th>Carrier</th><th>Trigger</th><th>List £ / Rate %</th><th>Disc % / Min £</th><th>Net</th></tr></thead><tbody id="accBody"></tbody></table>
  </div>
  <div class="panel"><button class="btn primary" id="saveBtn">Save settings</button><span class="ok" id="saveMsg"></span></div>
  <div class="panel" id="teamPanel">
    <h2>Team members</h2>
    <table class="utable"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Reset password</th><th></th></tr></thead><tbody id="usersBody"></tbody></table>
    <div class="miniform">
      <div class="f"><label>Name</label><input id="nuName" type="text"/></div>
      <div class="f"><label>Email</label><input id="nuEmail" type="email"/></div>
      <div class="f"><label>Role</label><select id="nuRole"><option value="sales">sales</option><option value="admin">admin</option></select></div>
      <div class="f"><label>Temp password</label><input id="nuPass" type="text" placeholder="min 8 chars"/></div>
      <button class="btn primary" id="nuAdd">Add user</button>
    </div>
    <div class="err" id="usersErr"></div>
  </div>
</div>

<!-- CALCULATOR -->
<div id="app" style="display:none">
<div class="panel">
<div class="calcrow">
  <div class="f country"><label>Country</label><select id="country"></select></div>
  <div class="f small"><label>Weight kg</label><input id="wt" type="number" min="0" step="0.1" value="5"/></div>
  <div class="f small"><label>L cm</label><input id="L" type="number" min="0" step="1" placeholder="—"/></div>
  <div class="f small"><label>W cm</label><input id="W" type="number" min="0" step="1" placeholder="—"/></div>
  <div class="f small"><label>H cm</label><input id="H" type="number" min="0" step="1" placeholder="—"/></div>
  <div class="f small"><label>Value £</label><input id="goodsValue" type="number" min="0" step="1" value="0"/></div>
</div>
<div class="toggles" id="toggles"></div>
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
    <option value="sell">Customer price</option>
    <option value="cost">Cost price</option>
    <option value="base">Base rate only</option>
  </select></div>
</div>
<div class="chartbox"><canvas id="chart"></canvas></div>
<p class="chartnote" id="chartnote"></p>
</div>
<div class="panel" id="reportPanel">
  <h2>Cheapest by country — report</h2>
  <p class="chartnote" style="margin:0 0 10px">Select destinations below. Uses the weight, dimensions, value and options set above. Run to preview, then open a printable report.</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;margin-bottom:8px">
    <div style="flex:1;min-width:260px">
      <input id="repSearch" placeholder="Search countries…" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:6px;font-size:13px"/>
      <div id="repList" style="max-height:200px;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:8px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:2px 8px"></div>
      <div id="repCount" class="chartnote" style="margin-top:5px"></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="btn" id="repAll">Select all</button>
      <button class="btn" id="repEU">EU</button>
      <button class="btn" id="repClear">Clear</button>
      <button class="btn primary" id="repRun">Run report</button>
      <button class="btn" id="repDoc">Open printable report</button>
    </div>
  </div>
  <div id="repMsg" class="chartnote" style="color:var(--r)"></div>
  <div id="repSummary" style="margin:8px 0;font-size:14px"></div>
  <div style="overflow:auto;max-height:520px"><table class="stable" id="repTable"><thead><tr><th>Country</th><th>Cheapest service</th><th>Customer price</th><th>Next best</th><th>You save</th></tr></thead><tbody id="repBody"></tbody></table></div>
</div>
</div>

</div>
<script>
let P, bands, CAPS, current=null, authEnabled=false, ACTIVE=[];
const $=id=>document.getElementById(id), money=v=>v==null?'—':'£'+v.toFixed(2);
const num=id=>{const el=$(id);const v=el?parseFloat(el.value):NaN;return isNaN(v)?0:v;};
const accList=()=>((P&&P.settings&&P.settings.accessorials)||[]);
const region=c=>{const eu=(P.settings&&P.settings.regions&&P.settings.regions.eu)||[];if(c==='USA')return 'usa';if(eu.includes(c))return 'eu';return 'row';};
function accVal(a){
  if(a.basis==='pctValue'){const pct=$('accPct_'+a.key)?num('accPct_'+a.key):(a.pct||0);const mn=$('accMin_'+a.key)?num('accMin_'+a.key):(a.min||0);return Math.max(pct*num('goodsValue')/100, mn);}
  const l=$('accList_'+a.key)?num('accList_'+a.key):(a.list||0);const d=$('accDisc_'+a.key)?num('accDisc_'+a.key):(a.disc||0);return l*(1-d/100);
}
const accOn=a=>{const el=$('acc_'+a.key);return el&&el.checked;};
const SERVICES=[
 {key:'ca',name:'DPD Classic Air',       carrier:'dpd',type:'band',src:'dpd_classic',    color:'#2563eb'},
 {key:'ae',name:'DPD Air Express',       carrier:'dpd',type:'band',src:'dpd_express',    color:'#7c3aed'},
 {key:'ep',name:'DPD Classic ExpressPak',carrier:'dpd',type:'flat',src:'dpd_expresspak', cap:'ep', color:'#db2777'},
 {key:'cp',name:'DPD Classic Parcel',    carrier:'dpd',type:'flat',src:'dpd_parcel',     cap:'cp', color:'#0891b2'},
 {key:'ux',name:'UPS Express Saver',     carrier:'ups',type:'zone',src:'ups_express', zmap:'c2zone_express',  color:'#0f766e'},
 {key:'us',name:'UPS Standard',          carrier:'ups',type:'zone',src:'ups_standard',zmap:'c2zone_standard', color:'#ea580c'},
];
const csel=$('country');
const zoneFor=(svc,c)=>(P[svc.zmap]||{})[c]||'';
function fuelOf(svc){const fc=$('fc_'+svc.key),fs=$('fs_'+svc.key);
  return {cost: fc?(parseFloat(fc.value)||0):0, sell: fs?(parseFloat(fs.value)||0):0};}
function activeAcc(c,actual,L,W,H){
  const sides=[L,W,H].filter(x=>x>0).sort((a,b)=>b-a);
  const longest=sides[0]||0, second=sides[1]||0;
  const girth=(L&&W&&H)?(longest+2*(sides[1]||0)+2*(sides[2]||0)):0;
  const out=[];
  accList().forEach(a=>{let t=false;
    if(a.cond==='toggle') t=accOn(a);
    else if(a.cond==='always') t=true;
    else if(a.cond==='countryIn') t=(a.countries||[]).includes(c);
    else if(a.cond==='region') t=region(c)===a.region;
    else if(a.cond==='auto'){
      if(a.key==='addlHandling') t = actual>25 || longest>100 || second>76;
      else if(a.key==='largePackage') t = girth>300;
      else if(a.key==='overMax') t = actual>70 || longest>274 || girth>400;
    }
    if(t) out.push(a);
  });
  return out;
}
function accAmount(a,svc){if(a.applyTo!==svc.carrier) return 0;return Math.round(accVal(a)*100)/100;}
function build(rawBase,svc){
  if(rawBase==null) return {base:null};
  const fuelExtras=[],flatExtras=[];let fuelable=0,flat=0;
  ACTIVE.forEach(a=>{const amt=accAmount(a,svc);if(amt>0){if(a.fuelable){fuelable+=amt;fuelExtras.push([a.name,amt]);}else{flat+=amt;flatExtras.push([a.name,amt]);}}});
  const cbase=rawBase+fuelable, f=fuelOf(svc);
  const costFuel=cbase*f.cost/100, totalCost=cbase+costFuel+flat;
  const sellFuel=cbase*f.sell/100, sell=cbase+sellFuel+flat;
  return {raw:rawBase,fuelExtras,flatExtras,cbase,fc:f.cost,fs:f.sell,costFuel,totalCost,sellFuel,sell,cost:totalCost,base:rawBase};
}
function baseRate(svc,c,chg){
  if(svc.type==='band'){const arr=P[svc.src][c];if(!arr)return{price:null,avail:false};
    if(chg>bands[bands.length-1]+1e-9)return{price:null,avail:true,note:'over '+bands[bands.length-1]+' kg'};
    for(let i=0;i<bands.length;i++)if(bands[i]>=chg-1e-9)return{price:arr[i],avail:true,band:bands[i]};
    return{price:null,avail:true};}
  if(svc.type==='flat'){const p=P[svc.src][c];if(p==null)return{price:null,avail:false};
    const cap=CAPS[svc.cap];if(chg>cap+1e-9)return{price:null,avail:true,note:'over '+cap+' kg cap'};
    return{price:p,avail:true,band:'flat ≤'+cap+'kg'};}
  if(svc.type==='zone'){const zone=zoneFor(svc,c),z=zone&&P[svc.src][zone];
    if(!zone||!z)return{price:null,avail:false};
    const b=z.bands,mB=b[b.length-1][0];
    if(chg<=mB+1e-9){for(const[w,pr]of b)if(w>=chg-1e-9)return{price:pr,avail:true,band:w};}
    return{price:b[b.length-1][1],avail:true,band:'>'+mB+' kg'};}
  return{price:null,avail:false};
}
let chart;
function calc(){
  const c=csel.value,actual=num('wt'),L=num('L'),W=num('W'),H=num('H');
  const vol=(L&&W&&H)?(L*W*H)/P.divisor:0, chg=Math.max(actual,vol);
  ACTIVE=activeAcc(c,actual,L,W,H);
  $('volw').textContent=vol?vol.toFixed(2)+' kg':'—';
  $('chgw').textContent=chg?chg.toFixed(2)+' kg':'—';
  $('driver').textContent=!chg?'—':(vol>actual?'volumetric':'actual weight');
  const rows=SERVICES.map(svc=>{const b=baseRate(svc,c,chg);return{svc,b,built:build(b.price,svc)};}).filter(x=>x.b.avail);
  const sells=rows.filter(x=>x.b.price!=null).map(x=>x.built.sell);
  const min=sells.length?Math.min(...sells):null,max=sells.length?Math.max(...sells):null;
  const R=$('results');R.innerHTML='';
  rows.forEach(({svc,b,built})=>{
    const d=document.createElement('div');let cls='res';
    if(b.price==null)cls+=' na';
    else if(built.sell===min&&sells.length>1)cls+=' win';
    else if(built.sell===max&&sells.length>1)cls+=' lose';else cls+=' mid';
    d.className=cls;
    const head=`<div class="car"><span class="swatch" style="background:${svc.color}"></span>${svc.name}</div>`;
    if(b.price==null)d.innerHTML=head+`<div class="pr">n/a</div><div class="brk">${b.note||'no rate'}</div>`;
    else{const badge=(built.sell===min&&sells.length>1)?'<span class="badge">CHEAPEST</span>':'';
      const bt=typeof b.band==='number'?b.band+' kg':b.band;
      const fuelLines=built.fuelExtras.map(([n,v])=>`<div class="row"><span>${n}</span><span>${money(v)}</span></div>`).join('');
      const flatLines=built.flatExtras.map(([n,v])=>`<div class="row"><span>${n}</span><span>${money(v)}</span></div>`).join('');
      d.innerHTML=badge+head+`<div class="pr">${money(built.sell)}</div><div class="sub">customer price</div>
        <div class="brk">
          <div class="blk">Cost</div>
          <div class="row"><span>Base rate (${bt})</span><span>${money(built.raw)}</span></div>
          ${fuelLines}
          <div class="row"><span>Fuel (${built.fc.toFixed(1)}%)</span><span>${money(built.costFuel)}</span></div>
          ${flatLines}
          <div class="row tot"><span>Total cost price</span><span>${money(built.totalCost)}</span></div>
          <div class="blk">Customer</div>
          <div class="row"><span>Base rate (${bt})</span><span>${money(built.raw)}</span></div>
          ${fuelLines}
          <div class="row"><span>Fuel (${built.fs.toFixed(1)}%)</span><span>${money(built.sellFuel)}</span></div>
          ${flatLines}
          <div class="row tot"><span>Total customer price</span><span>${money(built.sell)}</span></div>
        </div>`;}
    R.appendChild(d);
  });
  const v=$('verdict');
  if(!chg)v.innerHTML='Enter a weight to compare.';
  else if(sells.length<2)v.innerHTML=`Only one priced service for <b>${c}</b> at <b>${chg.toFixed(2)} kg</b>.`;
  else{const w=rows.find(x=>x.b.price!=null&&x.built.sell===min);
    const tags=ACTIVE.map(a=>a.name);
    const o=sells.filter(p=>p!==min).sort((a,b)=>a-b),nb=o[0],save=nb-min,pct=save/nb*100;
    v.innerHTML=`Cheapest for <b>${c}</b> at <b>${chg.toFixed(2)} kg</b>${tags.length?' ('+tags.join(', ')+')':''}: <b style="color:var(--g)">${w.svc.name}</b> — customer <b>${money(w.built.sell)}</b>, <b>£${save.toFixed(2)}</b> (${pct.toFixed(1)}%) cheaper than next best. <span style="color:var(--muted)">Your cost ${money(w.built.totalCost)}.</span>`;}
  drawChart(c);
}
function drawChart(c){
  const metric=$('metric').value, key={sell:'sell',cost:'cost',base:'base'}[metric];
  const ds=[],leg=[];
  SERVICES.forEach(svc=>{let data=null;
    if(svc.type==='band'){const arr=P[svc.src][c];if(arr)data=arr.map(p=>p==null?null:build(p,svc)[key]);}
    else if(svc.type==='flat'){const p=P[svc.src][c];if(p!=null){const cap=CAPS[svc.cap];data=bands.map(w=>w>cap+1e-9?null:build(p,svc)[key]);}}
    else if(svc.type==='zone'){const zone=zoneFor(svc,c),z=zone&&P[svc.src][zone];if(zone&&z)data=bands.map(w=>{const r=baseRate(svc,c,w);return r.price==null?null:build(r.price,svc)[key];});}
    if(data){ds.push({label:svc.name,data,borderColor:svc.color,borderWidth:2.4,tension:.12,pointRadius:0,spanGaps:false});
      leg.push(`<span><span class="dot" style="background:${svc.color}"></span>${svc.name}</span>`);}});
  $('legend').innerHTML=leg.join('');
  const lbl={sell:'Customer price (£)',cost:'Cost price (£)',base:'Base rate (£)'}[metric];
  const notes=[];
  if(!P.c2zone_express[c])notes.push('UPS Express Saver: no zone for this country.');
  if(!P.c2zone_standard[c]&&P.dpd_parcel[c]!=null)notes.push('UPS Standard: not available for this country.');
  $('chartnote').textContent=notes.join(' ');
  if(chart){chart.data.labels=bands;chart.data.datasets=ds;chart.options.scales.y.title.text=lbl;chart.update();return;}
  chart=new Chart($('chart'),{type:'line',data:{labels:bands,datasets:ds},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
      plugins:{legend:{display:false},tooltip:{callbacks:{title:i=>i[0].label+' kg',label:x=>x.dataset.label+': '+money(x.parsed.y)}}},
      scales:{x:{title:{display:true,text:'Chargeable weight (kg)'},ticks:{maxTicksLimit:16}},
        y:{title:{display:true,text:lbl},ticks:{callback:v=>'£'+v}}}}});
}
function buildFuelTable(fbs){
  const tb=$('fuelBody');tb.innerHTML='';
  SERVICES.forEach(svc=>{const cfg=(fbs&&fbs[svc.key])||{cost:0,sell:0};
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${svc.name}</td><td><input id="fc_${svc.key}" type="number" step="0.01" value="${cfg.cost}"/></td><td><input id="fs_${svc.key}" type="number" step="0.01" value="${cfg.sell}"/></td>`;
    tb.appendChild(tr);});
  SERVICES.forEach(svc=>{$('fc_'+svc.key).addEventListener('input',calc);$('fs_'+svc.key).addEventListener('input',calc);});
}
function accNetDisplay(a){
  if(a.basis==='pctValue'){const pct=$('accPct_'+a.key)?num('accPct_'+a.key):(a.pct||0);const mn=$('accMin_'+a.key)?num('accMin_'+a.key):(a.min||0);return pct+'% · min '+money(mn);}
  const l=$('accList_'+a.key)?num('accList_'+a.key):(a.list||0);const d=$('accDisc_'+a.key)?num('accDisc_'+a.key):(a.disc||0);return money(l*(1-d/100));
}
function buildAccTable(){
  const tb=$('accBody');tb.innerHTML='';
  const trg=a=>a.cond==='auto'?'auto (size/wt)':(a.cond==='always'?'always':(a.cond==='countryIn'?(a.countries||[]).join(','):(a.cond==='region'?a.region.toUpperCase():'toggle')));
  accList().forEach(a=>{const tr=document.createElement('tr');
    let cells;
    if(a.basis==='pctValue') cells=`<td><input id="accPct_${a.key}" type="number" step="0.1" value="${a.pct||0}"/> %</td><td><input id="accMin_${a.key}" type="number" step="0.01" value="${a.min||0}"/></td>`;
    else cells=`<td><input id="accList_${a.key}" type="number" step="0.01" value="${a.list||0}"/></td><td><input id="accDisc_${a.key}" type="number" step="1" value="${a.disc||0}"/></td>`;
    tr.innerHTML=`<td>${a.name}</td><td>${(a.applyTo||'').toUpperCase()}</td><td><span class="tagpill${a.cond!=='toggle'?' auto':''}">${trg(a)}</span></td>${cells}<td><span id="accNet_${a.key}"></span></td>`;
    tb.appendChild(tr);});
  accList().forEach(a=>{const upd=()=>{$('accNet_'+a.key).textContent=accNetDisplay(a);calc();};
    if(a.basis==='pctValue'){$('accPct_'+a.key).addEventListener('input',upd);$('accMin_'+a.key).addEventListener('input',upd);}
    else{$('accList_'+a.key).addEventListener('input',upd);$('accDisc_'+a.key).addEventListener('input',upd);}
    $('accNet_'+a.key).textContent=accNetDisplay(a);});
}
function renderToggles(){
  const t=$('toggles');t.innerHTML='';
  accList().filter(a=>a.cond==='toggle').forEach(a=>{const lab=document.createElement('label');lab.className='tg';
    lab.innerHTML=`<input type="checkbox" id="acc_${a.key}"/> ${a.name}`;t.appendChild(lab);
    lab.querySelector('input').addEventListener('change',calc);});
}
function bootCalc(){
  bands=P.bands;
  const s=P.settings||{fuelByService:{},caps:{cp:31.5,ep:3},accessorials:[]};
  CAPS={cp:(s.caps&&s.caps.cp)||31.5, ep:(s.caps&&s.caps.ep)||3};
  buildFuelTable(s.fuelByService||{});
  buildAccTable();
  renderToggles();
  buildRepList();
  if(!csel.options.length){
    P.countries.forEach(c=>csel.appendChild(new Option(c,c)));
    csel.value=P.countries.includes('USA')?'USA':P.countries[0];
    ['country','wt','L','W','H','goodsValue','metric'].forEach(id=>$(id).addEventListener('input',calc));
    $('metric').addEventListener('change',calc);
  }
  calc();
}

const SCREENS=['loading','setup','login','app','settings'];
function screen(id){SCREENS.forEach(s=>$(s).style.display='none');
  const authed=(id==='app'||id==='settings');$(id).style.display='block';
  $('hdr').style.display=authed?'flex':'none';if(!authed)$('pwPanel').style.display='none';}
const jpost=(p,b)=>fetch(p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b||{})});
const jput =(p,b)=>fetch(p,{method:'PUT', headers:{'Content-Type':'application/json'},body:JSON.stringify(b||{})});
const jpatch=(p,b)=>fetch(p,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(b||{})});
const jdel=p=>fetch(p,{method:'DELETE'});
function applyChrome(){
  const admin=(current&&current.role==='admin');
  $('settingsBtn').style.display=(!authEnabled||admin)?'':'none';
  $('pwBtn').style.display=authEnabled?'':'none';
  $('logoutBtn').style.display=authEnabled?'':'none';
  $('teamPanel').style.display=authEnabled?'block':'none';
  $('banner').style.display=authEnabled?'none':'block';
  $('who').textContent=current?((current.name||current.email)+' · '+current.role):'';
}
async function loadConfigAndApp(){
  const r=await fetch('/api/config'); if(r.status===401){screen('login');return;}
  P=await r.json(); if(!P||!P.bands){screen('login');return;}
  bootCalc(); applyChrome(); screen('app');
}
async function init(){
  try{
    const ns=await (await fetch('/api/needs-setup')).json();
    authEnabled=!!ns.authEnabled;
    if(!authEnabled){current=null;await loadConfigAndApp();return;}
    if(ns.needsSetup){screen('setup');return;}
    const me=await fetch('/api/me');
    if(me.ok){current=(await me.json()).user;await loadConfigAndApp();}else screen('login');
  }catch(e){$('loading').textContent='Failed to start: '+e.message;}
}
$('suBtn').onclick=async()=>{$('suErr').textContent='';
  const r=await jpost('/api/setup',{name:$('suName').value,email:$('suEmail').value,password:$('suPass').value});
  const d=await r.json(); if(!r.ok){$('suErr').textContent=d.error||'Setup failed';return;} current=d.user; await loadConfigAndApp();};
$('liBtn').onclick=async()=>{$('liErr').textContent='';
  const r=await jpost('/api/login',{email:$('liEmail').value,password:$('liPass').value});
  const d=await r.json(); if(!r.ok){$('liErr').textContent=d.error||'Login failed';return;} current=d.user; await loadConfigAndApp();};
$('liPass').addEventListener('keydown',e=>{if(e.key==='Enter')$('liBtn').click();});
$('logoutBtn').onclick=async()=>{await jpost('/api/logout',{});current=null;screen('login');};
$('pwBtn').onclick=()=>{const p=$('pwPanel');p.style.display=p.style.display==='none'?'block':'none';$('pwMsg').textContent='';};
$('pwCancel').onclick=()=>{$('pwPanel').style.display='none';};
$('pwSave').onclick=async()=>{$('pwMsg').className='ok';$('pwMsg').textContent='';
  const r=await jpost('/api/me/password',{current:$('pwCur').value,next:$('pwNew').value});
  const d=await r.json(); if(!r.ok){$('pwMsg').className='err';$('pwMsg').textContent=d.error||'Failed';return;}
  $('pwMsg').textContent='Password updated.';$('pwCur').value='';$('pwNew').value='';};
$('settingsBtn').onclick=async()=>{screen('settings');if(authEnabled)await refreshUsers();};
$('backBtn').onclick=()=>{screen('app');calc();};
$('saveBtn').onclick=async()=>{$('saveMsg').className='ok';$('saveMsg').textContent='';
  const fbs={};SERVICES.forEach(svc=>{fbs[svc.key]={name:svc.name,cost:num('fc_'+svc.key),sell:num('fs_'+svc.key)};});
  const acc=accList().map(a=>{const o={key:a.key};if(a.basis==='pctValue'){o.pct=num('accPct_'+a.key);o.min=num('accMin_'+a.key);}else{o.list=num('accList_'+a.key);o.disc=num('accDisc_'+a.key);}return o;});
  const r=await jput('/api/settings',{fuelByService:fbs,accessorials:acc});const d=await r.json();
  if(!r.ok){$('saveMsg').className='err';$('saveMsg').textContent=(d.error||'Save failed')+(authEnabled?'':' — connect the database to save.');return;}
  P.settings=Object.assign(P.settings||{},d.settings);$('saveMsg').textContent='Saved. Applies to everyone.';calc();};
async function refreshUsers(){
  $('usersErr').textContent='';
  const r=await fetch('/api/users'); if(!r.ok){$('usersErr').textContent='Could not load users';return;}
  const {users}=await r.json(); const tb=$('usersBody'); tb.innerHTML='';
  users.forEach(u=>{const tr=document.createElement('tr');const self=current&&u.id===current.id;
    tr.innerHTML=`<td>${u.name||'—'}</td><td>${u.email}</td>
      <td><select data-id="${u.id}" class="roleSel"><option value="sales"${u.role==='sales'?' selected':''}>sales</option><option value="admin"${u.role==='admin'?' selected':''}>admin</option></select></td>
      <td><input type="password" class="pwSet" data-id="${u.id}" placeholder="new pw" style="width:110px"/> <button class="btn pwSetBtn" data-id="${u.id}">Set</button></td>
      <td>${self?'<span class="rolechip">you</span>':'<button class="btn danger delBtn" data-id="'+u.id+'">Delete</button>'}</td>`;
    tb.appendChild(tr);});
  tb.querySelectorAll('.roleSel').forEach(s=>s.onchange=async()=>{const r=await jpatch('/api/users/'+s.dataset.id,{role:s.value});
    if(!r.ok){const d=await r.json();$('usersErr').textContent=d.error||'Update failed';await refreshUsers();}});
  tb.querySelectorAll('.pwSetBtn').forEach(btn=>btn.onclick=async()=>{const inp=tb.querySelector('.pwSet[data-id="'+btn.dataset.id+'"]');
    const r=await jpatch('/api/users/'+btn.dataset.id,{password:inp.value});const d=await r.json();
    $('usersErr').className=r.ok?'ok':'err';$('usersErr').textContent=r.ok?'Password updated.':(d.error||'Failed');inp.value='';});
  tb.querySelectorAll('.delBtn').forEach(btn=>btn.onclick=async()=>{const r=await jdel('/api/users/'+btn.dataset.id);
    if(!r.ok){const d=await r.json();$('usersErr').textContent=d.error||'Delete failed';return;}await refreshUsers();});
}
$('nuAdd').onclick=async()=>{$('usersErr').className='err';$('usersErr').textContent='';
  const r=await jpost('/api/users',{name:$('nuName').value,email:$('nuEmail').value,role:$('nuRole').value,password:$('nuPass').value});
  const d=await r.json(); if(!r.ok){$('usersErr').textContent=d.error||'Could not add user';return;}
  $('nuName').value='';$('nuEmail').value='';$('nuPass').value='';await refreshUsers();};

// ---------- multi-country report ----------
function buildRepList(){
  const box=$('repList');if(!box)return;box.innerHTML='';
  P.countries.forEach(c=>{const lab=document.createElement('label');lab.className='replab';lab.style.cssText='display:flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer';
    lab.innerHTML=`<input type="checkbox" class="repC" value="${c}"/> <span>${c}</span>`;box.appendChild(lab);});
  updateRepCount();
}
const selectedCountries=()=>[...document.querySelectorAll('.repC:checked')].map(x=>x.value);
function updateRepCount(){const n=selectedCountries().length;const el=$('repCount');if(el)el.textContent=n+' selected';}
function repPrice(c){
  const actual=num('wt'),L=num('L'),W=num('W'),H=num('H');
  const vol=(L&&W&&H)?(L*W*H)/P.divisor:0, chg=Math.max(actual,vol);
  ACTIVE=activeAcc(c,actual,L,W,H);
  return SERVICES.map(svc=>{const b=baseRate(svc,c,chg);return{svc,b,built:build(b.price,svc)};})
    .filter(x=>x.b.avail&&x.b.price!=null)
    .map(x=>({name:x.svc.name,carrier:x.svc.carrier,sell:x.built.sell}))
    .sort((a,b)=>a.sell-b.sell);
}
function reportRows(countries){
  let up=0,dp=0;const data=[];
  countries.forEach(c=>{const priced=repPrice(c);if(!priced.length){data.push({c,none:true});return;}
    const win=priced[0],next=priced[1];if(win.carrier==='ups')up++;else dp++;
    data.push({c,win,next,save:next?next.sell-win.sell:0});});
  calc(); // restore on-screen single-country view
  return {data,up,dp};
}
function runReport(){
  const countries=selectedCountries();
  if(!countries.length){$('repMsg').textContent='Select at least one country.';$('repBody').innerHTML='';$('repSummary').textContent='';return;}
  $('repMsg').textContent='';
  const {data,up,dp}=reportRows(countries);
  const tb=$('repBody');tb.innerHTML='';
  data.forEach(r=>{const tr=document.createElement('tr');
    if(r.none){tr.innerHTML=`<td>${r.c}</td><td colspan="4" class="chartnote">no services available</td>`;tb.appendChild(tr);return;}
    tr.innerHTML=`<td>${r.c}</td><td><b style="color:${r.win.carrier==='ups'?'#0f766e':'#2563eb'}">${r.win.name}</b></td><td><b>${money(r.win.sell)}</b></td><td>${r.next?r.next.name+' · '+money(r.next.sell):'—'}</td><td>${r.next?money(r.save):'—'}</td>`;
    tb.appendChild(tr);});
  $('repSummary').innerHTML=`<b>${countries.length}</b> countries priced — cheapest is UPS in <b>${up}</b>, DPD in <b>${dp}</b>.`;
}
function generateReport(){
  const countries=selectedCountries();
  if(!countries.length){$('repMsg').textContent='Select at least one country.';return;}
  $('repMsg').textContent='';
  const {data,up,dp}=reportRows(countries);
  const actual=num('wt'),L=num('L'),W=num('W'),H=num('H'),val=num('goodsValue');
  const dims=(L&&W&&H)?(L+'×'+W+'×'+H+' cm'):'';
  const tog=accList().filter(a=>a.cond==='toggle'&&accOn(a)).map(a=>a.name);
  const now=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const trs=data.map(r=>r.none?`<tr><td>${r.c}</td><td colspan="4" style="color:#94a3b8">no services available</td></tr>`
    :`<tr><td>${r.c}</td><td><b>${r.win.name}</b></td><td>£${r.win.sell.toFixed(2)}</td><td>${r.next?r.next.name+' · £'+r.next.sell.toFixed(2):'—'}</td><td>${r.next?'£'+r.save.toFixed(2):'—'}</td></tr>`).join('');
  const spec=['<b>'+actual+' kg</b>',dims,val?'value £'+val:'',tog.join(', ')].filter(Boolean).join(' · ');
  const html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>Shipping Rate Report</title>'
    +'<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#0f172a;max-width:900px;margin:24px auto;padding:0 22px}'
    +'h1{font-size:22px;margin:0 0 4px;letter-spacing:-.02em}.sub{color:#64748b;font-size:13px;margin:0 0 18px}'
    +'.spec{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;font-size:13px;margin-bottom:16px}'
    +'table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #e2e8f0}'
    +'th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#475569}'
    +'.sum{margin:14px 0;font-size:14px}.noprint{margin:0 0 16px}'
    +'button{padding:9px 15px;border:0;border-radius:8px;background:#0f766e;color:#fff;font-weight:700;cursor:pointer;font-size:14px}'
    +'@media print{.noprint{display:none}}</style></head><body>'
    +'<div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>'
    +'<h1>International Shipping Rate Report</h1>'
    +'<p class="sub">Cheapest carrier by destination · generated '+now+'</p>'
    +'<div class="spec">Parcel: '+spec+'</div>'
    +'<div class="sum"><b>'+countries.length+'</b> destinations — cheapest is UPS in <b>'+up+'</b>, DPD in <b>'+dp+'</b>.</div>'
    +'<table><thead><tr><th>Country</th><th>Cheapest service</th><th>Customer price</th><th>Next best</th><th>You save</th></tr></thead><tbody>'+trs+'</tbody></table>'
    +'<p class="sub" style="margin-top:20px">Customer sell prices incl. fuel and duty handling, excl. VAT. Indicative and subject to final confirmation.</p>'
    +'</body></html>';
  const w=window.open('','_blank');if(w){w.document.write(html);w.document.close();}
}
$('repSearch').addEventListener('input',()=>{const q=$('repSearch').value.toLowerCase();document.querySelectorAll('#repList .replab').forEach(l=>{l.style.display=l.textContent.toLowerCase().includes(q)?'':'none';});});
$('repList').addEventListener('change',updateRepCount);
$('repAll').onclick=()=>{document.querySelectorAll('.repC').forEach(x=>x.checked=true);updateRepCount();};
$('repEU').onclick=()=>{const eu=(P.settings.regions&&P.settings.regions.eu)||[];document.querySelectorAll('.repC').forEach(x=>x.checked=eu.includes(x.value));updateRepCount();};
$('repClear').onclick=()=>{document.querySelectorAll('.repC').forEach(x=>x.checked=false);updateRepCount();};
$('repRun').onclick=runReport;
$('repDoc').onclick=generateReport;

init();
</script>
</body></html>'''
with open(os.path.join(PUBLIC, 'index.html'), 'w') as f:
    f.write(HTML)
print('wrote public/index.html', len(HTML), 'bytes')
