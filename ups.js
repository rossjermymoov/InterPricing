// UPS integration: OAuth (client-credentials) + Rating "Shoptimeintransit" (all services,
// price + transit time in one call). Credentials come from env vars, never committed:
//   UPS_CLIENT_ID, UPS_CLIENT_SECRET  (from the "Moov Parcel Rating" app)
//   UPS_ACCOUNT_NUMBER                (your UPS account, for negotiated rates)
//   UPS_ENV = test | production       (test -> CIE, default; production -> live)
//   UPS_RATING_VERSION                (defaults to v2403)

const PROD = 'https://onlinetools.ups.com';
const TEST = 'https://wwwcie.ups.com';
const base = () => (String(process.env.UPS_ENV || 'test').toLowerCase().startsWith('prod') ? PROD : TEST);
const ver = () => process.env.UPS_RATING_VERSION || 'v2403';

// UPS service code -> friendly name (international + domestic).
const SVC = {
  '01': 'UPS Next Day Air', '02': 'UPS 2nd Day Air', '03': 'UPS Ground', '12': 'UPS 3 Day Select',
  '07': 'UPS Worldwide Express', '08': 'UPS Worldwide Expedited', '11': 'UPS Standard',
  '54': 'UPS Worldwide Express Plus', '65': 'UPS Worldwide Saver', '96': 'UPS Worldwide Express Freight',
};
const svcName = (c) => SVC[c] || ('UPS service ' + c);

const configured = () => !!(process.env.UPS_CLIENT_ID && process.env.UPS_CLIENT_SECRET && typeof fetch === 'function');

// ---- OAuth token (cached until ~1 min before expiry) ----
let _tok = null;
async function token() {
  if (!configured()) return null;
  if (_tok && _tok.exp > Date.now() + 60000) return _tok.access_token;
  const cred = Buffer.from(process.env.UPS_CLIENT_ID + ':' + process.env.UPS_CLIENT_SECRET).toString('base64');
  const res = await fetch(base() + '/security/v1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + cred, 'x-merchant-id': process.env.UPS_ACCOUNT_NUMBER || '' },
    body: 'grant_type=client_credentials',
  });
  const text = await res.text();
  if (!res.ok) throw new Error('UPS OAuth ' + res.status + ': ' + text.slice(0, 300));
  const d = JSON.parse(text);
  _tok = { access_token: d.access_token, exp: Date.now() + (Number(d.expires_in || 3600) * 1000) };
  return _tok.access_token;
}

const num = (v) => { const n = typeof v === 'string' ? parseFloat(v) : v; return (typeof n === 'number' && !isNaN(n)) ? n : null; };
const S = (v) => (v == null ? '' : String(v));

function addressOf(a, fallbackCountry) {
  a = a || {};
  return {
    Address: {
      AddressLine: [a.line1, a.line2].map(S).filter(Boolean),
      City: S(a.city), PostalCode: S(a.postcode),
      CountryCode: S(a.country || fallbackCountry).toUpperCase(),
    },
  };
}

// Build the RateRequest from the import/export form payload.
// Import: goods come from sender (overseas) to receiver (home/GB). Export: reversed.
// Shipper is always the account holder (for negotiated rates).
function buildRateRequest(p) {
  const acct = process.env.UPS_ACCOUNT_NUMBER || '';
  const homeCountry = 'GB';
  const shipper = { Name: 'MOOV Parcel', ShipperNumber: acct, Address: { AddressLine: ['1 Mellor Meadows'], City: 'Whittington', PostalCode: 'SY11 4FN', CountryCode: 'GB' } };
  const sender = p.sender || {}, receiver = p.receiver || {};
  const shipFrom = Object.assign({ Name: S(sender.name || sender.company || 'Sender') }, addressOf(sender, ''));
  const shipTo = Object.assign({ Name: S(receiver.name || receiver.company || 'Receiver') }, addressOf(receiver, homeCountry));

  // Weight is at least 0.1 kg per parcel and formatted to one decimal — UPS rejects
  // integer-only or zero weights on international time-in-transit lanes (error 111546).
  const wStr = (n) => (Math.max(0.1, Number(n) || 0.1)).toFixed(1);
  const KG = { Code: 'KGS', Description: 'Kilograms' };
  const CM = { Code: 'CM', Description: 'Centimeters' };

  // UPS packaging-type codes: 02 customer-supplied, 03 tube, 21 UPS Express Box, 30 pallet.
  const PKG = { mine: '02', tube: '03', expressbox: '21', pallet: '30' };
  const Package = [];
  let totalWeight = 0;
  (p.packages || []).forEach((pk) => {
    const qty = Math.max(1, Math.floor(Number(pk.qty) || 1));
    const w = wStr(pk.weight);
    const one = { PackagingType: { Code: PKG[pk.packaging] || '02' }, PackageWeight: { UnitOfMeasurement: KG, Weight: w } };
    if (num(pk.l) && num(pk.w) && num(pk.h)) one.Dimensions = { UnitOfMeasurement: CM, Length: S(pk.l), Width: S(pk.w), Height: S(pk.h) };
    for (let i = 0; i < qty; i++) { Package.push(JSON.parse(JSON.stringify(one))); totalWeight += Number(w); }
  });
  if (!Package.length) { Package.push({ PackagingType: { Code: '02' }, PackageWeight: { UnitOfMeasurement: KG, Weight: '1.0' } }); totalWeight = 1; }
  const ShipmentTotalWeight = { UnitOfMeasurement: KG, Weight: (Math.round(totalWeight * 10) / 10).toFixed(1) };

  // International shipments must declare the value of the goods (the "shipment contents
  // value"). UPS rejects the rate request without it (error 111549). Use the value the
  // form supplies; fall back to a nominal figure so a quote still returns.
  const goodsVal = num(p.value != null ? p.value : (p.goodsValue != null ? p.goodsValue : null));
  const invoiceTotal = (goodsVal != null && goodsVal > 0) ? goodsVal : 100;
  const invoiceCurrency = S(p.currency || 'GBP').toUpperCase();

  return {
    RateRequest: {
      Request: { SubVersion: ver().replace(/^v/, ''), TransactionReference: { CustomerContext: 'MOOV ' + (p.mode || 'import') + ' quote' } },
      Shipment: {
        Shipper: shipper, ShipTo: shipTo, ShipFrom: shipFrom,
        ShipmentRatingOptions: { NegotiatedRatesIndicator: 'Y' }, // account (negotiated) rates
        DeliveryTimeInformation: { PackageBillType: '03' }, // 03 = non-document (for time in transit)
        InvoiceLineTotal: { CurrencyCode: invoiceCurrency, MonetaryValue: String(invoiceTotal) },
        ShipmentTotalWeight,
        NumOfPieces: String(Package.length),
        Package,
      },
    },
  };
}

