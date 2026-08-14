// Fetches nearest pickup / drop-off locations from the MoovParcel courier API.
// Called server-side so the token is never exposed to the customer.
// Token comes from the COURIER_API_TOKEN env var (set in Railway → Variables).

const BASE = 'https://app.heyvoila.io/api/couriers/v1/';
// courier label -> URL slug (add DHL here when live: {carrier:'DHL', slug:'DHL'})
const COURIERS = [{ carrier: 'DPD', slug: 'DPD' }, { carrier: 'UPS', slug: 'UPSv2' }];
const AUTH_COMPANY = process.env.COURIER_AUTH_COMPANY || 'Moov Master';

// Request body — per Ross, only the postcode matters; everything else is a fixed placeholder.
function buildBody(postcode) {
  return JSON.stringify({
    testing: false,
    auth_company: AUTH_COMPANY,
    address: {
      name: 'MOOV Parcel', phone: '07498991612', email: 'ross.jermy@moovparcel.co.uk',
      company_name: 'MOOV Parcel', address_1: '1 Mellor Meadows', address_2: '', address_3: '',
      city: 'Whittington', county: '', postcode: postcode, country_iso: 'GB',
    },
  });
}

const num = (v) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return (typeof n === 'number' && !isNaN(n)) ? n : null;
};
const pick = (o, keys) => { for (const k of keys) if (o && o[k] != null) return o[k]; return undefined; };

const clean = (s) => (typeof s === 'string' ? s.replace(/&trade;|&reg;/g, '').trim() : s);
const joinAddr = (parts) => parts.map(clean).filter(Boolean).join(', ');

// Concatenate every string value in an object (bounded), so we can pattern-match
// on things like "Open 24 Hours" or "Mobile Barcode" without knowing the exact nesting.
function deepText(o) {
  const parts = []; let n = 0;
  (function rec(x) {
    if (n > 6000 || x == null) return;
    if (typeof x === 'string') { parts.push(x); n += x.length; }
    else if (Array.isArray(x)) x.forEach(rec);
    else if (typeof x === 'object') for (const k in x) rec(x[k]);
  })(o);
  return parts.join(' | ');
}

// "0900" -> "09:00"; "9:00" -> "09:00"; "9:00am"/"5:30pm" -> 24h; passthrough otherwise.
function hhmm(v) {
  if (v == null) return null;
  let s = String(v).trim();
  if (/^\d{3,4}$/.test(s)) { const p = s.padStart(4, '0'); return p.slice(0, 2) + ':' + p.slice(2); }
  const ap = s.match(/^(\d{1,2}):(\d{2})\s*([ap])m?$/i);
  if (ap) { let h = parseInt(ap[1], 10); const isP = /p/i.test(ap[3]); if (isP && h < 12) h += 12; if (!isP && h === 12) h = 0; return String(h).padStart(2, '0') + ':' + ap[2]; }
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return m[1].padStart(2, '0') + ':' + m[2];
  return s;
}

// Map a UPS day token to 1..7 (Mon..Sun). UPS numeric days run 1=Sun..7=Sat, which we
// re-base to Mon..Sun; day names are matched directly.
function upsDayNum(v) {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  const names = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
  for (const k in names) if (s.startsWith(k)) return names[k];
  const n = parseInt(s, 10);
  if (n >= 1 && n <= 7) return n === 1 ? 7 : n - 1; // 1=Sun..7=Sat  ->  Mon..Sun
  return null;
}

const emptyWeek = () => [1, 2, 3, 4, 5, 6, 7].map((d) => ({ d, closed: true }));

// DPD day token -> 1..7 (Mon..Sun). DPD numeric days run 1=Mon..7=Sun; names matched too.
function dpdDayNum(v) {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  const names = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
  for (const k in names) if (s.startsWith(k)) return names[k];
  const n = parseInt(s, 10);
  return (n >= 1 && n <= 7) ? n : null;
}

// hours: normalise to [{d:1..7 (Mon..Sun), open:"HH:MM", close:"HH:MM"} | {d, closed:true}]
// Field names vary across DPD payload shapes, so match several candidates defensively.
function dpdHours(windows) {
  if (!Array.isArray(windows)) windows = windows ? [windows] : [];
  const byDay = {};
  windows.forEach((w) => {
    if (!w || typeof w !== 'object') return;
    const d = pick(w, ['pickupLocationOpenWindowDay', 'day', 'dayOfWeek', 'weekDay', 'dow', 'dayNumber']);
    const s = pick(w, ['pickupLocationOpenWindowStartTime', 'open', 'openTime', 'start', 'startTime', 'from', 'fromTime', 'openingTime']);
    const e = pick(w, ['pickupLocationOpenWindowEndTime', 'close', 'closeTime', 'end', 'endTime', 'to', 'toTime', 'closingTime']);
    const dn = dpdDayNum(d);
    if (dn == null || s == null || e == null) return;
    const so = hhmm(s), eo = hhmm(e);
    if (!byDay[dn]) byDay[dn] = { open: so, close: eo };
    else { if (so < byDay[dn].open) byDay[dn].open = so; if (eo > byDay[dn].close) byDay[dn].close = eo; }
  });
  return [1, 2, 3, 4, 5, 6, 7].map((d) => byDay[d] ? { d, open: byDay[d].open, close: byDay[d].close } : { d, closed: true });
}

