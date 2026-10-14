const crypto = require('crypto');

/**
 * Return Customers Configuration
 * Easily add or update customers, credentials, default services, and return destinations.
 */
const CUSTOMERS = {
  buffalo: {
    id: 'buffalo',
    name: 'Buffalo Systems',
    auth_company: 'Buffalo Systems Ltd S8 0XQ',
    api_user: 'Buffalo Systems Ltd S8 0XQ',
    api_token: 'asmgbfwyicjhnoxv',
    default_service: 'DPD',
    ship_to: {
      name: 'Returns Dept',
      phone: '',
      email: '',
      company_name: 'Bessette Limited',
      address_1: '237 Brompton Road',
      address_2: '',
      address_3: '',
      city: 'London',
      county: '',
      postcode: 'SW3 2EP',
      country_iso: 'GB',
      tax_id: null
    }
  },
  xplore: {
    id: 'xplore',
    name: 'Xplore Brands',
    auth_company: 'Xplore Brands LE12 7RA',
    api_user: 'Xplore Brands LE12 7RA',
    api_token: 'ndxcbqahoyuglkpv',
    default_service: 'YOD',
    ship_to: {
      name: 'Returns Dept',
      phone: '11111 111111',
      email: '',
      company_name: 'Xplore Brands & Distribution',
      address_1: 'Unit 30-32 Albion Rd',
      address_2: 'Sileby',
      address_3: '',
      city: 'Loughborough',
      county: '',
      postcode: 'LE12 7RA',
      country_iso: 'GB',
      tax_id: null
    }
  },
  bessette: {
    id: 'bessette',
    name: 'Bessette',
    auth_company: 'Bessette LTD  W4 4PH',
    api_user: 'Bessette LTD  W4 4PH',
    api_token: 'eltywhgsfjdrcnqu',
    default_service: 'YOD',
    ship_to: {
      name: 'Returns Dept',
      phone: '',
      email: '',
      company_name: 'Bessette Limited',
      address_1: '237 Brompton Road',
      address_2: '',
      address_3: '',
      city: 'London',
      county: '',
      postcode: 'SW3 2EP',
      country_iso: 'GB',
      tax_id: null
    }
  }
};

/**
 * Courier Services Configuration
 */
const SERVICES = {
  DPD: {
    code: 'DPD',
    name: 'DPD (Drop Off QR)',
    dc_service_id: 'DPD-12DROPQR'
  },
  YOD: {
    code: 'YOD',
    name: 'Yodel (Direct Return C2C)',
    dc_service_id: 'YOD-C2CPS'
  }
};

const COURIER_API_URL = 'https://production.courierapi.co.uk/api/couriers/v1/MoovParcel/create-label';

/**
 * Returns today's date formatted as YYYY-MM-DD 18:00:00 (London time)
 */
function getCollectionDate(dateObj = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(dateObj);

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  return `${year}-${month}-${day} 18:00:00`;
}

/**
 * Generate 32-character hex request ID (idempotency key)
 */
function generateRequestId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Build the exact returns label JSON payload
 */
function buildPayload({
  customerId,
  serviceCode,
  shipFrom,
  collectionDate,
  requestId,
  reference = '',
  reference2 = '',
  deliveryInstructions = '',
  itemDescription = 'Test Item',
  parcelWeight = 2,
  dimensions = { width: 10, height: 20, length: 30 }
}) {
  const customer = CUSTOMERS[customerId?.toLowerCase()];
  if (!customer) {
    throw new Error(`Customer '${customerId}' not recognized. Available: ${Object.keys(CUSTOMERS).join(', ')}`);
  }

  const service = SERVICES[serviceCode?.toUpperCase()] || SERVICES[customer.default_service] || SERVICES.DPD;

  const resolvedCollectionDate = collectionDate && typeof collectionDate === 'string' && collectionDate.trim()
    ? collectionDate.trim()
    : getCollectionDate();

  const resolvedRequestId = requestId && typeof requestId === 'string' && requestId.trim()
    ? requestId.trim()
    : generateRequestId();

  const formattedShipFrom = {
    name: (shipFrom.name || '').trim(),
    phone: (shipFrom.phone || '').trim(),
    email: (shipFrom.email || '').trim(),
    company_name: (shipFrom.company_name || '').trim(),
    address_1: (shipFrom.address_1 || '').trim(),
    address_2: (shipFrom.address_2 || '').trim(),
    address_3: (shipFrom.address_3 || '').trim(),
    city: (shipFrom.city || '').trim(),
    postcode: (shipFrom.postcode || '').trim().toUpperCase(),
    county: (shipFrom.county || '').trim(),
    country_iso: (shipFrom.country_iso || 'GB').trim().toUpperCase(),
    company_id: (shipFrom.company_id || '').trim(),
    tax_id: (shipFrom.tax_id || '').trim(),
    ioss_number: shipFrom.ioss_number || null
  };

  return {
    auth_company: customer.auth_company,
    format_address_default: true,
    request_id: resolvedRequestId,
    shipment: {
      label_size: '6x4',
      label_format: 'pdf',
      generate_invoice: false,
      generate_packing_slip: false,
      courier: {
        auth_company: 'C2C'
      },
      collection_date: resolvedCollectionDate,
      dc_service_id: service.dc_service_id,
      reference: reference || '',
      reference_2: reference2 || '',
      delivery_instructions: deliveryInstructions || '',
      ship_from: formattedShipFrom,
      ship_to: customer.ship_to,
      parcels: [
        {
          dim_width: Number(dimensions.width) || 10,
          dim_height: Number(dimensions.height) || 20,
          dim_length: Number(dimensions.length) || 30,
          dim_unit: 'cm',
          items: [
            {
              description: itemDescription || 'Test Item',
              origin_country: formattedShipFrom.country_iso || 'GB',
              quantity: 1,
              value_currency: 'GBP',
              weight: Number(parcelWeight) || 2,
              weight_unit: 'KG',
              sku: 'TestSKU',
              hs_code: '50000000',
              value: '0.00',
              extended_description: `${itemDescription || 'Test Item'})`
            }
          ]
        }
      ]
    }
  };
}

