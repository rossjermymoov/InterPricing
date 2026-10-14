const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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
      company_name: 'Buffalo Systems Ltd',
      address_1: 'Unit 3, The Old Dairy',
      address_2: 'Broadfield Road',
      address_3: '',
      city: 'Sheffield',
      county: 'South Yorkshire',
      postcode: 'S8 0XQ',
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
      phone: '02075896655',
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
    (Array.isArray(data.tracking_codes) && data.tracking_codes[0]) ||
    data.tracking_number ||
    data.trackingNumber ||
    data.shipment?.tracking_number ||
    data.shipment?.trackingNumber ||
    data.parcels?.[0]?.tracking_number ||
    data.shipment?.parcels?.[0]?.tracking_number ||
    data.labels?.[0]?.tracking_number ||
    null;

  const qrCodeBase64 = data.qr_code_base64_png || null;
  const qrCodeUrl = data.qr_code || null;

  let labelPdf =
    data.label_pdf ||
    data.label_base64 ||
    data.labelPdf ||
    data.labelBase64 ||
    (typeof data.label === 'string' && (data.label.startsWith('JVBERi0') || data.label.startsWith('data:application/pdf') || data.label.length > 200) ? data.label : null) ||
    data.courier_specifics?.base64_pdf_barcode ||
    data.shipment?.label_pdf ||
    data.shipment?.label_base64 ||
    (typeof data.shipment?.label === 'string' && (data.shipment.label.startsWith('JVBERi0') || data.shipment.label.startsWith('data:application/pdf') || data.shipment.label.length > 200) ? data.shipment.label : null) ||
    data.parcels?.[0]?.label ||
    data.shipment?.parcels?.[0]?.label ||
    data.documents?.[0]?.content ||
    data.labels?.[0]?.label_data ||
    null;

  const labelUrl =
    data.uri ||
    data.label_url ||
    data.labelUrl ||
    (typeof data.label === 'string' && (data.label.startsWith('http://') || data.label.startsWith('https://')) ? data.label : null) ||
    data.shipment?.label_url ||
    data.documents?.[0]?.url ||
    data.labels?.[0]?.label_url ||
    null;

  const barcodeRef = data.courier_specifics?.unique_ref || data.courier_specifics?.barcode_reference || null;

  return { trackingNumber, labelPdf, labelUrl, qrCodeBase64, qrCodeUrl, barcodeRef };
}

/**
 * Generate vector Code 128B barcode SVG for Yodel scan passes
 */
