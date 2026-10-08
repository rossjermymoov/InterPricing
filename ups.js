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
  'HN': { city: 'Tegucigalpa', postcode: '11101' },
  'GT': { city: 'Guatemala City', postcode: '01001' },
  'CR': { city: 'San Jose', postcode: '10101' },
  'PA': { city: 'Panama City', postcode: '0801' },
  'SV': { city: 'San Salvador', postcode: '1101' },
  'NI': { city: 'Managua', postcode: '11001' },
  'MX': { city: 'Mexico City', postcode: '01000' },
  'CO': { city: 'Bogota', postcode: '110111' },
  'PE': { city: 'Lima', postcode: '15001' },
  'CL': { city: 'Santiago', postcode: '8320000' },
  'AR': { city: 'Buenos Aires', postcode: 'C1002' },
  'BR': { city: 'Sao Paulo', postcode: '01000-000' },
};

function usZipToState(zip) {
  const clean = String(zip || '').trim().replace(/[^\d]/g, '');
  if (clean.length < 3) return '';
  const p = parseInt(clean.slice(0, 3), 10);
  if (isNaN(p)) return '';
  if (p >= 5 && p <= 9) return 'PR';
  if (p >= 10 && p <= 27) return 'MA';
  if (p >= 28 && p <= 29) return 'RI';
  if (p >= 30 && p <= 38) return 'NH';
  if (p >= 39 && p <= 49) return 'ME';
  if (p >= 50 && p <= 59) return 'VT';
  if (p >= 60 && p <= 69) return 'CT';
  if (p >= 70 && p <= 89) return 'NJ';
  if (p >= 90 && p <= 99) return 'APO';
  if (p >= 100 && p <= 149) return 'NY';
  if (p >= 150 && p <= 196) return 'PA';
  if (p >= 197 && p <= 199) return 'DE';
  if (p >= 200 && p <= 205) return 'DC';
  if (p >= 206 && p <= 219) return 'MD';
  if (p >= 220 && p <= 246) return 'VA';
  if (p >= 247 && p <= 268) return 'WV';
  if (p >= 270 && p <= 289) return 'NC';
  if (p >= 290 && p <= 299) return 'SC';
  if (p >= 300 && p <= 319) return 'GA';
  if (p >= 320 && p <= 349) return 'FL';
  if (p >= 350 && p <= 369) return 'AL';
  if (p >= 370 && p <= 385) return 'TN';
  if (p >= 386 && p <= 397) return 'MS';
  if (p >= 400 && p <= 427) return 'KY';
  if (p >= 430 && p <= 459) return 'OH';
  if (p >= 460 && p <= 479) return 'IN';
  if (p >= 480 && p <= 499) return 'MI';
  if (p >= 500 && p <= 528) return 'IA';
  if (p >= 530 && p <= 549) return 'WI';
  if (p >= 550 && p <= 567) return 'MN';
  if (p >= 570 && p <= 577) return 'SD';
  if (p >= 580 && p <= 588) return 'ND';
  if (p >= 590 && p <= 599) return 'MT';
  if (p >= 600 && p <= 629) return 'IL';
  if (p >= 630 && p <= 658) return 'MO';
  if (p >= 660 && p <= 679) return 'KS';
  if (p >= 680 && p <= 693) return 'NE';
  if (p >= 700 && p <= 714) return 'LA';
  if (p >= 716 && p <= 729) return 'AR';
  if (p >= 730 && p <= 749) return 'OK';
  if (p >= 750 && p <= 799) return 'TX';
  if (p >= 800 && p <= 816) return 'CO';
  if (p >= 820 && p <= 831) return 'WY';
  if (p >= 832 && p <= 838) return 'ID';
  if (p >= 840 && p <= 847) return 'UT';
  if (p >= 850 && p <= 865) return 'AZ';
  if (p >= 870 && p <= 884) return 'NM';
  if (p >= 889 && p <= 898) return 'NV';
  if (p >= 900 && p <= 961) return 'CA';
  if (p >= 967 && p <= 968) return 'HI';
  if (p >= 970 && p <= 979) return 'OR';
  if (p >= 980 && p <= 994) return 'WA';
  if (p >= 995 && p <= 999) return 'AK';
  return '';
}

function caPostcodeToProvince(pc) {
  const clean = String(pc || '').trim().toUpperCase();
  if (!clean) return '';
  const first = clean.charAt(0);
  const map = {
    'A': 'NL', 'B': 'NS', 'C': 'PE', 'E': 'NB', 'G': 'QC', 'H': 'QC', 'J': 'QC',
    'K': 'ON', 'L': 'ON', 'M': 'ON', 'N': 'ON', 'P': 'ON', 'R': 'MB', 'S': 'SK',
    'T': 'AB', 'V': 'BC', 'X': 'NT', 'Y': 'YT',
  };
  return map[first] || '';
}

function addressOf(a, fallbackCountry) {
  a = a || {};
  const c = toIso(a.country || fallbackCountry) || 'GB';
  const lines = [a.line1, a.line2].map(S).filter(Boolean);
  const def = COUNTRY_DEFAULTS[c] || {};
  
  const hasCustomPostcode = !!(a.postcode && String(a.postcode).trim());
  const hasCustomCity = !!(a.city && String(a.city).trim());

  let city = hasCustomCity ? String(a.city).trim() : '';
  let postcode = hasCustomPostcode ? String(a.postcode).trim() : '';

  // Apply default fallback city & postcode if NEITHER was provided
  if (!hasCustomCity && !hasCustomPostcode) {
    city = def.city || '';
    postcode = def.postcode || '';
  } else if (!hasCustomCity && hasCustomPostcode) {
    // If postcode was provided without city, use country default city to prevent UPS API missing-city rejection
    city = def.city || '';
  }

  // Clean US zip code if it has extra text
  if (c.toUpperCase() === 'US' && postcode) {
    const zipMatch = postcode.match(/\b\d{5}(?:-\d{4})?\b/);
    if (zipMatch) postcode = zipMatch[0];
  }

  const addr = {
    AddressLine: lines.length ? lines : ['1 Main Street'],
    CountryCode: c.toUpperCase(),
  };
  if (city) addr.City = city;
  if (postcode) addr.PostalCode = postcode;

  let state = a.state || a.stateProvinceCode || '';
  if (!state && c.toUpperCase() === 'US' && postcode) {
    state = usZipToState(postcode);
  } else if (!state && c.toUpperCase() === 'CA' && postcode) {
    state = caPostcodeToProvince(postcode);
  }

  // Extract state if appended in city (e.g. "Miami, FL" or "Los Angeles, CA")
  if (!state && c.toUpperCase() === 'US' && city) {
    const stateMatch = city.match(/,\s*([A-Za-z]{2})\b/);
    if (stateMatch) {
      state = stateMatch[1].toUpperCase();
      city = city.replace(/,\s*[A-Za-z]{2}\b/, '').trim();
      addr.City = city;
    }
  }

  if (state) addr.StateProvinceCode = String(state).trim().toUpperCase();

  if (a.residential) {
    addr.ResidentialAddressIndicator = 'Y';
  }
  return { Address: addr };
}