// DPD: array of { pickupLocation:{ address, addressPoint, shortName, pickupLocationOpenWindow, dropoffDigital... }, distance }
function mapDPD(data) {
  const list = Array.isArray(data) ? data : ((data && (data.pickupLocations || data.locations || data.data)) || []);
  return (Array.isArray(list) ? list : []).map((it) => {
    const pl = it.pickupLocation || it;
    const a = pl.address || {};
    const pt = pl.addressPoint || {};
    const av = pl.pickupLocationAvailability || {};
    const labelPrint = pick(pl, ['printInStore', 'printerInStore', 'printerAvailable', 'labelPrinting', 'printLabel']);
    return {
      carrier: 'DPD',
      name: clean(a.organisation) || clean(pl.shortName) || 'DPD drop-off',
      type: 'DPD Pickup',
      address: joinAddr([a.property, a.street, a.town, a.county, a.postcode]),
      lat: num(pt.latitude), lng: num(pt.longitude),
      distance: (it.distance != null) ? (Math.round(Number(it.distance) * 10) / 10) + ' mi' : '',
      code: pl.pickupLocationCode || '',
      qr: !!pl.dropoffDigital,             // paperless / QR-code labels accepted
      labelPrint: labelPrint == null ? null : !!labelPrint, // shop prints your label
      parking: !!pl.parkingAvailable,
      disabledAccess: !!pl.disabledAccess,
      // DPD returns these directly — more authoritative than deriving from the window list.
      openLate: !!pl.openLate,
      openSaturday: !!pl.openSaturday,
      openSunday: !!pl.openSunday,
      open24: false,
      hours: dpdHours(av.pickupLocationOpenWindow || pl.pickupLocationOpenWindow || pl.openingHours || pl.openWindows || pl.openingTimes),
      hoursText: '',
    };
  }).filter((p) => p.lat != null && p.lng != null);
}

const truthyInd = (v) => { if (v == null) return false; const s = String(v).trim().toLowerCase(); return s === 'y' || s === '1' || s === 'true' || s === 'x'; };

// UPS operating hours -> normalised weekly array. OperatingHours.StandardHours is an
// array of blocks, each with DayOfWeek[] of {Day, OpenHours, CloseHours, Open24HoursIndicator, ClosedIndicator}.
// UPS Day runs 1=Sun..7=Sat (re-based to Mon..Sun by upsDayNum). Returns {hours, open24, text}.
function upsHours(loc) {
  const stdText = clean(loc.StandardHoursOfOperation) || '';
  const oh = loc.OperatingHours || {};
  let sh = oh.StandardHours || oh;
  if (Array.isArray(sh)) sh = sh[0];
  let days = sh && (sh.DayOfWeek || sh.Day);
  if (days && !Array.isArray(days)) days = [days];
  const byDay = {};
  let anyDay = false;
  (days || []).forEach((dd) => {
    if (!dd || typeof dd !== 'object') return;
    const dn = upsDayNum(dd.Day != null ? dd.Day : dd.DayOfWeek);
    if (!dn) return;
    anyDay = true;
    if (truthyInd(dd.Open24HoursIndicator)) { byDay[dn] = { open: '00:00', close: '24:00' }; return; }
    // A closed day carries ClosedIndicator and no hours.
    const cRaw = dd.CloseHours;
    let oRaw = (dd.OpenHours != null && dd.OpenHours !== '') ? dd.OpenHours : ((cRaw != null && cRaw !== '') ? '0000' : null);
    if (oRaw == null || cRaw == null || cRaw === '') { byDay[dn] = { closed: true }; return; }
    byDay[dn] = { open: hhmm(oRaw), close: hhmm(cRaw) };
  });
  if (!anyDay) {
    if (/open\s*24\s*hours/i.test(stdText)) return { hours: [1, 2, 3, 4, 5, 6, 7].map((d) => ({ d, open: '00:00', close: '24:00' })), open24: true, text: stdText };
    return { hours: null, open24: false, text: stdText };
  }
  const week = [1, 2, 3, 4, 5, 6, 7].map((d) => byDay[d] ? (byDay[d].closed ? { d, closed: true } : { d, open: byDay[d].open, close: byDay[d].close }) : { d, closed: true });
  const open24 = week.every((x) => !x.closed && x.open === '00:00' && x.close === '24:00');
  return { hours: week, open24, text: stdText };
}