function generateBarcodeSvg(text = '') {
  const safeText = String(text || '').trim();
  if (!safeText) return '';

  const patterns = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
    '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
    '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
    '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
    '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
    '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
    '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
    '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
    '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
  ];
  const startB = 104;
  const stop = 106;
  let checksum = startB;
  const codes = [startB];

  for (let i = 0; i < safeText.length; i++) {
    const code = safeText.charCodeAt(i) - 32;
    codes.push(code >= 0 && code < 95 ? code : 0);
    checksum += (code >= 0 && code < 95 ? code : 0) * (i + 1);
  }
  codes.push(checksum % 103);
  codes.push(stop);

  let barString = '';
  for (const c of codes) {
    barString += patterns[c] || '';
  }

  let x = 12;
  const barWidth = 2;
  const height = 75;
  let rects = '';

  for (let i = 0; i < barString.length; i++) {
    const width = parseInt(barString[i], 10) * barWidth;
    if (i % 2 === 0) {
      rects += `<rect x="${x}" y="0" width="${width}" height="${height}" fill="#000" />`;
    }
    x += width;
  }
  x += 12;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} ${height + 22}" width="100%" height="96" style="max-width:${x}px; margin: 0 auto; display: block;">
    ${rects}
    <text x="${x / 2}" y="${height + 17}" font-family="'JetBrains Mono', Courier, monospace" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="1px" fill="#000">${safeText}</text>
  </svg>`;
}

/**
 * Generate branded thermal / print-ready HTML return label with official Moov logo and centralized QR/barcode
 */
function generateBrandedReturnHtml({ customerId, courier, trackingNumber, barcodeRef, qrCodeBase64, qrCodeUrl, shipFrom = {}, shipTo = {} }) {
  const customer = CUSTOMERS[customerId?.toLowerCase()] || { name: 'Customer Return' };
  const isDpd = String(courier).toUpperCase().includes('DPD');
  const courierName = isDpd ? 'DPD' : 'YODEL';
  const resolvedShipTo = shipTo.company_name ? shipTo : customer.ship_to;

  let centralGraphic = '';
  if (isDpd) {
    if (qrCodeBase64) {
      const src = qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`;
      centralGraphic = `<img src="${src}" alt="Courier QR Code" style="width: 190px; height: 190px; object-fit: contain; margin: 0 auto; display: block;" />`;
    } else if (qrCodeUrl) {
      centralGraphic = `<div style="text-align:center; padding: 20px;"><a href="${qrCodeUrl}" target="_blank" style="font-weight:bold; color:#0284c7; text-decoration:underline;">View Courier QR Code PDF</a></div>`;
    } else {
      centralGraphic = `<div style="text-align:center; font-family: monospace; font-size: 16px; font-weight: bold; padding: 20px 0;">*${trackingNumber || 'PARCEL'}*</div>`;
    }
  } else {
    // Yodel vector barcode
    const code = barcodeRef || trackingNumber || 'YODEL-PARCEL';
    centralGraphic = generateBarcodeSvg(code);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Return Label - ${trackingNumber || customer.name}</title>
  <style>
    @page { size: 4in 6in; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #0f172a; display: flex; justify-content: center; align-items: flex-start; padding: 10px; }
    .label-card { width: 384px; border: 2.5px solid #0f172a; border-radius: 6px; overflow: hidden; background: #fff; }
    .header { background: #121624; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; }
    .header svg { height: 26px; width: auto; }
    .header .tag { color: #1DFB9D; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
    .courier-band { background: #000; color: #fff; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; font-weight: 900; }
    .courier-band .c-name { font-size: 20px; letter-spacing: 1px; }
    .courier-band .badge { background: #fff; color: #000; font-size: 11px; padding: 3px 8px; border-radius: 3px; letter-spacing: 1px; }
    .qr-stage { background: #f8fafc; padding: 16px 12px; text-align: center; border-bottom: 2px solid #0f172a; }
    .qr-box { display: inline-block; background: #fff; padding: 8px; border: 2px solid #0f172a; border-radius: 8px; width: 100%; box-sizing: border-box; }
    .tracking-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
    .tracking-num { font-family: 'JetBrains Mono', Courier, monospace; font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #000; }
    .addresses { padding: 12px 16px; font-size: 12px; line-height: 1.4; border-bottom: 1.5px solid #cbd5e1; }
    .addr-block { margin-bottom: 8px; }
    .addr-title { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .addr-name { font-weight: 800; font-size: 13px; color: #0f172a; }
    .footer { background: #121624; color: #fff; padding: 8px 16px; font-size: 10px; display: flex; justify-content: space-between; align-items: center; }
    .footer span { font-weight: 700; color: #1DFB9D; }
    @media print {
      body { padding: 0; }
      .label-card { width: 100%; border: none; border-radius: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="label-card">
    <div class="header">
      <svg width="120" height="30" viewBox="0 0 185 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M5.22146 37.295C5.96491 37.295 6.60008 37.4324 7.12738 37.7072C7.65468 37.9819 8.04673 38.3669 8.30273 38.8615C8.55874 39.3566 8.64165 39.9485 8.55149 40.6383C8.46092 41.328 8.2174 41.9228 7.82052 42.4226C7.42364 42.9221 6.91405 43.3046 6.29135 43.5693C5.66866 43.8345 4.97029 43.9719 4.19705 43.9819H2.92429L2.26859 47.7901H0.158995L1.95181 37.295H5.22146ZM3.23705 42.1675H4.39308C4.73442 42.1575 5.05562 42.095 5.35711 41.9804C5.65859 41.8655 5.90936 41.6928 6.11022 41.4629C6.31148 41.233 6.44189 40.9531 6.50227 40.6234C6.55259 40.3034 6.5224 40.0311 6.41171 39.8064C6.30142 39.5813 6.12833 39.4062 5.89206 39.2813C5.65578 39.1567 5.36717 39.0942 5.02543 39.0942H3.76636L3.23705 42.1675ZM56.8118 37.295C57.5552 37.295 58.1904 37.4348 58.7181 37.7148C59.2454 37.9948 59.6399 38.3845 59.9007 38.8843C60.1619 39.3838 60.242 39.9686 60.1418 40.6383C60.0512 41.318 59.8053 41.9079 59.4036 42.4074C59.0015 42.9073 58.4919 43.2946 57.874 43.5693C57.7279 43.6346 57.5774 43.6919 57.4224 43.7416L59.4937 47.7901H57.0682L55.3192 43.9819H54.3942L53.7381 47.7901H51.6289L53.4218 37.295H56.8118ZM54.6889 42.2728H55.8324C56.1943 42.2728 56.5232 42.2103 56.8194 42.085C57.1157 41.9604 57.3644 41.7778 57.5653 41.5378C57.7661 41.2979 57.897 41.0184 57.9569 40.6983C58.0173 40.3783 57.9923 40.1011 57.8817 39.8664C57.7714 39.6313 57.5955 39.4491 57.3544 39.3189C57.1133 39.1891 56.8271 39.1243 56.4954 39.1243H55.2311L54.6889 42.2728ZM112.561 37.295L112.245 39.109H107.756L107.37 41.328H111.582L111.265 43.0971H107.063L106.563 45.9757H111.069L110.753 47.7901H104.213L106.007 37.295H112.561ZM30.8445 45.4062H27.337L25.8638 47.7901H23.4076L30.5495 36.6354L33.8344 47.7901H31.4986L30.8445 45.4062ZM28.1147 43.7119H30.6469L29.8865 40.6983L28.1147 43.7119ZM134.543 9.06847e-05H150.963L156.22 21.2029L168.212 9.06847e-05H185L152.254 47.821L134.543 9.06847e-05ZM93.7484 17.762C93.2203 20.5833 92.0937 23.0846 90.3685 25.2659C88.4086 27.744 85.9645 29.6709 83.0366 31.0476C80.1083 32.4242 76.9151 33.1123 73.4567 33.1123C70.0904 33.1123 67.1279 32.4126 64.5687 31.0131C62.0095 29.6137 60.073 27.6635 58.7583 25.163C57.6132 22.9833 57.1245 20.5168 57.2924 17.7624L69.3876 17.762C69.4029 18.521 69.5261 19.2443 69.7563 19.9321C70.1021 20.9646 70.6556 21.8017 71.4163 22.4442C72.1771 23.0866 73.1339 23.4079 74.2867 23.4079C75.5317 23.4539 76.6845 23.1671 77.7451 22.5475C78.8057 21.9279 79.7166 21.0904 80.4774 20.0354C80.9866 19.3289 81.3565 18.5715 81.5867 17.762H93.7484ZM98.2272 14.6383C98.8302 12.1093 99.911 9.84752 101.47 7.85288C103.406 5.3752 105.851 3.44825 108.802 2.07163C111.753 0.695009 114.935 0.00649564 118.347 0.00649564C121.713 0.00649564 124.676 0.717841 127.235 2.14012C129.794 3.56281 131.731 5.5246 133.045 8.02511C134.359 10.5256 134.809 13.3822 134.394 16.594C133.979 19.8976 132.791 22.7882 130.832 25.2659C128.872 27.744 126.428 29.6709 123.5 31.0476C120.572 32.4242 117.379 33.1123 113.92 33.1123C110.554 33.1123 107.591 32.4126 105.032 31.0131C102.473 29.6137 100.536 27.6635 99.2218 25.163C98.0767 22.9833 97.588 20.5168 97.7559 17.762H110.874L109.881 23.395L122.386 16.5596L112.291 9.72416L111.425 14.6383H98.2272ZM13.8164 17.7624L11.2745 32.4242H0L2.53063 17.7624H13.8164ZM32.4144 17.7624L29.9497 32.4242H18.1222L20.7965 17.7624H32.4144ZM51.2164 17.7624L48.6946 32.4242H36.8666L39.5506 17.7624H51.2164ZM3.0696 14.6383L5.46418 0.7639H16.7387L16.0472 5.03115C16.7387 4.02181 17.5458 3.14985 18.4679 2.41568C19.3901 1.68151 20.4278 1.09674 21.5806 0.660565C22.7334 0.224789 24.0243 0.00649564 25.454 0.00649564C27.0681 -0.0391648 28.4165 0.155899 29.5005 0.591675C30.5837 1.02785 31.4487 1.64707 32.094 2.45013C32.7396 3.2532 33.1779 4.18242 33.4082 5.23782C34.7453 3.67735 36.3135 2.41569 38.112 1.45201C39.91 0.488337 41.9391 0.00649564 44.1985 0.00649564C46.6884 -0.0391648 48.5561 0.47712 49.8011 1.55535C51.0465 2.63357 51.8302 4.06747 52.153 5.85704C52.4758 7.64661 52.4988 9.66528 52.2223 11.9139L51.7537 14.6383H40.1222L40.3943 13.1527C40.4406 12.3268 40.4406 11.5237 40.3943 10.7435C40.348 9.96367 40.1636 9.32122 39.8408 8.81655C39.5184 8.31188 38.9416 8.05955 38.112 8.05955C37.2816 8.05955 36.5325 8.25461 35.8639 8.64472C35.1954 9.03444 34.6302 9.608 34.1693 10.3654C33.708 11.122 33.3852 12.0284 33.2009 13.0838L32.9396 14.6383H21.366L21.6498 13.0838C21.742 12.2579 21.7537 11.4665 21.6844 10.7095C21.6152 9.95205 21.4192 9.32122 21.0964 8.81655C20.7735 8.31188 20.1971 8.05955 19.3671 8.05955C18.5834 8.05955 17.8686 8.24299 17.2229 8.61028C16.5773 8.97717 16.0238 9.51628 15.5629 10.2276C15.1017 10.9386 14.8022 11.8221 14.6637 12.8771L14.3586 14.6383H3.0696ZM57.7637 14.6383C58.3667 12.1093 59.4474 9.84752 61.0064 7.85288C62.9433 5.3752 65.387 3.44825 68.3383 2.07163C71.2895 0.695009 74.471 0.00649564 77.8836 0.00649564C81.2498 0.00649564 84.2124 0.717841 86.7716 2.14012C89.3308 3.56281 91.2677 5.5246 92.5815 8.02511C93.6228 10.0065 94.1215 12.211 94.0773 14.6383H81.9047C81.8641 14.118 81.7691 13.6229 81.6185 13.1527C81.2957 12.143 80.7427 11.3175 79.9585 10.675C79.1744 10.0326 78.183 9.68811 76.9843 9.64245C75.8315 9.59679 74.7133 9.89478 73.6298 10.5372C72.5458 11.1797 71.6353 12.0284 70.8975 13.0838C70.5529 13.5769 70.2631 14.0951 70.0292 14.6383H57.7637ZM79.9702 42.5424C79.9002 43.0022 79.9078 43.4348 79.9928 43.8393C80.0785 44.2442 80.2391 44.6015 80.4754 44.9115C80.7113 45.2211 81.0075 45.4686 81.3641 45.6533C81.7208 45.8383 82.135 45.9309 82.6071 45.9309C83.3103 45.9409 83.9455 45.8035 84.513 45.5187C85.0806 45.2335 85.5854 44.9015 86.0273 44.5214L85.6658 46.9206C85.1836 47.2502 84.6736 47.5126 84.1363 47.7076C83.5989 47.9023 82.9786 48 82.2758 48C81.4921 48 80.7889 47.8574 80.1663 47.5726C79.5436 47.2878 79.0287 46.8929 78.6218 46.3883C78.2148 45.8832 77.9262 45.3012 77.7556 44.6416C77.5845 43.9819 77.5547 43.2822 77.665 42.5424C77.7858 41.773 78.0317 41.0556 78.4036 40.3911C78.7751 39.7262 79.2445 39.1467 79.812 38.652C80.3796 38.157 81.02 37.7721 81.7333 37.4973C82.4465 37.2225 83.2101 37.0852 84.0236 37.0852C84.6966 37.0751 85.2766 37.1649 85.7637 37.3547C86.2507 37.5446 86.7056 37.8149 87.1274 38.1646L86.7506 40.5782C86.4294 40.1488 86.0374 39.8011 85.5753 39.5364C85.1132 39.2712 84.5509 39.1391 83.8879 39.1391C83.4158 39.1391 82.9637 39.224 82.5318 39.3938C82.0999 39.564 81.7059 39.804 81.3493 40.1136C80.9926 40.4236 80.6936 40.7833 80.4524 41.193C80.2113 41.6027 80.0507 42.0525 79.9702 42.5424ZM131.259 37.295H133.384L131.907 45.9156H135.991L135.659 47.7901H129.451L131.259 37.295Z" fill="#1DFB9D"/>
      </svg>
      <div class="tag">PREPAID RETURN</div>
    </div>

    <div class="courier-band">
      <div class="c-name">${courierName}</div>
      <div class="badge">NO PRINTER REQUIRED</div>
    </div>

    <div class="qr-stage">
      <div class="qr-box">
        ${centralGraphic}
      </div>
      <div class="tracking-label">Tracking Number</div>
      <div class="tracking-num">${trackingNumber || '—'}</div>
    </div>

    <div class="addresses">
      <div class="addr-block">
        <div class="addr-title">RETURN DESTINATION:</div>
        <div class="addr-name">${resolvedShipTo.company_name || resolvedShipTo.name}</div>
        <div>${resolvedShipTo.address_1} ${resolvedShipTo.address_2 || ''}</div>
        <div><strong>${resolvedShipTo.city}, ${resolvedShipTo.postcode}</strong></div>
      </div>
      <div class="addr-block" style="margin-bottom: 0;">
        <div class="addr-title">CUSTOMER / SENDER:</div>
        <div class="addr-name">${shipFrom.name || 'Shopper'}</div>
        <div>${shipFrom.address_1 || ''} ${shipFrom.address_2 || ''}</div>
        <div><strong>${shipFrom.city || ''}, ${shipFrom.postcode || ''}</strong></div>
      </div>
    </div>

    <div class="footer">
      <div>Moov Parcel Returns Platform</div>
      <span>${customer.name.toUpperCase()}</span>
    </div>
  </div>
</body>
</html>`;
}

// ----------------------------------------------------
// RETURNS HISTORY PERSISTENCE (JSON + PostgreSQL fallback)
// ----------------------------------------------------
const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'returns_history.json');

function readHistoryFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(HISTORY_FILE)) {
      fs.writeFileSync(HISTORY_FILE, '[]', 'utf8');
      return [];
    }
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('Error reading returns history file:', e.message);
    return [];
  }
}

function writeHistoryFile(list) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing returns history file:', e.message);
  }
}

/**
 * Save a newly created return booking to history
 */
function saveReturnBooking(booking = {}) {
  const history = readHistoryFile();
  const id = booking.id || `RET-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const customerId = String(booking.customer_id || 'buffalo').toLowerCase();
  const customer = CUSTOMERS[customerId] || { name: 'Customer Return' };

  const record = {
    id,
    created_at: booking.created_at || new Date().toISOString(),
    customer_id: customerId,
    customer_name: customer.name || 'Unknown',
    service_code: booking.service_code || 'DPD',
    tracking_number: booking.tracking_number || '',
    barcode_ref: booking.barcode_ref || '',
    reference: booking.reference || '',
    ship_from: booking.ship_from || {},
    ship_to: booking.ship_to || {},
    label_url: booking.label_url || null,
    label_pdf: booking.label_pdf || null,
    qr_code_url: booking.qr_code_url || null,
    qr_code_base64: booking.qr_code_base64 || null,
    branded_html: booking.branded_html || null
  };

  // Add to top of list
  history.unshift(record);
  if (history.length > 500) history.length = 500;
  writeHistoryFile(history);

  return record;
}

/**
 * List return bookings with optional filtering
 */
function listReturnBookings({ search, customerId, limit = 100 } = {}) {
  let list = readHistoryFile();

  if (customerId && customerId !== 'all') {
    list = list.filter(r => String(r.customer_id).toLowerCase() === String(customerId).toLowerCase());
  }

  if (search && typeof search === 'string' && search.trim()) {
    const term = search.trim().toLowerCase();
    list = list.filter(r => {
      const matchTrack = (r.tracking_number || '').toLowerCase().includes(term);
      const matchCust = (r.customer_name || '').toLowerCase().includes(term);
      const matchName = (r.ship_from?.name || '').toLowerCase().includes(term);
      const matchPostcode = (r.ship_from?.postcode || '').toLowerCase().includes(term);
      const matchCity = (r.ship_from?.city || '').toLowerCase().includes(term);
      const matchRef = (r.reference || '').toLowerCase().includes(term);
      const matchBarcodeRef = (r.barcode_ref || '').toLowerCase().includes(term);
      return matchTrack || matchCust || matchName || matchPostcode || matchCity || matchRef || matchBarcodeRef;
    });
  }

  return list.slice(0, Number(limit) || 100);
}

/**
 * Get single booking by ID or Tracking Number
 */
function getReturnBookingById(id) {
  if (!id) return null;
  const list = readHistoryFile();
  const searchId = String(id).trim();
  return list.find(r => String(r.id) === searchId || String(r.tracking_number) === searchId) || null;
}

/**
 * Delete a booking from history
 */
function deleteReturnBooking(id) {
  if (!id) return false;
  let list = readHistoryFile();
  const initialLen = list.length;
  const searchId = String(id).trim();
  list = list.filter(r => String(r.id) !== searchId && String(r.tracking_number) !== searchId);
  if (list.length !== initialLen) {
    writeHistoryFile(list);
    return true;
  }
  return false;
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
  extractLabelInfo,
  generateBarcodeSvg,
  generateBrandedReturnHtml,
  saveReturnBooking,
  listReturnBookings,
  getReturnBookingById,
  deleteReturnBooking
};
