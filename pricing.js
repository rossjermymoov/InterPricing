// Server-side pricing for public customer cards.
// The payload carries BASE prices with the customer markup already folded in (markup is never
// sent as a number), per-service fuel %, and sanitised accessorial definitions (net customer
// amounts only — never our list price or discount). The card computes base + fuel + surcharges.

const SERVICES = [
  { key: 'ca', name: 'DPD Classic Air',        carrier: 'DPD', type: 'band', src: 'dpd_classic', days: 5 },
  { key: 'ae', name: 'DPD Air Express',        carrier: 'DPD', type: 'band', src: 'dpd_express', days: 2 },
  { key: 'ep', name: 'DPD Classic ExpressPak', carrier: 'DPD', type: 'flat', src: 'dpd_expresspak', cap: 'ep', days: 3 },
  { key: 'cp', name: 'DPD Classic Parcel',     carrier: 'DPD', type: 'flat', src: 'dpd_parcel',     cap: 'cp', days: 3 },
  { key: 'ux', name: 'UPS Express Saver',      carrier: 'UPS', type: 'zone', src: 'ups_express',  zmap: 'c2zone_express', days: 2 },
  { key: 'us', name: 'UPS Standard',           carrier: 'UPS', type: 'zone', src: 'ups_standard', zmap: 'c2zone_standard', days: 4 },
  { key: 'edp', name: 'UPS Worldwide Economy DDP', carrier: 'UPS', type: 'zone', src: 'ups_economy_ddp', zmap: 'c2zone_economy_ddp', days: 7, isEconomy: true },
  { key: 'edu', name: 'UPS Worldwide Economy DDU', carrier: 'UPS', type: 'zone', src: 'ups_economy_ddu', zmap: 'c2zone_economy_ddu', days: 9, isEconomy: true },
];

const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);

// EU per-item (per-SKU) customs duty config for the card. Carrier-agnostic; the card applies it
// to EU destinations whose goods value converts to <= the threshold in euros.
function euDutyPayload(e) {
  if (!e || !e.enabled) return { enabled: false };
  return {
    enabled: true,
    eurPerGbp: Number(e.eurPerGbp) || 0,
    perSku: Number(e.perSku) || 0,
    thresholdEur: Number(e.thresholdEur) || 150,
  };
}

function markupFor(card, key, country, euList) {
  const m = (card && card.config && card.config.markup);
  if (m == null) return 0;
  if (typeof m === 'number') return m;
  if (country && (key === 'us' || key === 'ux' || key === 'edp' || key === 'edu' || key.startsWith('ups'))) {
    const isEu = Array.isArray(euList) && euList.includes(country);
    const regKey = isEu ? key + '_eu' : key + '_row';
    if (m[regKey] != null && isFinite(Number(m[regKey]))) return Number(m[regKey]);
  }
  if (m[key] != null && isFinite(Number(m[key]))) return Number(m[key]);
  if (m.default != null && isFinite(Number(m.default))) return Number(m.default);
  return 0;
}

