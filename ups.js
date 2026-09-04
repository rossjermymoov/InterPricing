// UPS integration: OAuth (client-credentials) + Rating "Shoptimeintransit" (all services,
// price + transit time in one call). Credentials come from env vars, never committed:
//   UPS_CLIENT_ID, UPS_CLIENT_SECRET  (from the "Moov Parcel Rating" app)
//   UPS_ACCOUNT_NUMBER                (your UPS account, for negotiated rates)
//   UPS_ENV = test | production       (test -> CIE, default; production -> live)
//   UPS_RATING_VERSION                (defaults to v2403)

const PROD = 'https://onlinetools.ups.com';
const TEST = 'https://wwwcie.ups.com';
const { nameToIso } = require('./countries');
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
    signal: AbortSignal.timeout(6000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error('UPS OAuth ' + res.status + ': ' + text.slice(0, 300));
  const d = JSON.parse(text);
  _tok = { access_token: d.access_token, exp: Date.now() + (Number(d.expires_in || 3600) * 1000) };
  return _tok.access_token;
}

const num = (v) => { const n = typeof v === 'string' ? parseFloat(v) : v; return (typeof n === 'number' && !isNaN(n)) ? n : null; };
const S = (v) => (v == null ? '' : String(v));
const toIso = (c) => nameToIso(c) || (/^[A-Za-z]{2}$/.test(c) ? String(c).toUpperCase() : 'GB');

const COUNTRY_DEFAULTS = {
  'US': { city: 'New York', postcode: '10001' },
  'CA': { city: 'Toronto', postcode: 'M5V 2T6' },
  'AU': { city: 'Sydney', postcode: '2000' },
  'DE': { city: 'Berlin', postcode: '10115' },
  'FR': { city: 'Paris', postcode: '75001' },
  'IT': { city: 'Rome', postcode: '00118' },
  'ES': { city: 'Madrid', postcode: '28001' },
  'NL': { city: 'Amsterdam', postcode: '1012' },
  'IE': { city: 'Dublin', postcode: 'D02 X285' },
  'BE': { city: 'Brussels', postcode: '1000' },
  'CH': { city: 'Zurich', postcode: '8001' },
  'AT': { city: 'Vienna', postcode: '1010' },
  'PL': { city: 'Warsaw', postcode: '00-001' },
  'SE': { city: 'Stockholm', postcode: '111 20' },
  'NO': { city: 'Oslo', postcode: '0150' },
  'DK': { city: 'Copenhagen', postcode: '1050' },
  'JP': { city: 'Tokyo', postcode: '100-0001' },
  'CN': { city: 'Shanghai', postcode: '200000' },
  'HK': { city: 'Hong Kong', postcode: '999077' },
  'SG': { city: 'Singapore', postcode: '018989' },
  'NZ': { city: 'Auckland', postcode: '1010' },
  'AE': { city: 'Dubai', postcode: '00000' },
  'SA': { city: 'Riyadh', postcode: '11564' },
};