// UPS drop-off deadlines by service. Live shape: LocationAttribute[] where OptionType.Code==='03'
// carries OptionCode[] of services (Category '07', Name Express/Standard/International) each with a
// TransportationPickUpSchedule.PickUp[] of {DayOfWeek, PickUpDetails:{PickUpTime|NoPickUpIndicator}}.
function upsDeadlines(loc) {
  const attrs = Array.isArray(loc.LocationAttribute) ? loc.LocationAttribute : (loc.LocationAttribute ? [loc.LocationAttribute] : []);
  const svcAttr = attrs.find((a) => a && a.OptionType && a.OptionType.Code === '03');
  if (!svcAttr) return null;
  const codes = Array.isArray(svcAttr.OptionCode) ? svcAttr.OptionCode : (svcAttr.OptionCode ? [svcAttr.OptionCode] : []);
  const out = [];
  codes.forEach((c) => {
    if (!c || c.Category !== '07') return;
    const name = clean(c.Name);
    if (!/express|standard|international/i.test(name || '')) return;
    const sched = c.TransportationPickUpSchedule && c.TransportationPickUpSchedule.PickUp;
    const pickups = Array.isArray(sched) ? sched : (sched ? [sched] : []);
    const byDay = {};
    pickups.forEach((p) => {
      const dn = upsDayNum(p && p.DayOfWeek);
      if (!dn) return;
      const t = p.PickUpDetails && p.PickUpDetails.PickUpTime;
      byDay[dn] = (t != null && t !== '') ? hhmm(t) : null;
    });
    const mf = byDay[1] || byDay[2] || byDay[3] || byDay[4] || byDay[5] || null; // a weekday deadline
    const sat = byDay[6] || null;
    if (mf || sat) out.push({ svc: name, mf: mf || '--', sat: sat || '--' });
  });
  return out.length ? out : null;
}

// UPS: { LocatorResponse: { Geocode, SearchResults:{ DropLocation:[ {AddressKeyFormat, Geocode, Distance,
//        LocationID, OperatingHours, StandardHoursOfOperation, ServiceOfferingList, AccessPointInformation} ] } } }
function mapUPS(data) {
  const lr = (data && data.LocatorResponse) || {};
  let dl = (lr.SearchResults && lr.SearchResults.DropLocation) || [];
  if (!Array.isArray(dl)) dl = dl ? [dl] : [];
  return dl.map((it) => {
    const a = it.AddressKeyFormat || {};
    const g = it.Geocode || {};
    const d = it.Distance || {};
    const line = Array.isArray(a.AddressLine) ? a.AddressLine.filter(Boolean).join(', ') : a.AddressLine;
    const unit = (d.UnitOfMeasurement && d.UnitOfMeasurement.Code === 'MI') ? 'mi' : ((d.UnitOfMeasurement && d.UnitOfMeasurement.Code) || '');
    const h = upsHours(it);
    const nm = clean(a.ConsigneeName) || 'UPS Access Point';
    // Access-point type from BusinessClassification (e.g. "UPS Parcel Locker"); keep it customer-friendly.
    const api = it.AccessPointInformation || {};
    const bizList = api.BusinessClassificationList && api.BusinessClassificationList.BusinessClassification;
    const bizArr = Array.isArray(bizList) ? bizList : (bizList ? [bizList] : []);
    const bizDesc = bizArr.map((b) => clean(b && b.Description)).filter(Boolean).join(' ');
    const isLocker = /locker/i.test(bizDesc) || /locker/i.test(nm);
    const svcText = deepText(it.ServiceOfferingList || {});
    const qr = /mobile barcode|paperless|qr\s*code/i.test(svcText)
      || /"Code"\s*:\s*"015"/.test(JSON.stringify((it.ServiceOfferingList && it.ServiceOfferingList.ServiceOffering) || ''));
    return {
      carrier: 'UPS',
      name: nm,
      type: isLocker ? 'UPS Parcel Locker' : 'UPS Access Point',
      address: joinAddr([line, a.PoliticalDivision2, a.PostcodePrimaryLow]),
      lat: num(g.Latitude), lng: num(g.Longitude),
      distance: d.Value ? (Math.round(Number(d.Value) * 10) / 10 + ' ' + (unit || 'mi')).trim() : '',
      code: clean(api.PublicAccessPointID) || clean(it.LocationID) || '',
      qr: !!qr,
      labelPrint: null,
      open24: h.open24,
      hours: h.hours,
      hoursText: h.text || '',
      deadlines: upsDeadlines(it),
    };
  }).filter((p) => p.lat != null && p.lng != null);
}