// Rate cost from a RatedShipment: prefer negotiated (your account) rate, else published.
function costOf(rs) {
  const neg = rs.NegotiatedRateCharges && rs.NegotiatedRateCharges.TotalCharge;
  if (neg && neg.MonetaryValue != null) return { value: num(neg.MonetaryValue), currency: neg.CurrencyCode || 'GBP' };
  const tot = rs.TotalCharges || {};
  return { value: num(tot.MonetaryValue), currency: tot.CurrencyCode || 'GBP' };
}
// Business days in transit, when the response carries it.
function daysOf(rs) {
  const g = rs.GuaranteedDelivery && rs.GuaranteedDelivery.BusinessDaysInTransit;
  if (g != null) return num(g);
  const t = rs.TimeInTransit && rs.TimeInTransit.ServiceSummary && rs.TimeInTransit.ServiceSummary.EstimatedArrival;
  if (t && t.BusinessDaysInTransit != null) return num(t.BusinessDaysInTransit);
  return null;
}

function parseRates(data) {
  const rr = (data && data.RateResponse) || {};
  let list = rr.RatedShipment || [];
  if (!Array.isArray(list)) list = list ? [list] : [];
  return list.map((rs) => {
    const c = costOf(rs);
    const code = (rs.Service && rs.Service.Code) || '';
    return { code, name: svcName(code), cost: c.value, currency: c.currency, days: daysOf(rs) };
  }).filter((s) => s.cost != null).sort((a, b) => a.cost - b.cost);
}

async function callRate(payload) {
  const tk = await token();
  if (!tk) return null;
  const res = await fetch(base() + '/api/rating/' + ver() + '/Shoptimeintransit', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + tk, 'Content-Type': 'application/json', 'transId': 'moov' + Date.now(), 'transactionSrc': 'MOOV-InterPricing' },
    body: JSON.stringify(buildRateRequest(payload)),
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch (_) {}
  return { ok: res.ok, status: res.status, json, text };
}

// Live use: rated services (cost only — the caller applies markup). Returns null if not configured.
// Also returns the raw response text + the exact request we sent, so an admin can inspect the
// full UPS charge breakdown (base, fuel, accessorials, negotiated vs published) when diagnosing prices.
async function quoteRates(payload) {
  const request = buildRateRequest(payload);
  const r = await callRate(payload);
  if (!r) return { enabled: false };
  if (!r.ok) throw new Error('UPS Rating ' + r.status + ': ' + (r.text || '').slice(0, 400));
  return { enabled: true, services: parseRates(r.json), raw: r.text, status: r.status, request };
}

// Admin debug: raw request/response so we can confirm the field shapes against CIE.
async function quoteRatesRaw(payload) {
  const out = { env: String(process.env.UPS_ENV || 'test'), configured: configured(), account: process.env.UPS_ACCOUNT_NUMBER ? 'set' : 'missing' };
  try {
    const tk = await token();
    out.token = tk ? 'ok' : 'not configured';
    if (!tk) return out;
    const r = await callRate(payload);
    out.status = r.status; out.ok = r.ok;
    out.services = r.json ? parseRates(r.json).slice(0, 12) : [];
    out.raw = (r.text || '').slice(0, 8000);
  } catch (e) { out.error = e.message; }
  return out;
}

module.exports = { quoteRates, quoteRatesRaw, svcName, configured };