function addressOf(a, fallbackCountry) {
  a = a || {};
  const c = toIso(a.country || fallbackCountry) || 'GB';
  const lines = [a.line1, a.line2].map(S).filter(Boolean);
  const def = COUNTRY_DEFAULTS[c] || {};
  const city = (a.city && String(a.city).trim()) || def.city || '';
  const postcode = (a.postcode && String(a.postcode).trim()) || def.postcode || '';

  const addr = {
    AddressLine: lines.length ? lines : ['1 Main Street'],
    CountryCode: c.toUpperCase(),
  };
  if (city) addr.City = city;
  if (postcode) addr.PostalCode = postcode;
  if (a.residential) {
    addr.ResidentialAddressIndicator = 'Y';
  }
  return { Address: addr };
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

const DEFAULT_DAYS_BY_CODE = {
  '01': 1, // Next Day Air
  '02': 2, // 2nd Day Air
  '03': 3, // Ground
  '07': 1, // Worldwide Express
  '08': 4, // Worldwide Expedited
  '11': 4, // Standard
  '12': 3, // 3 Day Select
  '54': 1, // Worldwide Express Plus
  '65': 2, // Worldwide Saver
  '96': 3, // Worldwide Express Freight
};
function defaultDaysOf(code) {
  return DEFAULT_DAYS_BY_CODE[String(code)] || null;
}

// Business days in transit, when the response carries it; with standard fallbacks per service.
function daysOf(rs) {
  if (!rs) return null;
  const g = rs.GuaranteedDelivery && rs.GuaranteedDelivery.BusinessDaysInTransit;
  if (g != null && num(g) != null) return num(g);
  const tit = rs.TimeInTransit;
  if (tit) {
    if (tit.BusinessDaysInTransit != null && num(tit.BusinessDaysInTransit) != null) return num(tit.BusinessDaysInTransit);
    const ss = tit.ServiceSummary;
    if (ss) {
      if (ss.BusinessDaysInTransit != null && num(ss.BusinessDaysInTransit) != null) return num(ss.BusinessDaysInTransit);
      const ea = ss.EstimatedArrival;
      if (ea) {
        if (ea.BusinessDaysInTransit != null && num(ea.BusinessDaysInTransit) != null) return num(ea.BusinessDaysInTransit);
        if (ea.TotalTransitDays != null && num(ea.TotalTransitDays) != null) return num(ea.TotalTransitDays);
      }
    }
  }
  const code = (rs.Service && rs.Service.Code) || '';
  return defaultDaysOf(code);
}

// Friendly names for the itemised charge codes UPS returns; codes flagged remote are
// delivery/extended/remote-area surcharges we want to surface explicitly.
const CHG = {
  '375': 'Fuel Surcharge',
  '270': 'Residential Surcharge',
  '100': 'Additional Handling',
  '110': 'Large Package Surcharge',
  '120': 'Over Maximum Limits',
  '190': 'Delivery Area Surcharge',
  '195': 'Extended Area Surcharge',
  '197': 'Remote Area Surcharge',
  '199': 'Remote Area Surcharge',
  '400': 'Remote Area Surcharge',
  '401': 'Extended Area Surcharge',
  '376': 'Delivery Area Surcharge',
  '377': 'Large Package Surcharge',
  '260': 'Signature Required',
  '250': 'Adult Signature Required',
  '280': 'Direct Delivery Only',
  '300': 'Saturday Delivery',
  '430': 'Peak / Demand Surcharge',
  '441': 'Carbon Neutral Fee',
  '510': 'Lift Gate for Pickup',
  '511': 'Lift Gate for Delivery',
  '520': 'Oversize Pallet Surcharge',
  '573': 'International Processing Fee (US)',
};
const chgName = (c) => CHG[String(c)] || ('Accessorial ' + c);
const REMOTE = ['190', '195', '197', '199', '400', '401'];
const isRemote = (c) => REMOTE.indexOf(String(c)) >= 0;

// Per-service charge breakdown: base, fuel (code 375), other accessorials, and totals.
// Prefer the NEGOTIATED (discounted) itemised charges when UPS provides them — that gives
// your true account surcharge (e.g. the real remote-area figure) rather than the published one.
function breakdownOf(rs) {
  const neg = rs.NegotiatedRateCharges || null;
  const hasNegItems = !!(neg && neg.ItemizedCharges);
  const src = hasNegItems ? neg : rs;
  let items = src.ItemizedCharges || [];
  if (!Array.isArray(items)) items = items ? [items] : [];
  let fuel = 0; const acc = [];
  items.forEach((it) => {
    const code = String(it.Code || ''); const amt = num(it.MonetaryValue) || 0;
    if (code === '375') fuel += amt;
    else if (amt > 0) acc.push({ code, name: chgName(code), amt, remote: isRemote(code) });
  });
  const negBase = neg && neg.BaseServiceCharge ? num(neg.BaseServiceCharge.MonetaryValue) : null;
  const pubBase = rs.BaseServiceCharge ? num(rs.BaseServiceCharge.MonetaryValue) : null;
  return {
    base: hasNegItems ? (negBase != null ? negBase : pubBase) : pubBase,
    fuel,
    accessorials: acc,
    pubTotal: rs.TotalCharges ? num(rs.TotalCharges.MonetaryValue) : null,
    negTotal: (neg && neg.TotalCharge) ? num(neg.TotalCharge.MonetaryValue) : null,
    negotiated: hasNegItems, // true → components are already discounted (no scaling needed downstream)
  };
}

function parseRates(data) {
  const rr = (data && data.RateResponse) || {};
  let list = rr.RatedShipment || [];
  if (!Array.isArray(list)) list = list ? [list] : [];
  return list.map((rs) => {
    const c = costOf(rs);
    const code = (rs.Service && rs.Service.Code) || '';
    return { code, name: svcName(code), cost: c.value, currency: c.currency, days: daysOf(rs), breakdown: breakdownOf(rs) };
  }).filter((s) => s.cost != null).sort((a, b) => a.cost - b.cost);
}

async function callRate(payload) {
  const tk = await token();
  if (!tk) return null;
  const acct = process.env.UPS_ACCOUNT_NUMBER || '';
  const headers = {
    'Authorization': 'Bearer ' + tk,
    'Content-Type': 'application/json',
    'transId': 'moov' + Date.now(),
    'transactionSrc': 'MOOV-InterPricing',
  };
  if (acct) headers['x-merchant-id'] = acct;

  const reqBody = buildRateRequest(payload);
  let res = await fetch(base() + '/api/rating/' + ver() + '/Shoptimeintransit', {
    method: 'POST',
    headers,
    body: JSON.stringify(reqBody),
    signal: AbortSignal.timeout(6500),
  });
  let text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch (_) {}

  // If Shoptimeintransit returns non-200, try standard /Shop endpoint
  if (!res.ok) {
    try {
      const fallbackReq = JSON.parse(JSON.stringify(reqBody));
      if (fallbackReq.RateRequest && fallbackReq.RateRequest.Shipment) {
        delete fallbackReq.RateRequest.Shipment.DeliveryTimeInformation;
      }
      const resFallback = await fetch(base() + '/api/rating/' + ver() + '/Shop', {
        method: 'POST',
        headers,
        body: JSON.stringify(fallbackReq),
        signal: AbortSignal.timeout(6500),
      });
      if (resFallback.ok) {
        text = await resFallback.text();
        try { json = JSON.parse(text); } catch (_) {}
        return { ok: true, status: resFallback.status, json, text };
      }
    } catch (_) {}
  }

  return { ok: res.ok, status: res.status, json, text };
}

// Live use: rated services (cost only — the caller applies markup). Returns null if not configured.
async function quoteRates(payload) {
  const request = buildRateRequest(payload);
  const r = await callRate(payload);
  if (!r) return { enabled: false, error: 'UPS credentials not configured' };
  if (!r.ok) {
    return {
      enabled: false,
      error: 'UPS Rating ' + r.status + ': ' + (r.text || '').slice(0, 400),
      status: r.status,
      raw: r.text,
      request,
    };
  }
  return { enabled: true, services: parseRates(r.json), raw: r.text, status: r.status, request };
}

// Admin debug: raw request/response with full endpoint and headers so admins can inspect live UPS calls.
async function quoteRatesRaw(payload) {
  const acct = process.env.UPS_ACCOUNT_NUMBER || '';
  const endpoint = base() + '/api/rating/' + ver() + '/Shoptimeintransit';
  const request = buildRateRequest(payload);
  const out = {
    env: String(process.env.UPS_ENV || 'test'),
    configured: configured(),
    account: acct ? (acct.slice(0, 3) + '***' + acct.slice(-2)) : 'missing',
    endpoint,
    request,
  };
  try {
    const tk = await token();
    out.token = tk ? 'acquired (Bearer ' + tk.slice(0, 6) + '...)' : 'failed / not configured';
    if (!tk) return out;
    const r = await callRate(payload);
    out.status = r.status;
    out.ok = r.ok;
    out.services = r.json ? parseRates(r.json).slice(0, 12) : [];
    out.raw = (r.text || '').slice(0, 12000);
    try { out.responseJson = r.json || JSON.parse(r.text); } catch (_) {}
  } catch (e) {
    out.error = e.message;
  }
  return out;
}

// ---- UPS Pickup / Collection Creation ----
function buildPickupRequest(p) {
  const acct = process.env.UPS_ACCOUNT_NUMBER || '';
  const today = new Date();
  const defaultDateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const dateStr = String(p.pickupDate || defaultDateStr).replace(/[^0-9]/g, '');
  const readyStr = String(p.readyTime || '10:00').replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4);
  const closeStr = String(p.closeTime || '17:00').replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4);

  const addrLines = [p.addressLine1 || p.addressLine || p.address, p.addressLine2].map(S).filter(Boolean);
  if (!addrLines.length) addrLines.push(S(p.address || 'Address'));

  let phone = String(p.phone || '').replace(/[^0-9+]/g, '');
  if (!phone || phone.length < 7) phone = '07498991612';
  const parcels = Math.max(1, Math.floor(Number(p.parcels) || 1));
  const weight = Math.max(0.1, Number(p.weight || p.totalWeight) || 1.0);
  const toIso = (c, fallback = 'GB') => {
    if (!c) return fallback;
    const iso = nameToIso(c);
    if (iso) return iso;
    const s = String(c).trim();
    if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
    return fallback;
  };
  const originCountry = toIso(p.country || 'GB', 'GB');
  const destCountry = toIso(p.destinationCountry || p.destCountry || p.country || 'GB', 'GB');
  let rawSvc = String(p.serviceCode || '065').trim();
  if (rawSvc === '65') rawSvc = '065';
  if (rawSvc === '11') rawSvc = '011';
  if (rawSvc === '7' || rawSvc === '07') rawSvc = '007';
  const serviceCode = rawSvc.padStart(3, '0');
  const trackingNumber = p.trackingNumber ? String(p.trackingNumber).trim() : null;

  const req = {
    PickupCreationRequest: {
      RatePickupIndicator: 'N',
      Shipper: {
        Account: {
          AccountNumber: acct,
          AccountCountryCode: 'GB',
        },
      },
      PickupDateInfo: {
        CloseTime: closeStr,
        ReadyTime: readyStr,
        PickupDate: dateStr,
      },
      PickupAddress: {
        CompanyName: S(p.companyName || p.company || p.contactName || 'Company'),
        ContactName: S(p.contactName || p.companyName || 'Contact'),
        AddressLine: addrLines,
        City: S(p.city),
        PostalCode: S(p.postalCode || p.postcode),
        CountryCode: originCountry || 'GB',
        ResidentialIndicator: p.residential ? 'Y' : 'N',
        Phone: {
          Number: phone,
        },
      },
      AlternateAddressIndicator: originCountry !== 'GB' ? 'Y' : 'N',
      PickupPiece: [
        {
          ServiceCode: serviceCode,
          Quantity: String(parcels),
          DestinationCountryCode: destCountry || 'GB',
          ContainerCode: S(p.containerCode || '01'),
        },
      ],
      TotalWeight: {
        Weight: weight.toFixed(1),
        UnitOfMeasurement: 'KGS',
      },
      OverweightIndicator: 'N',
      PaymentMethod: '01',
    },
  };

  if (p.email) {
    req.PickupCreationRequest.PickupAddress.EMailAddress = S(p.email).trim();
  }
  let instructions = S(p.specialInstruction || p.instructions || '').slice(0, 100);
  const isCrossBorder = originCountry && destCountry && originCountry.toUpperCase() !== destCountry.toUpperCase();
  if (isCrossBorder && !instructions.toLowerCase().includes('invoice')) {
    const invNote = p.hasElectronicDocs ? 'Electronic Invoice uploaded.' : 'Commercial Invoices (x3) with packages.';
    instructions = instructions ? (invNote + ' ' + instructions).slice(0, 100) : invNote;
  }
  if (instructions) {
    req.PickupCreationRequest.SpecialInstruction = instructions;
  }
  if (trackingNumber) {
    req.PickupCreationRequest.TrackingData = [{ TrackingNumber: trackingNumber }];
  }

  return req;
}