const IMPERIAL_ORIGINS = new Set(['US', 'PR', 'VI', 'GU', 'AS', 'MP', 'UM']);

function isImperialCountry(countryCode) {
  return IMPERIAL_ORIGINS.has(String(countryCode || '').trim().toUpperCase());
}

// Build the RateRequest from the import/export form payload.
// Import: goods come from sender (overseas) to receiver (home/GB). Export: reversed.
// Shipper is always the account holder (for negotiated rates).
function buildRateRequest(p) {
  const acct = process.env.UPS_ACCOUNT_NUMBER || '';
  const homeCountry = 'GB';
  const shipper = {
    Name: 'MOOV Logistics Solutions Limited',
    ShipperNumber: acct,
    Address: {
      AddressLine: ['Units 3-5 Kettlebridge Road', 'Parkway Link'],
      City: 'Sheffield',
      PostalCode: 'S9 3AJ',
      CountryCode: 'GB',
    },
  };
  const sender = p.sender || {}, receiver = p.receiver || {};
  const shipFrom = Object.assign({ Name: S(sender.name || sender.company || 'Sender') }, addressOf(sender, ''));
  const shipTo = Object.assign({ Name: S(receiver.name || receiver.company || 'Receiver') }, addressOf(receiver, homeCountry));

  const originCountry = (shipFrom.Address && shipFrom.Address.CountryCode) || (sender && sender.country) || 'GB';
  const isImperial = isImperialCountry(originCountry);
  const UOM_WEIGHT = isImperial ? { Code: 'LBS', Description: 'Pounds' } : { Code: 'KGS', Description: 'Kilograms' };
  const UOM_DIM = isImperial ? { Code: 'IN', Description: 'Inches' } : { Code: 'CM', Description: 'Centimeters' };

  // UPS packaging-type codes: 02 customer-supplied, 03 tube, 21 UPS Express Box, 30 pallet.
  const PKG = { mine: '02', tube: '03', expressbox: '21', pallet: '30' };
  const Package = [];
  let totalWeight = 0;
  (p.packages || []).forEach((pk) => {
    const qty = Math.max(1, Math.floor(Number(pk.qty) || 1));
    const rawW = Number(pk.weight) || 1.0;
    const l = Number(pk.l) || 0, w = Number(pk.w) || 0, h = Number(pk.h) || 0;

    // Convert UI metric inputs (kg, cm) to imperial (lbs, in) if origin country requires it (e.g. US)
    const weightVal = isImperial ? Math.max(0.1, rawW * 2.20462262) : Math.max(0.1, rawW);
    const dimL = (l > 0) ? (isImperial ? Math.max(1, Math.round(l / 2.54)) : Math.max(1, Math.round(l))) : 0;
    const dimW = (w > 0) ? (isImperial ? Math.max(1, Math.round(w / 2.54)) : Math.max(1, Math.round(w))) : 0;
    const dimH = (h > 0) ? (isImperial ? Math.max(1, Math.round(h / 2.54)) : Math.max(1, Math.round(h))) : 0;

    const wStrVal = weightVal.toFixed(1);
    const one = {
      PackagingType: { Code: PKG[pk.packaging] || '02' },
      PackageWeight: { UnitOfMeasurement: UOM_WEIGHT, Weight: wStrVal }
    };
    if (dimL > 0 && dimW > 0 && dimH > 0) {
      one.Dimensions = {
        UnitOfMeasurement: UOM_DIM,
        Length: String(dimL),
        Width: String(dimW),
        Height: String(dimH)
      };
    }
    for (let i = 0; i < qty; i++) {
      Package.push(JSON.parse(JSON.stringify(one)));
      totalWeight += Number(wStrVal);
    }
  });
  if (!Package.length) {
    const fallbackW = isImperial ? '2.2' : '1.0';
    Package.push({ PackagingType: { Code: '02' }, PackageWeight: { UnitOfMeasurement: UOM_WEIGHT, Weight: fallbackW } });
    totalWeight = Number(fallbackW);
  }
  const ShipmentTotalWeight = { UnitOfMeasurement: UOM_WEIGHT, Weight: (Math.round(totalWeight * 10) / 10).toFixed(1) };

  // International shipments must declare the value of the goods (the "shipment contents
  // value"). UPS rejects the rate request without it (error 111549). Use the value the
  // form supplies; fall back to a nominal figure so a quote still returns.
  const goodsVal = num(p.value != null ? p.value : (p.goodsValue != null ? p.goodsValue : null));
  const invoiceTotal = (goodsVal != null && goodsVal > 0) ? goodsVal : 100;
  const invoiceCurrency = S(p.currency || 'GBP').toUpperCase();

  const shipmentObj = {
    Shipper: shipper, ShipTo: shipTo, ShipFrom: shipFrom,
    ShipmentRatingOptions: { NegotiatedRatesIndicator: 'Y' }, // account (negotiated) rates
    DeliveryTimeInformation: { PackageBillType: '03' }, // 03 = non-document (for time in transit)
    InvoiceLineTotal: { CurrencyCode: invoiceCurrency, MonetaryValue: String(invoiceTotal) },
    ShipmentTotalWeight,
    NumOfPieces: String(Package.length),
    Package,
  };

  return {
    RateRequest: {
      Request: { SubVersion: ver().replace(/^v/, ''), TransactionReference: { CustomerContext: 'MOOV ' + (p.mode || 'import') + ' quote' } },
      Shipment: shipmentObj,
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
  '431': 'Peak / Demand Surcharge',
  '432': 'Peak / Demand Surcharge',
  '433': 'Peak / Demand Surcharge',
  '434': 'Peak / Demand Surcharge',
  '435': 'Peak / Demand Surcharge',
  '436': 'Peak / Demand Surcharge',
  '437': 'Peak / Demand Surcharge',
  '438': 'Peak / Demand Surcharge',
  '439': 'Peak / Demand Surcharge',
  '441': 'Carbon Neutral Fee',
  '510': 'Lift Gate for Pickup',
  '511': 'Lift Gate for Delivery',
  '520': 'Oversize Pallet Surcharge',
  '573': 'Merchant Processing Fee',
};
const chgName = (c) => CHG[String(c)] || ('Accessorial ' + c);
const REMOTE = ['190', '195', '197', '199', '400', '401', '376'];
const isRemote = (c) => REMOTE.indexOf(String(c)) >= 0;

function breakdownOf(rs) {
  const neg = rs.NegotiatedRateCharges || null;
  const hasNeg = !!(neg && (neg.ItemizedCharges || neg.TotalCharge || neg.BaseServiceCharge || neg.TransportationCharges));
  
  // Extract shipment-level items
  const toArr = (x) => Array.isArray(x) ? x : (x ? [x] : []);
  const shpItems = toArr(hasNeg && neg.ItemizedCharges ? neg.ItemizedCharges : rs.ItemizedCharges);
  
  // Extract package-level items across all RatedPackage entries
  const pkgs = toArr(rs.RatedPackage);
  const pkgItems = [];
  pkgs.forEach((p) => {
    const pNeg = p.NegotiatedCharges || p.NegotiatedRateCharges || null;
    const pSrc = (hasNeg && pNeg && pNeg.ItemizedCharges) ? pNeg.ItemizedCharges : p.ItemizedCharges;
    pkgItems.push(...toArr(pSrc));
  });

  // Combine items: if a code is present at shipment level, use it; otherwise sum package-level items for that code
  const codeMap = new Map();
  shpItems.forEach((it) => {
    const code = String(it.Code || it.code || '');
    const amt = num(it.MonetaryValue || it.amt) || 0;
    if (code && amt > 0) {
      codeMap.set(code, (codeMap.get(code) || 0) + amt);
    }
  });

  pkgItems.forEach((it) => {
    const code = String(it.Code || it.code || '');
    const amt = num(it.MonetaryValue || it.amt) || 0;
    if (code && amt > 0 && !codeMap.has(code)) {
      // If not present at shipment level, accumulate from package level
      codeMap.set(code, (codeMap.get(code) || 0) + amt);
    }
  });

  let fuel = codeMap.get('375') || 0;
  const acc = [];
  codeMap.forEach((amt, code) => {
    if (code !== '375' && amt > 0) {
      acc.push({ code, name: chgName(code), amt: Math.round(amt * 100) / 100, remote: isRemote(code) });
    }
  });

  const getBase = (obj) => {
    if (!obj) return null;
    if (obj.BaseServiceCharge && obj.BaseServiceCharge.MonetaryValue != null) return num(obj.BaseServiceCharge.MonetaryValue);
    if (obj.TransportationCharges && obj.TransportationCharges.MonetaryValue != null) return num(obj.TransportationCharges.MonetaryValue);
    return null;
  };

  let negBase = getBase(neg);
  let pubBase = getBase(rs);

  // If base not on shipment, try summing packages
  if (negBase == null && hasNeg) {
    const sumPkgNegBase = pkgs.reduce((sum, p) => {
      const pNeg = p.NegotiatedCharges || p.NegotiatedRateCharges || null;
      const b = getBase(pNeg) || getBase(p);
      return b != null ? sum + b : sum;
    }, 0);
    if (sumPkgNegBase > 0) negBase = sumPkgNegBase;
  }
  if (pubBase == null) {
    const sumPkgPubBase = pkgs.reduce((sum, p) => {
      const b = getBase(p);
      return b != null ? sum + b : sum;
    }, 0);
    if (sumPkgPubBase > 0) pubBase = sumPkgPubBase;
  }

  const pubTotal = rs.TotalCharges ? num(rs.TotalCharges.MonetaryValue) : null;
  const negTotal = (neg && (neg.TotalCharge || neg.TotalCharges)) ? num((neg.TotalCharge || neg.TotalCharges).MonetaryValue) : null;
  const baseVal = hasNeg ? (negBase != null ? negBase : pubBase) : pubBase;

  return {
    base: baseVal != null ? Math.round(baseVal * 100) / 100 : null,
    pubBase: pubBase != null ? Math.round(pubBase * 100) / 100 : null,
    negBase: negBase != null ? Math.round(negBase * 100) / 100 : null,
    fuel: Math.round(fuel * 100) / 100,
    accessorials: acc,
    pubTotal,
    negTotal,
    negotiated: hasNeg,
  };
}

function parseRates(data, options = {}) {
  const rr = (data && data.RateResponse) || {};
  let list = rr.RatedShipment || [];
  if (!Array.isArray(list)) list = list ? [list] : [];
  const parsed = list.map((rs) => {
    const c = costOf(rs);
    const code = (rs.Service && rs.Service.Code) || '';
    const isSat = !!(
      (rs.TimeInTransit && rs.TimeInTransit.ServiceSummary && String(rs.TimeInTransit.ServiceSummary.SaturdayDelivery) === '1') ||
      (rs.NegotiatedRateCharges && Array.isArray(rs.NegotiatedRateCharges.ItemizedCharges) && rs.NegotiatedRateCharges.ItemizedCharges.some((i) => String(i.Code || i.code) === '300')) ||
      (rs.ItemizedCharges && Array.isArray(rs.ItemizedCharges) && rs.ItemizedCharges.some((i) => String(i.Code || i.code) === '300'))
    );
    return {
      code,
      name: svcName(code),
      isSaturday: isSat,
      cost: c.value,
      currency: c.currency,
      days: daysOf(rs),
      breakdown: breakdownOf(rs)
    };
  }).filter((s) => s.cost != null);

  if (options.includeSaturday) {
    return parsed.sort((a, b) => a.cost - b.cost);
  }

  // Deduplicate by service code: prefer standard weekday delivery (non-Saturday)
  const deduped = [];
  const seenCodes = new Set();
  parsed.forEach((s) => {
    if (!s.isSaturday && !seenCodes.has(s.code)) {
      seenCodes.add(s.code);
      deduped.push(s);
    }
  });
  // Fallback: if a service code was only returned with Saturday, include it
  parsed.forEach((s) => {
    if (!seenCodes.has(s.code)) {
      seenCodes.add(s.code);
      deduped.push(s);
    }
  });

  return deduped.sort((a, b) => a.cost - b.cost);
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

  // If Shoptimeintransit returns non-200, try standard /Shop endpoint and /Rate endpoint
  if (!res.ok) {
    try {
      const fallbackReq = JSON.parse(JSON.stringify(reqBody));
      if (fallbackReq.RateRequest && fallbackReq.RateRequest.Shipment) {
        delete fallbackReq.RateRequest.Shipment.DeliveryTimeInformation;
      }
      if (fallbackReq.RateRequest && fallbackReq.RateRequest.Request) {
        fallbackReq.RateRequest.Request.RequestOption = 'Shop';
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

      // Also try /Rate endpoint
      const resFallback2 = await fetch(base() + '/api/rating/' + ver() + '/Rate', {
        method: 'POST',
        headers,
        body: JSON.stringify(fallbackReq),
        signal: AbortSignal.timeout(6500),
      });
      if (resFallback2.ok) {
        text = await resFallback2.text();
        try { json = JSON.parse(text); } catch (_) {}
        return { ok: true, status: resFallback2.status, json, text };
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
    let errMsg = 'UPS Rating ' + r.status;
    if (r.json && r.json.response && r.json.response.errors && r.json.response.errors.length) {
      errMsg = r.json.response.errors.map((e) => e.message || e.code).join('; ');
    } else if (r.json && r.json.Error && r.json.Error.Description) {
      errMsg = r.json.Error.Description;
    } else if (r.text) {
      errMsg += ': ' + (r.text || '').slice(0, 400);
    }
    return {
      enabled: false,
      error: errMsg,
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

  let phone = String(p.phone || (p.sender && p.sender.phone) || (p.receiver && p.receiver.phone) || '').replace(/[^0-9+]/g, '');
  if (!phone || phone.length < 5) phone = '0000000000';
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

  let state = p.state || p.stateProvinceCode || '';
  if (!state && originCountry.toUpperCase() === 'US' && (p.postalCode || p.postcode)) {
    state = usZipToState(p.postalCode || p.postcode);
  } else if (!state && originCountry.toUpperCase() === 'CA' && (p.postalCode || p.postcode)) {
    state = caPostcodeToProvince(p.postalCode || p.postcode);
  }

  const isImperial = isImperialCountry(originCountry);
  const rawWeight = Math.max(0.5, Number(p.totalWeight || p.weight) || (parcels * 1.5));
  const finalWeight = isImperial ? Math.max(1.0, rawWeight * 2.20462262) : rawWeight;
  const pickupUom = isImperial ? 'LBS' : 'KGS';

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
        ...(state ? { StateProvinceCode: String(state).trim().toUpperCase() } : {}),
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
        Weight: finalWeight.toFixed(1),
        UnitOfMeasurement: pickupUom,
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

  const senderAddr = addressOf(sender, 'US');
  const receiverAddr = addressOf(receiver, 'GB');
  const originCountry = (senderAddr.Address && senderAddr.Address.CountryCode) || (sender && sender.country) || 'US';
  // In UPS Shipping API (/api/shipments/v1/ship), package weights and dimensions are validated
  // against the Shipper's account country (GB = Metric: KGS & CM).
  const isImperial = !!p.forceImperial;
  const UOM_WEIGHT = isImperial ? { Code: 'LBS', Description: 'Pounds' } : { Code: 'KGS', Description: 'Kilograms' };
  const UOM_DIM = isImperial ? { Code: 'IN', Description: 'Inches' } : { Code: 'CM', Description: 'Centimeters' };

  const packagesArray = [];
  pkgs.forEach((pkg) => {
    const q = Math.max(1, parseInt(pkg.qty, 10) || 1);
    const rawW = Math.max(0.1, Number(pkg.weight) || 1);
    const rawL = Math.max(1, Number(pkg.l) || 10);
    const rawW_dim = Math.max(1, Number(pkg.w) || 10);
    const rawH = Math.max(1, Number(pkg.h) || 10);

    const wt = isImperial ? Math.max(0.1, rawW * 2.20462262) : rawW;
    const l = isImperial ? Math.max(1, Math.round(rawL / 2.54)) : Math.round(rawL);
    const w = isImperial ? Math.max(1, Math.round(rawW_dim / 2.54)) : Math.round(rawW_dim);
    const h = isImperial ? Math.max(1, Math.round(rawH / 2.54)) : Math.round(rawH);

    for (let i = 0; i < q; i++) {
      packagesArray.push({
        Description: S(pkg.description || p.description || 'Commercial Goods').slice(0, 35),
        Packaging: { Code: '02', Description: 'Customer Supplied Package' },
        Dimensions: {
          UnitOfMeasurement: UOM_DIM,
          Length: String(l),
          Width: String(w),
          Height: String(h),
        },
        PackageWeight: {
          UnitOfMeasurement: UOM_WEIGHT,
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
  const ukEoriNumber = S(p.ukEori || p.importerEori || (receiver && (receiver.eoriNumber || receiver.eori)) || '').slice(0, 18);
  const senderTaxId = S(p.senderTaxId || p.senderVat || (sender && (sender.taxId || sender.vatNumber)) || '').slice(0, 18);

  const shipperObj = {
    Name: 'MOOV Logistics Solutions Limited',
    AttentionName: 'Customer Success Team',
    Phone: { Number: '01133224100' },
    ShipperNumber: acct,
    Address: {
      AddressLine: ['Units 3-5 Kettlebridge Road', 'Parkway Link'],
      City: 'Sheffield',
      PostalCode: 'S9 3AJ',
      CountryCode: 'GB',
    },
  };

  const shipmentCharges = [
    {
      Type: '01', // Transportation
      BillShipper: {
        AccountNumber: acct,
      },
    },
  ];

  const dutyAcct = String(p.dutyAccountNumber || p.thirdPartyAccountNumber || '').trim();
  const dutyPostal = String(p.dutyPostalCode || p.thirdPartyPostalCode || '').trim();
  const dutyCountry = String(p.dutyCountryCode || p.thirdPartyCountryCode || 'GB').trim().toUpperCase();

  if ((p.dutyPaymentType === 'thirdParty' || p.dutyPaymentType === 'tp') && dutyAcct) {
    const btp = {
      AccountNumber: dutyAcct,
    };
    if (dutyPostal || dutyCountry) {
      btp.Address = {};
      if (dutyPostal) btp.Address.PostalCode = dutyPostal;
      if (dutyCountry) btp.Address.CountryCode = dutyCountry;
    }
    shipmentCharges.push({
      Type: '02', // Duties and Taxes
      BillThirdParty: btp,
    });
  } else {
    // Standard default: Duties & Taxes billed to MOOV shipper account (door-to-door DDP)
    shipmentCharges.push({
      Type: '02', // Duties and Taxes
      BillShipper: {
        AccountNumber: acct,
      },
    });
  }

  const paymentInfo = {
    ShipmentCharge: shipmentCharges,
  };

  const incoTerms = String(p.incoterms || p.termsOfSale || 'DDP').trim().toUpperCase();

  const shipmentObj = {
    Description: S(p.description || 'Commercial Goods / International Express').slice(0, 50),
    Shipper: shipperObj,
    ShipTo: {
      Name: S(receiver.company || receiver.name || 'Recipient').slice(0, 35),
      AttentionName: S(receiver.name || receiver.company || 'Recipient').slice(0, 35),
      TaxIdentificationNumber: ukEoriNumber,
      Phone: { Number: S(receiver.phone || '').replace(/[^0-9+ ]/g, '').slice(0, 15) },
      EMailAddress: S(receiver.email || '').slice(0, 50),
      Address: receiverAddr.Address,
    },
    ShipFrom: {
      Name: S(sender.company || sender.name || 'Sender').slice(0, 35),
      AttentionName: S(sender.name || sender.company || 'Sender').slice(0, 35),
      ...(senderTaxId ? { TaxIdentificationNumber: senderTaxId } : {}),
      Phone: { Number: S(sender.phone || '').replace(/[^0-9+ ]/g, '').slice(0, 15) },
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

  const isReturn = !!(p.isReturn || p.mode === 'return' || p.mode === 'intl_return');
  const retServiceType = p.returnServiceType || p.returnService;
  const isCrossBorder = (originCountry || '').toUpperCase() !== ((receiverAddr.Address && receiverAddr.Address.CountryCode) || 'GB').toUpperCase();

  let retCode = p.returnServiceCode;
  if (!retCode) {
    if (retServiceType === 'electronic_label' || retServiceType === 'erl' || retServiceType === '8') {
      retCode = '8'; // UPS Electronic Return Label (ERL - email link)
    } else if (retServiceType === 'driver_brings_label' || retServiceType === '1_attempt' || retServiceType === '3') {
      retCode = '3'; // UPS Return Service 1-Attempt (domestic/EU only)
    } else if (retServiceType === '3_attempts' || retServiceType === '5') {
      retCode = '5'; // UPS Return Service 3-Attempt (domestic/EU only)
    } else if (isCrossBorder || isReturn) {
      // For cross-border returns (e.g. US -> GB billed to UK account), UPS requires Code 9 (Print Return Label)
      // to permit ShipFrom country (US) to differ from Shipper account country (GB).
      retCode = '9';
    }
  }

  if (retCode && retCode !== 'NONE') {
    const descMap = {
      '2': 'UPS Print and Mail',
      '3': 'UPS Return Service 1-Attempt (Driver Brings Label)',
      '5': 'UPS Return Service 3-Attempt',
      '8': 'UPS Electronic Return Label',
      '9': 'UPS Print Return Label',
    };
    shipmentObj.ReturnService = {
      Code: String(retCode),
      Description: descMap[String(retCode)] || 'UPS Return Service',
    };
  }

  const reasonForExport = String(p.reasonForExport || (isReturn ? 'RETURN' : 'SALE')).toUpperCase();

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

  const isReturn = !!(p.isReturn || p.mode === 'return' || p.mode === 'intl_return');
  const defaultOrigin = toIso(p.originCountry || p.origin || (isReturn ? 'PL' : ((senderAddr.Address && senderAddr.Address.CountryCode) || (sender && sender.country) || 'GB')));
  const rawItems = Array.isArray(p.lineItems) && p.lineItems.length ? p.lineItems : (Array.isArray(p.items) && p.items.length ? p.items : []);
  const sourceItems = rawItems.length ? rawItems : [
    {
      description: S(p.description || 'Returned Merchandise').slice(0, 35),
      qty: 1,
      unitValue: Number(p.goodsValue || p.value || 50),
      hsCode: '62046200',
      sku: 'RET-01',
      originCountry: defaultOrigin,
    }
  ];

  const productList = sourceItems.map((item, idx) => {
    let rawDesc = item.description || item.name || 'Returned Merchandise';
    if (isReturn && !String(rawDesc).toUpperCase().includes('61 23') && !String(rawDesc).toUpperCase().includes('CPC')) {
      rawDesc = String(rawDesc).slice(0, 20) + ' (CPC 61 23 F01)';
    }
    const descStr = S(rawDesc).slice(0, 35) || 'Merchandise';
    const orig = toIso(item.originCountry || item.origin || defaultOrigin);
    const rawHsDigits = S(item.hsCode || item.tariffCode || '62046200').replace(/[^0-9]/g, '');
    const cleanHs = rawHsDigits.length === 6 ? (rawHsDigits + '00') : (rawHsDigits.slice(0, 10) || '62046200');
    return {
      Description: [descStr],
      Unit: {
        Number: String(Math.max(1, parseInt(item.qty || item.quantity, 10) || 1)),
        Value: String(Number(item.unitValue || item.value || 10).toFixed(2)),
        UnitOfMeasurement: {
          Code: 'PCS',
          Description: 'Pieces',
        },
      },
      CommodityCode: cleanHs,
      PartNumber: S(item.sku || item.partNumber || ('RET-' + (idx + 1))).slice(0, 35),
      OriginCountryCode: orig,
      JointFirmRegistrationIndicator: '',
    };
  });

  const invoiceNumber = S(p.invoiceNumber || p.originalOrderRef || ('RET-' + Date.now().toString().slice(-6)));
  const purchaseOrderNumber = S(p.reference || p.originalOrderRef || ('MOOV-' + Date.now().toString().slice(-6)));
  const rgrDeclaration = 'Returned merchandise being returned to the United Kingdom for refund/repair. Relief from customs import duty and VAT claimed under Returned Goods Relief (CPC 61 23 F01).';
  const rgrComments = 'RETURNED GOODS RELIEF CLAIMED UNDER CPC 61 23 F01 - UK GOODS RETURNED UNALTERED';

  if (forms.length > 0) {
    const intlForms = {
      FormType: ['01'],
      UserCreatedForm: forms,
      ReasonForExport: isReturn ? 'RETURN' : reasonForExport,
      TermsOfSale: incoTerms,
      InvoiceNumber: invoiceNumber,
      InvoiceDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      PurchaseOrderNumber: purchaseOrderNumber,
      CurrencyCode: p.currency || 'GBP',
      DeclarationStatement: isReturn ? rgrDeclaration : (p.declarationStatement || 'I hereby declare that the information in this invoice is true and correct.'),
      Comments: isReturn ? rgrComments : 'Commercial Invoices provided for customs clearance',
      Contacts: {
        SoldTo: {
          Name: S(receiver.company || receiver.name || 'Importer').slice(0, 35),
          AttentionName: S(receiver.name || receiver.company || 'Importer').slice(0, 35),
          TaxIdentificationNumber: ukEoriNumber,
          Phone: { Number: S(receiver.phone || '').replace(/[^0-9+ ]/g, '').slice(0, 15) },
          Address: receiverAddr.Address,
        },
      },
    };
    if (productList.length > 0) {
      intlForms.Product = productList;
    }
    shipmentObj.ShipmentServiceOptions = {
      InternationalForms: intlForms,
    };
  } else if (isImport || isReturn || ((senderAddr.Address.CountryCode || '').toUpperCase() !== (receiverAddr.Address.CountryCode || '').toUpperCase())) {
    // Cross-border shipment or international return: build full electronic commercial invoice
    const intlForms = {
      FormType: ['01'],
      ReasonForExport: isReturn ? 'RETURN' : reasonForExport,
      TermsOfSale: incoTerms,
      InvoiceNumber: invoiceNumber,
      InvoiceDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      PurchaseOrderNumber: purchaseOrderNumber,
      CurrencyCode: p.currency || 'GBP',
      DeclarationStatement: isReturn ? rgrDeclaration : (p.declarationStatement || 'I hereby declare that the information in this invoice is true and correct.'),
      Comments: isReturn ? rgrComments : 'Commercial Invoices provided for customs clearance',
      Contacts: {
        SoldTo: {
          Name: S(receiver.company || receiver.name || 'Importer').slice(0, 35),
          AttentionName: S(receiver.name || receiver.company || 'Importer').slice(0, 35),
          TaxIdentificationNumber: ukEoriNumber,
          Phone: { Number: S(receiver.phone || '').replace(/[^0-9+ ]/g, '').slice(0, 15) },
          Address: receiverAddr.Address,
        },
      },
    };
    if (productList.length > 0) {
      intlForms.Product = productList;
    }
    shipmentObj.ShipmentServiceOptions = {
      InternationalForms: intlForms,
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

async function bookShipment(payload, retryCount = 0) {
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

    // Auto-retry with inverted measurement system if UPS rejected units
    if (retryCount === 0 && (errMsg.toLowerCase().includes('measurement system') || errMsg.toLowerCase().includes('unit of measurement'))) {
      console.warn('[bookShipment] Retrying booking with toggled measurement system...');
      return bookShipment({ ...payload, forceImperial: !payload.forceImperial }, 1);
    }

    // Auto-retry without ReturnService container if accessory option was rejected
    if (retryCount < 2 && (errMsg.toLowerCase().includes('accessory option') || errMsg.toLowerCase().includes('returnservice') || errMsg.toLowerCase().includes('return service'))) {
      const nextCode = 'NONE';
      console.warn('[bookShipment] Retrying booking with returnServiceCode:', nextCode);
      return bookShipment({ ...payload, returnServiceCode: nextCode }, retryCount + 1);
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

function formatUpsDateTime(d, t) {
  if (!d) return { rawDate: '', rawTime: '', dateFormatted: '', timeFormatted: '', timestamp: '', shortTimestamp: '' };
  let y = '', m = '', day = '';
  const dStr = String(d).replace(/[^\d]/g, '');
  if (dStr.length === 8) {
    y = dStr.slice(0, 4);
    m = dStr.slice(4, 6);
    day = dStr.slice(6, 8);
  } else if (String(d).includes('-')) {
    const parts = String(d).split('-');
    if (parts.length === 3) {
      y = parts[0]; m = parts[1]; day = parts[2];
    }
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mIdx = parseInt(m, 10) - 1;
  const monthName = (mIdx >= 0 && mIdx < 12) ? MONTHS[mIdx] : m;

  let timeStr = '';
  if (t) {
    const tClean = String(t).replace(/[^\d]/g, '');
    if (tClean.length >= 4) {
      const hh = tClean.slice(0, 2);
      const mm = tClean.slice(2, 4);
      timeStr = hh + ':' + mm;
    } else if (String(t).includes(':')) {
      const parts = String(t).split(':');
      timeStr = parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
    }
  }

  const dateFormatted = (day && monthName && y) ? `${parseInt(day, 10)} ${monthName} ${y}` : String(d);
  const fullTimestamp = timeStr ? `${dateFormatted}, ${timeStr}` : dateFormatted;
  const shortTimestamp = timeStr ? `${parseInt(day, 10) || ''} ${monthName || ''}, ${timeStr}` : dateFormatted;

  return {
    rawDate: d,
    rawTime: t,
    dateFormatted,
    timeFormatted: timeStr,
    timestamp: fullTimestamp,
    shortTimestamp,
  };
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

  // Check if collected / picked up (strictly excluding manifest & label-created events)
  const isManifestStatus = (statusDescription || '').toLowerCase().includes('order processed') ||
    (statusDescription || '').toLowerCase().includes('ready for ups') ||
    (statusDescription || '').toLowerCase().includes('label created') ||
    (statusDescription || '').toLowerCase().includes('shipper created');

  const isCollected = !isManifestStatus && (activities.some((a) => {
    const desc = ((a.status && a.status.description) || (a.activityScan && a.activityScan.description) || '').toLowerCase();
    const type = ((a.status && a.status.type) || '').toLowerCase();
    const isManifestAct = desc.includes('order processed') || desc.includes('ready for ups') || desc.includes('label created') || desc.includes('shipper created') || desc.includes('electronic billing');
    if (isManifestAct) return false;
    return desc.includes('pickup') || desc.includes('picked up') || desc.includes('collection') || desc.includes('collected') || desc.includes('origin scan') || desc.includes('drop-off') || (type === 'p' && !desc.includes('ready')) || type === 'or';
  }) || (['OR', 'DP'].includes(statusCode)));

  const isDelivered = statusCode === 'D' || statusCode === 'DELIVERED' || statusDescription.toLowerCase().includes('delivered') || !!deliveryInfo.receivedBy;

  // Normalise raw UPS activity stream into standard 7-stage courier journey
  const stageInfo = normalizeTrackingStages({ statusCode, statusDescription, isCollected, isDelivered, activities, deliveryInfo });

  // Map activities with structured date and time formatting
  const mapActivities = (acts) => {
    return (acts || []).map((a) => {
      const loc = (a.location && a.location.address ? ([a.location.address.city, a.location.address.countryCode].filter(Boolean).join(', ')) : '');
      const stat = (a.status && a.status.description) || (a.activityScan && a.activityScan.description) || statusDescription || 'Scan Event';
      const code = (a.status && a.status.code) || (a.activityScan && a.activityScan.type) || '';
      const dt = formatUpsDateTime(a.date, a.time);
      return {
        date: a.date,
        time: a.time,
        dateFormatted: dt.dateFormatted,
        timeFormatted: dt.timeFormatted,
        timestamp: dt.timestamp,
        shortTimestamp: dt.shortTimestamp,
        location: loc,
        status: stat,
        code: code,
      };
    });
  };

  const formattedActivities = mapActivities(activities);

  // Map all parcels piece-by-piece
  const parcels = pkgList.map((pkg, idx) => {
    const pStatus = pkg.currentStatus || {};
    const pCode = pStatus.code || statusCode;
    const pDesc = pStatus.description || statusDescription;
    const pActs = Array.isArray(pkg.activity) ? pkg.activity : (pkg.activity ? [pkg.activity] : []);
    const pDel = pkg.deliveryInformation || deliveryInfo;
    const pActsFormatted = mapActivities(pActs.length ? pActs : activities);
    const pIsDelivered = pCode === 'D' || pCode === 'DELIVERED' || pDesc.toLowerCase().includes('delivered') || !!(pDel && pDel.receivedBy);
    const pIsCollected = isCollected || pActsFormatted.some((a) => {
      const st = a.status.toLowerCase();
      return !st.includes('ready') && !st.includes('label created') && (st.includes('pickup') || st.includes('collected') || st.includes('origin scan'));
    });
    const pStageInfo = normalizeTrackingStages({ statusCode: pCode, statusDescription: pDesc, isCollected: pIsCollected, isDelivered: pIsDelivered, activities: pActs.length ? pActs : activities, deliveryInfo: pDel });
    const latestScan = pActsFormatted[0] || null;

    return {
      parcelIndex: idx + 1,
      totalParcels: pkgList.length,
      trackingNumber: pkg.trackingNumber || trk,
      weight: pkg.weight && pkg.weight.weight ? Number(pkg.weight.weight) : null,
      statusCode: pCode,
      statusDescription: pStageInfo.latestStatusText || pDesc || 'Active',
      isCollected: pIsCollected,
      isDelivered: pIsDelivered,
      stage: pStageInfo.stage,
      stageName: pStageInfo.stageName,
      stageDesc: pStageInfo.stageDesc,
      stageTimestamps: pStageInfo.stageTimestamps,
      lastLocation: pStageInfo.lastLocation,
      lastScan: latestScan ? {
        timestamp: latestScan.timestamp,
        shortTimestamp: latestScan.shortTimestamp,
        location: latestScan.location,
        status: latestScan.status,
      } : null,
      activities: pActsFormatted,
      delivery: {
        receivedBy: (pDel && pDel.receivedBy) || (deliveryInfo && deliveryInfo.receivedBy) || null,
        location: (pDel && pDel.location) || (deliveryInfo && deliveryInfo.location) || null,
        hasSignature: !!((pDel && pDel.signature && pDel.signature.content) || (deliveryInfo && deliveryInfo.signature && deliveryInfo.signature.content)),
        signatureBase64: (pDel && pDel.signature && pDel.signature.content) || (deliveryInfo && deliveryInfo.signature && deliveryInfo.signature.content) || null,
        hasPOD: !!((pDel && pDel.pod && pDel.pod.content) || (deliveryInfo && deliveryInfo.pod && deliveryInfo.pod.content)),
        podBase64: (pDel && pDel.pod && pDel.pod.content) || (deliveryInfo && deliveryInfo.pod && deliveryInfo.pod.content) || null,
      },
    };
  });

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
    stageTimestamps: stageInfo.stageTimestamps,
    lastLocation: stageInfo.lastLocation,
    latestScan: formattedActivities[0] ? {
      timestamp: formattedActivities[0].timestamp,
      shortTimestamp: formattedActivities[0].shortTimestamp,
      location: formattedActivities[0].location,
      status: formattedActivities[0].status,
    } : null,
    activities: formattedActivities,
    parcels,
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

// Deterministic normalization engine for UPS tracking milestones into 7 operational stages with scan timestamps
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

  const stageTimestamps = {};

  if (isDelivered || statusCode === 'D' || (deliveryInfo && deliveryInfo.receivedBy)) {
    const delTime = deliveryInfo && (deliveryInfo.date || deliveryInfo.deliveryDate) ? formatUpsDateTime(deliveryInfo.date || deliveryInfo.deliveryDate, deliveryInfo.time || deliveryInfo.deliveryTime) : null;
    stageTimestamps[7] = {
      timestamp: delTime ? delTime.timestamp : '',
      shortTimestamp: delTime ? delTime.shortTimestamp : '',
      location: (deliveryInfo && deliveryInfo.location) || 'Destination',
      statusText: 'Signed by ' + ((deliveryInfo && deliveryInfo.receivedBy) || 'Recipient'),
    };
    return {
      stage: 7,
      stageName: 'Delivered',
      stageDesc: 'Signed & Complete',
      stageTimestamps,
      lastLocation: (deliveryInfo && deliveryInfo.location) || 'Destination',
      latestStatusText: 'Delivered' + ((deliveryInfo && deliveryInfo.receivedBy) ? (' to ' + deliveryInfo.receivedBy) : ''),
    };
  }

  let highestStage = isCollected ? 1 : 0;
  let lastLoc = '';
  let latestDesc = statusDescription || '';

  // Reverse chronological or chronological pass over all scan activities
  if (Array.isArray(activities) && activities.length > 0) {
    activities.forEach((act, idx) => {
      const desc = ((act.status && act.status.description) || (act.activityScan && act.activityScan.description) || '').toLowerCase();
      const code = ((act.status && act.status.code) || (act.activityScan && act.activityScan.type) || '').toUpperCase();
      const loc = (act.location && act.location.address)
        ? [act.location.address.city, act.location.address.countryCode].filter(Boolean).join(', ')
        : '';
      const cCode = (act.location && act.location.address && act.location.address.countryCode || '').toUpperCase();
      const city = (act.location && act.location.address && act.location.address.city || '').toLowerCase();
      const dt = formatUpsDateTime(act.date, act.time);

      if (idx === 0 && loc) lastLoc = loc;
      if (idx === 0 && desc) latestDesc = (act.status && act.status.description) || desc;

      const recordStageScan = (stNum) => {
        if (!stageTimestamps[stNum]) {
          stageTimestamps[stNum] = {
            timestamp: dt.timestamp,
            shortTimestamp: dt.shortTimestamp,
            location: loc,
            statusText: (act.status && act.status.description) || (act.activityScan && act.activityScan.description) || desc,
          };
        }
      };

      const isManifest = desc.includes('order processed') || desc.includes('ready for ups') || desc.includes('label created') || desc.includes('shipper created') || desc.includes('electronic billing') || desc.includes('shipment information received') || code === 'MP' || code === 'M';

      // Pre-collection manifest notifications do not advance physical transit stages
      if (isManifest) {
        return;
      }

      const isUkLoc = cCode === 'GB' || cCode === 'UK' || loc.toLowerCase().includes('united kingdom') ||
        city.includes('castle donington') || city.includes('stanford le hope') || city.includes('tamworth') ||
        city.includes('east midlands') || city.includes('dartford') || city.includes('barking') ||
        city.includes('birmingham') || city.includes('nuneaton') || city.includes('london') ||
        city.includes('feltham') || city.includes('luton') || city.includes('manchester') ||
        city.includes('leeds') || city.includes('bristol') || city.includes('glasgow') ||
        desc.includes('castle donington') || desc.includes('stanford le hope');

      // Stage 6: Out for delivery
      if (code === 'OF' || code === 'OD' || desc.includes('out for delivery') || desc.includes('loaded on delivery') || desc.includes('on vehicle for delivery')) {
        if (highestStage < 6) highestStage = 6;
        recordStageScan(6);
      }
      // Stage 5: At destination UK Depot / Hub (any physical scan once physically in the UK / destination country)
      else if (
        (isUkLoc && (isCollected || highestStage >= 1)) ||
        desc.includes('destination scan') || desc.includes('import scan') ||
        ((desc.includes('arrival scan') || desc.includes('warehouse scan') || desc.includes('hub scan') || desc.includes('processing at facility')) && (cCode === 'GB' || isUkLoc) && (isCollected || highestStage >= 1))
      ) {
        if (highestStage < 5) highestStage = 5;
        recordStageScan(5);
      }
      // Stage 4: Cross-border transit / export customs released / international transit
      else if (desc.includes('customs') || desc.includes('international') || desc.includes('cross-border') || desc.includes('in transit') || desc.includes('transit') || desc.includes('cleared customs') || desc.includes('carrier processing')) {
        if (highestStage < 4) highestStage = 4;
        recordStageScan(4);
      }
      // Stage 3: At Export Gateway / Hub (e.g. Cologne, Roissy, Milan, Origin Hub)
      else if (desc.includes('export scan') || desc.includes('hub') || desc.includes('gateway') || desc.includes('arrival scan') || desc.includes('origin hub') || desc.includes('facility') || code === 'AR' || code === 'HS') {
        if (highestStage < 3) highestStage = 3;
        recordStageScan(3);
      }
      // Stage 2: Departure from origin facility / moving in origin transit
      else if (desc.includes('departure scan') || desc.includes('departed from facility') || desc.includes('origin departure') || code === 'DP') {
        if (highestStage < 2) highestStage = 2;
        recordStageScan(2);
      }
      // Stage 1: Collected / Picked up / Origin scan
      else if (desc.includes('pickup') || desc.includes('picked up') || desc.includes('collection') || desc.includes('collected') || desc.includes('origin scan') || desc.includes('drop-off') || code === 'P' || code === 'OR') {
        if (highestStage < 1) highestStage = 1;
        recordStageScan(1);
      }
    });
  }

  // Fallback if status code or description indicates progress
  const sDescLow = (statusDescription || '').toLowerCase();
  const isManifestDesc = sDescLow.includes('order processed') || sDescLow.includes('ready for ups') || sDescLow.includes('label created') || sDescLow.includes('shipper created');
  if (highestStage === 0 && !isManifestDesc) {
    if (sDescLow.includes('out for delivery')) highestStage = 6;
    else if (sDescLow.includes('hub') || sDescLow.includes('transit')) highestStage = 3;
    else if (isCollected) highestStage = 1;
  }

  const stageObj = STAGES.find((s) => s.stage === highestStage) || { stage: 0, name: 'Booked', desc: 'Awaiting Collection' };
  return {
    stage: highestStage,
    stageName: highestStage === 0 ? 'Booked' : stageObj.name,
    stageDesc: highestStage === 0 ? 'Awaiting Collection' : stageObj.desc,
    stageTimestamps,
    lastLocation: lastLoc,
    latestStatusText: latestDesc || (highestStage === 0 ? 'Booked (Awaiting Collection)' : stageObj.name),
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
  bookShipment, buildShipmentRequest, voidShipment, trackShipment, uploadPaperlessDocument,
  normalizeTrackingStages, svcName, configured
};
