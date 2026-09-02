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

function addressOf(a, fallbackCountry) {
  a = a || {};
  const addr = {
    AddressLine: [a.line1, a.line2].map(S).filter(Boolean),
    City: S(a.city), PostalCode: S(a.postcode),
    CountryCode: S(a.country || fallbackCountry).toUpperCase(),
  };
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
  const res = await fetch(base() + '/api/rating/' + ver() + '/Shoptimeintransit', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + tk, 'Content-Type': 'application/json', 'transId': 'moov' + Date.now(), 'transactionSrc': 'MOOV-InterPricing' },
    body: JSON.stringify(buildRateRequest(payload)),
    signal: AbortSignal.timeout(6500),
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

// ---- UPS Pickup / Collection Creation ----
function buildPickupRequest(p) {
  const acct = process.env.UPS_ACCOUNT_NUMBER || '';
  const today = new Date();
  const defaultDateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const dateStr = String(p.pickupDate || defaultDateStr).replace(/[^0-9]/g, '');
  const readyStr = String(p.readyTime || '09:00').replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4);
  const closeStr = String(p.closeTime || '17:00').replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4);

  const addrLines = [p.addressLine1 || p.addressLine || p.address, p.addressLine2].map(S).filter(Boolean);
  if (!addrLines.length) addrLines.push(S(p.address || 'Address'));

  const phone = String(p.phone || '').replace(/[^0-9+]/g, '');
  const parcels = Math.max(1, Math.floor(Number(p.parcels) || 1));
  const weight = Math.max(0.1, Number(p.weight || p.totalWeight) || 1.0);
  const destCountry = S(p.destinationCountry || p.destCountry || p.country || 'GB').toUpperCase();
  const originCountry = S(p.country || 'GB').toUpperCase();
  const serviceCode = S(p.serviceCode || '011');
  const trackingNumber = p.trackingNumber ? String(p.trackingNumber).trim() : null;

  const req = {
    PickupCreationRequest: {
      RatePickupIndicator: 'N',
      Shipper: {
        Account: {
          AccountNumber: acct,
          AccountCountryCode: originCountry || 'GB',
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
          Number: phone || '01234567890',
        },
      },
      AlternateAddressIndicator: 'Y',
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
  if (p.specialInstruction || p.instructions) {
    req.PickupCreationRequest.SpecialInstruction = S(p.specialInstruction || p.instructions).slice(0, 100);
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
  const rateStatus = (pResp.RateStatus && pResp.RateStatus.RateStatusText) || null;

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

module.exports = { quoteRates, quoteRatesRaw, createPickup, buildPickupRequest, svcName, configured };