// Build the customer-facing payload for one card against the current config.
function buildCardPayload(cfg, card) {
  const S = cfg.settings || {};
  const FUEL = S.fuelByService || {};
  const CAPS = (S.caps || cfg.caps || { cp: 31.5, ep: 3 });
  const conf = (card && card.config) || {};
  const include = Array.isArray(conf.services) && conf.services.length ? conf.services : SERVICES.map((s) => s.key);
  const euList = (S.regions && S.regions.eu) || [];

  // Base delivery price with the customer markup folded in (fuel NOT applied — card adds it).
  const base = (key, raw, country) => (raw == null ? null : r2(raw * (1 + markupFor(card, key, country, euList) / 100)));

  const countries = new Set();
  const services = [];
  for (const s of SERVICES) {
    if (!include.includes(s.key)) continue;
    const o = { key: s.key, name: s.name, carrier: s.carrier, type: s.type, days: s.days,
      fuel: Math.round(((FUEL[s.key] && FUEL[s.key].sell) || 0) * 100) / 100 };
    if (s.type === 'band') {
      const src = cfg[s.src] || {};
      o.prices = {};
      for (const c of Object.keys(src)) { o.prices[c] = src[c].map((p) => base(s.key, p, c)); countries.add(c); }
    } else if (s.type === 'flat') {
      const src = cfg[s.src] || {};
      o.cap = CAPS[s.cap];
      o.prices = {};
      for (const c of Object.keys(src)) { if (src[c] != null) { o.prices[c] = base(s.key, src[c], c); countries.add(c); } }
    } else {
      const src = cfg[s.src] || {}, zmap = cfg[s.zmap] || {};
      o.zones = {};
      for (const z of Object.keys(src)) o.zones[z] = (src[z].bands || []).map(([w, p]) => [w, base(s.key, p)]);
      o.prices = {};
      o.zmap = zmap;
      for (const c of Object.keys(zmap)) {
        const z = zmap[c];
        if (src[z]) {
          countries.add(c);
          o.prices[c] = (src[z].bands || []).map(([w, p]) => [w, base(s.key, p, c)]);
        }
      }
    }
    services.push(o);
  }

  // optional country restriction
  let countryList = Array.from(countries).sort();
  if (Array.isArray(conf.countries) && conf.countries.length) {
    const allow = new Set(conf.countries);
    countryList = countryList.filter((c) => allow.has(c));
  }

  // Sanitised accessorial definitions — net customer amounts only (no list price / discount).
  const carriersShown = new Set(services.map((s) => s.carrier.toLowerCase()));
  const includeSur = conf.includeSurcharges !== false;
  const accessorials = !includeSur ? [] : (S.accessorials || [])
    .filter((a) => carriersShown.has(a.applyTo))
    .map((a) => {
      const o = { key: a.key, name: a.name, group: a.group || a.key, cond: a.cond, basis: a.basis,
        carrier: (a.applyTo || '').toUpperCase(), fuelable: !!a.fuelable };
      if (a.basis === 'pctValue') {
        const customerMin = a.sellMin != null && a.sellMin !== '' ? Number(a.sellMin) : (a.sell != null && a.sell !== '' ? Number(a.sell) : (Number(a.min) || 14.35));
        const customerPct = a.sellPct != null && a.sellPct !== '' ? Number(a.sellPct) : (Number(a.pct) || 3.0);
        o.pct = customerPct;
        o.min = customerMin;
        o.sellMin = customerMin;
        o.sellPct = customerPct;
        o.amount = customerMin;
      } else {
        const customerFlat = a.sell != null && a.sell !== '' ? Number(a.sell) : Math.round((a.list || 0) * (1 - (a.disc || 0) / 100) * 100) / 100;
        o.amount = customerFlat;
        o.sell = customerFlat;
      }
      if (a.region) o.region = a.region;
      if (a.countries) o.countries = a.countries;
      return o;
    });

  return {
    customer: card.customer || '',
    title: conf.title || 'International Rate Card',
    notes: conf.notes || '',
    showBest: conf.showBest !== false,
    divisor: cfg.divisor,
    bands: cfg.bands,
    caps: { cp: CAPS.cp, ep: CAPS.ep },
    eu: (S.regions && S.regions.eu) || [],
    euDuty: euDutyPayload(S.euCustomsDuty),
    countries: countryList,
    receiver: conf.receiver || {
      company: card.customer || '',
      name: conf.contactName || '',
      line1: (conf.deliveryAddress && conf.deliveryAddress.line1) || conf.address || '',
      line2: (conf.deliveryAddress && conf.deliveryAddress.line2) || '',
      city: (conf.deliveryAddress && conf.deliveryAddress.city) || '',
      postcode: (conf.deliveryAddress && conf.deliveryAddress.postcode) || conf.postcode || '',
      country: (conf.deliveryAddress && conf.deliveryAddress.country) || 'GB',
      phone: conf.phone || '',
      email: conf.email || '',
    },
    deliveryAddress: conf.deliveryAddress || null,
    addressBook: Array.isArray(conf.addressBook) ? conf.addressBook : [], // saved sender/supplier addresses
    services,
    accessorials,
  };
}

module.exports = { buildCardPayload, SERVICES };
