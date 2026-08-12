#!/usr/bin/env python3
# Generates a self-contained, branded, INTERACTIVE customer rate card (single HTML file).
# Prices are baked in as final customer prices (markup + fuel already applied) so the
# markup is never exposed. Branding lives in the BRAND block near the top of the HTML and
# is trivial to swap once real MOOV Parcel assets (logo + hex codes) are supplied.
import json, os, html

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
seed = json.load(open(os.path.join(ROOT, 'seed.json')))

# ---- config you can change per customer ----
CUSTOMER   = "Sample Customer Ltd"
# markup %: single number = flat across all services, or a dict keyed by service id.
MARKUP     = {'ca': 50, 'ae': 50, 'ep': 50, 'cp': 50, 'ux': 50, 'us': 50}
INCLUDE    = ['ca', 'ae', 'ep', 'cp', 'ux', 'us']   # which services to show
OUT        = os.path.join(ROOT, 'public', 'ratecard_moov.html')

S = seed['settings']
FUEL = S['fuelByService']            # {key:{sell,...}}
CAPS = S['caps']
DIV  = seed['divisor']
BANDS = seed['bands']

SERVICES = [
    {'key': 'ca', 'name': 'DPD Classic Air',        'carrier': 'DPD', 'type': 'band', 'src': 'dpd_classic'},
    {'key': 'ae', 'name': 'DPD Air Express',        'carrier': 'DPD', 'type': 'band', 'src': 'dpd_express'},
    {'key': 'ep', 'name': 'DPD Classic ExpressPak', 'carrier': 'DPD', 'type': 'flat', 'src': 'dpd_expresspak', 'cap': CAPS['ep']},
    {'key': 'cp', 'name': 'DPD Classic Parcel',     'carrier': 'DPD', 'type': 'flat', 'src': 'dpd_parcel',     'cap': CAPS['cp']},
    {'key': 'ux', 'name': 'UPS Express Saver',      'carrier': 'UPS', 'type': 'zone', 'src': 'ups_express',  'zmap': 'c2zone_express'},
    {'key': 'us', 'name': 'UPS Standard',           'carrier': 'UPS', 'type': 'zone', 'src': 'ups_standard', 'zmap': 'c2zone_standard'},
]

def mk(key):
    return (MARKUP.get(key, 0) if isinstance(MARKUP, dict) else MARKUP)

def sell(key, raw):
    if raw is None:
        return None
    f = FUEL[key]['sell']
    return round(raw * (1 + f / 100.0) * (1 + mk(key) / 100.0), 2)

# ---- build customer-price data per included service ----
services_out = []
countries = set()
for s in SERVICES:
    if s['key'] not in INCLUDE:
        continue
    o = {'key': s['key'], 'name': s['name'], 'carrier': s['carrier'], 'type': s['type']}
    if s['type'] == 'band':
        src = seed[s['src']]
        o['prices'] = {c: [sell(s['key'], p) for p in arr] for c, arr in src.items()}
        countries.update(src.keys())
    elif s['type'] == 'flat':
        src = seed[s['src']]
        o['cap'] = s['cap']
        o['prices'] = {c: sell(s['key'], p) for c, p in src.items() if p is not None}
        countries.update(o['prices'].keys())
    else:  # zone
        src = seed[s['src']]
        zmap = seed[s['zmap']]
        o['zones'] = {z: [[w, sell(s['key'], p)] for (w, p) in zd['bands']] for z, zd in src.items()}
        o['zmap'] = zmap
        countries.update(c for c, z in zmap.items() if z in src)
    services_out.append(o)

countries = sorted(countries)

# ---- surcharges (customer-facing amounts only; no discounts/list shown) ----
def when(a):
    if a['cond'] == 'auto':      return 'By size / weight'
    if a['cond'] == 'always':    return 'Every shipment'
    if a['cond'] == 'countryIn': return ', '.join(a.get('countries', []))
    if a['cond'] == 'region':    return a['region'].upper() + ' destinations'
    return 'On request'
