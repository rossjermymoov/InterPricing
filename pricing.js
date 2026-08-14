// Server-side pricing for public customer cards.
// The payload carries BASE prices with the customer markup already folded in (markup is never
// sent as a number), per-service fuel %, and sanitised accessorial definitions (net customer
// amounts only — never our list price or discount). The card computes base + fuel + surcharges.

const SERVICES = [
  { key: 'ca', name: 'DPD Classic Air',        carrier: 'DPD', type: 'band', src: 'dpd_classic' },
  { key: 'ae', name: 'DPD Air Express',        carrier: 'DPD', type: 'band', src: 'dpd_express' },
  { key: 'ep', name: 'DPD Classic ExpressPak', carrier: 'DPD', type: 'flat', src: 'dpd_expresspak', cap: 'ep' },
  { key: 'cp', name: 'DPD Classic Parcel',     carrier: 'DPD', type: 'flat', src: 'dpd_parcel',     cap: 'cp' },
  { key: 'ux', name: 'UPS Express Saver',      carrier: 'UPS', type: 'zone', src: 'ups_express',  zmap: 'c2zone_express' },
  { key: 'us', name: 'UPS Standard',           carrier: 'UPS', type: 'zone', src: 'ups_standard', zmap: 'c2zone_standard' },
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

function markupFor(card, key) {
  const m = (card && card.config && card.config.markup);
  if (m == null) return 0;
  if (typeof m === 'number') return m;
  return Number(m[key] || 0);
}

// Build the customer-facing payload for one card against the current config.
function buildCardPayload(cfg, card) {
  const S = cfg.settings || {};
  const FUEL = S.fuelByService || {};
  const CAPS = (S.caps || cfg.caps || { cp: 31.5, ep: 3 });
  const conf = (card && card.config) || {};
  const include = Array.isArray(conf.services) && conf.services.length ? conf.services : SERVICES.map((s) => s.key);

  // Base delivery price with the customer markup folded in (fuel NOT applied — card adds it).
  const base = (key, raw) => (raw == null ? null : r2(raw * (1 + markupFor(card, key) / 100)));

  const countries = new Set();
  const services = [];
  for (const s of SERVICES) {
    if (!include.includes(s.key)) continue;
    const o = { key: s.key, name: s.name, carrier: s.carrier, type: s.type,
      fuel: Math.round(((FUEL[s.key] && FUEL[s.key].sell) || 0) * 100) / 100 };
    if (s.type === 'band') {
      const src = cfg[s.src] || {};
      o.prices = {};
      for (const c of Object.keys(src)) { o.prices[c] = src[c].map((p) => base(s.key, p)); countries.add(c); }
    } else if (s.type === 'flat') {
      const src = cfg[s.src] || {};
      o.cap = CAPS[s.cap];
      o.prices = {};
      for (const c of Object.keys(src)) { if (src[c] != null) { o.prices[c] = base(s.key, src[c]); countries.add(c); } }
    } else {
      const src = cfg[s.src] || {}, zmap = cfg[s.zmap] || {};
      o.zones = {};
      for (const z of Object.keys(src)) o.zones[z] = (src[z].bands || []).map(([w, p]) => [w, base(s.key, p)]);
      o.zmap = zmap;
      for (const c of Object.keys(zmap)) if (src[zmap[c]]) countries.add(c);
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
      if (a.basis === 'pctValue') { o.pct = a.pct || 0; o.min = a.min || 0; }
      else { o.amount = Math.round((a.list || 0) * (1 - (a.disc || 0) / 100) * 100) / 100; }
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
    services,
    accessorials,
  };
}

module.exports = { buildCardPayload, SERVICES };
