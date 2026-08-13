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

// Flexible mapping across common response shapes → [{carrier,name,address,lat,lng,distance}].
function mapList(data, carrier) {
  const list = Array.isArray(data) ? data
    : (data && (data.locations || data.results || data.pickupLocations || data.pickup_locations || data.data || data.pickups)) || [];
  return (Array.isArray(list) ? list : []).map((x) => ({
    carrier,
    name: pick(x, ['name', 'locationName', 'title', 'companyName', 'shopName']) || '',
    address: pick(x, ['address', 'fullAddress', 'displayAddress']) ||
      [pick(x, ['addressLine1', 'address1', 'address_1', 'line1', 'street']), pick(x, ['city', 'town']), pick(x, ['postcode', 'postCode', 'zip'])].filter(Boolean).join(', '),
    lat: num(pick(x, ['latitude', 'lat']) ?? (x.coordinates && (x.coordinates.lat ?? x.coordinates.latitude)) ?? (x.geo && x.geo.lat) ?? (x.location && x.location.lat)),
    lng: num(pick(x, ['longitude', 'lng', 'lon', 'long']) ?? (x.coordinates && (x.coordinates.lng ?? x.coordinates.longitude)) ?? (x.geo && x.geo.lng) ?? (x.location && x.location.lng)),
    distance: pick(x, ['distance', 'distanceText', 'distanceMiles', 'distance_miles']) || '',
  })).filter((p) => p.lat != null && p.lng != null);
}
function originOf(data, postcode) {
  const o = data && data.origin;
  return (o && (o.lat != null || o.latitude != null))
    ? { lat: num(o.lat ?? o.latitude), lng: num(o.lng ?? o.longitude), postcode } : null;
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
  return { points: mapList(data, carrier), origin: originOf(data, postcode) };
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
  return { dropoffs: results.flatMap((r) => r.points), origin: (results.find((r) => r.origin) || {}).origin || null, postcode };
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
      const mapped = json ? mapList(json, c.carrier) : [];
      out.couriers.push({ carrier: c.carrier, status: res.status, ok: res.ok, mappedCount: mapped.length, sample: mapped.slice(0, 2), raw: text.slice(0, 6000) });
    } catch (e) { out.couriers.push({ carrier: c.carrier, error: e.message }); }
  }
  return out;
}

module.exports = { fetchPickups, fetchPickupsRaw };