/**
 * Call CourierAPI to generate label
 */
async function callCreateLabel({ customerId, payload }) {
  const customer = CUSTOMERS[customerId?.toLowerCase()];
  if (!customer) {
    throw new Error(`Customer '${customerId}' not recognized`);
  }

  const headers = {
    'Content-Type': 'application/json',
    'api-user': customer.api_user,
    'api-token': customer.api_token
  };

  const res = await fetch(COURIER_API_URL, {
    method: 'POST',
    headers,
    body: typeof payload === 'string' ? payload : JSON.stringify(payload)
  });

  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (err) {
    data = { raw: rawText };
  }

  return {
    ok: res.ok,
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type')
    },
    data
  };
}

/**
 * Smart text parser to extract customer return address details from pasted text
 */
function parseAddressText(rawText) {
  if (!rawText || typeof rawText !== 'string') return {};

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = {
    name: '',
    phone: '',
    email: '',
    company_name: '',
    address_1: '',
    address_2: '',
    city: '',
    county: '',
    postcode: '',
    country_iso: 'GB'
  };

  // Find email
  const emailMatch = rawText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    result.email = emailMatch[1];
  }

  // Find UK/International phone number
  const phoneMatch = rawText.match(/(?:(?:\+44\s?\(0\)\s?|\+44\s?|0)(?:[1-9]\d{8,9}|7\d{9}))/);
  if (phoneMatch) {
    result.phone = phoneMatch[0].replace(/\s+/g, '');
  }

  // Find UK Postcode
  const postcodeRegex = /([A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2})/i;
  const postcodeMatch = rawText.match(postcodeRegex);
  if (postcodeMatch) {
    result.postcode = postcodeMatch[1].toUpperCase().replace(/\s+/, ' ');
  }

  // Remaining lines heuristics
  const nonContactLines = lines.filter(line => {
    if (emailMatch && line.includes(emailMatch[1])) return false;
    if (phoneMatch && line.replace(/\s+/g, '').includes(phoneMatch[0].replace(/\s+/g, ''))) return false;
    if (/^(tel|phone|email|mobile|e-mail):/i.test(line)) return false;
    return true;
  });

  if (nonContactLines.length > 0) {
    result.name = nonContactLines[0].replace(/^(name|customer|recipient|ship to|ship from):\s*/i, '');
  }

  const addrLines = nonContactLines.slice(1);
  if (addrLines.length > 0) {
    // If last line has postcode, see if city is before it
    const lastLine = addrLines[addrLines.length - 1];
    if (postcodeMatch && lastLine.toUpperCase().includes(result.postcode)) {
      const remainingOnLast = lastLine.replace(new RegExp(result.postcode, 'i'), '').trim().replace(/,\s*$/, '');
      if (remainingOnLast) {
        result.city = remainingOnLast;
      }
      addrLines.pop();
    }
  }

  if (addrLines.length > 0 && !result.city) {
    result.city = addrLines.pop().replace(/,\s*$/, '');
  }

  if (addrLines.length > 0) {
    result.address_1 = addrLines[0].replace(/,\s*$/, '');
  }
  if (addrLines.length > 1) {
    result.address_2 = addrLines[1].replace(/,\s*$/, '');
  }

  return result;
}

/**
 * Extract tracking number and label file/URL from various CourierAPI response shapes
 */
function extractLabelInfo(data) {
  if (!data || typeof data !== 'object') return { trackingNumber: null, labelPdf: null, labelUrl: null };

  const trackingNumber =
    data.tracking_number ||
    data.trackingNumber ||
    data.shipment?.tracking_number ||
    data.shipment?.trackingNumber ||
    data.parcels?.[0]?.tracking_number ||
    data.shipment?.parcels?.[0]?.tracking_number ||
    data.labels?.[0]?.tracking_number ||
    null;

  let labelPdf =
    data.label_pdf ||
    data.label_base64 ||
    data.labelPdf ||
    data.labelBase64 ||
    (typeof data.label === 'string' && (data.label.startsWith('JVBERi0') || data.label.startsWith('data:application/pdf') || data.label.length > 200) ? data.label : null) ||
    data.shipment?.label_pdf ||
    data.shipment?.label_base64 ||
    (typeof data.shipment?.label === 'string' && (data.shipment.label.startsWith('JVBERi0') || data.shipment.label.startsWith('data:application/pdf') || data.shipment.label.length > 200) ? data.shipment.label : null) ||
    data.parcels?.[0]?.label ||
    data.shipment?.parcels?.[0]?.label ||
    data.documents?.[0]?.content ||
    data.labels?.[0]?.label_data ||
    null;

  const labelUrl =
    data.label_url ||
    data.labelUrl ||
    (typeof data.label === 'string' && (data.label.startsWith('http://') || data.label.startsWith('https://')) ? data.label : null) ||
    data.shipment?.label_url ||
    data.documents?.[0]?.url ||
    data.labels?.[0]?.label_url ||
    null;

  return { trackingNumber, labelPdf, labelUrl };
}

module.exports = {
  CUSTOMERS,
  SERVICES,
  COURIER_API_URL,
  getCollectionDate,
  generateRequestId,
  buildPayload,
  callCreateLabel,
  parseAddressText,
  extractLabelInfo
};