def rate(a):
    if a.get('basis') == 'pctValue':
        r = f"{a.get('pct',0)}% of goods value"
        if a.get('min'): r += f" (min £{float(a['min']):.2f})"
        return r
    return f"£{(a.get('list',0)*(1-a.get('disc',0)/100)):.2f} per shipment"
carriers_shown = {s['carrier'].lower() for s in services_out}
surcharges = [{'name': a['name'], 'carrier': a.get('applyTo','').upper(), 'when': when(a), 'rate': rate(a)}
              for a in S['accessorials'] if a.get('applyTo') in carriers_shown]

RC = {
    'customer': CUSTOMER, 'divisor': DIV, 'bands': BANDS, 'caps': CAPS,
    'countries': countries, 'services': services_out, 'surcharges': surcharges,
    'eu': S['regions']['eu'],
}
DATA = json.dumps(RC, separators=(',', ':'))

TEMPLATE = r'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>__CUSTOMER__ — International Rate Card</title>
<style>
/* ===== BRAND (placeholder — swap for the approved MOOV Parcel palette + logo) ===== */
:root{
  --brand:#0B1F3A;        /* primary / ink */
  --accent:#21C2A6;       /* accent */
  --accent-2:#12A594;
  --dpd:#DC2626;          /* DPD red */
  --ups:#8B4513;          /* UPS brown */
  --bg:#f4f6f9; --card:#fff; --line:#e5e9f0; --muted:#64748b; --ink:#0f172a;
  --g:#15803d; --g-bg:#e7f6ec;
}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.5}
.wrap{max-width:1000px;margin:0 auto;padding:0 20px 60px}
/* header / brand bar */
.hero{background:linear-gradient(120deg,var(--brand),#12315a);color:#fff;border-radius:0 0 22px 22px;padding:26px 26px 30px;box-shadow:0 8px 26px rgba(11,31,58,.18)}
.hero .top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.logo{display:flex;align-items:baseline;gap:2px;font-weight:900;font-size:30px;letter-spacing:-.02em}
.logo .m{color:#fff}.logo .p{color:var(--accent)}
.logo .dot{width:9px;height:9px;border-radius:50%;background:var(--accent);display:inline-block;margin-left:3px}
.hero .tag{font-size:13px;color:#cfe0f5;margin-top:3px;font-weight:500}
.hero .cust{text-align:right;font-size:13px;color:#cfe0f5}
.hero .cust b{display:block;color:#fff;font-size:15px}
.hero h1{font-size:22px;margin:22px 0 2px;letter-spacing:-.02em}
.hero p.lede{margin:0;color:#cfe0f5;font-size:13.5px;max-width:640px}
/* calculator */
.calc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px;margin-top:-18px;position:relative;box-shadow:0 6px 22px rgba(15,23,42,.07)}
.calc h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0 0 14px}
.row{display:flex;flex-wrap:wrap;gap:12px;align-items:end}
.f label{display:block;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
.f input,.f select{padding:11px 12px;border:1px solid #cbd5e1;border-radius:11px;font-size:15px;background:#fff;color:var(--ink)}
.f input:focus,.f select:focus{outline:2px solid var(--accent);border-color:var(--accent)}
.f.country{flex:1;min-width:200px}.f.country select{width:100%}
.f.small input{width:84px;text-align:right;font-variant-numeric:tabular-nums}
.meta{display:flex;gap:22px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line);font-size:13px}
.meta .lab{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:800}
.meta b{font-size:16px}
/* result cards */
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:18px}
.card{border:1px solid var(--line);border-radius:16px;padding:16px;background:#fff;position:relative}
.card .car{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;letter-spacing:.02em;text-transform:uppercase}
.card .pill{font-size:10px;font-weight:800;color:#fff;padding:2px 8px;border-radius:999px}
.card.dpd .pill{background:var(--dpd)} .card.ups .pill{background:var(--ups)}
.card .svc{font-size:14.5px;font-weight:700;margin:8px 0 2px;color:var(--brand)}
.card .price{font-size:30px;font-weight:900;letter-spacing:-.02em;margin:6px 0 0}
.card .unit{font-size:11px;color:var(--muted)}
.card.win{border:2px solid var(--accent);box-shadow:0 6px 18px rgba(33,194,166,.18)}
.card.win .price{color:var(--accent-2)}
.card .badge{position:absolute;top:12px;right:12px;font-size:10px;font-weight:900;color:#fff;background:var(--accent);padding:3px 9px;border-radius:999px;letter-spacing:.03em}
.card.na{background:#f8fafc;color:var(--muted)} .card.na .price{font-size:17px;color:#94a3b8;margin-top:12px}
.note{font-size:12.5px;color:var(--muted);margin-top:14px}
/* panels */
.panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;margin-top:18px}
.panel h3{font-size:15px;margin:0 0 4px}
.panel p.sub{color:var(--muted);font-size:12.5px;margin:0 0 14px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line)}
th{font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:#475569}
td.r{text-align:right;font-variant-numeric:tabular-nums;font-weight:700}
.tag2{font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;color:#fff}
.tag2.DPD{background:var(--dpd)} .tag2.UPS{background:var(--ups)}
.foot{font-size:12px;color:var(--muted);margin-top:22px;text-align:center}
.print{display:inline-flex;gap:8px;align-items:center;background:var(--accent);color:#fff;border:0;border-radius:11px;padding:10px 16px;font-weight:800;cursor:pointer;font-size:13.5px}
@media print{.calc,.print{box-shadow:none}.print{display:none}.hero{border-radius:0}}
</style></head>
<body>
<div class="hero">
  <div class="top">
    <div>
      <div class="logo"><span class="m">moov</span><span class="p">parcel</span><span class="dot"></span></div>
      <div class="tag">International delivery, simplified.</div>
    </div>
    <div class="cust">Rate card prepared for<b>__CUSTOMER__</b><span id="today"></span></div>
  </div>
  <h1>International Rate Card</h1>
  <p class="lede">Enter a destination, weight and dimensions to see your delivery price instantly. Prices are in GBP and include fuel; per-shipment surcharges are listed below.</p>
</div>

<div class="wrap">
  <div class="calc">
    <h2>Price calculator</h2>
    <div class="row">
      <div class="f country"><label>Destination country</label><select id="country"></select></div>
      <div class="f small"><label>Weight kg</label><input id="wt" type="number" min="0" step="0.1" value="5"/></div>
      <div class="f small"><label>Length cm</label><input id="L" type="number" min="0" step="1" placeholder="—"/></div>
      <div class="f small"><label>Width cm</label><input id="W" type="number" min="0" step="1" placeholder="—"/></div>
      <div class="f small"><label>Height cm</label><input id="H" type="number" min="0" step="1" placeholder="—"/></div>
    </div>
    <div class="meta">
      <div><div class="lab">Volumetric</div><b id="volw">—</b></div>
      <div><div class="lab">Chargeable</div><b id="chgw">—</b></div>
      <div><div class="lab">Priced on</div><b id="driver">—</b></div>
    </div>
    <div class="cards" id="cards"></div>
    <div class="note" id="note"></div>
  </div>

  <div class="panel">
    <h3>Surcharges</h3>
    <p class="sub">Applied per shipment in addition to the delivery price above where relevant. Duties &amp; taxes are passed on at cost.</p>
    <table><thead><tr><th>Surcharge</th><th>Carrier</th><th>When it applies</th><th>Charge</th></tr></thead>
      <tbody id="surBody"></tbody></table>
  </div>

  <div style="text-align:center;margin-top:20px"><button class="print" onclick="window.print()">Print / Save as PDF</button></div>
  <div class="foot">Prices indicative and subject to final confirmation. Excludes VAT. Volumetric divisor __DIV__. Generated by MOOV Parcel.</div>
</div>

<script>
const RC=__DATA__;
const $=id=>document.getElementById(id), money=v=>v==null?'—':'£'+v.toFixed(2);
const num=id=>{const v=parseFloat($(id).value);return isNaN(v)?0:v;};
$('today').textContent=' · '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});

function priceOf(s,c,chg){
  const B=RC.bands;
  if(s.type==='band'){const arr=s.prices[c];if(!arr)return{p:null,avail:false};
    if(chg>B[B.length-1]+1e-9)return{p:null,avail:true,note:'over '+B[B.length-1]+' kg'};
    for(let i=0;i<B.length;i++)if(B[i]>=chg-1e-9)return{p:arr[i],avail:true,band:B[i]};
    return{p:null,avail:true};}
  if(s.type==='flat'){const p=s.prices[c];if(p==null)return{p:null,avail:false};
    if(chg>s.cap+1e-9)return{p:null,avail:true,note:'over '+s.cap+' kg'};
    return{p:p,avail:true,band:'≤'+s.cap+'kg'};}
  const z=s.zmap[c], zd=z&&s.zones[z];if(!z||!zd)return{p:null,avail:false};
  const mB=zd[zd.length-1][0];
  if(chg<=mB+1e-9){for(const[w,pr]of zd)if(w>=chg-1e-9)return{p:pr,avail:true,band:w};}
  return{p:zd[zd.length-1][1],avail:true,band:'>'+mB+'kg'};
}
function calc(){
  const c=$('country').value,actual=num('wt'),L=num('L'),W=num('W'),H=num('H');
  const vol=(L&&W&&H)?(L*W*H)/RC.divisor:0, chg=Math.max(actual,vol);
  $('volw').textContent=vol?vol.toFixed(2)+' kg':'—';
  $('chgw').textContent=chg?chg.toFixed(2)+' kg':'—';
  $('driver').textContent=!chg?'—':(vol>actual?'volumetric':'actual weight');
  const rows=RC.services.map(s=>({s,r:priceOf(s,c,chg)})).filter(x=>x.r.avail);
  const priced=rows.filter(x=>x.r.p!=null).map(x=>x.r.p);
  const min=priced.length?Math.min(...priced):null;
  const box=$('cards');box.innerHTML='';
  rows.forEach(({s,r})=>{
    const d=document.createElement('div');let cls='card '+s.carrier.toLowerCase();
    if(r.p==null)cls+=' na'; else if(r.p===min&&priced.length>1)cls+=' win';
    d.className=cls;
    const head=`<div class="car"><span class="pill">${s.carrier}</span></div><div class="svc">${s.name}</div>`;
    if(r.p==null)d.innerHTML=head+`<div class="price">n/a</div><div class="unit">${r.note||'not available'}</div>`;
    else d.innerHTML=(r.p===min&&priced.length>1?'<span class="badge">BEST PRICE</span>':'')+head
      +`<div class="price">${money(r.p)}</div><div class="unit">delivery, incl. fuel${r.band?(' · '+(typeof r.band==='number'?r.band+' kg band':r.band)):''}</div>`;
    box.appendChild(d);
  });
  $('note').textContent=chg?(priced.length?('Showing '+priced.length+' available service'+(priced.length>1?'s':'')+' to '+c+' at '+chg.toFixed(2)+' kg chargeable.'):'No services available to '+c+' at this weight.'):'Enter a weight to see prices.';
}
// populate
RC.countries.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;$('country').appendChild(o);});
$('country').value=RC.countries.includes('USA')?'USA':RC.countries[0];
['country','wt','L','W','H'].forEach(id=>$(id).addEventListener('input',calc));
const sb=$('surBody');RC.surcharges.forEach(a=>{const tr=document.createElement('tr');
  tr.innerHTML=`<td>${a.name}</td><td><span class="tag2 ${a.carrier}">${a.carrier}</span></td><td>${a.when}</td><td class="r">${a.rate}</td>`;sb.appendChild(tr);});
calc();
</script>
</body></html>'''

out = (TEMPLATE
       .replace('__DATA__', DATA)
       .replace('__CUSTOMER__', html.escape(CUSTOMER))
       .replace('__DIV__', str(DIV)))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w') as f:
    f.write(out)
print('wrote', OUT, len(out), 'bytes;', len(services_out), 'services;', len(countries), 'countries;', len(surcharges), 'surcharges')
