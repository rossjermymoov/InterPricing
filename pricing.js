// Server-side pricing for public customer cards.
// Produces a customer-facing payload with FINAL prices only — markup/fuel/cost never included
// (unless breakdown mode, which exposes only the fuel surcharge %, a normal customer-facing figure).

const SERVICES = [
  { key: 'ca', name: 'DPD Classic Air',        carrier: 'DPD', type: 'band', src: 'dpd_classic' },
  { key: 'ae', name: 'DPD Air Express',        carrier: 'DPD', type: 'band', src: 'dpd_express' },
  { key: 'ep', name: 'DPD Classic ExpressPak', carrier: 'DPD', type: 'flat', src: 'dpd_expresspak', cap: 'ep' },
  { key: 'cp', name: 'DPD Classic Parcel',     carrier: 'DPD', type: 'flat', src: 'dpd_parcel',     cap: 'cp' },
  { key: 'ux', name: 'UPS Express Saver',      carrier: 'UPS', type: 'zone', src: 'ups_express',  zmap: 'c2zone_express' },
  { key: 'us', name: 'UPS Standard',           carrier: 'UPS', type: 'zone', src: 'ups_standard', zmap: 'c2zone_standard' },
];

const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);

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
  const breakdown = !!conf.breakdown;

  const sell = (key, raw) => {
    if (raw == null) return null;
    const f = (FUEL[key] && FUEL[key].sell) || 0;
    const base = raw * (1 + markupFor(card, key) / 100);
    return breakdown ? r2(base) : r2(base * (1 + f / 100));
  };

  const countries = new Set();
  const services = [];
  for (const s of SERVICES) {
    if (!include.includes(s.key)) continue;
    const o = { key: s.key, name: s.name, carrier: s.carrier, type: s.type };
    if (breakdown) o.fuel = Math.round(((FUEL[s.key] && FUEL[s.key].sell) || 0) * 100) / 100;
    if (s.type === 'band') {
      const src = cfg[s.src] || {};
      o.prices = {};
      for (const c of Object.keys(src)) { o.prices[c] = src[c].map((p) => sell(s.key, p)); countries.add(c); }
    } else if (s.type === 'flat') {
      const src = cfg[s.src] || {};
      o.cap = CAPS[s.cap];
      o.prices = {};
      for (const c of Object.keys(src)) { if (src[c] != null) { o.prices[c] = sell(s.key, src[c]); countries.add(c); } }
    } else {
      const src = cfg[s.src] || {}, zmap = cfg[s.zmap] || {};
      o.zones = {};
      for (const z of Object.keys(src)) o.zones[z] = (src[z].bands || []).map(([w, p]) => [w, sell(s.key, p)]);
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

  // surcharges (customer amounts only), filtered to carriers shown
  const carriersShown = new Set(services.map((s) => s.carrier.toLowerCase()));
  const when = (a) => a.cond === 'auto' ? 'By size / weight'
    : a.cond === 'always' ? 'Every shipment'
    : a.cond === 'countryIn' ? (a.countries || []).join(', ')
    : a.cond === 'region' ? (a.region || '').toUpperCase() + ' destinations' : 'On request';
  const rate = (a) => a.basis === 'pctValue'
    ? `${a.pct || 0}% of goods value${a.min ? ` (min £${Number(a.min).toFixed(2)})` : ''}`
    : `£${((a.list || 0) * (1 - (a.disc || 0) / 100)).toFixed(2)} per shipment`;
  const surcharges = (conf.includeSurcharges === false) ? [] :
    (S.accessorials || []).filter((a) => carriersShown.has(a.applyTo))
      .map((a) => ({ name: a.name, carrier: (a.applyTo || '').toUpperCase(), when: when(a), rate: rate(a) }));

  return {
    customer: card.customer || '',
    title: conf.title || 'International Rate Card',
    notes: conf.notes || '',
    breakdown,
    showBest: conf.showBest !== false,
    divisor: cfg.divisor,
    bands: cfg.bands,
    caps: { cp: CAPS.cp, ep: CAPS.ep },
    countries: countryList,
    services,
    surcharges,
  };
}

module.exports = { buildCardPayload, SERVICES };
