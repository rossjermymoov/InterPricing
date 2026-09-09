const fs = require('fs');
const path = require('path');
const { nameToIso } = require('./countries');

const EAS_PATH = path.join(__dirname, 'eas_lookup.json');
let easData = null;

function loadData() {
  if (easData) return easData;
  try {
    if (fs.existsSync(EAS_PATH)) {
      easData = JSON.parse(fs.readFileSync(EAS_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('[surcharges] Failed to load eas_lookup.json:', e.message);
  }
  return easData || {};
}

const TYPE_NAMES = {
  1: 'Delivery Area Surcharge',
  2: 'Delivery Area Surcharge (Extended)',
  3: 'Extended Area Surcharge',
  4: 'Remote Area Surcharge',
  5: 'Remote Area Surcharge (Extended)',
};

const TYPE_CODES = {
  1: '190',
  2: '195',
  3: '195',
  4: '197',
  5: '199',
};

// Clean and normalize postal codes for range comparison
function normalizePc(pc, iso) {
  if (!pc) return '';
  const s = String(pc).trim().toUpperCase();
  if (iso === 'US') {
    const m = s.match(/^\d{5}/);
    return m ? m[0] : s.replace(/[^\d]/g, '').slice(0, 5).padStart(5, '0');
  }
  if (iso === 'CA') {
    return s.replace(/[^A-Z0-9]/g, '');
  }
  if (iso === 'GB') {
    return s.replace(/\s+/g, ' ');
  }
  return s;
}

/**
 * Checks if a target postal code / city matches a rule range [low, high, typeId, city]
 */
function matchRule(normTarget, rawTarget, cityTarget, rule, iso) {
  const [low, high, typeId, ruleCity] = rule;

  // City-only check if low is empty
  if (!low && !high && ruleCity && cityTarget) {
    return cityTarget.toLowerCase().includes(ruleCity.toLowerCase());
  }

  if (iso === 'US') {
    const lowNum = parseInt(low, 10);
    const highNum = parseInt(high, 10);
    const targetNum = parseInt(normTarget, 10);
    if (!isNaN(lowNum) && !isNaN(highNum) && !isNaN(targetNum)) {
      return targetNum >= lowNum && targetNum <= highNum;
    }
  }

  if (iso === 'CA') {
    const cleanLow = low.replace(/[^A-Z0-9]/g, '');
    const cleanHigh = high.replace(/[^A-Z0-9]/g, '');
    return normTarget >= cleanLow && normTarget <= cleanHigh;
  }

  if (iso === 'GB') {
    const outcode = rawTarget.split(' ')[0].toUpperCase();
    if (low === high) {
      if (rawTarget.toUpperCase().startsWith(low) || outcode === low || normTarget.startsWith(low)) return true;
    }
    if (outcode >= low && outcode <= high) return true;
    if (normTarget >= low && normTarget <= high) return true;
    return false;
  }

  const lowNum = parseFloat(low);
  const highNum = parseFloat(high);
  const targetNum = parseFloat(normTarget);
  if (!isNaN(lowNum) && !isNaN(highNum) && !isNaN(targetNum)) {
    return targetNum >= lowNum && targetNum <= highNum;
  }

  return normTarget >= low && normTarget <= high;
}

/**
 * Look up destination surcharge from official UPS EAS dataset.
 * Returns null if standard/urban, or an object with surcharge details.
 */
function lookupSurcharge({ country, postcode, city, weight = 1, qty = 1 }) {
  const data = loadData();
  if (!country) return null;
  const iso = (nameToIso(country) || (/^[A-Za-z]{2}$/.test(country) ? String(country).toUpperCase() : '')).toUpperCase();
  if (!iso || !data[iso]) return null;

  const rawPc = String(postcode || '').trim();
  const cityStr = String(city || '').trim();
  if (!rawPc && !cityStr) return null;

  const normPc = normalizePc(rawPc, iso);
  const rules = data[iso];

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (matchRule(normPc, rawPc, cityStr, rule, iso)) {
      const typeId = rule[2];
      const name = TYPE_NAMES[typeId] || 'Remote Area Surcharge';
      const code = TYPE_CODES[typeId] || '197';
      const numWeight = Math.max(1, Number(weight) || 1);
      const numQty = Math.max(1, Number(qty) || 1);

      let amt = 0;
      if (typeId === 1) {
        amt = 3.50 * numQty;
      } else if (typeId === 2) {
        amt = 4.50 * numQty;
      } else if (typeId === 3) {
        amt = Math.max(20.00 * numQty, Math.round(numWeight * 0.45 * 100) / 100);
      } else if (typeId === 4 || typeId === 5) {
        amt = Math.max(24.00 * numQty, Math.round(numWeight * 0.50 * 100) / 100);
      }

      return {
        matched: true,
        typeId,
        name,
        code,
        amt: Math.round(amt * 100) / 100,
        remote: true,
      };
    }
  }

  return null;
}

// Time-based Peak Demand & Surge Emergency Fee constants
const SURGE_START_DATE = '2026-09-20T00:00:00Z';
const SURGE_END_DATE = '2027-02-06T23:59:59Z';

function isSurgePeriod(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const start = new Date(SURGE_START_DATE);
  const end = new Date(SURGE_END_DATE);
  return d >= start && d <= end;
}

// Demand Surcharge adjusted base prices (in GBP) before customer discount is applied
const DEMAND_SURCHARGE_LIST_RATES = {
  addlHandling: 7.25,
  largePackage: 68.95,
  overMax: 439.90,
};

function getDemandSurcharges(dateInput) {
  const active = isSurgePeriod(dateInput);
  return {
    active,
    startDate: '2026-09-20',
    endDate: '2027-02-06',
    formattedRange: '20 September 2026 – 6 February 2027',
    rates: DEMAND_SURCHARGE_LIST_RATES,
  };
}

/**
 * Calculates the UPS Surge Emergency Fee
 * - Domestic residential (Standard, Express, Express Saver, Express Plus): £0.48 / package
 *   (In Italy IT, applies to both residential and commercial)
 * - Standard residential worldwide & transborder: £0.13 / kg (billable weight)
 * - Applicable air services: £0.13 - £0.48 / unit
 */
function calculateSurgeEmergencyFee({ country, isDomestic = false, isResidential = false, weight = 1, qty = 1, serviceKey = '', date = new Date() } = {}) {
  if (!isSurgePeriod(date)) return null;

  const iso = (nameToIso(country) || (/^[A-Za-z]{2}$/.test(country) ? String(country).toUpperCase() : '')).toUpperCase();
  const numWeight = Math.max(1, Number(weight) || 1);
  const numQty = Math.max(1, Number(qty) || 1);
  const svc = String(serviceKey || '').toLowerCase();

  // Italy exception: applies to residential AND commercial
  const isItDomestic = (iso === 'IT' && isDomestic);
  const appliesResidential = isResidential || isItDomestic;

  if (!appliesResidential) return null;

  let feeAmount = 0;
  let calculationNote = '';

  if (isDomestic || isItDomestic) {
    // Domestic: £0.48 per package
    feeAmount = Math.round(0.48 * numQty * 100) / 100;
    calculationNote = '£0.48 per package (Domestic)';
  } else {
    // International / Transborder:
    // Standard service: £0.13 per kg
    // Air service (ux, ue, etc.): £0.13 / kg or per unit
    const ratePerKg = 0.13;
    feeAmount = Math.round(ratePerKg * numWeight * 100) / 100;
    calculationNote = '£0.13/kg billable weight';
  }

  if (feeAmount <= 0) return null;

  return {
    code: '430',
    name: 'Surge Emergency Fee',
    amt: feeAmount,
    costAmt: feeAmount,
    note: calculationNote,
    fuelable: true,
    surge: true,
  };
}

module.exports = {
  lookupSurcharge,
  loadData,
  TYPE_NAMES,
  TYPE_CODES,
  SURGE_START_DATE,
  SURGE_END_DATE,
  isSurgePeriod,
  getDemandSurcharges,
  calculateSurgeEmergencyFee,
};

