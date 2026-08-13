// Fetches nearest pickup / drop-off locations from the MoovParcel courier API.
// Called server-side so the API key is never exposed to the customer.
//
// >>> CONFIRM WITH ROSS (marked TODO): request body fields, auth header, response field names. <<<
// Set the key on Railway as env var COURIER_API_KEY. If it's missing, this is skipped silently
// (the card just doesn't show a map), so nothing breaks before it's configured.

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

async function fetchOne(slug, carrier, postcode, headers) {
  const res = await fetch(BASE + slug + '/get-pickup-locations', { method: 'POST', headers, body: buildBody(postcode) });
  if (!res.ok) throw new Error(carrier + ' pickups ' + res.status);
  const data = await res.json();
  // TODO(confirm): response shape. Flexible mapping across common shapes.
  const list = Array.isArray(data) ? data
    : (data.locations || data.results || data.pickupLocations || data.pickup_locations || data.data || []);
  const points = (Array.isArray(list) ? list : []).map((x) => ({
    carrier,
    name: pick(x, ['name', 'locationName', 'title', 'companyName']) || '',
    address: pick(x, ['address', 'fullAddress', 'displayAddress']) ||
      [pick(x, ['addressLine1', 'address1', 'line1']), pick(x, ['city', 'town']), pick(x, ['postcode', 'postCode'])].filter(Boolean).join(', '),
    lat: num(pick(x, ['latitude', 'lat']) ?? (x.coordinates && (x.coordinates.lat ?? x.coordinates.latitude)) ?? (x.geo && x.geo.lat)),
    lng: num(pick(x, ['longitude', 'lng', 'lon', 'long']) ?? (x.coordinates && (x.coordinates.lng ?? x.coordinates.longitude)) ?? (x.geo && x.geo.lng)),
    distance: pick(x, ['distance', 'distanceText', 'distanceMiles']) || '',
  })).filter((p) => p.lat != null && p.lng != null);
  const oRaw = data && data.origin;
  const origin = (oRaw && (oRaw.lat != null || oRaw.latitude != null))
    ? { lat: num(oRaw.lat ?? oRaw.latitude), lng: num(oRaw.lng ?? oRaw.longitude), postcode } : null;
  return { points, origin };
}

// Fetch nearest drop-offs for all couriers, tagged by carrier. carriers: optional subset e.g. ['DPD','UPS'].
async function fetchPickups(postcode, carriers) {
  if (!postcode) return null;
  // Token comes from a Railway env var — never hard-coded / committed. API user is not secret.
  const user = process.env.COURIER_API_USER || 'Moov Parcel Master';
  const token = process.env.COURIER_API_TOKEN;
  if (!token) return null;                       // not configured yet — skip silently
  if (typeof fetch !== 'function') return null; // needs Node 18+ global fetch

  const headers = { 'Content-Type': 'application/json' };
  // Auth: two custom headers. TODO(confirm exact header names if these fail).
  headers['API user'] = user;
  headers['API token'] = token;

  const want = COURIERS.filter((c) => !carriers || carriers.includes(c.carrier));
  const results = await Promise.all(want.map((c) =>
    fetchOne(c.slug, c.carrier, postcode, headers).catch((e) => { console.error('[pickups]', e.message); return { points: [], origin: null }; })
  ));
  const dropoffs = results.flatMap((r) => r.points);
  const origin = (results.find((r) => r.origin) || {}).origin || null;
  return { dropoffs, origin, postcode };
}

module.exports = { fetchPickups };