async function createPickup(payload) {
  const tk = await token();
  if (!tk) return { ok: false, error: 'UPS credentials not configured' };

  const reqBody = buildPickupRequest(payload);
  const headers = {
    'Authorization': 'Bearer ' + tk,
    'Content-Type': 'application/json',
    'transId': 'moov_pickup_' + Date.now(),
    'transactionSrc': 'MOOV-InterPricing',
  };
  if (process.env.UPS_ACCOUNT_NUMBER) {
    headers['x-merchant-id'] = process.env.UPS_ACCOUNT_NUMBER;
  }
  const res = await fetch(base() + '/api/pickupcreation/v1/pickup', {
    method: 'POST',
    headers,
    body: JSON.stringify(reqBody),
    signal: AbortSignal.timeout(10000),
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}

  if (!res.ok) {
    let errMsg = 'UPS Pickup ' + res.status;
    if (json && json.response && json.response.errors && json.response.errors.length) {
      errMsg = json.response.errors.map((e) => e.message || e.code).join('; ');
    } else if (json && json.Error && json.Error.Description) {
      errMsg = json.Error.Description;
    } else if (text) {
      errMsg += ': ' + text.slice(0, 300);
    }
    return { ok: false, status: res.status, error: errMsg, raw: text, request: reqBody };
  }

  const pResp = (json && json.PickupCreationResponse) || {};
  const prn = pResp.PRN || (pResp.Response && pResp.Response.PRN) || null;
  const rateStatus = pResp.RateStatus || (pResp.PickupRate && pResp.PickupRate.RateStatus) || 'OK';
  return {
    ok: true,
    prn,
    rateStatus,
    status: res.status,
    raw: text,
    json,
    request: reqBody,
  };
}

// ---- UPS Pickup Cancellation ----
async function cancelPickup(prn) {
  if (!prn) return { ok: false, error: 'PRN is required for cancellation' };
  const tk = await token();
  if (!tk) return { ok: false, error: 'UPS credentials not configured' };

  const cleanPrn = String(prn).trim();
  const headers = {
    'Authorization': 'Bearer ' + tk,
    'transId': 'moov_cancel_' + Date.now(),
    'transactionSrc': 'testing',
    'Prn': cleanPrn,
  };

  const res = await fetch(base() + '/api/pickupcreation/v1/pickup/' + encodeURIComponent(cleanPrn), {
    method: 'DELETE',
    headers,
    signal: AbortSignal.timeout(10000),
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}

  if (!res.ok) {
    let errMsg = 'UPS Pickup Cancellation ' + res.status;
    if (json && json.response && json.response.errors && json.response.errors.length) {
      errMsg = json.response.errors.map((e) => e.message || e.code).join('; ');
    } else if (json && json.Error && json.Error.Description) {
      errMsg = json.Error.Description;
    } else if (text) {
      errMsg += ': ' + text.slice(0, 300);
    }
    return { ok: false, status: res.status, error: errMsg, raw: text };
  }

  return {
    ok: true,
    status: res.status,
    raw: text,
    json,
  };
}

// ---- UPS Shipment Booking (Label Generation & Paperless Document Upload) ----
function buildShipmentRequest(p) {
  const acct = process.env.UPS_ACCOUNT_NUMBER || '';
  const sender = p.sender || {};
  const receiver = p.receiver || {};
  const pkgs = Array.isArray(p.packages) && p.packages.length ? p.packages : [{ weight: p.weight || 1, l: p.l || 10, w: p.w || 10, h: p.h || 10 }];
  const svcCode = String(p.serviceCode || '65').padStart(2, '0'); // default to 65 (Worldwide Saver) or 11 (Standard)

  const senderAddr = addressOf(sender, '');
  const receiverAddr = addressOf(receiver, 'GB');

  const packagesArray = [];
  pkgs.forEach((pkg) => {
    const q = Math.max(1, parseInt(pkg.qty, 10) || 1);
    const wt = Math.max(0.1, Number(pkg.weight) || 1);
    const l = Math.max(1, Number(pkg.l) || 10);
    const w = Math.max(1, Number(pkg.w) || 10);
    const h = Math.max(1, Number(pkg.h) || 10);
    for (let i = 0; i < q; i++) {
      packagesArray.push({
        Description: S(pkg.description || p.description || 'Commercial Goods').slice(0, 35),
        Packaging: { Code: '02', Description: 'Customer Supplied Package' },
        Dimensions: {
          UnitOfMeasurement: { Code: 'CM', Description: 'Centimeters' },
          Length: String(Math.round(l)),
          Width: String(Math.round(w)),
          Height: String(Math.round(h)),
        },
        PackageWeight: {
          UnitOfMeasurement: { Code: 'KGS', Description: 'Kilograms' },
          Weight: String(wt.toFixed(1)),
        },
      });
    }
  });

  const isImport = (p.mode === 'import') || ((senderAddr.Address.CountryCode || '').toUpperCase() !== 'GB');

  // Shipper is always the account owner (MOOV Parcel in the UK) with your ShipperNumber.
  // For cross-border imports originating overseas (e.g. NL -> GB), UPS requires the ReturnService
  // container (Code: '9' Print Return Label) so the shipment originates from ShipFrom (NL)
  // and delivers to ShipTo (GB) billed to the UK Shipper account.
  const shipperObj = {
    Name: 'MOOV Parcel',
    AttentionName: 'Operations',
    TaxIdentificationNumber: 'GB446867375',
    Phone: { Number: '07498991612' },
    ShipperNumber: acct,
    Address: {
      AddressLine: ['1 Mellor Meadows'],
      City: 'Whittington',
      PostalCode: 'SY11 4FN',
      CountryCode: 'GB',
    },
  };

  const paymentInfo = {
    ShipmentCharge: [
      {
        Type: '01', // Transportation
        BillShipper: {
          AccountNumber: acct,
        },
      },
    ],
  };

  const shipmentObj = {
    Description: S(p.description || 'Commercial Goods / International Express').slice(0, 50),
    Shipper: shipperObj,
    ShipTo: {
      Name: S(receiver.company || receiver.name || 'Recipient').slice(0, 35),
      AttentionName: S(receiver.name || receiver.company || 'Recipient').slice(0, 35),
      Phone: { Number: S(receiver.phone || '07498991612').replace(/[^0-9+ ]/g, '').slice(0, 15) },
      EMailAddress: S(receiver.email || '').slice(0, 50),
      Address: receiverAddr.Address,
    },
    ShipFrom: {
      Name: S(sender.company || sender.name || 'Sender').slice(0, 35),
      AttentionName: S(sender.name || sender.company || 'Sender').slice(0, 35),
      Phone: { Number: S(sender.phone || '07498991612').replace(/[^0-9+ ]/g, '').slice(0, 15) },
      EMailAddress: S(sender.email || '').slice(0, 50),
      Address: senderAddr.Address,
    },
    PaymentInformation: paymentInfo,
    Service: {
      Code: svcCode,
      Description: svcName(svcCode),
    },
    Package: packagesArray,
    ItemizedChargesRequestedIndicator: '',
    RatingMethodRequestedIndicator: '',
  };

  if (isImport) {
    shipmentObj.ReturnService = {
      Code: '9', // UPS Print Return Label
      Description: 'UPS Print Return Label',
    };
  }

  // Attach Paperless Documents (Commercial Invoice / Packing Slip) via Base64 UserCreatedForm
  const forms = [];
  if (p.invoiceBase64) {
    const rawB64 = String(p.invoiceBase64).replace(/^data:[^;]+;base64,/, '');
    const fmt = (p.invoiceFormat || 'PDF').toUpperCase();
    forms.push({
      DocumentType: '002', // Commercial Invoice
      DocumentFormat: fmt,
      DocumentContent: rawB64,
    });
  }
  if (p.packingSlipBase64) {
    const rawB64 = String(p.packingSlipBase64).replace(/^data:[^;]+;base64,/, '');
    const fmt = (p.packingSlipFormat || 'PDF').toUpperCase();
    forms.push({
      DocumentType: '004', // Packing List
      DocumentFormat: fmt,
      DocumentContent: rawB64,
    });
  }

  if (forms.length > 0) {
    const intlForms = {
      FormType: ['01'],
      UserCreatedForm: forms,
      ReasonForExport: 'SALE',
      TermsOfSale: 'DAP',
      InvoiceNumber: S(p.invoiceNumber || ('INV-' + Date.now().toString().slice(-6))),
      InvoiceDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      PurchaseOrderNumber: S(p.reference || ('MOOV-' + Date.now().toString().slice(-6))),
      CurrencyCode: p.currency || 'GBP',
    };
    shipmentObj.InternationalForms = intlForms;
    shipmentObj.ShipmentServiceOptions = {
      InternationalForms: intlForms,
    };
  } else if (isImport || ((senderAddr.Address.CountryCode || '').toUpperCase() !== (receiverAddr.Address.CountryCode || '').toUpperCase())) {
    // Cross-border shipment without digital upload: declare hardcopy commercial invoice for pickup -> generates "INV" label indicator
    shipmentObj.InternationalForms = {
      FormType: ['01'],
      ReasonForExport: 'SALE',
      TermsOfSale: 'DAP',
      InvoiceNumber: S(p.invoiceNumber || ('INV-' + Date.now().toString().slice(-6))),
      InvoiceDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      PurchaseOrderNumber: S(p.reference || ('MOOV-' + Date.now().toString().slice(-6))),
      CurrencyCode: p.currency || 'GBP',
      Comments: 'Commercial Invoices (3 copies) provided by Shipper at pickup',
    };
  }

  return {
    ShipmentRequest: {
      Request: {
        SubVersion: '1801',
        RequestOption: 'nonvalidate',
        TransactionReference: {
          CustomerContext: 'MOOV-Import-' + Date.now(),
        },
      },
      Shipment: shipmentObj,
      LabelSpecification: {
        LabelImageFormat: {
          Code: 'GIF', // Standard GIF/PNG graphic format
        },
        LabelStockSize: {
          Height: '6',
          Width: '4',
        },
      },
    },
  };
}

async function bookShipment(payload) {
  const tk = await token();
  if (!tk) return { ok: false, error: 'UPS credentials not configured' };

  const reqBody = buildShipmentRequest(payload);
  const headers = {
    'Authorization': 'Bearer ' + tk,
    'Content-Type': 'application/json',
    'transId': 'moov_ship_' + Date.now(),
    'transactionSrc': 'MOOV-InterPricing',
  };
  if (process.env.UPS_ACCOUNT_NUMBER) {
    headers['x-merchant-id'] = process.env.UPS_ACCOUNT_NUMBER;
  }

  const res = await fetch(base() + '/api/shipments/v1/ship', {
    method: 'POST',
    headers,
    body: JSON.stringify(reqBody),
    signal: AbortSignal.timeout(15000),
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}

  if (!res.ok) {
    let errMsg = 'UPS Shipment Booking ' + res.status;
    if (json && json.response && json.response.errors && json.response.errors.length) {
      errMsg = json.response.errors.map((e) => e.message || e.code).join('; ');
    } else if (json && json.Error && json.Error.Description) {
      errMsg = json.Error.Description;
    } else if (text) {
      errMsg += ': ' + text.slice(0, 350);
    }
    return { ok: false, status: res.status, error: errMsg, raw: text, request: reqBody };
  }

  const sResults = (json && json.ShipmentResponse && json.ShipmentResponse.ShipmentResults) || {};
  const shipmentId = sResults.ShipmentIdentificationNumber || null;
  const pkgResults = Array.isArray(sResults.PackageResults) ? sResults.PackageResults : (sResults.PackageResults ? [sResults.PackageResults] : []);
  const packages = pkgResults.map((pkg) => ({
    trackingNumber: pkg.TrackingNumber,
    labelGraphic: (pkg.ShippingLabel && pkg.ShippingLabel.GraphicImage) || null,
    htmlImage: (pkg.ShippingLabel && pkg.ShippingLabel.HTMLImage) || null,
  }));

  const mainTracking = (packages[0] && packages[0].trackingNumber) || shipmentId;
  const totalCost = (sResults.ShipmentCharges && sResults.ShipmentCharges.TotalCharges && Number(sResults.ShipmentCharges.TotalCharges.MonetaryValue)) || null;

  return {
    ok: true,
    shipmentId,
    trackingNumber: mainTracking,
    packages,
    totalCost,
    status: res.status,
    raw: text,
    json,
    request: reqBody,
  };
}

// Void (Cancel) an existing booked shipment with UPS
async function voidShipment({ shipmentId, trackingNumber } = {}) {
  const tk = await token();
  if (!tk) return { ok: false, error: 'UPS credentials not configured' };
  const sId = String(shipmentId || trackingNumber || '').trim();
  if (!sId) return { ok: false, error: 'Shipment ID or tracking number required to void shipment' };

  const headers = {
    'Authorization': 'Bearer ' + tk,
    'transId': 'moov_void_' + Date.now(),
    'transactionSrc': 'testing',
  };

  let url = base() + '/api/shipments/v1/void/cancel/' + encodeURIComponent(sId);
  if (trackingNumber && trackingNumber !== sId) {
    url += '?trackingnumber=' + encodeURIComponent(trackingNumber);
  }

  const res = await fetch(url, {
    method: 'DELETE',
    headers,
    signal: AbortSignal.timeout(10000),
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}

  if (!res.ok) {
    let errMsg = 'UPS Void Error ' + res.status;
    if (json && json.response && json.response.errors && json.response.errors.length) {
      errMsg = json.response.errors.map((e) => e.message || e.code).join('; ');
    } else if (json && json.Error && json.Error.Description) {
      errMsg = json.Error.Description;
    } else if (text) {
      errMsg += ': ' + text.slice(0, 300);
    }
    return { ok: false, status: res.status, error: errMsg, raw: text };
  }

  return { ok: true, status: res.status, raw: text, json };
}

// Query UPS Tracking API for live shipment status, activity history, POD, and signature
async function trackShipment(trackingNumber) {
  const tk = await token();
  if (!tk) return { ok: false, error: 'UPS credentials not configured' };
  const trk = String(trackingNumber || '').trim();
  if (!trk) return { ok: false, error: 'Tracking number required' };

  const headers = {
    'Authorization': 'Bearer ' + tk,
    'transId': 'moov_track_' + Date.now(),
    'transactionSrc': 'testing',
  };
  if (process.env.UPS_ACCOUNT_NUMBER) {
    headers['x-merchant-id'] = process.env.UPS_ACCOUNT_NUMBER;
  }

  // Try requesting basic tracking first (works on standard Tracking scope)
  let url = base() + '/api/track/v1/details/' + encodeURIComponent(trk) + '?locale=en_GB';

  let res = await fetch(url, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(10000),
  });

  let text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}

  if (!res.ok) {
    let errMsg = 'UPS Tracking ' + res.status;
    if (json && json.response && json.response.errors && json.response.errors.length) {
      errMsg = json.response.errors.map((e) => e.message || e.code).join('; ');
    } else if (json && json.Error && json.Error.Description) {
      errMsg = json.Error.Description;
    } else if (text) {
      errMsg += ': ' + text.slice(0, 300);
    }
    if (errMsg.toLowerCase().includes('invalid authentication') || res.status === 401 || res.status === 403) {
      errMsg = 'The "Tracking" product needs to be added to your app in the UPS Developer Portal (under Apps > Products > Add Tracking).';
    }
    return { ok: false, status: res.status, error: errMsg, raw: text };
  }

  // Parse structured tracking events and delivery status
  const trackResp = (json && json.trackResponse) || {};
  const shipmentList = Array.isArray(trackResp.shipment) ? trackResp.shipment : (trackResp.shipment ? [trackResp.shipment] : []);
  const firstShipment = shipmentList[0] || {};
  const pkgList = Array.isArray(firstShipment.package) ? firstShipment.package : (firstShipment.package ? [firstShipment.package] : []);
  const firstPkg = pkgList[0] || {};

  const currentStatus = firstPkg.currentStatus || {};
  const statusCode = currentStatus.code || '';
  const statusDescription = currentStatus.description || '';
  const activities = Array.isArray(firstPkg.activity) ? firstPkg.activity : (firstPkg.activity ? [firstPkg.activity] : []);
  const deliveryInfo = firstPkg.deliveryInformation || {};

  // Check if collected / picked up
  const isCollected = activities.some((a) => {
    const desc = ((a.status && a.status.description) || (a.activityScan && a.activityScan.description) || '').toLowerCase();
    const type = ((a.status && a.status.type) || '').toLowerCase();
    return desc.includes('pickup') || desc.includes('picked up') || desc.includes('collection') || desc.includes('collected') || desc.includes('origin scan') || desc.includes('drop-off') || type === 'p' || type === 'or';
  }) || ['P', 'OR', 'DP', 'IT', 'OT', 'DL', 'D'].includes(statusCode);

  const isDelivered = statusCode === 'D' || statusCode === 'DELIVERED' || statusDescription.toLowerCase().includes('delivered') || !!deliveryInfo.receivedBy;

  // Normalise raw UPS activity stream into standard 7-stage courier journey
  const stageInfo = normalizeTrackingStages({ statusCode, statusDescription, isCollected, isDelivered, activities, deliveryInfo });

  return {
    ok: true,
    trackingNumber: trk,
    statusCode,
    statusDescription: stageInfo.latestStatusText || statusDescription || 'Active',
    isCollected,
    isDelivered,
    stage: stageInfo.stage,
    stageName: stageInfo.stageName,
    stageDesc: stageInfo.stageDesc,
    lastLocation: stageInfo.lastLocation,
    activities: activities.map((a) => {
      const loc = (a.location && a.location.address ? ((a.location.address.city || '') + (a.location.address.countryCode ? (', ' + a.location.address.countryCode) : '')) : '');
      const stat = (a.status && a.status.description) || (a.activityScan && a.activityScan.description) || statusDescription;
      const code = (a.status && a.status.code) || (a.activityScan && a.activityScan.type) || '';
      return {
        date: (a.date || '') + (a.time ? (' ' + a.time) : ''),
        location: loc,
        status: stat,
        code: code,
      };
    }),
    delivery: {
      receivedBy: deliveryInfo.receivedBy || null,
      location: deliveryInfo.location || null,
      hasSignature: !!(deliveryInfo.signature && deliveryInfo.signature.content),
      signatureBase64: (deliveryInfo.signature && deliveryInfo.signature.content) || null,
      hasPOD: !!(deliveryInfo.pod && deliveryInfo.pod.content),
      podBase64: (deliveryInfo.pod && deliveryInfo.pod.content) || null,
    },
    raw: text,
    json,
  };
}

// Deterministic normalization engine for UPS tracking milestones into 7 operational stages
function normalizeTrackingStages({ statusCode, statusDescription, isCollected, isDelivered, activities, deliveryInfo }) {
  const STAGES = [
    { stage: 1, name: 'Collected', desc: 'Supplier Pickup' },
    { stage: 2, name: 'In Transit', desc: 'Origin Transit' },
    { stage: 3, name: 'At Hub', desc: 'Export Hub' },
    { stage: 4, name: 'In Transit', desc: 'Cross-Border' },
    { stage: 5, name: 'At Depot', desc: 'UK Depot' },
    { stage: 6, name: 'Out for Delivery', desc: 'Local Driver' },
    { stage: 7, name: 'Delivered', desc: 'Signed & Complete' },
  ];

  if (isDelivered || statusCode === 'D' || (deliveryInfo && deliveryInfo.receivedBy)) {
    return {
      stage: 7,
      stageName: 'Delivered',
      stageDesc: 'Signed & Complete',
      lastLocation: (deliveryInfo && deliveryInfo.location) || 'Destination',
      latestStatusText: 'Delivered' + ((deliveryInfo && deliveryInfo.receivedBy) ? (' to ' + deliveryInfo.receivedBy) : ''),
    };
  }

  let highestStage = isCollected ? 1 : 0;
  let lastLoc = '';
  let latestDesc = statusDescription || '';

  // Reverse chronological or chronological pass over all scan activities
  if (Array.isArray(activities) && activities.length > 0) {
    // Process all scans to determine highest milestone reached
    activities.forEach((act, idx) => {
      const desc = ((act.status && act.status.description) || (act.activityScan && act.activityScan.description) || '').toLowerCase();
      const code = ((act.status && act.status.code) || (act.activityScan && act.activityScan.type) || '').toUpperCase();
      const loc = (act.location && act.location.address)
        ? [act.location.address.city, act.location.address.countryCode].filter(Boolean).join(', ')
        : '';
      const cCode = (act.location && act.location.address && act.location.address.countryCode || '').toUpperCase();

      if (idx === 0 && loc) lastLoc = loc;
      if (idx === 0 && desc) latestDesc = (act.status && act.status.description) || desc;

      // Stage 6: Out for delivery
      if (code === 'OF' || code === 'OD' || desc.includes('out for delivery') || desc.includes('loaded on delivery') || desc.includes('on vehicle for delivery')) {
        if (highestStage < 6) highestStage = 6;
      }
      // Stage 5: At destination UK Depot / Hub
      else if (
        (cCode === 'GB' || desc.includes('uk') || desc.includes('castle donington') || desc.includes('stanford') || desc.includes('tamworth') || desc.includes('destination scan') || desc.includes('import scan') || desc.includes('customs cleared')) &&
        (desc.includes('arrival scan') || desc.includes('warehouse scan') || desc.includes('hub scan') || desc.includes('processing at facility') || desc.includes('destination'))
      ) {
        if (highestStage < 5) highestStage = 5;
      }
      // Stage 4: Cross-border transit / export customs released / international transit
      else if (desc.includes('customs') || desc.includes('international') || desc.includes('cross-border') || desc.includes('in transit') || desc.includes('transit') || desc.includes('cleared customs') || desc.includes('carrier processing')) {
        if (highestStage < 4) highestStage = 4;
      }
      // Stage 3: At Export Gateway / Hub (e.g. Cologne, Roissy, Milan, Origin Hub)
      else if (desc.includes('export scan') || desc.includes('hub') || desc.includes('gateway') || desc.includes('arrival scan') || desc.includes('origin hub') || desc.includes('facility') || code === 'AR' || code === 'HS') {
        if (highestStage < 3) highestStage = 3;
      }
      // Stage 2: Departure from origin facility / moving in origin transit
      else if (desc.includes('departure scan') || desc.includes('departed from facility') || desc.includes('origin departure') || code === 'DP') {
        if (highestStage < 2) highestStage = 2;
      }
      // Stage 1: Collected / Picked up / Origin scan
      else if (desc.includes('pickup') || desc.includes('picked up') || desc.includes('collection') || desc.includes('collected') || desc.includes('origin scan') || desc.includes('drop-off') || code === 'P' || code === 'OR') {
        if (highestStage < 1) highestStage = 1;
      }
    });
  }

  // Fallback if status code or description indicates progress
  const sDescLow = (statusDescription || '').toLowerCase();
  if (highestStage === 0) {
    if (sDescLow.includes('out for delivery')) highestStage = 6;
    else if (sDescLow.includes('hub') || sDescLow.includes('transit')) highestStage = 3;
    else if (isCollected) highestStage = 1;
  }

  const stageObj = STAGES.find((s) => s.stage === highestStage) || STAGES[0];
  return {
    stage: highestStage,
    stageName: stageObj.name,
    stageDesc: stageObj.desc,
    lastLocation: lastLoc,
    latestStatusText: latestDesc || stageObj.name,
  };
}

// Upload customs document (Commercial Invoice / Packing Slip) post-shipment
async function uploadPaperlessDocument({ trackingNumber, documentType, base64Content, format }) {
  const tk = await token();
  if (!tk) return { ok: false, error: 'UPS credentials not configured' };
  const acct = process.env.UPS_ACCOUNT_NUMBER || '';
  const rawB64 = String(base64Content || '').replace(/^data:[^;]+;base64,/, '');
  const fmt = String(format || 'PDF').toUpperCase();
  const docType = String(documentType || '002'); // 002 = Commercial Invoice, 004 = Packing List

  const reqBody = {
    UploadRequest: {
      Request: {
        TransactionReference: { CustomerContext: 'MOOV-DocUpload-' + Date.now() },
      },
      ShipperNumber: acct,
      UserCreatedForm: [
        {
          DocumentType: docType,
          DocumentFormat: fmt,
          DocumentContent: rawB64,
        },
      ],
      TrackingNumber: String(trackingNumber || '').trim(),
    },
  };

  const headers = {
    'Authorization': 'Bearer ' + tk,
    'Content-Type': 'application/json',
    'transId': 'moov_doc_' + Date.now(),
    'transactionSrc': 'testing',
  };

  try {
    const res = await fetch(base() + '/api/paperlessdocuments/v1/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify(reqBody),
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (_) {}
    if (!res.ok) {
      let errMsg = 'UPS Document Upload ' + res.status;
      if (json && json.response && json.response.errors && json.response.errors.length) {
        errMsg = json.response.errors.map((e) => e.message || e.code).join('; ');
      }
      return { ok: false, status: res.status, error: errMsg, raw: text };
    }
    return { ok: true, status: res.status, json, raw: text };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  quoteRates, quoteRatesRaw, createPickup, cancelPickup, buildPickupRequest,
  bookShipment, buildShipmentRequest, voidShipment, trackShipment, uploadPaperlessDocument, svcName, configured
};
