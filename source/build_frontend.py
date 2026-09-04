#!/usr/bin/env python3
# Generates ../public/index.html — calculator + auth + admin Settings (fuel by service, accessorials, team).
import os, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PUBLIC = os.path.join(ROOT, 'public')
os.makedirs(PUBLIC, exist_ok=True)
def vendor(dest, cands):
    for cand in cands:
        if os.path.exists(cand):
            shutil.copyfile(cand, os.path.join(PUBLIC, dest)); return True
    return False
vendor('chart.umd.js', [
    os.path.join(ROOT, 'node_modules', 'chart.js', 'dist', 'chart.umd.js'),
    os.path.join(os.path.dirname(ROOT), 'node_modules', 'chart.js', 'dist', 'chart.umd.js'),
])
vendor('xlsx.full.min.js', [
    os.path.join(ROOT, 'node_modules', 'xlsx', 'dist', 'xlsx.full.min.js'),
    os.path.join(os.path.dirname(ROOT), 'node_modules', 'xlsx', 'dist', 'xlsx.full.min.js'),
])

HTML = r'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>International Rate Calculator</title>
<script src="/chart.umd.js"></script>
<script src="/xlsx.full.min.js"></script>
<style>
:root{--ink:#171B2D;--muted:#64748b;--line:#e2e8f0;--bg:#f1f5f9;--card:#fff;
--g:#15803d;--g-bg:#dcfce7;--a:#b45309;--a-bg:#fef3c7;--r:#b91c1c;--r-bg:#fee2e2;--teal:#0E9C63;
--brand:#171B2D;--green:#1DFB9D;--pink:#CD1C69;}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.5}
.wrap{max-width:1160px;margin:0 auto;padding:22px 22px 56px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(15,23,42,.05);margin-bottom:18px}
h2{font-size:15px;margin:0 0 14px;letter-spacing:-.01em}
.calcrow{display:flex;flex-wrap:wrap;gap:12px;align-items:end}
.f label{display:block;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
.f input,.f select{padding:9px 10px;border:1px solid #cbd5e1;border-radius:9px;font-size:14px;background:#fff;color:var(--ink)}
.f input:focus,.f select:focus{outline:2px solid var(--teal);border-color:var(--teal)}
.f.country select{width:220px;max-width:100%}
.f.small input{width:82px;text-align:right;font-variant-numeric:tabular-nums}
.calcrow input[type=number]::-webkit-inner-spin-button,.calcrow input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.calcrow input[type=number]{-moz-appearance:textfield;appearance:textfield}
.toggles{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line)}
.tg{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:#334155}
.tg input{width:16px;height:16px;accent-color:var(--teal)}
.wt{display:flex;gap:20px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line);font-size:13.5px}
.wt div b{font-size:17px}.wt .lab{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:700}
.results{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:13px;margin-top:16px}
.res{border:1px solid var(--line);border-radius:14px;padding:15px;position:relative;background:#fff}
.res .car{font-size:12.5px;font-weight:700;color:#334155;display:flex;align-items:center;gap:7px}
.res .swatch{width:10px;height:10px;border-radius:3px;flex:none}
.res .clogo{height:22px;width:auto;max-width:74px;object-fit:contain;display:inline-block;vertical-align:middle}
.res .clogo[data-k="dpd"]{height:34px;max-width:96px}
.res .cbadge{font-size:9.5px;font-weight:800;color:#fff;padding:2px 7px;border-radius:5px;letter-spacing:.03em}
.res .cbadge.dpd{background:#DC2626}.res .cbadge.ups{background:#8B4513}.res .cbadge.dhl{background:#D4A017}
.res .pr{font-size:25px;font-weight:800;letter-spacing:-.02em;margin:6px 0 0}
.res .sub{font-size:11px;color:var(--muted);margin-bottom:8px}
.res .brk{font-size:11.5px;color:#475569;line-height:1.6}
.res .brk .blk{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:800;margin:8px 0 3px}
.res .brk .row{display:flex;justify-content:space-between;gap:8px}
.res .brk .row.tot{font-weight:700;color:var(--ink);border-top:1px solid var(--line);margin-top:3px;padding-top:3px}
.res.win{border:2px solid var(--g);background:var(--g-bg)} .res.win .pr{color:var(--g)}
.res.fast{border:2px solid #0284c7;background:#f0f9ff} .res.fast .pr{color:#0369a1}
.res.win.fast{border:2px solid var(--g);background:linear-gradient(180deg,var(--g-bg),#f0f9ff);box-shadow:0 0 0 1px #0284c7}
.res.lose{border:1px solid #fca5a5;background:var(--r-bg)} .res.lose .pr{color:var(--r)}
.res.mid{background:var(--a-bg)}
.res.na{background:#f8fafc;color:var(--muted)} .res.na .pr{color:#94a3b8;font-size:16px;margin:12px 0 2px}
.badge{position:absolute;top:12px;right:12px;font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--g);color:#fff;text-transform:uppercase}
.badge.fastest{background:#0284c7;color:#fff}
.badge.best-both{background:linear-gradient(90deg,#15803d,#0284c7);color:#fff}
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
header#hdr{display:none;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;flex-wrap:wrap;
  padding:13px 18px;background:#171B2D;color:#fff;border-radius:0 0 14px 14px;border-bottom:3px solid transparent;
  background-image:linear-gradient(#171B2D,#171B2D),linear-gradient(90deg,var(--green),var(--pink));
  background-origin:border-box;background-clip:padding-box,border-box}
header#hdr .brand{display:flex;align-items:center;gap:12px;font-weight:800;letter-spacing:-.01em;font-size:14px}
header#hdr .brand img{height:30px;width:auto;display:block}
header#hdr .brand .fallback{font-weight:900;font-size:20px;color:var(--green)}
header#hdr .brand .ttl{color:#9aa3b5;font-weight:600;border-left:1px solid #333a4d;padding-left:12px}
header#hdr .actions{display:flex;gap:8px;align-items:center}
header#hdr .who{color:#9aa3b5;font-size:13px;margin-right:4px}
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
.custform{margin-top:16px;padding-top:16px;border-top:1px dashed var(--line)}
.custform .f{margin:0;min-width:0}
.custform .f label{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:#475569;font-weight:800;margin-bottom:5px}
.custform .f input,.custform .f select{width:100%;padding:9px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;background:#fff}
.cfrow2{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px;margin-bottom:14px}
.cfhead{font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;font-weight:800;margin-bottom:10px}
.cfgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px 14px}
.cfgrid .cf2{grid-column:span 2}
.cfactions{margin-top:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
@media(max-width:860px){.cfgrid{grid-template-columns:1fr 1fr}}
@media(max-width:520px){.cfrow2,.cfgrid{grid-template-columns:1fr}.cfgrid .cf2{grid-column:span 1}}
.rolechip{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#3730a3}
.rcchecks{display:flex;flex-direction:column;gap:14px}
.rcgroup{display:flex;flex-direction:column;gap:7px}
.rchead{display:flex;align-items:center;gap:8px;font-size:13px;color:#334155;cursor:pointer}
.rchead b{font-size:13.5px;letter-spacing:.02em}
.rchead .rcall{font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:700}
.rcitem{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:#334155;cursor:pointer;padding-left:20px}
.rcchecks .sw{width:11px;height:11px;border-radius:3px;flex:none}
.rcchecks input{width:16px;height:16px;accent-color:var(--teal)}
.svcpickwrap{display:flex;flex-wrap:wrap;gap:8px 20px;margin:6px 0 2px}
.svcpk{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:#334155;cursor:pointer}
.svcpk .sw{width:11px;height:11px;border-radius:3px;flex:none}
.svcpk input{width:15px;height:15px;accent-color:var(--teal)}
label.blk{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#475569;font-weight:700;margin-bottom:10px}
.voltabs{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
.voltab{padding:7px 14px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#334155}
.voltab:hover{border-color:var(--teal)}
.voltab.active{background:var(--teal);color:#fff;border-color:var(--teal)}
.mklist{border:1px solid var(--line);border-radius:12px;overflow:hidden;max-width:520px;margin-top:14px}
.mkrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border-bottom:1px solid var(--line);background:#fff}
.mkrow:last-child{border-bottom:none}
.mkrow .nm{display:flex;align-items:center;gap:9px;font-size:13.5px;font-weight:600;color:#334155}
.mkrow .sw{width:11px;height:11px;border-radius:3px;flex:none}
.mkrow input{width:82px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:8px;text-align:right;font-size:13px;font-variant-numeric:tabular-nums}
.mkrow input:focus{outline:2px solid var(--teal);border-color:var(--teal)}
.mkrow .pct{color:var(--muted);font-size:13px;margin-left:6px}
textarea{font-family:inherit;padding:9px 10px;border:1px solid #cbd5e1;border-radius:9px;font-size:13px;resize:vertical}
textarea:focus{outline:2px solid var(--teal);border-color:var(--teal)}
.qtiles{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
@media(max-width:680px){.qtiles{grid-template-columns:1fr 1fr}}
.qtile{border:1px solid var(--line);border-radius:14px;padding:16px 18px;background:linear-gradient(180deg,#fff,#f9fbfc)}
.qtile .qn{font-size:32px;font-weight:900;letter-spacing:-.02em;color:var(--ink);line-height:1}
.qtile .ql{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:800;margin-top:6px}
.qexp{cursor:pointer;color:var(--teal);font-weight:800;background:none;border:0;font-size:14px;padding:2px 6px}
.qdetail{background:#f8fafc}
.qdetail table{width:auto;min-width:420px}
.qdetail td,.qdetail th{padding:6px 12px}
.qmuted{color:var(--muted);font-variant-numeric:tabular-nums}
.rawbox{margin-top:10px;border-top:1px dashed var(--line);padding-top:8px}
.rawbox summary{cursor:pointer;font-weight:800;font-size:12.5px;color:var(--teal)}
.rawhd{display:flex;align-items:center;gap:10px;margin:8px 0 3px}
.rawhd .lbl{font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);font-weight:800}
.rawcopy{border:1px solid var(--line);background:#fff;border-radius:7px;padding:3px 9px;font-size:11px;font-weight:800;cursor:pointer;color:var(--ink)}
.rawcopy:hover{background:#f1f5f9}
.rawpre{background:#0b1220;color:#d7e2f0;border-radius:8px;padding:12px;font-family:ui-monospace,Menlo,monospace;font-size:11px;line-height:1.5;max-height:340px;overflow:auto;white-space:pre;margin:0}
.rawmore{cursor:pointer;font-weight:800;font-size:12px;color:var(--teal)}
.bdwrap{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px}
.bd{border:1px solid var(--line);border-radius:10px;width:440px;max-width:100%;background:#fff}
.bd-h{background:#f8fafc;padding:9px 12px;font-weight:800;font-size:13px;border-bottom:1px solid var(--line);border-radius:10px 10px 0 0}
.bdt{width:100%;font-size:13px;border-collapse:collapse;table-layout:fixed}
.bdt td{padding:6px 12px;border-bottom:1px solid #f1f5f9;overflow:hidden;text-overflow:ellipsis}
.bdt td.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;width:110px}
.bdt tr.bd-sub td{font-weight:800;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.bdt tr.bd-neg td{color:var(--teal);font-weight:800}
.bdt tr.bd-sell td{background:#ECFDF5;font-weight:900;border-bottom:0}
.bdt tr.bd-sell td:last-child{border-radius:0 0 10px 0}.bdt tr.bd-sell td:first-child{border-radius:0 0 0 10px}
</style></head>
<body><div class="wrap">

<header id="hdr">
  <div class="brand"><img src="/logo.png" alt="MOOV Parcel" onerror="this.outerHTML='&lt;span class=\'fallback\'&gt;moov parcel&lt;/span&gt;'"/><span class="ttl">Rate Calculator</span></div>
  <div class="actions">
    <span class="who" id="who"></span>
    <button class="btn" id="collectionBtn" style="display:none">Create a Collection</button>
    <button class="btn" id="quotesBtn" style="display:none">Quotes</button>
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
    <div class="voltabs" id="accTabs" style="margin-bottom:12px"></div>
    <table class="stable"><thead><tr><th>Accessorial</th><th>Carrier</th><th>Trigger</th><th>List £ / Rate %</th><th>Disc % / Min £</th><th>Net</th></tr></thead><tbody id="accBody"></tbody></table>
  </div>
  <div class="panel" id="euDutyPanel">
    <h2>EU customs duty (€ per item)</h2>
    <p class="adminnote">Per-SKU EU import duty on low-value shipments (goods value ≤ threshold, converted to €). Applies to <b>all carriers</b> into the EU, in addition to any other duties. Shown on customer cards in £ using the rate below. Interim EU measure (1 Jul 2026 – 1 Jul 2028) — untick Enabled to switch it off.</p>
    <div class="miniform">
      <label class="tg" style="align-self:end"><input type="checkbox" id="euEnabled"/> Enabled</label>
      <div class="f"><label>£ → € rate (€ per £1)</label><input id="euRate" type="number" min="0" step="0.001" value="1.16"/></div>
      <div class="f"><label>Duty per SKU (€)</label><input id="euPerSku" type="number" min="0" step="0.5" value="3"/></div>
      <div class="f"><label>Low-value threshold (€)</label><input id="euThresh" type="number" min="0" step="1" value="150"/></div>
    </div>
  </div>
  <div class="panel"><button class="btn primary" id="saveBtn">Save settings</button><span class="ok" id="saveMsg"></span></div>
  <div class="panel" id="ratesPanel">
    <h2>Rate data</h2>
    <p class="adminnote">Export all current DPD &amp; UPS base (cost) rates to Excel to review them — one sheet per service, plus zones, fuel and accessorials. These are your raw rates, not customer prices. Re-import to update them (coming next once you've confirmed the layout).</p>
    <button class="btn primary" id="ratesExport">Export current rates (Excel)</button>
    <span class="ok" id="ratesMsg"></span>
  </div>
  <div class="panel" id="pickTestPanel">
    <h2>Drop-off lookup test</h2>
    <p class="adminnote">Check a postcode against the courier pickup API. Shows how many drop-off points each carrier returns and the raw response — use it to confirm <code>COURIER_API_TOKEN</code> is set and to debug the map. Copy the raw output to share if points aren’t mapping.</p>
    <div class="miniform">
      <div class="f"><label>Postcode</label><input id="pkPostcode" type="text" placeholder="e.g. SY11 4FN"/></div>
      <button class="btn primary" id="pkTest">Test lookup</button>
      <span class="ok" id="pkMsg"></span>
    </div>
    <div id="pkResult" style="margin-top:12px;font-size:13px"></div>
    <textarea id="pkRaw" readonly style="display:none;width:100%;height:200px;margin-top:10px;font-family:ui-monospace,Menlo,monospace;font-size:11px"></textarea>
  </div>
  <div class="panel" id="upsPanel">
    <h2>UPS import / export quotes</h2>
    <p class="adminnote">Live rating from your “Moov Parcel Rating” UPS app powers the <a href="/import" target="_blank">Request a Quote</a> page. Add <code>UPS_CLIENT_ID</code>, <code>UPS_CLIENT_SECRET</code>, <code>UPS_ACCOUNT_NUMBER</code> and <code>UPS_ENV=test</code> (then <code>production</code>) as Railway variables. The markup below is applied to every import/export quote. Remember to press <b>Save settings</b> after changing the markup.</p>
    <div class="miniform">
      <div class="f"><label>Import / export markup %</label><input id="upsMarkup" type="number" min="0" step="1" value="0"/></div>
      <div class="f"><label>Free HS / tariff lines</label><input id="hsFreeLines" type="number" min="0" step="1" value="5"/></div>
      <div class="f"><label>£ per extra HS line</label><input id="hsLineCharge" type="number" min="0" step="0.01" value="2.95"/></div>
      <label class="tg" style="align-self:end"><input type="checkbox" id="debugRaw" checked/> Keep raw UPS responses for debugging</label>
      <button class="btn primary" id="upsTest">Test UPS connection</button>
      <span class="ok" id="upsMsg"></span>
    </div>
    <p class="adminnote" style="margin-top:6px">When on, each quote stores the exact UPS request &amp; response — view it under <b>Quotes</b> → expand a row → <b>Raw UPS response</b>. Turn off to stop storing them.</p>
    <div id="upsResult" style="margin-top:12px;font-size:13px"></div>
    <textarea id="upsRaw" readonly style="display:none;width:100%;height:220px;margin-top:10px;font-family:ui-monospace,Menlo,monospace;font-size:11px"></textarea>
  </div>
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

<!-- QUOTES DASHBOARD -->
<div id="quotes" style="display:none">
  <div class="settingshead"><button class="btn" id="quotesBack">← Back to calculator</button><h1>Quotes</h1></div>
  <div class="panel">
    <div class="qtiles">
      <div class="qtile"><div class="qn" id="qStatToday">—</div><div class="ql">Today</div></div>
      <div class="qtile"><div class="qn" id="qStatWeek">—</div><div class="ql">Last 7 days</div></div>
      <div class="qtile"><div class="qn" id="qStatMonth">—</div><div class="ql">Last 30 days</div></div>
      <div class="qtile"><div class="qn" id="qStatTotal">—</div><div class="ql">All time</div></div>
    </div>
    <div class="chartbox" style="margin-top:18px;height:260px"><canvas id="qChart"></canvas></div>
    <p class="chartnote">Import quotes per day (last 30 days). Once bookings go live, conversion will show here alongside.</p>
  </div>
  <div class="panel">
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
      <h2 style="margin:0">Quote log</h2>
      <input id="qSearch" placeholder="Search customer, country, postcode…" style="flex:1;min-width:220px;max-width:340px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px"/>
      <button class="btn" id="qRefresh">Refresh</button>
    </div>
    <div style="overflow:auto"><table class="utable"><thead><tr><th></th><th>When</th><th>Customer</th><th>From → To</th><th>Shipment</th><th>Goods</th><th>Cheapest</th></tr></thead><tbody id="qBody"></tbody></table></div>
    <div id="qEmpty" class="chartnote" style="margin-top:8px"></div>
  </div>
</div>

<!-- CREATE A COLLECTION -->
<div id="collection" style="display:none">
  <div class="settingshead"><button class="btn" id="colBack">← Back to calculator</button><h1>Create a Collection</h1></div>

  <!-- Quick Tracking Number Hero Card -->
  <div class="panel" style="background:linear-gradient(180deg,#f0fdf4,#fff);border-color:#bbf7d0">
    <h2 style="color:var(--teal)">⚡ Quick Booking with Tracking Number</h2>
    <p class="adminnote" style="margin-bottom:12px">If a UPS shipping label / tracking number has already been created, enter it here. UPS will associate the collection directly with the existing parcel.</p>
    <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
      <div class="f" style="flex:1;min-width:240px;max-width:400px">
        <label>UPS Tracking Number (e.g. 1Z9999999999999999)</label>
        <input id="colTracking" type="text" placeholder="1Z..." style="font-family:monospace;font-size:14px;letter-spacing:0.04em;text-transform:uppercase"/>
      </div>
      <div class="f" style="width:200px">
        <label>Service</label>
        <select id="colService">
          <option value="011">UPS Standard (011)</option>
          <option value="065">UPS Express Saver (065)</option>
          <option value="007">UPS Express (007)</option>
          <option value="008">UPS Expedited (008)</option>
          <option value="001">UPS Next Day Air (001)</option>
        </select>
      </div>
    </div>
  </div>

  <div class="panel">
    <h2>Collection details</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px">
      <!-- Address & Contact -->
      <div>
        <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:0 0 12px;font-weight:800">Pickup Address &amp; Contact</h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="f"><label>Company Name</label><input id="colCompany" type="text" placeholder="Company / Sender name"/></div>
            <div class="f"><label>Contact Name</label><input id="colContact" type="text" placeholder="Contact person"/></div>
          </div>
          <div class="f"><label>Address Line 1 *</label><input id="colAddr1" type="text" placeholder="Street address"/></div>
          <div class="f"><label>Address Line 2 (optional)</label><input id="colAddr2" type="text" placeholder="Unit, Suite, Building…"/></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="f"><label>Town / City *</label><input id="colCity" type="text" placeholder="City"/></div>
            <div class="f"><label>Postcode *</label><input id="colPostcode" type="text" placeholder="Postcode / Postal code"/></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="f country"><label>Pickup Country</label><select id="colCountry" style="width:100%"></select></div>
            <div class="f country"><label>Destination Country</label><select id="colDestCountry" style="width:100%"></select></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="f"><label>Phone Number *</label><input id="colPhone" type="tel" placeholder="e.g. 07123456789"/></div>
            <div class="f"><label>Email Address</label><input id="colEmail" type="email" placeholder="Email for notifications"/></div>
          </div>
          <div class="tg" style="margin-top:4px"><input id="colResi" type="checkbox"/><label for="colResi">Residential Address</label></div>
        </div>
      </div>

      <!-- Timing & Parcels -->
      <div>
        <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:0 0 12px;font-weight:800">Pickup Schedule &amp; Parcels</h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="f"><label>Pickup Date *</label><input id="colDate" type="date"/></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="f"><label>Ready Time</label><input id="colReady" type="time" value="09:00"/></div>
            <div class="f"><label>Latest Close Time</label><input id="colClose" type="time" value="17:00"/></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="f small"><label>Parcels Count</label><input id="colParcels" type="number" min="1" step="1" value="1" style="width:100%"/></div>
            <div class="f small"><label>Total Weight (kg)</label><input id="colWeight" type="number" min="0.1" step="0.1" value="5.0" style="width:100%"/></div>
          </div>
          <div class="f"><label>Special Instructions for Courier</label><input id="colSpecial" type="text" placeholder="e.g. Goods at reception / ring buzzer" maxlength="100"/></div>
        </div>
      </div>
    </div>

    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--line);display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <button class="btn primary" id="colSubmit" style="padding:10px 24px;font-size:14px;font-weight:700">Book UPS Collection</button>
      <span id="colMsg" style="font-weight:700;font-size:13.5px"></span>
    </div>

    <div id="colResultCard" style="display:none;margin-top:16px;border-radius:12px"></div>
  </div>

  <!-- Previous Collections History -->
  <div class="panel">
    <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h2 style="margin:0">Recent collections</h2>
      <button class="btn" id="colRefresh">Refresh</button>
    </div>
    <div style="overflow:auto">
      <table class="utable">
        <thead>
          <tr>
            <th>PRN</th>
            <th>Booked</th>
            <th>Pickup Date &amp; Window</th>
            <th>Contact / Company</th>
            <th>Address</th>
            <th>Parcels &amp; Weight</th>
            <th>Tracking #</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="colHistoryBody"></tbody>
      </table>
    </div>
    <div id="colEmpty" class="chartnote" style="margin-top:8px"></div>
  </div>
</div>

<!-- CALCULATOR -->
<div id="app" style="display:none">
<div class="panel">
<div class="calcrow">
  <div class="f country"><label>Destination</label><select id="country"></select></div>
  <div class="f small"><label>Postcode</label><input id="postcode" type="text" placeholder="e.g. 90210" style="width:110px"/></div>
  <div class="f small"><label>Weight (kg)</label><input id="wt" type="number" min="0" step="0.1" value="5"/></div>
  <div class="f small"><label>Length (cm)</label><input id="L" type="number" min="0" step="1"/></div>
  <div class="f small"><label>Width (cm)</label><input id="W" type="number" min="0" step="1"/></div>
  <div class="f small"><label>Height (cm)</label><input id="H" type="number" min="0" step="1"/></div>
  <div class="f small"><label id="gvlab">Value (£)</label><input id="goodsValue" type="number" min="0" step="1" value="0"/></div>
  <div class="f small"><label>SKUs</label><input id="SK" type="number" min="1" step="1" value="1"/></div>
</div>
<div class="toggles" id="toggles"></div>
<div class="wt">
  <div><div class="lab">Volumetric</div><b id="volw">—</b></div>
  <div><div class="lab">Chargeable</div><b id="chgw">—</b></div>
  <div><div class="lab">Driven by</div><b id="driver">—</b></div>
</div>
<div id="staticNotice" style="display:none;background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;padding:10px 14px;border-radius:6px;font-size:12.5px;color:#92400e;margin:14px 0 6px;line-height:1.45">
  <b>⚠️ Standard Rate Card Notice:</b> Live UPS rates are currently unavailable. The prices below are calculated from your agreed standard rate card. Note that these rates are indicative base prices and do not include destination-specific remote/extended area surcharges or live out-of-gauge / demand surcharges.
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
<div class="panel" id="customersPanel">
  <h2>Customer links</h2>
  <p class="chartnote" style="margin:0 0 14px">Create a private, unguessable link for each customer. It shows only their prices — never your cost or markup — always reflects your latest rates, and gives them the live calculator. Set the markup and options below, then create the link.</p>
  <label class="blk">Markup</label>
  <div class="calcrow">
    <div class="f small"><label>Global markup %</label><input id="mkGlobal" type="number" min="0" step="1" value="0"/></div>
    <button class="btn" id="mkApply">Apply to all</button>
    <div class="f"><label>Volume preset</label>
      <div class="voltabs" id="volTabs">
        <button class="voltab" data-mk="70">Low · 70%</button>
        <button class="voltab" data-mk="50">Medium · 50%</button>
        <button class="voltab" data-mk="30">High · 30%</button>
      </div>
    </div>
  </div>
  <p class="chartnote" style="margin:8px 0 0">Set a global markup to fill every service, then fine-tune any below. Markup applies to base rate + fuel only — duties and per-shipment surcharges pass through without markup.</p>
  <div id="mkList" class="mklist"></div>
  <div style="display:flex;gap:28px;flex-wrap:wrap;margin-top:16px;border-top:1px dashed var(--line);padding-top:16px">
    <div>
      <label class="blk">Services to include</label>
      <div id="rcServices" class="rcchecks"></div>
    </div>
    <div style="flex:1;min-width:260px">
      <div class="f"><label>Notes to customer (optional)</label><textarea id="rcNotes" rows="2" style="width:100%" placeholder="e.g. Prices valid for 30 days."></textarea></div>
      <label class="tg" style="margin-top:12px"><input type="checkbox" id="rcSur" checked/> Include the surcharges section</label>
      <label class="tg" style="margin-top:8px"><input type="checkbox" id="rcCheapest" checked/> Highlight the best price</label>
      <label class="tg" style="margin-top:8px"><input type="checkbox" id="rcBreakdown"/> Show base price and fuel separately</label>
    </div>
  </div>
  <div id="rcMsg" class="chartnote" style="color:var(--r);margin-top:8px"></div>
  <div class="custform">
    <div class="cfrow2">
      <div class="f"><label>Customer name</label><input id="custName" type="text" placeholder="e.g. Slumba Ltd"/></div>
      <div class="f"><label>Contact name</label><input id="custContact" type="text" placeholder="delivery contact"/></div>
    </div>
    <div class="cfhead">Delivery address — pre-fills the import quote (where imports come back to)</div>
    <div class="cfgrid">
      <div class="f cf2"><label>Address line 1</label><input id="custLine1" type="text"/></div>
      <div class="f cf2"><label>Address line 2</label><input id="custLine2" type="text"/></div>
      <div class="f"><label>City / town</label><input id="custCity" type="text"/></div>
      <div class="f"><label>Postcode</label><input id="custPostcode" type="text" placeholder="e.g. SY11 4FN"/></div>
      <div class="f"><label>Country</label><select id="custCountry"><option value="GB" selected>United Kingdom</option><option value="IE">Ireland</option></select></div>
      <div class="f"><label>Import quote markup %</label><input id="custImportMarkup" type="number" min="0" step="1" placeholder="e.g. 25"/></div>
      <div class="f cf2"><label>Phone</label><input id="custPhone" type="text"/></div>
      <div class="f cf2"><label>Email</label><input id="custEmail" type="text"/></div>
    </div>
    <div class="cfactions">
      <button class="btn primary" id="custCreateBtn">Create customer link</button>
      <span class="err" id="custErr" style="margin:0"></span>
      <span class="ok" id="custOk" style="margin:0"></span>
    </div>
  </div>
  <div style="margin-top:20px;overflow:auto">
    <input id="custSearch" placeholder="Search customers…" style="width:100%;max-width:320px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;margin-bottom:12px;display:none"/>
    <table class="utable" id="custTable" style="display:none">
      <thead><tr><th>Customer</th><th>Link</th><th>Created by</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="custBody"></tbody>
    </table>
    <div id="custEmpty" class="chartnote" style="display:none">No customer links created yet. Fill the form above and click Create.</div>
  </div>
</div>
</div>

</div>
<script>
const LIVE_CODE_TO_KEY = {
  '270': 'residential',
  '100': 'addlHandling',
  '110': 'largePackage',
  '377': 'largePackage',
  '120': 'overMax',
  '260': 'signature',
  '250': 'adultSig',
  '280': 'directDelivery',
  '300': 'saturday',
  '573': 'merchantProc',
};
let upsKey=null, upsData=null, upsTimer=null, upsAbortCtrl=null;
function activeTogglesKey(){
  const list=[];
  document.querySelectorAll('#toggles input[type="checkbox"]').forEach(cb=>{if(cb.checked)list.push(cb.id);});
  return list.sort().join(',');
}
function upsLaneKey(){
  const pc=$('postcode')?$('postcode').value.trim():'';
  return [csel.value, pc, num('wt'), num('L'), num('W'), num('H'), num('goodsValue'), activeTogglesKey()].join('|');
}
function scheduleUpsFetch(key,c){
  clearTimeout(upsTimer);
  upsTimer=setTimeout(()=>doUpsFetch(key,c),300);
}
function doUpsFetch(key,c){
  if(upsAbortCtrl){try{upsAbortCtrl.abort();}catch(_){}}
  upsAbortCtrl=new AbortController();
  const pc=$('postcode')?$('postcode').value.trim():'';
  const resiEl=$('acc_residential')||$('acc_residential_dpd');
  const isResi=!!(resiEl&&resiEl.checked);
  const mkObj={};
  SERVICES.forEach(s=>{mkObj[s.key]=markupPct(s);});
  mkObj.default=num('mkGlobal');
  const body={
    country:c,
    postcode:pc,
    weight:num('wt'),
    l:num('L'), w:num('W'), h:num('H'),
    value:num('goodsValue'),
    residential:isResi,
    markup:mkObj,
  };
  const timeoutId=setTimeout(()=>{if(upsAbortCtrl)upsAbortCtrl.abort();},5500);
  fetch('/api/calc-rate',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body),
    signal:upsAbortCtrl.signal
  })
    .then(r=>r.json()).then(d=>{
      clearTimeout(timeoutId);
      upsKey=key;upsData=d;
      calc();
    })
    .catch((err)=>{
      clearTimeout(timeoutId);
      if(err&&err.name==='AbortError'&&upsLaneKey()!==key)return;
      upsKey=key;upsData={enabled:false};
      calc();
    });
}

let P, bands, CAPS, current=null, authEnabled=false, ACTIVE=[];
const $=id=>document.getElementById(id), money=v=>v==null?'—':'£'+v.toFixed(2);
const CARRIER_LOGOS={dpd:'https://app.heyvoila.io/courier-service-logos/dpd.jpg',ups:'https://app.heyvoila.io/courier-service-logos/ups.jpg'};
function carrierLogo(carrier){const k=(carrier||'').toLowerCase();const src=CARRIER_LOGOS[k]||('/carrier-'+k+'.svg');
  return '<img class="clogo" src="'+src+'" data-k="'+k+'" data-c="'+k.toUpperCase()+'" alt="'+k+'"/>';}
function wireLogos(box){box.querySelectorAll('img.clogo').forEach(img=>{const fb=()=>{img.outerHTML='<span class="cbadge '+img.dataset.k+'">'+img.dataset.c+'</span>';};img.onerror=fb;if(img.complete&&!img.naturalWidth)fb();});}
const num=id=>{const el=$(id);const v=el?parseFloat(el.value):NaN;return isNaN(v)?0:v;};
function markupPct(svc){
  return svc&&$('mk_'+svc.key) ? num('mk_'+svc.key) : num('mkGlobal');
}
const accList=()=>((P&&P.settings&&P.settings.accessorials)||[]);
const region=c=>{const eu=(P.settings&&P.settings.regions&&P.settings.regions.eu)||[];return eu.includes(c)?'eu':'row';};
function accVal(a){
  if(a.basis==='pctValue'){const pct=$('accPct_'+a.key)?num('accPct_'+a.key):(a.pct||0);const mn=$('accMin_'+a.key)?num('accMin_'+a.key):(a.min||0);return Math.max(pct*num('goodsValue')/100, mn);}
  const l=$('accList_'+a.key)?num('accList_'+a.key):(a.list||0);const d=$('accDisc_'+a.key)?num('accDisc_'+a.key):(a.disc||0);return l*(1-d/100);
}
const accOn=a=>{const el=$('acc_'+(a.group||a.key));return el&&el.checked;};
const DPD_COLOR='#dc2626', UPS_COLOR='#8B4513';
const SERVICES=[
 {key:'ae',name:'DPD Air Express',       carrier:'dpd',type:'band',src:'dpd_express',    days:2, color:DPD_COLOR, dash:[7,4]},
 {key:'ca',name:'DPD Classic Air',       carrier:'dpd',type:'band',src:'dpd_classic',    days:5, color:DPD_COLOR, dash:[]},
 {key:'ep',name:'DPD Classic ExpressPak',carrier:'dpd',type:'flat',src:'dpd_expresspak', days:3, cap:'ep', color:DPD_COLOR, dash:[2,3]},
 {key:'cp',name:'DPD Classic Parcel',    carrier:'dpd',type:'flat',src:'dpd_parcel',     days:3, cap:'cp', color:DPD_COLOR, dash:[9,4,2,4]},
 {key:'ux',name:'UPS Express Saver',     carrier:'ups',type:'zone',src:'ups_express', zmap:'c2zone_express', days:2, color:UPS_COLOR, dash:[]},
 {key:'us',name:'UPS Standard',          carrier:'ups',type:'zone',src:'ups_standard',zmap:'c2zone_standard', days:4, color:UPS_COLOR, dash:[7,4]},
];
const CARRIERS=[{key:'dpd',name:'DPD',color:DPD_COLOR},{key:'ups',name:'UPS',color:UPS_COLOR}];
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
// EU per-SKU customs duty (all carriers), £ amount; {over:true} above threshold; null otherwise.
let EU_CD=null;
function euCustomsAmt(c){
  const e=(P.settings&&P.settings.euCustomsDuty)||null;
  if(!e||!e.enabled)return null;
  if(region(c)!=='eu')return null;
  if(num('goodsValue')>(Number(e.thresholdEur)||150))return {over:true};   // goodsValue is € for EU
  const sku=Math.max(1,Math.floor(num('SK')||1));
  const eur=Math.round(sku*(Number(e.perSku)||0)*100)/100;
  return eur>0?{eur,sku,perSku:Number(e.perSku)}:null;
}
function build(rawBase,svc){
  if(rawBase==null) return {base:null};
  const fuelExtras=[],flatExtras=[];let fuelable=0,flat=0;
  ACTIVE.forEach(a=>{const amt=accAmount(a,svc);if(amt>0){if(a.fuelable){fuelable+=amt;fuelExtras.push([a.name,amt]);}else{flat+=amt;flatExtras.push([a.name,amt]);}}});
  // EU customs duty is shown separately in € (see calc render), not folded into the £ totals.
  const cbase=rawBase+fuelable, f=fuelOf(svc);
  const costFuel=cbase*f.cost/100, totalCost=cbase+costFuel+flat;
  const sellFuel=cbase*f.sell/100, sellShip=cbase+sellFuel;
  const mk=markupPct(svc), markupAmt=sellShip*mk/100;
  const sell=sellShip+markupAmt+flat;
  return {raw:rawBase,fuelExtras,flatExtras,cbase,fc:f.cost,fs:f.sell,costFuel,totalCost,sellFuel,mk,markupAmt,sell,cost:totalCost,base:rawBase};
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
function exceedsLimits(carrier, actual, L, W, H, isEp){
  const sides = [L, W, H].filter(x => x > 0).sort((a, b) => b - a);
  const longest = sides[0] || 0, second = sides[1] || 0, third = sides[2] || 0;
  const girth = (L && W && H) ? (longest + 2 * second + 2 * third) : 0;
  const carr = (carrier || '').toLowerCase();
  if (carr === 'dpd') {
    if (isEp && actual > 3) return { exceeded: true, reason: 'DPD Classic ExpressPak max weight is 3 kg' };
    if (actual > 31.5) return { exceeded: true, reason: 'Weight exceeds DPD limit of 31.5 kg' };
    if (longest > 175) return { exceeded: true, reason: 'Length exceeds DPD limit of 175 cm' };
    if (girth > 300) return { exceeded: true, reason: 'Girth (L + 2W + 2H) exceeds DPD limit of 300 cm' };
  } else if (carr === 'ups') {
    if (actual > 70) return { exceeded: true, reason: 'Weight exceeds UPS small package limit of 70 kg' };
    if (longest > 274) return { exceeded: true, reason: 'Length exceeds UPS limit of 274 cm' };
    if (girth > 400) return { exceeded: true, reason: 'Combined Length + Girth exceeds UPS limit of 400 cm' };
  }
  return { exceeded: false };
}

let chart;
function calc(){
  const c=csel.value,actual=num('wt'),L=num('L'),W=num('W'),H=num('H');
  const vol=(L&&W&&H)?(L*W*H)/P.divisor:0, chg=Math.max(actual,vol);
  ACTIVE=activeAcc(c,actual,L,W,H);
  EU_CD=euCustomsAmt(c); const cdShow=EU_CD&&!EU_CD.over?EU_CD:null; EU_CD=cdShow;
  const gvl=$('gvlab'); if(gvl)gvl.textContent=region(c)==='eu'?'Value (€)':'Value (£)';   // EU goods value entered in euros
  $('volw').textContent=vol?vol.toFixed(2)+' kg':'—';
  $('chgw').textContent=chg?chg.toFixed(2)+' kg':'—';
  $('driver').textContent=!chg?'—':(vol>actual?'Volumetric weight':'Actual weight');

  const dpdLimit=exceedsLimits('dpd',actual,L,W,H);
  const upsLimit=exceedsLimits('ups',actual,L,W,H);

  const key=upsLaneKey();
  const upsReady=(upsKey===key)?upsData:null;
  const upsLoading=chg>0&&!upsLimit.exceeded&&!upsReady;
  if(upsLoading)scheduleUpsFetch(key,c);

  let rows=[];

  // 1. DPD services (static) - checked against DPD 31.5kg / 175cm / 300cm limits
  if(!dpdLimit.exceeded){
    SERVICES.filter(svc=>svc.carrier==='dpd'&&!(svc.key==='ep'&&(actual>3||(region(c)==='eu'&&chg>CAPS.ep)))).forEach(svc=>{
      const b=baseRate(svc,c,chg);
      if(b.avail&&b.price!=null){
        const built=build(b.price,svc);
        if(built&&built.sell!=null) rows.push({svc,b,built,days:svc.days});
      }
    });
  }

  // 2. UPS services (Live when ready, fallback to static) - strictly Standard & Express Saver
  if(!upsLimit.exceeded){
    if(upsLoading){
      rows.push({svc:{key:'ups',name:'UPS',carrier:'ups',color:UPS_COLOR},loading:true,built:{sell:null}});
    }else if(upsReady&&upsReady.enabled){
      const ALLOWED_UPS=new Set(['ux','us','ups_65','ups_11']);
      (upsReady.services||[]).filter(live=>ALLOWED_UPS.has(live.key)||['65','11'].includes(String(live.code))).forEach(live=>{
        const liveSur=(live.accessorials||[]).map(a=>({name:a.name,code:a.code,costAmt:a.costAmt,amt:a.amt,remote:a.remote}));
        const coveredKeys=new Set(liveSur.map(a=>LIVE_CODE_TO_KEY[String(a.code)]).filter(Boolean));
        const upsCustom=ACTIVE.filter(a=>a.applyTo==='ups').filter(a=>{
          const k=a.key||a.group;
          return !coveredKeys.has(k);
        }).map(a=>({name:a.name,costAmt:Math.round(accVal(a)*100)/100,amt:Math.round(accVal(a)*100)/100})).filter(x=>x.amt>0);

        const mergedSur=[...liveSur,...upsCustom];
        const costSurTotal=mergedSur.reduce((t,x)=>t+(x.costAmt||x.amt||0),0);
        const sellSurTotal=mergedSur.reduce((t,x)=>t+(x.amt||0),0);

        const totalCost=Math.round(((live.costBase||0)+(live.costFuel||0)+costSurTotal)*100)/100;
        const totalSell=Math.round(((live.sellBase||0)+(live.sellFuel||0)+sellSurTotal)*100)/100;

        const flatExtras=mergedSur.map(x=>[x.name,x.amt]);
        const built={
          live:true,
          days:live.days,
          raw:live.costBase,
          fc:(live.costBase?(live.costFuel/live.costBase*100):0),
          fs:(live.fuelRatePct != null ? live.fuelRatePct : (live.sellBase?(live.sellFuel/live.sellBase*100):0)),
          costFuel:live.costFuel,
          sellFuel:live.sellFuel,
          totalCost,
          mk:live.markupPct,
          markupAmt:live.markupAmt,
          sell:totalSell,
          cost:totalCost,
          fuelExtras:[],
          flatExtras,
        };
        rows.push({
          svc:{key:live.key,name:live.name,carrier:'ups',color:UPS_COLOR},
          b:{price:live.costPrice,avail:true,live:true},
          built,
          live:true,
          days:live.days,
        });
      });
    }else{
      // Fallback to static UPS services
      SERVICES.filter(svc=>svc.carrier==='ups').forEach(svc=>{
        const b=baseRate(svc,c,chg);
        if(b.avail&&b.price!=null){
          const built=build(b.price,svc);
          if(built&&built.sell!=null) rows.push({svc,b,built,days:svc.days});
        }
      });
    }
  }

  // Filter out unavailable services (no n/a cards)
  rows=rows.filter(x=>x.loading||(x.built&&x.built.sell!=null&&x.built.sell>0));
  rows.sort((a,b)=>((a.built.sell==null)-(b.built.sell==null))||((a.built.sell==null||b.built.sell==null)?0:a.built.sell-b.built.sell));

  const sells=rows.filter(x=>x.built&&x.built.sell!=null).map(x=>x.built.sell);
  const min=sells.length?Math.min(...sells):null,max=sells.length?Math.max(...sells):null;
  const daysList=rows.filter(x=>x.days!=null&&x.days>0).map(x=>x.days);
  const minDays=daysList.length?Math.min(...daysList):null;
  const maxDays=daysList.length?Math.max(...daysList):null;
  const hasTransitDiff=(daysList.length>=2 && minDays!=null && maxDays!=null && minDays<maxDays);

  const sn=$('staticNotice');
  if(sn){
    const isStaticFallback=chg>0&&!upsLoading&&!upsLimit.exceeded&&(!upsReady||!upsReady.enabled);
    sn.style.display=isStaticFallback?'block':'none';
  }

  const R=$('results');R.innerHTML='';
  rows.forEach(({svc,b,built,loading,live,days})=>{
    const d=document.createElement('div');let cls='res';
    if(loading){
      d.className=cls+' na loadcard';
      d.innerHTML=`<div class="car">${carrierLogo(svc.carrier)}<span>${svc.name}</span></div><div class="pr"><span class="spin"></span></div><div class="sub">getting live UPS rates…</div>`;
      R.appendChild(d);return;
    }
    const isCheapest=(built.sell===min&&sells.length>1);
    const isFastest=(hasTransitDiff&&days!=null&&days===minDays);

    let badge='';
    if(isCheapest&&isFastest){
      cls+=' win fast';
      badge='<span class="badge best-both">BEST &amp; FASTEST</span>';
    }else if(isCheapest){
      cls+=' win';
      badge='<span class="badge">CHEAPEST</span>';
    }else if(isFastest){
      cls+=' fast';
      badge='<span class="badge fastest">FASTEST · '+days+' DAY'+(days===1?'':'S')+'</span>';
    }else if(built.sell===max&&sells.length>1){
      cls+=' lose';
    }else{
      cls+=' mid';
    }
    d.className=cls;
    const etaStr=(days!=null&&days>0)?(' · '+days+' business day'+(days===1?'':'s')):'';
    const head=`<div class="car">${carrierLogo(svc.carrier)}<span>${svc.name}${live?' <span class="tagpill" style="background:#dcfce7;color:#15803d;margin-left:4px">live</span>':''}</span></div>`;
    const bt=live?'UPS live':(typeof (b&&b.band)==='number'?(b.band+' kg'):(b&&b.band));
    const fuelLines=built.fuelExtras.map(([n,v])=>`<div class="row"><span>${n}</span><span>${money(v)}</span></div>`).join('');
    const flatLines=built.flatExtras.map(([n,v])=>`<div class="row"><span>${n}</span><span>${money(v)}</span></div>`).join('');
    d.innerHTML=badge+head+`<div class="pr">${money(built.sell)}</div><div class="sub">customer price${etaStr}</div>
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
        ${built.mk?`<div class="row"><span>Markup (${built.mk.toFixed(0)}%)</span><span>${money(built.markupAmt)}</span></div>`:''}
        ${flatLines}
        <div class="row tot"><span>Total customer price</span><span>${money(built.sell)}</span></div>
        ${EU_CD?`<div class="row" style="margin-top:5px;color:#9d174d;font-weight:800"><span>EU customs duty</span><span>€${EU_CD.eur.toFixed(2)}</span></div><div style="font-size:10px;color:var(--muted);font-weight:600;white-space:nowrap">${EU_CD.sku} item${EU_CD.sku>1?'s':''} × €${EU_CD.perSku} · paid at import</div>`:''}
      </div>`;
    R.appendChild(d);
  });
  wireLogos(R);
  const v=$('verdict');
  if(!chg)v.innerHTML='Enter a weight to compare.';
  else if(sells.length<1){
    if(dpdLimit.exceeded&&upsLimit.exceeded){
      v.innerHTML=`<span style="color:#b91c1c">⚠️ <b>Exceeds carrier maximum limits:</b> DPD (${dpdLimit.reason}) &amp; UPS (${upsLimit.reason}). No parcel services available for <b>${c}</b> at this size/weight.</span>`;
    }else if(dpdLimit.exceeded){
      v.innerHTML=`<span style="color:#b91c1c">⚠️ <b>Exceeds DPD maximums:</b> ${dpdLimit.reason}. No other services available for <b>${c}</b> at <b>${chg.toFixed(2)} kg</b>.</span>`;
    }else if(upsLimit.exceeded){
      v.innerHTML=`<span style="color:#b91c1c">⚠️ <b>Exceeds UPS maximums:</b> ${upsLimit.reason}. No other services available for <b>${c}</b> at <b>${chg.toFixed(2)} kg</b>.</span>`;
    }else{
      v.innerHTML=`No available services found for <b>${c}</b> at <b>${chg.toFixed(2)} kg</b>.`;
    }
  }
  else if(sells.length<2)v.innerHTML=`Only one priced service for <b>${c}</b> at <b>${chg.toFixed(2)} kg</b>: <b>${rows[0].svc.name}</b> (customer ${money(rows[0].built.sell)}, cost ${money(rows[0].built.totalCost)}).`;
  else{
    const w=rows.find(x=>x.built&&x.built.sell===min);
    const fastW=rows.find(x=>hasTransitDiff&&x.days!=null&&x.days===minDays);
    const tags=ACTIVE.map(a=>a.name);
    const o=sells.filter(p=>p!==min).sort((a,b)=>a-b),nb=o[0],save=nb-min,pct=save/nb*100;
    let verdictHTML=`Cheapest for <b>${c}</b> at <b>${chg.toFixed(2)} kg</b>${tags.length?' ('+tags.join(', ')+')':''}: <b style="color:var(--g)">${w.svc.name}</b> — customer <b>${money(w.built.sell)}</b>, <b>£${save.toFixed(2)}</b> (${pct.toFixed(1)}%) cheaper than next best. <span style="color:var(--muted)">Your cost ${money(w.built.totalCost)}.</span>`;
    if(fastW&&fastW.svc.name!==w.svc.name){
      verdictHTML+=` <span style="display:block;margin-top:5px;color:#0369a1">⚡ <b>Fastest:</b> ${fastW.svc.name} (${fastW.days} business day${fastW.days===1?'':'s'}) at customer <b>${money(fastW.built.sell)}</b>.</span>`;
    }
    v.innerHTML=verdictHTML;
  }
  drawChart(c);
}
function drawChart(c){
  const metric=$('metric').value, key={sell:'sell',cost:'cost',base:'base'}[metric];
  const ds=[],leg=[];
  SERVICES.forEach(svc=>{let data=null;
    if(svc.type==='band'){const arr=P[svc.src][c];if(arr)data=arr.map(p=>p==null?null:build(p,svc)[key]);}
    else if(svc.type==='flat'){const p=P[svc.src][c];if(p!=null){const cap=CAPS[svc.cap];data=bands.map(w=>w>cap+1e-9?null:build(p,svc)[key]);}}
    else if(svc.type==='zone'){const zone=zoneFor(svc,c),z=zone&&P[svc.src][zone];if(zone&&z)data=bands.map(w=>{const r=baseRate(svc,c,w);return r.price==null?null:build(r.price,svc)[key];});}
    if(data){ds.push({label:svc.name,data,borderColor:svc.color,borderDash:svc.dash||[],borderWidth:2.4,tension:.12,pointRadius:0,spanGaps:false});
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
let accCarrier='all';
const CARRIER_NAME={ups:'UPS',dpd:'DPD',dhl:'DHL',all:'All carriers'};
function renderAccTabs(){
  const box=$('accTabs');if(!box)return;box.innerHTML='';
  const present=[...new Set(accList().map(a=>a.applyTo))].sort();
  if(!present.includes(accCarrier)&&accCarrier!=='all')accCarrier='all';
  ['all',...present].forEach(t=>{const b=document.createElement('button');
    b.className='voltab'+(t===accCarrier?' active':'');
    b.textContent=CARRIER_NAME[t]||t.toUpperCase();
    b.onclick=()=>{accCarrier=t;renderAccTabs();buildAccTable();};
    box.appendChild(b);});
}
function buildAccTable(){
  const tb=$('accBody');tb.innerHTML='';
  const trg=a=>a.cond==='auto'?'auto (size/wt)':(a.cond==='always'?'always':(a.cond==='countryIn'?(a.countries||[]).join(','):(a.cond==='region'?a.region.toUpperCase():'toggle')));
  accList().filter(a=>accCarrier==='all'||a.applyTo===accCarrier).forEach(a=>{const tr=document.createElement('tr');
    let cells;
    if(a.basis==='pctValue') cells=`<td><input id="accPct_${a.key}" type="number" step="0.1" value="${a.pct||0}"/> %</td><td><input id="accMin_${a.key}" type="number" step="0.01" value="${a.min||0}"/></td>`;
    else cells=`<td><input id="accList_${a.key}" type="number" step="0.01" value="${a.list||0}"/></td><td><input id="accDisc_${a.key}" type="number" step="1" value="${a.disc||0}"/></td>`;
    tr.innerHTML=`<td>${a.name}</td><td>${(a.applyTo||'').toUpperCase()}</td><td><span class="tagpill${a.cond!=='toggle'?' auto':''}">${trg(a)}</span></td>${cells}<td><span id="accNet_${a.key}"></span></td>`;
    tb.appendChild(tr);});
  accList().filter(a=>accCarrier==='all'||a.applyTo===accCarrier).forEach(a=>{const upd=()=>{$('accNet_'+a.key).textContent=accNetDisplay(a);calc();};
    if(a.basis==='pctValue'){$('accPct_'+a.key).addEventListener('input',upd);$('accMin_'+a.key).addEventListener('input',upd);}
    else{$('accList_'+a.key).addEventListener('input',upd);$('accDisc_'+a.key).addEventListener('input',upd);}
    $('accNet_'+a.key).textContent=accNetDisplay(a);});
}
function renderToggles(){
  const t=$('toggles');t.innerHTML='';const seen={};
  accList().filter(a=>a.cond==='toggle').forEach(a=>{const g=a.group||a.key;if(seen[g])return;seen[g]=1;
    const lab=document.createElement('label');lab.className='tg';
    lab.innerHTML=`<input type="checkbox" id="acc_${g}"/> ${a.name}`;t.appendChild(lab);
    lab.querySelector('input').addEventListener('change',calc);});
}
function fillEuDuty(e){
  if($('euEnabled'))$('euEnabled').checked=e.enabled!==false;
  if($('euRate'))$('euRate').value=(e.eurPerGbp!=null?e.eurPerGbp:1.16);
  if($('euPerSku'))$('euPerSku').value=(e.perSku!=null?e.perSku:3);
  if($('euThresh'))$('euThresh').value=(e.thresholdEur!=null?e.thresholdEur:150);
}
function renderMarkup(){
  const wrap=$('mkList');if(!wrap)return;wrap.innerHTML='';
  const g=num('mkGlobal');
  SERVICES.forEach(svc=>{const row=document.createElement('div');row.className='mkrow';
    row.innerHTML=`<div class="nm"><span class="sw" style="background:${svc.color}"></span>${svc.name}</div>`
      +`<div><input id="mk_${svc.key}" type="number" min="0" step="1" value="${g}"/><span class="pct">%</span></div>`;
    wrap.appendChild(row);});
  SERVICES.forEach(svc=>$('mk_'+svc.key).addEventListener('input',calc));
}
function syncVolTabs(){const g=String(num('mkGlobal'));
  document.querySelectorAll('#volTabs .voltab').forEach(b=>b.classList.toggle('active',b.dataset.mk===g));}
function applyGlobalMarkup(){const g=num('mkGlobal');
  SERVICES.forEach(svc=>{const el=$('mk_'+svc.key);if(el)el.value=g;});syncVolTabs();calc();}
function volTabClick(pct){$('mkGlobal').value=pct;applyGlobalMarkup();}
function bootCalc(){
  bands=P.bands;
  const s=P.settings||{fuelByService:{},caps:{cp:31.5,ep:3},accessorials:[]};
  CAPS={cp:(s.caps&&s.caps.cp)||31.5, ep:(s.caps&&s.caps.ep)||3};
  buildFuelTable(s.fuelByService||{});
  fillEuDuty(s.euCustomsDuty||{});
  if($('upsMarkup'))$('upsMarkup').value=(s.importMarkupPct!=null?s.importMarkupPct:0);
  if($('hsFreeLines'))$('hsFreeLines').value=(s.hsFreeLines!=null?s.hsFreeLines:5);
  if($('hsLineCharge'))$('hsLineCharge').value=(s.hsLineCharge!=null?s.hsLineCharge:2.95);
  if($('debugRaw'))$('debugRaw').checked=(s.debugRaw!==false);
  renderAccTabs();
  buildAccTable();
  renderToggles();
  renderMarkup();
  renderRcServices();
  buildRepList();
  if(!csel.options.length){
    P.countries.forEach(c=>csel.appendChild(new Option(c,c)));
    csel.value=P.countries.includes('USA')?'USA':P.countries[0];
    ['country','postcode','wt','L','W','H','goodsValue','SK','metric'].forEach(id=>$(id).addEventListener('input',calc));
    $('metric').addEventListener('change',calc);
    $('mkGlobal').addEventListener('input',applyGlobalMarkup);
    $('mkApply').addEventListener('click',applyGlobalMarkup);
    document.querySelectorAll('#volTabs .voltab').forEach(b=>b.addEventListener('click',()=>volTabClick(b.dataset.mk)));
  }
  calc();
}

const SCREENS=['loading','setup','login','app','settings','quotes','collection'];
function screen(id){SCREENS.forEach(s=>$(s).style.display='none');
  const authed=(id==='app'||id==='settings'||id==='quotes'||id==='collection');$(id).style.display='block';
  $('hdr').style.display=authed?'flex':'none';if(!authed)$('pwPanel').style.display='none';}
const jpost=(p,b)=>fetch(p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b||{})});
const jput =(p,b)=>fetch(p,{method:'PUT', headers:{'Content-Type':'application/json'},body:JSON.stringify(b||{})});
const jpatch=(p,b)=>fetch(p,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(b||{})});
const jdel=p=>fetch(p,{method:'DELETE'});
function applyChrome(){
  const admin=(current&&current.role==='admin');
  $('settingsBtn').style.display=(!authEnabled||admin)?'':'none';
  $('quotesBtn').style.display=authEnabled?'':'none';
  $('collectionBtn').style.display=authEnabled?'':'none';
  $('pwBtn').style.display=authEnabled?'':'none';
  $('logoutBtn').style.display=authEnabled?'':'none';
  $('teamPanel').style.display=authEnabled?'block':'none';
  $('customersPanel').style.display=authEnabled?'block':'none';
  $('banner').style.display=authEnabled?'none':'block';
  $('who').textContent=current?((current.name||current.email)+' · '+current.role):'';
}
async function loadConfigAndApp(){
  const r=await fetch('/api/config'); if(r.status===401){screen('login');return;}
  P=await r.json(); if(!P||!P.bands){screen('login');return;}
  bootCalc(); applyChrome(); screen('app'); refreshCards();
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

// ---- Quotes dashboard ----
let qchart=null, qTimer=null;
function qesc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
function qpretty(v){if(v==null)return '(none)';try{const o=(typeof v==='string')?JSON.parse(v):v;return JSON.stringify(o,null,2);}catch(e){return String(v);}}
function upsSvcName(c){const M={'11':'UPS Standard','07':'UPS Worldwide Express','08':'UPS Worldwide Expedited','54':'UPS Worldwide Express Plus','65':'UPS Worldwide Saver','96':'UPS Worldwide Express Freight','03':'UPS Ground','12':'UPS 3 Day Select','02':'UPS 2nd Day Air','01':'UPS Next Day Air'};return M[c]||('UPS service '+c);}
function upsChgName(c){const M={'375':'Fuel surcharge','270':'Residential surcharge','190':'Delivery area surcharge','100':'Additional handling','110':'Large package surcharge','120':'Over-maximum-limits','258':'Extended area','375 ':'Fuel'};return (M[c]||'Accessorial')+' ('+c+')';}
function money2(v){const n=Number(v);return isNaN(n)?'—':('£'+n.toFixed(2));}
function qarr(v){return Array.isArray(v)?v:(v?[v]:[]);}
function breakdownHTML(x){
  let raw;try{raw=(typeof x.debug.raw==='string')?JSON.parse(x.debug.raw):x.debug.raw;}catch(e){return '<div class="qmuted">Couldn’t parse the response — see the raw JSON below.</div>';}
  const rr=raw&&raw.RateResponse;if(!rr)return '<div class="qmuted">No rate data in the response — see the raw JSON below.</div>';
  let list=qarr(rr.RatedShipment);if(!list.length)return '<div class="qmuted">No services returned — see the raw JSON below.</div>';
  const byCode={};(x.services||[]).forEach(s=>{byCode[s.code]=s;});
  const cards=list.map(rs=>{
    const code=(rs.Service&&rs.Service.Code)||'';
    const neg=rs.NegotiatedRateCharges;
    let base=rs.BaseServiceCharge, items=qarr(rs.ItemizedCharges);
    if((!base||base.MonetaryValue==null)&&neg&&neg.BaseServiceCharge)base=neg.BaseServiceCharge;
    if(!items.length&&neg&&neg.ItemizedCharges)items=qarr(neg.ItemizedCharges);
    const svcOpt=rs.ServiceOptionsCharges?rs.ServiceOptionsCharges.MonetaryValue:null;
    const pubTotal=rs.TotalCharges?rs.TotalCharges.MonetaryValue:null;
    const negTotal=(neg&&neg.TotalCharge)?neg.TotalCharge.MonetaryValue:null;
    const sold=byCode[code];
    let rows='<tr><td>Base charge</td><td class="r">'+money2(base&&base.MonetaryValue)+'</td></tr>';
    items.forEach(it=>{rows+='<tr><td>'+qesc(upsChgName(it.Code))+'</td><td class="r">'+money2(it.MonetaryValue)+'</td></tr>';});
    if(svcOpt&&Number(svcOpt)>0)rows+='<tr><td>Service options</td><td class="r">'+money2(svcOpt)+'</td></tr>';
    rows+='<tr class="bd-sub"><td>Published total</td><td class="r">'+money2(pubTotal)+'</td></tr>';
    if(negTotal!=null)rows+='<tr class="bd-neg"><td>Your account rate (negotiated)</td><td class="r">'+money2(negTotal)+'</td></tr>';
    if(sold)rows+='<tr class="bd-sell"><td>Quoted to customer'+(x.debug.markupPct!=null?(' · incl. '+x.debug.markupPct+'% markup'):'')+'</td><td class="r">'+money2(sold.price)+'</td></tr>';
    return '<div class="bd"><div class="bd-h">'+qesc(upsSvcName(code))+' <span class="qmuted">· code '+qesc(code)+'</span></div><table class="bdt"><tbody>'+rows+'</tbody></table></div>';
  }).join('');
  return '<div class="bdwrap">'+cards+'</div>';
}
function qDT(s){const d=new Date(s);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});}
async function openQuotes(){screen('quotes');await loadQuoteStats();await loadQuoteLog($('qSearch').value.trim());}
async function loadQuoteStats(){
  try{const r=await fetch('/api/quotes/stats');if(!r.ok)return;const s=await r.json();
    $('qStatToday').textContent=s.today;$('qStatWeek').textContent=s.week;$('qStatMonth').textContent=s.month;$('qStatTotal').textContent=s.total;
    drawQuoteChart(s.perDay||[]);}catch(e){}
}
function drawQuoteChart(perDay){
  const map={};perDay.forEach(r=>{map[r.d]=r.c;});
  const labels=[],data=[],today=new Date();
  for(let i=29;i>=0;i--){const d=new Date(today);d.setDate(today.getDate()-i);const key=d.toISOString().slice(0,10);
    labels.push(d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}));data.push(map[key]||0);}
  if(qchart)qchart.destroy();
  qchart=new Chart($('qChart'),{type:'bar',data:{labels,datasets:[{label:'Quotes',data,backgroundColor:'#0E9C63',borderRadius:4,maxBarThickness:22}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.parsed.y+' quote'+(c.parsed.y===1?'':'s')}}},
      scales:{y:{beginAtZero:true,ticks:{precision:0}},x:{grid:{display:false},ticks:{maxRotation:0,autoSkip:true,maxTicksLimit:10}}}}});
}
async function loadQuoteLog(q){
  try{const r=await fetch('/api/quotes'+(q?('?q='+encodeURIComponent(q)):''));if(!r.ok){$('qEmpty').textContent='Could not load the quote log.';return;}
    renderQuoteLog((await r.json()).quotes||[]);}catch(e){$('qEmpty').textContent='Could not load the quote log.';}
}
function qShip(x){const b=[(x.parcels||0)+' parcel'+((x.parcels===1)?'':'s')];if(x.weight_kg)b.push((Math.round(x.weight_kg*10)/10)+' kg');return b.join(' · ');}
function renderQuoteLog(rows){
  const tb=$('qBody');tb.innerHTML='';
  rows.forEach(x=>{
    const from=x.sender_country||'—';const to=[x.receiver_country||'',x.receiver_postcode||''].filter(Boolean).join(' ')||'—';
    const tr=document.createElement('tr');
    tr.innerHTML='<td><button class="qexp" data-id="'+x.id+'">▸</button></td>'
      +'<td style="white-space:nowrap">'+qDT(x.created_at)+'</td>'
      +'<td><b>'+qesc(x.customer||'(direct)')+'</b></td>'
      +'<td style="white-space:nowrap">'+qesc(from)+' → '+qesc(to)+'</td>'
      +'<td>'+qesc(qShip(x))+'</td>'
      +'<td class="qmuted">'+(x.goods_value?('£'+Number(x.goods_value).toFixed(0)):'—')+'</td>'
      +'<td class="qmuted">'+(x.cheapest!=null?('£'+Number(x.cheapest).toFixed(2)):'—')+'</td>';
    tb.appendChild(tr);
    const svcs=Array.isArray(x.services)?x.services:[];
    const svcRows=svcs.length?svcs.map(s=>'<tr><td>'+qesc(s.name||s.code||'')+'</td><td class="qmuted">'+(s.days!=null?(s.days+' day'+(s.days===1?'':'s')):'—')+'</td><td class="qmuted">£'+(s.cost!=null?Number(s.cost).toFixed(2):'—')+'</td><td><b>£'+(s.price!=null?Number(s.price).toFixed(2):'—')+'</b></td></tr>').join(''):'<tr><td colspan="4" class="qmuted">No services returned for this lane.</td></tr>';
    let rawHtml='';
    if(x.debug){const dbg=x.debug;
      rawHtml='<div class="rawbox"><div class="rawhd"><span class="lbl">UPS charge breakdown</span><span class="qmuted">HTTP '+(dbg.status!=null?dbg.status:'—')+'</span></div>'
        +breakdownHTML(x)
        +'<details style="margin-top:10px"><summary class="rawmore">Show full raw JSON (request &amp; response)</summary>'
          +'<div class="rawhd"><span class="lbl">Request sent to UPS</span><button class="rawcopy" data-copy="req" data-id="'+x.id+'">Copy</button></div><pre class="rawpre" id="rawreq'+x.id+'">'+qesc(qpretty(dbg.request))+'</pre>'
          +'<div class="rawhd"><span class="lbl">Response from UPS</span><button class="rawcopy" data-copy="res" data-id="'+x.id+'">Copy</button></div><pre class="rawpre" id="rawres'+x.id+'">'+qesc(qpretty(dbg.raw))+'</pre>'
        +'</details></div>';
    }
    const dr=document.createElement('tr');dr.className='qdetail';dr.dataset.id=x.id;dr.style.display='none';
    dr.innerHTML='<td></td><td colspan="6"><table><thead><tr><th>Service</th><th>Transit</th><th>Cost</th><th>Quoted price</th></tr></thead><tbody>'+svcRows+'</tbody></table>'
      +(x.sender_company?'<div class="qmuted" style="margin-top:6px">Sender: '+qesc(x.sender_company)+'</div>':'')+rawHtml+'</td>';
    tb.appendChild(dr);
  });
  $('qEmpty').textContent=rows.length?'':'No quotes logged yet — they’ll appear here as customers use the import quote tab.';
  tb.querySelectorAll('.qexp').forEach(b=>b.onclick=()=>{const dr=tb.querySelector('.qdetail[data-id="'+b.dataset.id+'"]');const open=dr.style.display!=='none';dr.style.display=open?'none':'';b.textContent=open?'▸':'▾';});
  tb.querySelectorAll('.rawcopy').forEach(b=>b.onclick=()=>{const el=$( (b.dataset.copy==='req'?'rawreq':'rawres')+b.dataset.id);if(el&&navigator.clipboard)navigator.clipboard.writeText(el.textContent);b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1200);});
}
$('quotesBtn').onclick=openQuotes;
$('quotesBack').onclick=()=>{screen('app');calc();};
$('qRefresh').onclick=()=>{loadQuoteStats();loadQuoteLog($('qSearch').value.trim());};
$('qSearch').addEventListener('input',()=>{clearTimeout(qTimer);qTimer=setTimeout(()=>loadQuoteLog($('qSearch').value.trim()),250);});

// ---- Create a Collection ----
function populateColCountries() {
  const c1 = $('colCountry'), c2 = $('colDestCountry');
  if (!c1 || c1.options.length) return;
  const rawList = (P && P.countries && P.countries.length) ? P.countries : [];
  const allSet = new Set(['United Kingdom', ...rawList]);
  const sorted = Array.from(allSet).sort((a, b) => a.localeCompare(b));

  c1.appendChild(new Option('United Kingdom (GB)', 'United Kingdom'));
  c2.appendChild(new Option('United Kingdom (GB)', 'United Kingdom'));

  sorted.forEach(c => {
    if (c !== 'United Kingdom') {
      c1.appendChild(new Option(c, c));
      c2.appendChild(new Option(c, c));
    }
  });

  c1.value = 'United Kingdom';
  c2.value = 'United Kingdom';

  const today = new Date();
  if (today.getHours() >= 16) today.setDate(today.getDate() + 1);
  if ($('colDate') && !$('colDate').value) $('colDate').value = today.toISOString().slice(0, 10);
}

async function openCollection() {
  screen('collection');
  populateColCountries();
  $('colResultCard').style.display = 'none';
  $('colMsg').textContent = '';
  await loadCollections();
}

async function loadCollections() {
  try {
    const r = await fetch('/api/collections');
    if (!r.ok) { $('colEmpty').textContent = 'Could not load collections.'; return; }
    const d = await r.json();
    renderCollections(d.collections || []);
  } catch (e) {
    $('colEmpty').textContent = 'Could not load collections: ' + e.message;
  }
}

function renderCollections(list) {
  const tb = $('colHistoryBody');
  tb.innerHTML = '';
  list.forEach(x => {
    const tr = document.createElement('tr');
    const prnStr = x.prn ? `<b style="color:var(--teal);font-family:monospace;font-size:13.5px">${qesc(x.prn)}</b>` : '<span class="qmuted">—</span>';
    const statusChip = x.status === 'booked' ? '<span class="cbadge" style="background:var(--teal);padding:2px 6px;border-radius:4px;font-size:10px;color:#fff;font-weight:800">BOOKED</span>' : '<span class="cbadge" style="background:var(--r);padding:2px 6px;border-radius:4px;font-size:10px;color:#fff;font-weight:800">FAILED</span>';
    const timeWin = `${qesc(x.ready_time || '09:00')} – ${qesc(x.close_time || '17:00')}`;
    const weightStr = x.total_weight_kg ? `${x.total_weight_kg} kg` : '';
    const parcelsStr = `${x.parcels || 1} parcel${x.parcels === 1 ? '' : 's'}${weightStr ? (' · ' + weightStr) : ''}`;
    const trackingStr = x.tracking_number ? `<span style="font-family:monospace;font-size:12px;font-weight:700">${qesc(x.tracking_number)}</span>` : '<span class="qmuted">—</span>';

    tr.innerHTML = `
      <td>${prnStr}</td>
      <td style="white-space:nowrap">${qDT(x.created_at)}</td>
      <td style="white-space:nowrap"><b>${qesc(x.pickup_date || '—')}</b><div class="qmuted" style="font-size:11px">${timeWin}</div></td>
      <td><b>${qesc(x.company_name || x.contact_name || '—')}</b>${(x.phone ? ('<div class="qmuted" style="font-size:11px">' + qesc(x.phone) + '</div>') : '')}</td>
      <td>${qesc(x.address_line || '')}, ${qesc(x.city || '')} ${qesc(x.postal_code || '')}</td>
      <td>${parcelsStr}</td>
      <td>${trackingStr}</td>
      <td>${statusChip}</td>
    `;
    tb.appendChild(tr);
  });
  $('colEmpty').textContent = list.length ? '' : 'No collections booked yet.';
}

$('collectionBtn').onclick = openCollection;
$('colBack').onclick = () => { screen('app'); calc(); };
$('colRefresh').onclick = loadCollections;

$('colSubmit').onclick = async () => {
  $('colMsg').className = '';
  $('colMsg').textContent = 'Submitting pickup request to UPS…';
  $('colSubmit').disabled = true;
  $('colResultCard').style.display = 'none';

  const body = {
    companyName: $('colCompany').value.trim(),
    contactName: $('colContact').value.trim(),
    addressLine1: $('colAddr1').value.trim(),
    addressLine2: $('colAddr2').value.trim(),
    city: $('colCity').value.trim(),
    postalCode: $('colPostcode').value.trim(),
    country: $('colCountry').value,
    destinationCountry: $('colDestCountry').value,
    phone: $('colPhone').value.trim(),
    email: $('colEmail').value.trim(),
    residential: $('colResi').checked,
    pickupDate: $('colDate').value,
    readyTime: $('colReady').value,
    closeTime: $('colClose').value,
    parcels: num('colParcels') || 1,
    weight: num('colWeight') || 1.0,
    serviceCode: $('colService').value,
    trackingNumber: $('colTracking').value.trim(),
    specialInstruction: $('colSpecial').value.trim(),
  };

  try {
    const r = await jpost('/api/collections', body);
    const d = await r.json();
    $('colSubmit').disabled = false;
    const card = $('colResultCard');

    if (!r.ok || !d.ok) {
      $('colMsg').textContent = '';
      card.style.display = 'block';
      card.innerHTML = `
        <div style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid var(--r);padding:14px 18px;border-radius:8px">
          <div style="font-size:13px;font-weight:800;color:var(--r);text-transform:uppercase;letter-spacing:0.04em">Collection Booking Failed</div>
          <div style="margin-top:6px;font-size:13.5px;color:#991b1b"><b>UPS error:</b> ${qesc(d.error || 'UPS rejected the pickup request.')}</div>
          ${d.raw ? ('<details style="margin-top:8px"><summary class="rawmore" style="color:var(--r)">Show raw UPS response</summary><pre class="rawpre" style="margin-top:6px">' + qesc(qpretty(d.raw)) + '</pre></details>') : ''}
        </div>`;
      await loadCollections();
      return;
    }

    $('colMsg').textContent = '';
    card.style.display = 'block';
    card.innerHTML = `
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-left:4px solid var(--teal);padding:14px 18px;border-radius:8px">
        <div style="font-size:13px;font-weight:800;color:var(--teal);text-transform:uppercase;letter-spacing:0.04em">✓ Collection Successfully Booked with UPS</div>
        <div style="margin-top:8px;font-size:15px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span><b>Pickup Request Number (PRN):</b></span>
          <span style="font-family:monospace;font-size:18px;font-weight:800;color:#065f46;background:#d1fae5;padding:3px 10px;border-radius:6px;letter-spacing:0.03em">${qesc(d.prn || '(Generated)')}</span>
          ${d.prn ? '<button class="rawcopy" id="colCopyPrn">Copy PRN</button>' : ''}
        </div>
        <div style="margin-top:6px;font-size:12.5px;color:#065f46">${d.rateStatus ? ('Rate status: ' + qesc(d.rateStatus)) : 'Pickup scheduled with courier.'}</div>
      </div>`;

    if ($('colCopyPrn')) {
      $('colCopyPrn').onclick = () => {
        if (navigator.clipboard) navigator.clipboard.writeText(d.prn);
        $('colCopyPrn').textContent = 'Copied';
        setTimeout(() => { if ($('colCopyPrn')) $('colCopyPrn').textContent = 'Copy PRN'; }, 1200);
      };
    }

    await loadCollections();
  } catch (e) {
    $('colSubmit').disabled = false;
    $('colMsg').textContent = 'Failed to submit: ' + e.message;
  }
};
$('saveBtn').onclick=async()=>{$('saveMsg').className='ok';$('saveMsg').textContent='';
  const fbs={};SERVICES.forEach(svc=>{fbs[svc.key]={name:svc.name,cost:num('fc_'+svc.key),sell:num('fs_'+svc.key)};});
  const acc=accList().filter(a=>$('accList_'+a.key)||$('accPct_'+a.key)).map(a=>{const o={key:a.key};if(a.basis==='pctValue'){o.pct=num('accPct_'+a.key);o.min=num('accMin_'+a.key);}else{o.list=num('accList_'+a.key);o.disc=num('accDisc_'+a.key);}return o;});
  const euCustomsDuty={enabled:$('euEnabled')?$('euEnabled').checked:true,eurPerGbp:num('euRate'),perSku:num('euPerSku'),thresholdEur:num('euThresh')};
  const importMarkupPct=$('upsMarkup')?num('upsMarkup'):0;
  const debugRaw=$('debugRaw')?$('debugRaw').checked:true;
  const hsFreeLines=$('hsFreeLines')?num('hsFreeLines'):5;
  const hsLineCharge=$('hsLineCharge')?num('hsLineCharge'):2.95;
  const r=await jput('/api/settings',{fuelByService:fbs,accessorials:acc,euCustomsDuty,importMarkupPct,debugRaw,hsFreeLines,hsLineCharge});const d=await r.json();
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
function pricedByService(c){
  const actual=num('wt'),L=num('L'),W=num('W'),H=num('H');
  const vol=(L&&W&&H)?(L*W*H)/P.divisor:0, chg=Math.max(actual,vol);
  ACTIVE=activeAcc(c,actual,L,W,H);
  const out={};
  SERVICES.forEach(svc=>{const b=baseRate(svc,c,chg);out[svc.key]=(b.avail&&b.price!=null)?build(b.price,svc).sell:null;});
  return out;
}
function verdictText(up,dp){
  const t=up+dp;
  if(!t) return {msg:'No priced destinations in this selection.',cls:'r'};
  if(dp>up){const p=Math.round(dp/t*100);return {msg:'DPD is cheapest for '+dp+' of '+t+' destinations ('+p+'%). A DPD-led card is likely best overall.',cls:'g'};}
  if(up>dp){const p=Math.round(up/t*100);return {msg:'UPS is cheapest for '+up+' of '+t+' destinations ('+p+'%). A UPS-led card is likely best overall.',cls:'g'};}
  return {msg:'Evenly split — DPD and UPS each win '+dp+'. A mixed card gives the best coverage.',cls:'a'};
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
  if(!countries.length){
    if($('repMsg')) $('repMsg').textContent='Select at least one country.';
    if($('repBody')) $('repBody').innerHTML='';
    if($('repSummary')) $('repSummary').textContent='';
    return;
  }
  if($('repMsg')) $('repMsg').textContent='';
  const {data,up,dp}=reportRows(countries);
  const tb=$('repBody');
  if(tb){
    tb.innerHTML='';
    data.forEach(r=>{const tr=document.createElement('tr');
      if(r.none){tr.innerHTML=`<td>${r.c}</td><td colspan="4" class="chartnote">no services available</td>`;tb.appendChild(tr);return;}
      tr.innerHTML=`<td>${r.c}</td><td><b style="color:${r.win.carrier==='ups'?'#0f766e':'#2563eb'}">${r.win.name}</b></td><td><b>${money(r.win.sell)}</b></td><td>${r.next?r.next.name+' · '+money(r.next.sell):'—'}</td><td>${r.next?money(r.save):'—'}</td>`;
      tb.appendChild(tr);});
  }
  const v=verdictText(up,dp);
  const col=v.cls==='g'?'var(--g)':(v.cls==='a'?'var(--a)':'var(--r)');
  const bg=v.cls==='g'?'var(--g-bg)':(v.cls==='a'?'var(--a-bg)':'var(--r-bg)');
  if($('repSummary')){
    $('repSummary').innerHTML=`<div style="border:1px solid ${col};background:${bg};border-radius:10px;padding:11px 13px">`
      +`<b style="color:${col}">Recommendation:</b> ${v.msg}`
      +`<div style="margin-top:4px;color:var(--muted);font-size:13px">Across <b>${countries.length}</b> selected: DPD cheapest in <b>${dp}</b>, UPS cheapest in <b>${up}</b>.</div></div>`;
  }
}
function generateReport(){
  const countries=selectedCountries();
  if(!countries.length){if($('repMsg')) $('repMsg').textContent='Select at least one country.';return;}
  if($('repMsg')) $('repMsg').textContent='';
  const {data,up,dp}=reportRows(countries);
  const actual=num('wt'),L=num('L'),W=num('W'),H=num('H'),val=num('goodsValue');
  const dims=(L&&W&&H)?(L+'×'+W+'×'+H+' cm'):'';
  const tog=accList().filter(a=>a.cond==='toggle'&&accOn(a)).map(a=>a.name);
  const now=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const trs=data.map(r=>r.none?`<tr><td>${r.c}</td><td colspan="4" style="color:#94a3b8">no services available</td></tr>`
    :`<tr><td>${r.c}</td><td><b>${r.win.name}</b></td><td>£${r.win.sell.toFixed(2)}</td><td>${r.next?r.next.name+' · £'+r.next.sell.toFixed(2):'—'}</td><td>${r.next?'£'+r.save.toFixed(2):'—'}</td></tr>`).join('');
  const co=($('cardCo')?$('cardCo').value:($('custName')?$('custName').value:'')).trim();
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
    +(co?'<p class="sub" style="font-size:15px;color:#0f172a;margin:0 0 2px">Prepared for <b>'+co+'</b></p>':'')
    +'<p class="sub">Cheapest carrier by destination · generated '+now+'</p>'
    +'<div class="spec">Parcel: '+spec+'</div>'
    +'<div class="sum"><b>'+countries.length+'</b> destinations — cheapest is UPS in <b>'+up+'</b>, DPD in <b>'+dp+'</b>.</div>'
    +'<table><thead><tr><th>Country</th><th>Cheapest service</th><th>Customer price</th><th>Next best</th><th>You save</th></tr></thead><tbody>'+trs+'</tbody></table>'
    +'<p class="sub" style="margin-top:20px">Customer sell prices incl. fuel and duty handling, excl. VAT. Indicative and subject to final confirmation.</p>'
    +'</body></html>';
  const w=window.open('','_blank');if(w){w.document.write(html);w.document.close();}
}
// ---------- rate card export (Excel) ----------
function zonePrice(z,weight){
  if(!z||!z.bands)return null;
  const b=z.bands,mB=b[b.length-1][0];
  if(weight<=mB+1e-9){for(const[w,pr]of b)if(w>=weight-1e-9)return pr;}
  return b[b.length-1][1];
}
function cardSell(svc,rawBase){
  if(rawBase==null)return null;
  const f=fuelOf(svc),mk=markupPct(svc);
  return rawBase*(1+f.sell/100)*(1+mk/100);
}
// Base freight only (markup hidden inside; fuel NOT applied) — for the base/fuel breakdown mode.
function cardBase(svc,rawBase){if(rawBase==null)return null;return rawBase*(1+markupPct(svc)/100);}
const fuelPctText=svc=>(Math.round(fuelOf(svc).sell*100)/100)+'%';
// ---- rate card options (customer-facing) ----
function renderRcServices(){
  const box=$('rcServices');if(!box)return;box.innerHTML='';
  CARRIERS.forEach(car=>{
    const svcs=SERVICES.filter(s=>s.carrier===car.key);if(!svcs.length)return;
    const grp=document.createElement('div');grp.className='rcgroup';
    const head=document.createElement('label');head.className='rchead';
    head.innerHTML=`<input type="checkbox" id="rcAll_${car.key}" checked/> <span class="sw" style="background:${car.color}"></span><b style="color:${car.color}">${car.name}</b> <span class="rcall">select all</span>`;
    grp.appendChild(head);
    svcs.forEach(svc=>{const lab=document.createElement('label');lab.className='rcitem';
      lab.innerHTML=`<input type="checkbox" class="rc_${car.key}" id="rcSvc_${svc.key}" checked/> <span class="sw" style="background:${svc.color}"></span>${svc.name}`;
      grp.appendChild(lab);});
    box.appendChild(grp);
  });
  CARRIERS.forEach(car=>{const master=$('rcAll_'+car.key);if(!master)return;
    const items=[...document.querySelectorAll('.rc_'+car.key)];
    master.addEventListener('change',()=>{items.forEach(i=>i.checked=master.checked);});
    items.forEach(i=>i.addEventListener('change',()=>{
      const on=items.filter(x=>x.checked).length;
      master.checked=on===items.length;master.indeterminate=on>0&&on<items.length;}));
  });
}
function selectedServices(){return SERVICES.filter(s=>{const el=$('rcSvc_'+s.key);return !el||el.checked;});}
function rcTitle(){return ($('rcTitle')&&$('rcTitle').value.trim())||'International Rate Card';}
// Customer-facing cover — deliberately no markup / cost / recommendation.
function rcCoverRows(svcs,breakdown){
  const co=($('cardCo')?$('cardCo').value:($('custName')?$('custName').value:'')).trim();
  const sel=selectedCountries();
  const now=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const rows=[[rcTitle()],['Prepared for',co||'—'],['Date',now],
    ['Scope',sel.length?(sel.length+' destinations'):'All destinations'],[],
    ['Parcel',num('wt')+' kg'+((num('L')&&num('W')&&num('H'))?(', '+num('L')+' x '+num('W')+' x '+num('H')+' cm'):'')+(num('goodsValue')?(', value £'+num('goodsValue')):'')],[]];
  if(breakdown){
    rows.push(['Prices shown are base freight in GBP. Add the fuel surcharge below, plus any per-shipment surcharges (Surcharges sheet). VAT is not included.']);
    rows.push([]);
    rows.push(['Fuel surcharge — applied to the price of each service']);
    rows.push(['Service','Fuel']);
    (svcs||SERVICES).forEach(s=>rows.push([s.name,fuelPctText(s)]));
  }else{
    rows.push(['Prices are in GBP and include fuel and applicable duty handling. VAT is not included.']);
    rows.push(['Per-shipment surcharges apply in addition — see the Surcharges sheet.']);
  }
  const notes=($('rcNotes')&&$('rcNotes').value||'').trim();
  if(notes){rows.push([]);notes.split(/\r?\n/).forEach(l=>rows.push([l]));}
  return rows;
}
function rcSurchargeRows(carriers){
  const trg=a=>a.cond==='auto'?'By size / weight':(a.cond==='always'?'Every shipment':(a.cond==='countryIn'?(a.countries||[]).join(', '):(a.cond==='region'?a.region.toUpperCase()+' destinations':'When selected')));
  const sur=[['Surcharge','Carrier','When it applies','Charge']];
  accList().filter(a=>!carriers||carriers.has(a.applyTo)).forEach(a=>{let rate;
    if(a.basis==='pctValue')rate=(a.pct||0)+'% of goods value'+(a.min?' (min £'+Number(a.min).toFixed(2)+')':'');
    else rate='£'+((a.list||0)*(1-(a.disc||0)/100)).toFixed(2)+' per shipment';
    sur.push([a.name,(a.applyTo||'').toUpperCase(),trg(a),rate]);});
  return sur;
}
function exportRateCard(){
  if(typeof XLSX==='undefined'){$('rcMsg').textContent='Excel export library did not load — reload the page and try again.';return;}
  $('rcMsg').textContent='';
  const svcs=selectedServices();
  if(!svcs.length){$('rcMsg').textContent='Choose at least one service to include.';return;}
  const keys=new Set(svcs.map(s=>s.key)), carriers=new Set(svcs.map(s=>s.carrier));
  const sel=selectedCountries();
  const inSet=c=>!sel.length||sel.includes(c);
  const co=($('cardCo')?$('cardCo').value:($('custName')?$('custName').value:'')).trim();
  const gbp=v=>v==null?'':Math.round(v*100)/100;
  const bd=$('rcBreakdown').checked;
  const pf=(svc,raw)=>bd?cardBase(svc,raw):cardSell(svc,raw);
  const plabel=bd?'base prices (GBP)':'prices (GBP)';
  const wb=XLSX.utils.book_new();
  const add=(rows,name)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),name.slice(0,31));
  const now=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  add(rcCoverRows(svcs,bd),'Rate Card');

  // UPS zone grids (weight x zone)
  [['ux','UPS Express Saver'],['us','UPS Standard']].forEach(([k,title])=>{
    if(!keys.has(k))return;
    const svc=SERVICES.find(s=>s.key===k),src=P[svc.src]||{};
    const zones=Object.keys(src).sort((a,b)=>parseFloat(a)-parseFloat(b));
    const rows=[[title+' — '+plabel],['Weight (kg)',...zones.map(z=>'Zone '+z)]];
    bands.forEach(w=>{rows.push([w,...zones.map(z=>{const r=zonePrice(src[z],w);return r==null?'':gbp(pf(svc,r));})]);});
    add(rows,title);
  });
  // UPS zone guide (only if a UPS service is shown)
  if(keys.has('ux')||keys.has('us')){
    const zg=[['Country',...(keys.has('ux')?['Express Saver zone']:[]),...(keys.has('us')?['Standard zone']:[])]];
    P.countries.filter(inSet).forEach(c=>{const ez=(P.c2zone_express||{})[c]||'',sz=(P.c2zone_standard||{})[c]||'';
      if((keys.has('ux')&&ez)||(keys.has('us')&&sz))zg.push([c,...(keys.has('ux')?[ez]:[]),...(keys.has('us')?[sz]:[])]);});
    add(zg,'UPS Zone Guide');
  }
  // DPD banded services (country x weight band)
  [['ca','DPD Classic Air'],['ae','DPD Air Express']].forEach(([k,title])=>{
    if(!keys.has(k))return;
    const svc=SERVICES.find(s=>s.key===k),src=P[svc.src]||{};
    const rows=[[title+' — '+plabel],['Country',...bands.map(w=>w+' kg')]];
    Object.keys(src).sort().filter(inSet).forEach(c=>{const arr=src[c];if(arr)rows.push([c,...arr.map(p=>p==null?'':gbp(pf(svc,p)))]);});
    add(rows,title);
  });
  // DPD flat services (country -> price)
  [['cp','DPD Classic Parcel',CAPS.cp],['ep','DPD Classic ExpressPak',CAPS.ep]].forEach(([k,title,cap])=>{
    if(!keys.has(k))return;
    const svc=SERVICES.find(s=>s.key===k),src=P[svc.src]||{};
    const rows=[[title+' — '+plabel],['Country','Price (<='+cap+' kg)']];
    Object.keys(src).sort().filter(inSet).forEach(c=>{const p=src[c];if(p!=null)rows.push([c,gbp(pf(svc,p))]);});
    add(rows,title);
  });
  if($('rcSur').checked) add(rcSurchargeRows(carriers),'Surcharges');

  const safeCo=co.replace(/[\\/:*?"<>|]/g,'').trim();
  XLSX.writeFile(wb,(rcTitle().replace(/[\\/:*?"<>|]/g,''))+(safeCo?' - '+safeCo:'')+' '+now.replace(/ /g,'-')+'.xlsx');
}
function exportMixedCard(){
  if(typeof XLSX==='undefined'){$('rcMsg').textContent='Excel export library did not load — reload the page and try again.';return;}
  $('rcMsg').textContent='';
  const svcs=selectedServices();
  if(!svcs.length){$('rcMsg').textContent='Choose at least one service to include.';return;}
  const carriers=new Set(svcs.map(s=>s.carrier));
  const sel=selectedCountries();
  const list=sel.length?sel:P.countries;
  const co=($('cardCo')?$('cardCo').value:($('custName')?$('custName').value:'')).trim();
  const showBest=$('rcCheapest').checked;
  const gbp=v=>v==null?'':Math.round(v*100)/100;
  const wb=XLSX.utils.book_new();
  const add=(rows,name)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),name.slice(0,31));
  const now=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});

  const bd=$('rcBreakdown').checked;
  const bestLabel=bd?'Cheapest (incl. fuel)':'Best price';
  const rows=[['Delivery options — '+(bd?'base prices in GBP (fuel & surcharges extra)':'prices in GBP')],
    ['Country',...svcs.map(s=>s.name),...(showBest?[bestLabel,'']:[])]];
  const actual=num('wt'),Lx=num('L'),Wx=num('W'),Hx=num('H');
  list.forEach(c=>{
    const vol=(Lx&&Wx&&Hx)?(Lx*Wx*Hx)/P.divisor:0, chg=Math.max(actual,vol);
    ACTIVE=activeAcc(c,actual,Lx,Wx,Hx);
    const base={},sell={};
    svcs.forEach(s=>{const b=baseRate(s,c,chg);
      if(b.avail&&b.price!=null){base[s.key]=cardBase(s,b.price);sell[s.key]=build(b.price,s).sell;}
      else{base[s.key]=null;sell[s.key]=null;}});
    let best=null;svcs.forEach(s=>{const p=sell[s.key];if(p!=null&&(best==null||p<best.p))best={p,svc:s};});
    const show=bd?base:sell;
    rows.push([c,...svcs.map(s=>show[s.key]==null?'':gbp(show[s.key])),...(showBest?[best?best.svc.name:'—',best?gbp(best.p):'']:[])]);});
  calc();

  add(rcCoverRows(svcs,bd),'Rate Card');
  add(rows,'Delivery options');
  if($('rcSur').checked) add(rcSurchargeRows(carriers),'Surcharges');

  const safeCo=co.replace(/[\\/:*?"<>|]/g,'').trim();
  XLSX.writeFile(wb,(rcTitle().replace(/[\\/:*?"<>|]/g,''))+(safeCo?' - '+safeCo:'')+' options '+now.replace(/ /g,'-')+'.xlsx');
}

// ---------- customer rate cards (shareable links) ----------
let cardsCache=[];
function currentCardConfig(){
  const markup={};SERVICES.forEach(s=>markup[s.key]=num('mk_'+s.key));
  return {services:selectedServices().map(s=>s.key),markup,
    breakdown:$('rcBreakdown').checked,showBest:$('rcCheapest').checked,includeSurcharges:$('rcSur').checked,
    notes:($('rcNotes').value||'').trim(),countries:selectedCountries(),
    postcode:($('custPostcode')?$('custPostcode').value.trim():''),
    receiver:{company:cv('custName'),name:cv('custContact'),line1:cv('custLine1'),line2:cv('custLine2'),city:cv('custCity'),postcode:cv('custPostcode'),country:($('custCountry')?$('custCountry').value:'GB'),phone:cv('custPhone'),email:cv('custEmail')},
    importMarkupPct:($('custImportMarkup')&&$('custImportMarkup').value!==''?Number($('custImportMarkup').value)||0:null)};
}
function cv(id){const el=$(id);return el?(el.value||'').trim():'';}
const cardUrl=t=>location.origin+'/card/'+t;
async function saveCard(){
  const customer=cv('custName');
  const setErr=msg=>{if($('custErr'))$('custErr').textContent=msg;if($('custOk'))$('custOk').textContent='';};
  const setOk=msg=>{if($('custOk'))$('custOk').textContent=msg;if($('custErr'))$('custErr').textContent='';};
  setErr('');
  if(!customer){setErr('Enter a customer name.');return;}
  if(!selectedServices().length){setErr('Pick at least one service above first.');return;}
  const r=await jpost('/api/cards',{customer,config:currentCardConfig()});const d=await r.json();
  if(!r.ok){setErr((d.error||'Could not save')+(authEnabled?'':' — connect the database to save links.'));return;}
  ['custName','custContact','custLine1','custLine2','custCity','custPostcode','custPhone','custEmail','custImportMarkup'].forEach(id=>{if($(id))$(id).value='';});
  setOk('Link created.');await refreshCards();
}
async function refreshCards(){
  if(!authEnabled){if($('custEmpty'))$('custEmpty').textContent='';return;}
  const r=await fetch('/api/cards');if(!r.ok)return;
  const {cards}=await r.json();
  cardsCache=(cards||[]).slice().sort((a,b)=>(a.customer||'').toLowerCase().localeCompare((b.customer||'').toLowerCase()));
  renderCards();
}
const svcName=k=>{const s=SERVICES.find(x=>x.key===k);return s?s.name:k;};
const svcColor=k=>{const s=SERVICES.find(x=>x.key===k);return s?s.color:'#94a3b8';};
const esc2=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
function adrF(id,k,label,val,w){return `<div class="f"><label style="font-size:10px">${label}</label><input class="adrInput" data-id="${id}" data-k="${k}" type="text" value="${esc2(val)}" style="width:${w||'130px'};padding:6px 8px;border:1px solid #cbd5e1;border-radius:7px;font-size:13px"/></div>`;}
function cardDetailHTML(c){
  const cfg=c.config||{};
  const rc=cfg.receiver||{};
  const svcs=(cfg.services&&cfg.services.length)?cfg.services:SERVICES.map(s=>s.key);
  const mk=cfg.markup;
  const rows=svcs.map(k=>{const m=(typeof mk==='number')?mk:((mk&&mk[k])||0);
    return `<tr><td style="padding:4px 16px 4px 0"><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${svcColor(k)};margin-right:7px"></span>${svcName(k)}</td>`
      +`<td style="padding:4px 0;text-align:right"><input class="mkEdit" data-id="${c.id}" data-k="${k}" type="number" min="0" step="1" value="${m}" style="width:66px;text-align:right;padding:4px 6px;border:1px solid #cbd5e1;border-radius:6px;font-variant-numeric:tabular-nums"/> %</td></tr>`;}).join('');
  const extras=[];
  if(cfg.title)extras.push('Title: '+cfg.title);
  if(cfg.postcode)extras.push('Postcode: '+cfg.postcode);
  if(cfg.breakdown)extras.push('Shows base price + fuel separately');
  if(cfg.includeSurcharges===false)extras.push('No surcharges page');
  const created=c.created_at?new Date(c.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
  const by=c.creator_name||c.creator_email||'';
  const svcSet=new Set(svcs);
  const svcPick=SERVICES.map(s=>`<label class="svcpk"><input type="checkbox" class="svcChk" data-id="${c.id}" data-k="${s.key}"${svcSet.has(s.key)?' checked':''}/> <span class="sw" style="background:${s.color}"></span>${s.name}</label>`).join('');
  return `<div style="padding:8px 10px 14px 40px">`
    +`<div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:#475569;font-weight:800;margin-bottom:5px">Services on this card — tick to add, untick to remove</div>`
    +`<div class="svcpickwrap">${svcPick}</div>`
    +`<div style="margin:6px 0 14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn primary svcSave" data-id="${c.id}">Save services</button><span class="svcMsg" data-id="${c.id}" style="font-size:12px"></span></div>`
    +`<div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:#475569;font-weight:800;margin-bottom:7px;border-top:1px dashed var(--line);padding-top:12px">Markup for this customer — edit &amp; save${by?' · by '+by:''}${created?' · created '+created:''}</div>`
    +`<table style="width:auto;border:none"><tbody>${rows}</tbody></table>`
    +`<div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn primary mkSave" data-id="${c.id}">Save markups</button><span class="mkMsg" data-id="${c.id}" style="font-size:12px"></span></div>`
    +(extras.length?`<div style="margin-top:9px;color:var(--muted);font-size:12px">${extras.join(' · ')}</div>`:'')
    +`<div style="margin-top:12px;border-top:1px dashed var(--line);padding-top:10px">`
    +`<div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:#475569;font-weight:800;margin-bottom:7px">Delivery address — pre-fills this customer's import quote &amp; sets the drop-off postcode</div>`
    +`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">`
    +adrF(c.id,'name','Contact name',rc.name,'150px')
    +adrF(c.id,'line1','Address line 1',rc.line1,'190px')
    +adrF(c.id,'line2','Address line 2',rc.line2,'160px')
    +adrF(c.id,'city','City / town',rc.city,'130px')
    +adrF(c.id,'postcode','Postcode',rc.postcode||cfg.postcode,'110px')
    +`<div class="f"><label style="font-size:10px">Country</label><select class="adrInput" data-id="${c.id}" data-k="country" style="padding:6px 8px;border:1px solid #cbd5e1;border-radius:7px;font-size:13px"><option value="GB"${(rc.country||'GB')==='GB'?' selected':''}>United Kingdom</option><option value="IE"${rc.country==='IE'?' selected':''}>Ireland</option></select></div>`
    +adrF(c.id,'phone','Phone',rc.phone,'130px')
    +adrF(c.id,'email','Email',rc.email,'170px')
    +`<button class="btn primary adrBtn" data-id="${c.id}">Save address</button>`
    +`<span class="adrMsg" data-id="${c.id}" style="font-size:12px"></span>`
    +`</div></div>`
    +`<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">`
    +`<label style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.04em">Import quote markup %</label>`
    +`<input class="imInput" data-id="${c.id}" type="number" min="0" step="1" value="${cfg.importMarkupPct!=null?cfg.importMarkupPct:''}" placeholder="uses global default" style="padding:6px 9px;border:1px solid #cbd5e1;border-radius:7px;font-size:13px;width:170px"/>`
    +`<button class="btn imBtn" data-id="${c.id}">Save import markup</button>`
    +`<span class="imMsg" data-id="${c.id}" style="font-size:12px"></span></div>`
    +`</div>`;
}
function renderCards(){
  const searchEl=$('custSearch');
  const q=(searchEl&&searchEl.value?searchEl.value:'').toLowerCase();
  const list=cardsCache.filter(c=>(c.customer||'').toLowerCase().includes(q));
  const tb=$('custBody');
  if(!tb)return;
  tb.innerHTML='';
  list.forEach(c=>{const url=cardUrl(c.token);const tr=document.createElement('tr');
    tr.innerHTML=`<td style="white-space:nowrap"><button class="btn exBtn" data-id="${c.id}" style="padding:2px 9px;margin-right:6px">▸</button><b>${c.customer||'—'}</b></td>`
      +`<td><a href="${url}" target="_blank" rel="noopener" style="color:var(--teal);word-break:break-all">${url}</a></td>`
      +`<td><span class="rolechip">${c.creator_name||c.creator_email||'—'}</span></td>`
      +`<td>${c.enabled?'<span class="rolechip" style="background:var(--g-bg);color:var(--g)">live</span>':'<span class="rolechip" style="background:#fee2e2;color:var(--r)">off</span>'}</td>`
      +`<td style="white-space:nowrap"><button class="btn copyBtn" data-u="${url}">Copy</button> `
      +`<button class="btn tglBtn" data-id="${c.id}" data-en="${c.enabled?0:1}">${c.enabled?'Disable':'Enable'}</button> `
      +`<button class="btn danger delCardBtn" data-id="${c.id}">Delete</button></td>`;
    tb.appendChild(tr);
    const dr=document.createElement('tr');dr.className='detailRow';dr.dataset.id=c.id;dr.style.display='none';
    dr.innerHTML=`<td colspan="5" style="background:#f8fafc">${cardDetailHTML(c)}</td>`;
    tb.appendChild(dr);});
  if($('custTable')) $('custTable').style.display=list.length?'table':'none';
  if($('custEmpty')){
    $('custEmpty').style.display=list.length?'none':'block';
    $('custEmpty').textContent=cardsCache.length?(list.length?'':'No customers match your search.'):'No customer links yet — save one above.';
  }
  if(searchEl) searchEl.style.display=cardsCache.length?'block':'none';
  tb.querySelectorAll('.exBtn').forEach(b=>b.onclick=()=>{const dr=tb.querySelector('.detailRow[data-id="'+b.dataset.id+'"]');
    const open=dr.style.display!=='none';dr.style.display=open?'none':'';b.textContent=open?'▸':'▾';});
  tb.querySelectorAll('.adrBtn').forEach(b=>b.onclick=async()=>{const id=b.dataset.id;
    const msg=tb.querySelector('.adrMsg[data-id="'+id+'"]');
    const card=cardsCache.find(x=>String(x.id)===String(id)); if(!card)return;
    const rc={company:card.customer||''};
    tb.querySelectorAll('.adrInput[data-id="'+id+'"]').forEach(inp=>{rc[inp.dataset.k]=(inp.value||'').trim();});
    const cfg=Object.assign({},card.config||{},{receiver:rc,postcode:rc.postcode||''}); // keep drop-off postcode in sync
    const r=await jpatch('/api/cards/'+id,{config:cfg}); const d=await r.json();
    if(r.ok){card.config=cfg;if(msg){msg.style.color='var(--g)';msg.textContent='Address saved — pre-fills this customer\'s import quote.';}}
    else{if(msg){msg.style.color='var(--r)';msg.textContent=(d.error||'Failed');}}});
  tb.querySelectorAll('.svcSave').forEach(b=>b.onclick=async()=>{const id=b.dataset.id;
    const card=cardsCache.find(x=>String(x.id)===String(id)); if(!card)return;
    let msg=tb.querySelector('.svcMsg[data-id="'+id+'"]');
    const keys=[...tb.querySelectorAll('.svcChk[data-id="'+id+'"]')].filter(i=>i.checked).map(i=>i.dataset.k);
    if(!keys.length){if(msg){msg.style.color='var(--r)';msg.textContent='Pick at least one service.';}return;}
    const cfg=Object.assign({},card.config||{},{services:keys});
    const r=await jpatch('/api/cards/'+id,{config:cfg}); const d=await r.json();
    if(!r.ok){if(msg){msg.style.color='var(--r)';msg.textContent=(d.error||'Failed');}return;}
    card.config=cfg;renderCards();
    const dr=tb.querySelector('.detailRow[data-id="'+id+'"]');if(dr){dr.style.display='';const xb=tb.querySelector('.exBtn[data-id="'+id+'"]');if(xb)xb.textContent='▾';}
    msg=tb.querySelector('.svcMsg[data-id="'+id+'"]');if(msg){msg.style.color='var(--g)';msg.textContent='Services updated — set the markup for any new ones below (new services start at 0%).';}});
  tb.querySelectorAll('.mkSave').forEach(b=>b.onclick=async()=>{const id=b.dataset.id;
    const card=cardsCache.find(x=>String(x.id)===String(id)); if(!card)return;
    const msg=tb.querySelector('.mkMsg[data-id="'+id+'"]');
    const mk={}; tb.querySelectorAll('.mkEdit[data-id="'+id+'"]').forEach(inp=>{mk[inp.dataset.k]=Number(inp.value)||0;});
    const cfg=Object.assign({},card.config||{},{markup:mk});
    const r=await jpatch('/api/cards/'+id,{config:cfg}); const d=await r.json();
    if(r.ok){card.config=cfg;if(msg){msg.style.color='var(--g)';msg.textContent='Markups saved — the link now uses these.';}}
    else{if(msg){msg.style.color='var(--r)';msg.textContent=(d.error||'Failed');}}});
  tb.querySelectorAll('.imBtn').forEach(b=>b.onclick=async()=>{const id=b.dataset.id;
    const inp=tb.querySelector('.imInput[data-id="'+id+'"]'), msg=tb.querySelector('.imMsg[data-id="'+id+'"]');
    const card=cardsCache.find(x=>String(x.id)===String(id)); if(!card)return;
    const val=(inp.value===''?null:Number(inp.value)||0);
    const cfg=Object.assign({},card.config||{},{importMarkupPct:val});
    const r=await jpatch('/api/cards/'+id,{config:cfg}); const d=await r.json();
    if(r.ok){card.config=cfg;if(msg){msg.style.color='var(--g)';msg.textContent=val==null?'Cleared — uses global default.':'Import markup saved.';}}
    else{if(msg){msg.style.color='var(--r)';msg.textContent=(d.error||'Failed');}}});
  tb.querySelectorAll('.copyBtn').forEach(b=>b.onclick=()=>{const t=b.dataset.u;
    if(navigator.clipboard)navigator.clipboard.writeText(t);b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1200);});
  tb.querySelectorAll('.tglBtn').forEach(b=>b.onclick=async()=>{await jpatch('/api/cards/'+b.dataset.id,{enabled:b.dataset.en==='1'});await refreshCards();});
  tb.querySelectorAll('.delCardBtn').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this customer link? It will stop working immediately.'))return;await jdel('/api/cards/'+b.dataset.id);await refreshCards();});
}
if($('custCreateBtn')) $('custCreateBtn').onclick=saveCard;
if($('custSave')) $('custSave').onclick=saveCard;
if($('custSearch')) $('custSearch').addEventListener('input',renderCards);

// ---------- Settings: export raw rate data ----------
function exportRates(){
  if(typeof XLSX==='undefined'){$('ratesMsg').className='err';$('ratesMsg').textContent='Excel library did not load — reload and try again.';return;}
  $('ratesMsg').className='ok';$('ratesMsg').textContent='';
  const wb=XLSX.utils.book_new();
  const add=(rows,name)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),name.slice(0,31));
  const B=P.bands;
  // DPD banded (country x weight band)
  [['dpd_classic','DPD Air Classic'],['dpd_express','DPD Air Express']].forEach(([src,title])=>{
    const rows=[['Country',...B]];
    Object.keys(P[src]).sort().forEach(c=>rows.push([c,...P[src][c].map(v=>v==null?'':v)]));
    add(rows,title);
  });
  // DPD flat (country -> price)
  [['dpd_parcel','DPD Classic Parcel'],['dpd_expresspak','DPD Classic ExpressPak']].forEach(([src,title])=>{
    const rows=[['Country','Rate']];
    Object.keys(P[src]).sort().forEach(c=>{if(P[src][c]!=null)rows.push([c,P[src][c]]);});
    add(rows,title);
  });
  // UPS zone grids (weight x zone)
  [['ups_express','UPS Express Saver'],['ups_standard','UPS Standard']].forEach(([src,title])=>{
    const zones=Object.keys(P[src]).sort((a,b)=>parseFloat(a)-parseFloat(b));
    const wset=new Set();zones.forEach(z=>(P[src][z].bands||[]).forEach(([w])=>wset.add(w)));
    const weights=[...wset].sort((a,b)=>a-b);
    const rows=[['Up to kg',...zones.map(z=>'Zone '+z)]];
    weights.forEach(w=>{rows.push([w,...zones.map(z=>{const b=(P[src][z].bands||[]).find(x=>x[0]===w);return b?b[1]:'';})]);});
    add(rows,title);
  });
  // UPS country -> zone
  const zr=[['Country','Express Saver zone','Standard zone']];
  P.countries.forEach(c=>{const e=(P.c2zone_express||{})[c]||'',s=(P.c2zone_standard||{})[c]||'';if(e||s)zr.push([c,e,s]);});
  add(zr,'UPS Zones');
  // Fuel
  const f=(P.settings&&P.settings.fuelByService)||{};
  const fr=[['Service key','Service','Fuel cost %','Fuel sell %']];
  SERVICES.forEach(s=>{const cf=f[s.key]||{};fr.push([s.key,s.name,cf.cost||0,cf.sell||0]);});
  add(fr,'Fuel');
  // Caps
  add([['Cap','kg'],['cp (Classic Parcel)',CAPS.cp],['ep (ExpressPak)',CAPS.ep]],'Caps');
  // Accessorials
  const ar=[['key','name','carrier','basis','list','disc','pct','min']];
  accList().forEach(a=>ar.push([a.key,a.name,a.applyTo,a.basis,a.list==null?'':a.list,a.disc==null?'':a.disc,a.pct==null?'':a.pct,a.min==null?'':a.min]));
  add(ar,'Accessorials');
  const now=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}).replace(/ /g,'-');
  XLSX.writeFile(wb,'MOOV rates '+now+'.xlsx');
  $('ratesMsg').textContent='Exported.';
}
$('ratesExport').onclick=exportRates;

// ---------- Settings: test the drop-off pickup API ----------
$('pkTest').onclick=async()=>{
  const pc=($('pkPostcode').value||'').trim();
  $('pkMsg').className='ok';$('pkMsg').textContent='';
  if(!pc){$('pkMsg').className='err';$('pkMsg').textContent='Enter a postcode.';return;}
  $('pkResult').innerHTML='Testing…';$('pkRaw').style.display='none';
  const r=await jpost('/api/pickups-test',{postcode:pc});const d=await r.json();
  if(!r.ok){$('pkResult').innerHTML='<span style="color:var(--r)">'+((d&&d.error)||'Failed')+(authEnabled?'':' — connect the database / deploy first')+'</span>';return;}
  let html='';
  if(!d.tokenSet)html+='<div style="color:var(--r)"><b>COURIER_API_TOKEN is not set</b> in Railway → Variables. The map cannot work until it is (and the app redeploys).</div>';
  if(!d.hasFetch)html+='<div style="color:var(--r)">This Node version has no global fetch — needs Node 18+.</div>';
  (d.couriers||[]).forEach(c=>{const ok=c.mappedCount>0;
    html+='<div style="margin-top:6px"><b>'+c.carrier+'</b>: '+(c.error?('<span style="color:var(--r)">error — '+c.error+'</span>')
      :('HTTP '+c.status+' · <b style="color:'+(ok?'var(--g)':'var(--r)')+'">'+c.mappedCount+' points mapped</b>'))+'</div>';});
  if(!(d.couriers||[]).length&&d.tokenSet)html+='<div class="chartnote">No couriers queried.</div>';
  $('pkResult').innerHTML=html||'<span class="chartnote">No response.</span>';
  $('pkRaw').style.display='block';$('pkRaw').value=JSON.stringify(d,null,2);
};
$('upsTest').onclick=async()=>{
  $('upsMsg').className='ok';$('upsMsg').textContent='';$('upsResult').innerHTML='Testing UPS connection…';$('upsRaw').style.display='none';
  const sample={mode:'import',sender:{country:'DE',city:'Berlin',postcode:'10115',line1:'Hauptstrasse 1',name:'Test Sender'},
    receiver:{country:'GB',city:'Whittington',postcode:'SY11 4FN',line1:'1 Mellor Meadows',name:'Test Receiver'},
    packages:[{qty:1,weight:5,l:30,w:20,h:15}],value:250,currency:'GBP'};
  const r=await jpost('/api/ups-test',sample);const d=await r.json();
  if(!r.ok){$('upsResult').innerHTML='<span style="color:var(--r)">'+((d&&d.error)||'Failed')+(authEnabled?'':' — deploy first')+'</span>';return;}
  let html='<div>Environment: <b>'+(d.env||'?')+'</b> · credentials: <b style="color:'+(d.configured?'var(--g)':'var(--r)')+'">'+(d.configured?'set':'missing')+'</b> · account: <b>'+(d.account||'?')+'</b> · token: <b style="color:'+(d.token==='ok'?'var(--g)':'var(--r)')+'">'+(d.token||'—')+'</b></div>';
  if(!d.configured)html+='<div style="color:var(--r);margin-top:4px">Set <code>UPS_CLIENT_ID</code> and <code>UPS_CLIENT_SECRET</code> in Railway → Variables, then redeploy.</div>';
  if(d.status!=null){const ok=(d.services||[]).length>0;
    html+='<div style="margin-top:6px">Rating HTTP '+d.status+' · <b style="color:'+(ok?'var(--g)':'var(--r)')+'">'+((d.services||[]).length)+' services returned</b></div>';
    (d.services||[]).forEach(s=>{html+='<div style="margin-top:2px">'+s.code+' '+s.name+' — £'+(s.cost!=null?s.cost:'?')+(s.days!=null?(' · '+s.days+'d'):'')+'</div>';});}
  if(d.error)html+='<div style="color:var(--r);margin-top:6px">'+d.error+'</div>';
  $('upsResult').innerHTML=html;
  $('upsRaw').style.display='block';$('upsRaw').value=JSON.stringify(d,null,2);
};

init();
</script>
</body></html>'''
with open(os.path.join(PUBLIC, 'index.html'), 'w') as f:
    f.write(HTML)
print('wrote public/index.html', len(HTML), 'bytes')
