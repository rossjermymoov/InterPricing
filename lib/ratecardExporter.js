// lib/ratecardExporter.js
// Generates professional, multi-tab customer rate card Excel (.xlsx) workbooks
// with weight bands (every 0.5 kg), zones, surcharges schedule, and country zone guide.

const fs = require('fs');
const path = require('path');
const XLSX = require('../public/xlsx.full.min.js');
const { SERVICES } = require('../pricing');
const { nameToIso, countryList } = require('../countries');

// Load cached live rates if available
let liveExpressRates = null;
let liveStandardRates = null;

try {
  const pExp = path.join(__dirname, '..', 'live_express_rates.json');
  if (fs.existsSync(pExp)) liveExpressRates = JSON.parse(fs.readFileSync(pExp, 'utf8'));
} catch (e) {
  console.warn('[ratecardExporter] Could not load live_express_rates.json:', e.message);
}

try {
  const pStd = path.join(__dirname, '..', 'live_standard_rates.json');
  if (fs.existsSync(pStd)) liveStandardRates = JSON.parse(fs.readFileSync(pStd, 'utf8'));
} catch (e) {
  console.warn('[ratecardExporter] Could not load live_standard_rates.json:', e.message);
}

const r2 = (v) => (v == null || isNaN(v) ? null : Math.round(Number(v) * 100) / 100);

// Helper to determine customer markup % for a service
function getMarkupPct(card, svcKey, country, euList) {
  const conf = (card && card.config) || {};
  const m = conf.markup;
  if (m == null) return 0;
  if (typeof m === 'number') return m;
  if (country && (svcKey === 'us' || svcKey === 'ux' || svcKey === 'edp' || svcKey === 'edu' || svcKey.startsWith('ups'))) {
    const isEu = Array.isArray(euList) && euList.includes(country);
    const regKey = isEu ? svcKey + '_eu' : svcKey + '_row';
    if (m[regKey] != null && isFinite(Number(m[regKey]))) return Number(m[regKey]);
  }
  if (m[svcKey] != null && isFinite(Number(m[svcKey]))) return Number(m[svcKey]);
  if (m.default != null && isFinite(Number(m.default))) return Number(m.default);
  return 0;
}

// Build a clean header section for a rate matrix sheet
function buildSheetHeader(title, customerName, svcName, currency = 'GBP (£)') {
  const today = new Date().toISOString().split('T')[0];
  return [
    ['MOOV PARCEL - CUSTOMER RATE CARD'],
    [`Customer: ${customerName || 'Standard / Valued Customer'}`, `Issue Date: ${today}`, `Currency: ${currency}`],
    [`Service: ${svcName}`, 'Tariff Type: Baseline with agreed customer margin folded in', 'VAT: Exclusive'],
    [] // blank row before table header
  ];
}

