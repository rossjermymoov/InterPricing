// Billing API client for Return and Outbound quotes
// Based on the Moov / BillingAPI (billingapi.co.uk) specification

const DEFAULT_ENDPOINT = 'https://production.billingapi.co.uk/api/customer-routes/get-quote';

/**
 * Normalises DPD and Yodel return services from the Billing API response.
 */
function normaliseServices(rawList) {
  if (!Array.isArray(rawList)) {
    if (rawList && typeof rawList === 'object') {
      rawList = Object.entries(rawList).map(([k, v]) => ({
        service_code: k,
        service_name: k,
        price: typeof v === 'number' ? v : (v && v.total),
      }));
    } else {
      return [];
    }
  }

  return rawList
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const code = String(item.service_code || item.dc_service_id || item.id || '');
      const name = String(item.service_name || item.name || code || '');
      const courierRaw = String(item.courier || item.carrier || '').toUpperCase();
      
      let courier = 'OTHER';
      if (courierRaw.includes('DPD') || name.toUpperCase().includes('DPD') || code.toUpperCase().includes('DPD')) {
        courier = 'DPD';
      } else if (courierRaw.includes('YODEL') || name.toUpperCase().includes('YODEL') || code.toUpperCase().includes('YODEL')) {
        courier = 'YODEL';
      } else if (courierRaw.includes('UPS') || name.toUpperCase().includes('UPS')) {
        courier = 'UPS';
      }

      // Canonical service IDs as requested
      let mappedCode = code;
      let mappedName = name;
      if (courier === 'DPD') {
        mappedCode = 'DPD-12DROPQR';
        mappedName = name || 'DPD Drop Off Next Day (QR & Label)';
      } else if (courier === 'YODEL') {
        mappedCode = 'YODC2C';
        mappedName = name || 'Yodel Direct Return (C2C)';
      }

      const rawTotal = (item.price && typeof item.price === 'object')
        ? (item.price.total ?? item.price.amount ?? item.price.cost)
        : (item.total ?? item.price ?? item.cost);

      const basePrice = Number(rawTotal);
      if (isNaN(basePrice) || basePrice <= 0) return null;

      // Direct live pricing from Billing API (no markup)
      const sellPrice = Math.round(basePrice * 100) / 100;

      // Determine return characteristics
      const isDropoff = mappedName.toLowerCase().includes('drop') || mappedName.toLowerCase().includes('shop') || mappedName.toLowerCase().includes('pickup') || mappedCode.toLowerCase().includes('drop') || courier === 'DPD';
      const isCollection = mappedName.toLowerCase().includes('collect') || mappedName.toLowerCase().includes('c2c') || courier === 'YODEL';

      let leadTime = item.lead_time || item.leadTime || (courier === 'DPD' ? 'Next Working Day · Drop off with QR Code or Label' : '2-3 Working Days · Drop off or Courier Collection');

      return {
        code: mappedCode,
        name: mappedName,
        courier,
        basePrice,
        price: sellPrice,
        sellPrice,
        leadTime,
        isDropoff,
        isCollection,
        badge: courier === 'DPD' ? 'DPD Drop-Off (QR & Label)' : 'Yodel Direct Return (C2C)',
        raw: item,
      };
    })
    .filter(Boolean);
}

/**
 * Fetch live quote from the Billing API
 */
async function fetchBillingQuote({
  customerDcId,
  customerKey,
  authCompany,
  shipFrom,
  shipTo,
  parcels,
}) {
  const url = DEFAULT_ENDPOINT;
  // Hardcoded permanently to Moov Parcel
  const cName = 'Moov Parcel';
  const dcId = customerDcId || process.env.BILLING_CUSTOMER_DC_ID || '';
  const cKey = customerKey || process.env.BILLING_CUSTOMER_KEY || '';
  const authComp = authCompany || process.env.VOILA_AUTH_COMPANY || 'Moov Master';

  if (!cKey) {
    throw new Error('Billing API key is not configured. Please set BILLING_CUSTOMER_KEY in environment variables.');
  }

  const payload = {
    auth_company: authComp,
    format_address_default: true,
    request_id: 'ret_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
    shipment: {
      label_size: '6x4',
      label_format: 'pdf',
      generate_invoice: false,
      generate_packing_slip: false,
      collection_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      reference: 'customer-return',
      reference_2: '',
      delivery_instructions: 'Customer Return Item',
      ship_from: {
        name: shipFrom.name || 'Customer Return',
        phone: shipFrom.phone || '07000000000',
        email: shipFrom.email || 'returns@example.com',
        company_name: shipFrom.company || shipFrom.company_name || '',
        address_1: shipFrom.line1 || shipFrom.address_1 || '',
        address_2: shipFrom.line2 || shipFrom.address_2 || '',
        address_3: '',
        city: shipFrom.city || '',
        county: shipFrom.county || '',
        postcode: shipFrom.postcode || '',
        country_iso: (shipFrom.country || shipFrom.country_iso || 'GB').toUpperCase().slice(0, 2),
      },
      ship_to: {
        name: shipTo.name || shipTo.contactName || 'Returns Department',
        phone: shipTo.phone || '01111111111',
        email: shipTo.email || 'returns@moovparcel.com',
        company_name: shipTo.company || shipTo.company_name || 'Warehouse',
        address_1: shipTo.line1 || shipTo.address_1 || '',
        address_2: shipTo.line2 || shipTo.address_2 || '',
        address_3: '',
        city: shipTo.city || '',
        county: shipTo.county || '',
        postcode: shipTo.postcode || '',
        country_iso: (shipTo.country || shipTo.country_iso || 'GB').toUpperCase().slice(0, 2),
      },
      parcels: (Array.isArray(parcels) && parcels.length > 0 ? parcels : [{ weight: 1.5, l: 30, w: 20, h: 15 }]).map((p) => ({
        dim_width: Number(p.w || p.width || 20),
        dim_height: Number(p.h || p.height || 15),
        dim_length: Number(p.l || p.length || 30),
        dim_unit: 'cm',
        items: [
          {
            description: p.description || 'Customer Return Merchandise',
            origin_country: 'GB',
            quantity: 1,
            value_currency: 'GBP',
            weight: Number(p.weight || p.weightKg || 1.5),
            weight_unit: 'KG',
            sku: p.sku || 'RETURN-ITEM-01',
            value: '50.00',
          },
        ],
      })),
    },
  };

  const headers = {
    client_name: cName,
    customer_dc_id: dcId,
    customer_key: cKey,
    'Content-Type': 'application/json',
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Billing API returned invalid JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const msg = data && (data.error || data.message || data.detail || (Array.isArray(data) ? data.join(', ') : null));
    throw new Error(msg || `Billing API error (HTTP ${res.status})`);
  }

  const services = normaliseServices(data);
  return {
    raw: data,
    services,
    dpd: services.filter((s) => s.courier === 'DPD'),
    yodel: services.filter((s) => s.courier === 'YODEL'),
  };
}

module.exports = {
  DEFAULT_ENDPOINT,
  normaliseServices,
  fetchBillingQuote,
};