function mapResponse(data, carrier) {
  if (carrier === 'UPS') return mapUPS(data);
  if (carrier === 'DPD') return mapDPD(data);
  return [];
}
// Search origin (the customer's postcode location), if the response carries it.
function originForCarrier(data, carrier, postcode) {
  if (carrier === 'UPS') {
    const g = data && data.LocatorResponse && data.LocatorResponse.Geocode;
    return g ? { lat: num(g.Latitude), lng: num(g.Longitude), postcode } : null;
  }
  const first = Array.isArray(data) ? data[0] : null;
  const o = first && first.addressPoint;
  return o ? { lat: num(o.latitude), lng: num(o.longitude), postcode } : null;
}
function authHeaders() {
  const user = process.env.COURIER_API_USER || 'Moov Parcel Master';
  const token = process.env.COURIER_API_TOKEN;
  if (!token || typeof fetch !== 'function') return null;
  // HTTP header names can't contain spaces. Hyphenated names normalise to the same
  // server-side value as "API user"/"API token". Override via env if the API needs a different form.
  const uh = process.env.COURIER_USER_HEADER || 'api-user';
  const th = process.env.COURIER_TOKEN_HEADER || 'api-token';
  const h = { 'Content-Type': 'application/json' };
  h[uh] = user;
  h[th] = token;
  return h;
}

async function fetchOne(slug, carrier, postcode, headers) {
  const res = await fetch(BASE + slug + '/get-pickup-locations', { method: 'POST', headers, body: buildBody(postcode) });
  if (!res.ok) throw new Error(carrier + ' pickups ' + res.status);
  const data = await res.json();
  return { points: mapResponse(data, carrier), origin: originForCarrier(data, carrier, postcode) };
}

// Live use: merged, tagged drop-offs for a postcode. carriers: optional subset e.g. ['DPD','UPS'].
async function fetchPickups(postcode, carriers) {
  if (!postcode) return null;
  const headers = authHeaders();
  if (!headers) return null; // token not set / no global fetch — skip silently
  const want = COURIERS.filter((c) => !carriers || carriers.includes(c.carrier));
  const results = await Promise.all(want.map((c) =>
    fetchOne(c.slug, c.carrier, postcode, headers).catch((e) => { console.error('[pickups]', e.message); return { points: [], origin: null }; })
  ));
  // Cap each carrier to 10 nearest; the card shows the first 3 with a "Load more" up to 10.
  return { dropoffs: results.flatMap((r) => r.points.slice(0, 10)), origin: (results.find((r) => r.origin) || {}).origin || null, postcode };
}

// Admin debug: returns per-courier HTTP status, mapped count, a sample, and the raw body (truncated).
async function fetchPickupsRaw(postcode, carriers) {
  const out = { postcode, tokenSet: !!process.env.COURIER_API_TOKEN, hasFetch: typeof fetch === 'function', couriers: [] };
  const headers = authHeaders();
  if (!headers) return out;
  const want = COURIERS.filter((c) => !carriers || carriers.includes(c.carrier));
  for (const c of want) {
    try {
      const res = await fetch(BASE + c.slug + '/get-pickup-locations', { method: 'POST', headers, body: buildBody(postcode) });
      const text = await res.text();
      let json = null; try { json = JSON.parse(text); } catch (_) {}
      const mapped = json ? mapResponse(json, c.carrier) : [];
      // Surface the exact field names of the first drop-off so we can wire hours/deadlines precisely.
      let firstKeys = null;
      try {
        if (json) {
          const first = c.carrier === 'UPS'
            ? ((((json.LocatorResponse || {}).SearchResults || {}).DropLocation || [])[0])
            : ((Array.isArray(json) ? json[0] : (json.pickupLocations || json.locations || [])[0]));
          const node = c.carrier === 'UPS' ? first : (first && (first.pickupLocation || first));
          if (node && typeof node === 'object') {
            firstKeys = Object.keys(node);
            if (c.carrier === 'UPS' && node.OperatingHours) firstKeys = firstKeys.concat(['OperatingHours>>' + Object.keys(node.OperatingHours).join(',')]);
          }
        }
      } catch (_) {}
      out.couriers.push({ carrier: c.carrier, status: res.status, ok: res.ok, mappedCount: mapped.length, sample: mapped.slice(0, 2), firstKeys, raw: text.slice(0, 12000) });
    } catch (e) { out.couriers.push({ carrier: c.carrier, error: e.message }); }
  }
  return out;
}

module.exports = { fetchPickups, fetchPickupsRaw };