// Generate the workbook
function buildRateCardWorkbook(cfg, card, options = {}) {
  const wb = XLSX.utils.book_new();
  const S = (cfg && cfg.settings) || {};
  const euList = (S.regions && S.regions.eu) || [];
  const customerName = (card && (card.customer || card.name)) || (options.customerName || 'Valued Customer');
  const conf = (card && card.config) || {};

  const selectedServices = Array.isArray(options.services) && options.services.length
    ? options.services
    : (Array.isArray(conf.services) && conf.services.length
        ? conf.services
        : (Array.isArray(conf.includedServices) && conf.includedServices.length ? conf.includedServices : ['ux', 'us', 'edp', 'edu']));

  const includeSurcharges = options.includeSurcharges !== false;
  const includeZoneGuide = options.includeZoneGuide !== false;

  // -------------------------------------------------------------
  // 1. UPS EXPRESS SAVER (ux)
  // -------------------------------------------------------------
  if (selectedServices.includes('ux')) {
    const mk = getMarkupPct(card, 'ux', null, euList);
    const wsData = buildSheetHeader('UPS Express Saver', customerName, `UPS Express Saver (+${mk}% margin)`);

    // Collect zones
    const liveZones = liveExpressRates ? Object.keys(liveExpressRates) : [];
    const seedZones = (cfg.ups_express ? Object.keys(cfg.ups_express) : []);
    const allZonesSet = new Set([...liveZones, ...seedZones]);
    // Sort zones numerically where possible
    const zones = Array.from(allZonesSet).sort((a, b) => {
      const na = parseInt(a), nb = parseInt(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });

    wsData.push(['Weight (kg)', ...zones.map(z => 'Zone ' + z)]);

    // Weights: 0.5 kg to 70.0 kg in 0.5 kg increments (140 steps)
    for (let w = 0.5; w <= 70.0; w = Math.round((w + 0.5) * 10) / 10) {
      const row = [w];
      for (const z of zones) {
        let basePrice = null;
        if (liveExpressRates && liveExpressRates[z] && liveExpressRates[z][String(w)] != null) {
          basePrice = Number(liveExpressRates[z][String(w)]);
        } else if (cfg.ups_express && cfg.ups_express[z] && cfg.ups_express[z].bands) {
          const bands = cfg.ups_express[z].bands;
          const match = bands.find(b => Math.abs(b[0] - w) < 0.001);
          if (match) {
            basePrice = match[1];
          } else {
            // Find bracket for interpolation / step
            const higher = bands.find(b => b[0] >= w);
            if (higher) basePrice = higher[1];
          }
        }

        if (basePrice != null && !isNaN(basePrice)) {
          const sell = r2(basePrice * (1 + mk / 100));
          row.push(sell);
        } else {
          row.push('—');
        }
      }
      wsData.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 12 }, ...zones.map(() => ({ wch: 11 }))];
    XLSX.utils.book_append_sheet(wb, ws, 'UPS Express Saver');
  }

  // -------------------------------------------------------------
  // 2. UPS STANDARD (us)
  // -------------------------------------------------------------
  if (selectedServices.includes('us')) {
    const mk = getMarkupPct(card, 'us', null, euList);
    const wsData = buildSheetHeader('UPS Standard', customerName, `UPS Standard European Road Freight (+${mk}% margin)`);

    const liveZones = liveStandardRates ? Object.keys(liveStandardRates) : [];
    const seedZones = (cfg.ups_standard ? Object.keys(cfg.ups_standard) : []);
    const allZonesSet = new Set([...liveZones, ...seedZones]);
    const zones = Array.from(allZonesSet).sort((a, b) => {
      const na = parseInt(a), nb = parseInt(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });

    wsData.push(['Weight (kg)', ...zones.map(z => 'Zone ' + z)]);

    // Weights: 1.0 kg to 70.0 kg in 0.5 kg increments
    for (let w = 1.0; w <= 70.0; w = Math.round((w + 0.5) * 10) / 10) {
      const row = [w];
      for (const z of zones) {
        let basePrice = null;
        if (liveStandardRates && liveStandardRates[z] && liveStandardRates[z][String(w)] != null) {
          basePrice = Number(liveStandardRates[z][String(w)]);
        } else if (cfg.ups_standard && cfg.ups_standard[z] && cfg.ups_standard[z].bands) {
          const bands = cfg.ups_standard[z].bands;
          const match = bands.find(b => Math.abs(b[0] - w) < 0.001);
          if (match) {
            basePrice = match[1];
          } else {
            const higher = bands.find(b => b[0] >= w);
            if (higher) basePrice = higher[1];
          }
        }

        if (basePrice != null && !isNaN(basePrice)) {
          const sell = r2(basePrice * (1 + mk / 100));
          row.push(sell);
        } else {
          row.push('—');
        }
      }
      wsData.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 12 }, ...zones.map(() => ({ wch: 11 }))];
    XLSX.utils.book_append_sheet(wb, ws, 'UPS Standard');
  }

  // -------------------------------------------------------------
  // 3. UPS WORLDWIDE ECONOMY DDP (edp)
  // -------------------------------------------------------------
  if (selectedServices.includes('edp') && cfg.ups_economy_ddp) {
    const mk = getMarkupPct(card, 'edp', null, euList);
    const wsData = buildSheetHeader('UPS Worldwide Economy DDP', customerName, `UPS Worldwide Economy DDP (+${mk}% margin)`);

    const zones = Object.keys(cfg.ups_economy_ddp).sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
    wsData.push(['Weight (kg)', ...zones.map(z => 'Zone ' + z)]);

    // Find all distinct weights across bands
    const weightSet = new Set();
    zones.forEach(z => {
      (cfg.ups_economy_ddp[z].bands || []).forEach(b => weightSet.add(b[0]));
    });
    const weights = Array.from(weightSet).sort((a, b) => a - b);

    weights.forEach(w => {
      const row = [w];
      zones.forEach(z => {
        const bands = cfg.ups_economy_ddp[z].bands || [];
        const match = bands.find(b => Math.abs(b[0] - w) < 0.001);
        if (match && match[1] != null) {
          row.push(r2(match[1] * (1 + mk / 100)));
        } else {
          row.push('—');
        }
      });
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 12 }, ...zones.map(() => ({ wch: 11 }))];
    XLSX.utils.book_append_sheet(wb, ws, 'UPS Economy DDP');
  }

  // -------------------------------------------------------------
  // 4. UPS WORLDWIDE ECONOMY DDU (edu)
  // -------------------------------------------------------------
  if (selectedServices.includes('edu') && cfg.ups_economy_ddu) {
    const mk = getMarkupPct(card, 'edu', null, euList);
    const wsData = buildSheetHeader('UPS Worldwide Economy DDU', customerName, `UPS Worldwide Economy DDU (+${mk}% margin)`);

    const zones = Object.keys(cfg.ups_economy_ddu).sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
    wsData.push(['Weight (kg)', ...zones.map(z => 'Zone ' + z)]);

    const weightSet = new Set();
    zones.forEach(z => {
      (cfg.ups_economy_ddu[z].bands || []).forEach(b => weightSet.add(b[0]));
    });
    const weights = Array.from(weightSet).sort((a, b) => a - b);

    weights.forEach(w => {
      const row = [w];
      zones.forEach(z => {
        const bands = cfg.ups_economy_ddu[z].bands || [];
        const match = bands.find(b => Math.abs(b[0] - w) < 0.001);
        if (match && match[1] != null) {
          row.push(r2(match[1] * (1 + mk / 100)));
        } else {
          row.push('—');
        }
      });
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 12 }, ...zones.map(() => ({ wch: 11 }))];
    XLSX.utils.book_append_sheet(wb, ws, 'UPS Economy DDU');
  }

  // -------------------------------------------------------------
  // 5. DPD SERVICES (ca, cp)
  // -------------------------------------------------------------
  if (selectedServices.includes('ca') && cfg.dpd_classic) {
    const mk = getMarkupPct(card, 'ca', null, euList);
    const wsData = buildSheetHeader('DPD Classic Air', customerName, `DPD Classic Air Europe (+${mk}% margin)`);
    const countries = Object.keys(cfg.dpd_classic).sort();
    wsData.push(['Weight Band', ...countries]);

    const maxBands = Math.max(...countries.map(c => (cfg.dpd_classic[c] || []).length));
    for (let i = 0; i < maxBands; i++) {
      const bandLabel = `${i + 1} kg`;
      const row = [bandLabel];
      countries.forEach(c => {
        const p = cfg.dpd_classic[c] && cfg.dpd_classic[c][i];
        row.push(p != null ? r2(p * (1 + mk / 100)) : '—');
      });
      wsData.push(row);
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 14 }, ...countries.map(() => ({ wch: 12 }))];
    XLSX.utils.book_append_sheet(wb, ws, 'DPD Classic Air');
  }

  if (selectedServices.includes('cp') && cfg.dpd_parcel) {
    const mk = getMarkupPct(card, 'cp', null, euList);
    const wsData = buildSheetHeader('DPD Classic Parcel', customerName, `DPD Classic Road Parcel (+${mk}% margin)`);
    wsData.push(['Country', 'Flat Rate (Up to 31.5 kg)', 'Notes']);
    const countries = Object.keys(cfg.dpd_parcel).sort();
    countries.forEach(c => {
      const p = cfg.dpd_parcel[c];
      wsData.push([c, p != null ? r2(p * (1 + mk / 100)) : '—', 'Max weight 31.5kg · Max length 175cm']);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 22 }, { wch: 26 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws, 'DPD Classic Parcel');
  }

  // -------------------------------------------------------------
  // 6. SURCHARGES & ACCESSORIALS SCHEDULE
  // -------------------------------------------------------------
  if (includeSurcharges) {
    const surData = [
      ['MOOV PARCEL - SURCHARGES & ACCESSORIAL SCHEDULE'],
      [`Customer: ${customerName}`, `Currency: GBP (£)`, 'All rates subject to applicable courier terms'],
      ['Effective from standard operating schedule', 'All values net of VAT'],
      [],
      ['Category', 'Surcharge Name', 'Applies To', 'Trigger Condition', 'Customer Rate / Fee', 'Billing Rule & Notes']
    ];

    const surchargesList = [
      ['Fuel', 'Fuel Surcharge (Air Express)', 'UPS Express', 'Applied to base transportation and fuelable surcharges', 'Variable Monthly Index', 'Published on invoice per monthly courier index'],
      ['Fuel', 'Fuel Surcharge (Standard Road)', 'UPS Standard', 'Applied to standard road transport base rate', 'Variable Monthly Index', 'Published on invoice per monthly courier index'],
      ['Fuel', 'Fuel Surcharge (Worldwide Economy DDP)', 'UPS Economy DDP', 'Contractual fixed fuel rate', 'Fixed 5.00%', 'Applied directly to base freight'],
      ['Area', 'Extended Area Surcharge (EAS)', 'UPS Express / Standard', 'Deliveries to designated extended postal codes', '£0.45 / kg (Min £19.50)', 'Whichever is greater per shipment'],
      ['Area', 'Remote Area Surcharge (RAS)', 'UPS Express / Standard', 'Deliveries to designated remote / offshore postal codes', '£0.45 / kg (Min £19.50)', 'Whichever is greater per shipment'],
      ['Handling', 'Additional Handling - Weight', 'UPS Small Package', 'Any parcel with actual weight > 25 kg (or > 32 kg)', '£12.10', 'Per parcel fee'],
      ['Handling', 'Additional Handling - Length', 'UPS Small Package', 'Longest side exceeds 100 cm', '£12.10', 'Per parcel fee'],
      ['Handling', 'Additional Handling - Width / Girth', 'UPS Small Package', 'Second longest side exceeds 76 cm', '£12.10', 'Per parcel fee'],
      ['Handling', 'Additional Handling - Packaging', 'UPS Small Package', 'Non-corrugated cardboard, metal, wood, cylindrical or irregular packaging', '£12.10', 'Per parcel fee'],
      ['Handling', 'Large Package Surcharge', 'UPS Small Package', 'Length + Girth (2W + 2H) combined exceeds 300 cm (up to max 400 cm)', '£56.55 (Min billable 40 kg)', 'Minimum billable weight of 40 kg applies'],
      ['Security', 'Over Maximum Limits Surcharge', 'UPS Small Package', 'Actual weight > 70 kg, Length > 274 cm, or Length + Girth > 400 cm', '£455.45', 'Unauthorized package handling / refusal'],
      ['Delivery', 'Residential Delivery Surcharge', 'UPS All Services', 'Delivery to a home or private residence address', '£3.40', 'Per parcel fee'],
      ['Delivery', 'Address Correction Fee', 'UPS / DPD', 'Incomplete, invalid, or incorrect recipient address details', '£12.50', 'Per shipment fee'],
      ['Security', 'Direct Delivery Only', 'UPS All Services', 'Delivery only to address on label, no drop-shop reroute', '£2.80', 'Per shipment fee'],
      ['Customs', 'International Processing Fee (IP)', 'UPS International', 'Export customs documentation and clearance handling', '£4.30', 'Per international export parcel'],
      ['Customs', 'Customs Duty Disbursement Fee', 'UPS International', 'Advancement fee for paying destination duties & taxes on shipper behalf', '£8.00', 'Per shipment fee'],
      ['Customs', 'DDP Forwarding Clearance Fee', 'UPS Economy / DPD', 'Delivered Duty Paid clearance processing fee', 'Included (£0.00)', 'Included in agreed tariff'],
      ['Rules', 'UPS WW Economy Max Value Limit', 'UPS Economy (DDP & DDU)', 'Maximum parcel customs value', 'Max $400 USD (£300 / €360)', 'Parcels above $400 USD cannot travel on Economy'],
      ['Rules', 'UPS WW Economy Small Parcel Limit', 'UPS Economy (DDP & DDU)', 'Packages weighing ≤ 2.0 kg', 'Max 60cm length · Max 90cm L+W+H', 'Parcels exceeding dimensions not accepted'],
      ['Rules', 'UPS WW Economy Large Parcel Limit', 'UPS Economy (DDP & DDU)', 'Packages weighing > 2.0 kg', 'DDU: Max 90cm (200cm L+W+H) · DDP: Max 122cm (330cm girth)', 'Max actual weight: DDU 20 kg, DDP 30 kg'],
      ['Rules', 'Volumetric Divisor Formula', 'UPS & DPD Air', 'Dimensional weight rating formula', '(L x W x H in cm) / 5000', 'Charged on greater of actual or volumetric weight']
    ];

    surchargesList.forEach(s => surData.push(s));

    const wsSur = XLSX.utils.aoa_to_sheet(surData);
    wsSur['!cols'] = [{ wch: 14 }, { wch: 34 }, { wch: 22 }, { wch: 45 }, { wch: 26 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsSur, 'Surcharges & Terms');
  }

  // -------------------------------------------------------------
  // 7. COUNTRY ZONE GUIDE
  // -------------------------------------------------------------
  if (includeZoneGuide) {
    const zoneData = [
      ['MOOV PARCEL - COUNTRY ZONE GUIDE'],
      [`Customer: ${customerName}`, `Currency: GBP (£)`],
      ['Country destinations and corresponding courier tariff zones'],
      [],
      ['Country Name', 'ISO Code', 'Region', 'UPS Express Saver', 'UPS Standard', 'UPS Economy DDP', 'UPS Economy DDU']
    ];

    const c2zExp = cfg.c2zone_express || {};
    const c2zStd = cfg.c2zone_standard || {};
    const c2zEdp = cfg.c2zone_economy_ddp || {};
    const c2zEdu = cfg.c2zone_economy_ddu || {};

    const countries = (Array.isArray(cfg.countries) && cfg.countries.length ? cfg.countries : countryList || []).slice().sort();

    countries.forEach(c => {
      const iso = nameToIso(c) || '';
      const isEu = euList.includes(c);
      const reg = isEu ? 'Europe (EU)' : (c === 'United Kingdom' || c === 'GB' ? 'UK Domestic' : 'Rest of World');
      const zExp = c2zExp[c] ? ('Zone ' + c2zExp[c]) : '—';
      const zStd = c2zStd[c] ? ('Zone ' + c2zStd[c]) : '—';
      const zEdp = c2zEdp[c] ? ('Zone ' + c2zEdp[c]) : '—';
      const zEdu = c2zEdu[c] ? ('Zone ' + c2zEdu[c]) : '—';

      zoneData.push([c, iso, reg, zExp, zStd, zEdp, zEdu]);
    });

    const wsZone = XLSX.utils.aoa_to_sheet(zoneData);
    wsZone['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsZone, 'Country Zone Guide');
  }

  return wb;
}

module.exports = {
  buildRateCardWorkbook,
  getMarkupPct,
};
