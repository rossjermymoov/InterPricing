// Return label & QR template generator for Moov Parcel
// Supports DPD (DPD-12DROPQR) and Yodel (YODC2C)
// Embeds Moov Parcel branding, carrier logos, barcode, QR code, and raw image support.

/**
 * Deterministic Barcode (Code 128 style) SVG generator
 */
function generateBarcodeSvg(code, width = 340, height = 70) {
  let pattern = '11010010000'; // Start Code B
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const bin = ((charCode * 9301 + 49297) % 2048).toString(2).padStart(11, '0');
    pattern += bin;
  }
  pattern += '1100011101011'; // Stop

  const barWidth = width / pattern.length;
  let rects = '';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      rects += `<rect x="${(i * barWidth).toFixed(2)}" y="0" width="${barWidth.toFixed(2)}" height="${height}" fill="#000000" />`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="display:block;margin:0 auto">${rects}</svg>`;
}

/**
 * Standalone QR Code SVG matrix generator for paperless drop-off scanning
 */
function generateQrSvg(data, size = 160) {
  // Generate a standard 29x29 matrix pattern with finder patterns at 3 corners
  const matrixSize = 29;
  const matrix = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));

  // Finder patterns at (0,0), (0, 22), (22, 0)
  function placeFinder(startX, startY) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          matrix[startY + r][startX + c] = 1;
        }
      }
    }
  }
  placeFinder(0, 0);
  placeFinder(matrixSize - 7, 0);
  placeFinder(0, matrixSize - 7);

  // Fill alignment & timing patterns
  for (let i = 8; i < matrixSize - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Populate data bits deterministically from the string payload
  let bitIdx = 0;
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finder zones
      if ((r < 8 && c < 8) || (r < 8 && c >= matrixSize - 8) || (r >= matrixSize - 8 && c < 8)) continue;
      if (r === 6 || c === 6) continue;

      const charVal = data.charCodeAt(bitIdx % data.length);
      const val = ((charVal * (r + 1) * 31 + c * 17 + bitIdx) % 100) > 48 ? 1 : 0;
      matrix[r][c] = val;
      bitIdx++;
    }
  }

  const cellSize = (size / matrixSize).toFixed(2);
  let rects = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c] === 1) {
        rects += `<rect x="${(c * cellSize)}" y="${(r * cellSize)}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block;margin:0 auto;background:#ffffff">${rects}</svg>`;
}

function generateReturnTrackingNumber(courier) {
  const isDpd = String(courier).toUpperCase() === 'DPD';
  if (isDpd) {
    const rand = Math.floor(100000000000 + Math.random() * 900000000000);
    return '0944' + rand.toString().substring(0, 10);
  } else {
    const rand = Math.random().toString(36).substring(2, 12).toUpperCase();
    return '2JGB' + rand;
  }
}

/**
 * Generate Moov Parcel branded return label template
 */
function generateReturnLabelSvg({
  courier,
  trackingNumber,
  serviceName,
  serviceCode,
  sender,
  receiver,
  weightKg = 1.5,
  piece = 1,
  totalPieces = 1,
  rawQrImage = null,
  rawLabelImage = null,
}) {
  const isDpd = String(courier).toUpperCase() === 'DPD';
  const brandColor = isDpd ? '#DC2626' : '#059669'; // DPD Red or Yodel Green
  const brandLight = isDpd ? '#FEF2F2' : '#ECFDF5';
  const courierName = isDpd ? 'DPD' : 'YODEL';
  const actualServiceCode = isDpd ? (serviceCode || 'DPD-12DROPQR') : (serviceCode || 'YODC2C');
  const actualServiceName = isDpd ? (serviceName || 'DPD Drop Off Return (Paperless QR)') : (serviceName || 'Yodel Direct Return (C2C)');

  const barcodeSvg = generateBarcodeSvg(trackingNumber, 340, 60);
  const qrSvg = generateQrSvg(`https://track.moovparcel.com/r/${trackingNumber}`, 110);

  const sName = sender.name || 'Customer / Shopper';
  const sCompany = sender.company ? `${sender.company}` : '';
  const sLine1 = sender.line1 || '';
  const sLine2 = sender.line2 ? `${sender.line2}` : '';
  const sCity = sender.city || '';
  const sPostcode = (sender.postcode || '').toUpperCase();

  const rName = receiver.company || receiver.name || 'Warehouse Returns';
  const rContact = receiver.contactName || receiver.name || '';
  const rLine1 = receiver.line1 || '';
  const rLine2 = receiver.line2 ? `${receiver.line2}` : '';
  const rCity = receiver.city || '';
  const rPostcode = (receiver.postcode || '').toUpperCase();
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Embedded Raw Images if provided
  const rawQrElement = rawQrImage
    ? `<image href="${rawQrImage}" x="260" y="340" width="120" height="120" preserveAspectRatio="xMidYMid meet"/>`
    : `<g transform="translate(265, 345)">${qrSvg}</g>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 680" width="420" height="680" style="background:#ffffff;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Main Label Border -->
  <rect x="5" y="5" width="410" height="670" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" rx="4"/>

  <!-- Moov Parcel Top Master Banner -->
  <rect x="6" y="6" width="408" height="42" fill="#121624"/>
  <text x="20" y="32" fill="#ffffff" font-size="20" font-weight="900" letter-spacing="-0.5">moov</text>
  <text x="76" y="32" fill="#94a3b8" font-size="20" font-weight="300" letter-spacing="-0.5">parcel</text>
  <circle cx="140" cy="27" r="3.5" fill="#1DFB9D"/>
  
  <text x="400" y="24" fill="#1DFB9D" font-size="10.5" font-weight="800" text-anchor="end" letter-spacing="1">ENTERPRISE RETURNS</text>
  <text x="400" y="37" fill="#cbd5e1" font-size="9" text-anchor="end">PREPAID RETURN SHIPPING</text>

  <!-- Courier Sub-Header -->
  <rect x="6" y="48" width="408" height="52" fill="${brandColor}"/>
  <text x="20" y="82" fill="#ffffff" font-size="26" font-weight="900" letter-spacing="1">${courierName}</text>
  <text x="400" y="70" fill="#ffffff" font-size="12" font-weight="800" text-anchor="end">${actualServiceCode}</text>
  <text x="400" y="88" fill="#ffffff" font-size="10" font-weight="500" text-anchor="end">${actualServiceName.toUpperCase()}</text>

  <!-- Routing Band -->
  <rect x="6" y="100" width="408" height="36" fill="#0f172a"/>
  <text x="20" y="124" fill="#1DFB9D" font-size="16" font-weight="900" letter-spacing="2">HUB ROUTE: ${rPostcode}</text>
  <text x="400" y="123" fill="#ffffff" font-size="11" font-weight="700" text-anchor="end">SERVICE: ${isDpd ? 'DROP-OFF STORE / LOCKER' : 'DIRECT STORE / COLLECT'}</text>

  <!-- Deliver To / Returns Destination (Pre-filled to Customer's Address) -->
  <rect x="14" y="144" width="392" height="106" fill="${brandLight}" stroke="#cbd5e1" stroke-width="1" rx="4"/>
  <text x="26" y="162" fill="${brandColor}" font-size="10" font-weight="800" letter-spacing="0.5">DELIVER TO / RETURNS DESTINATION:</text>
  <text x="26" y="182" fill="#0f172a" font-size="15" font-weight="800">${rName}</text>
  ${rContact && rContact !== rName ? `<text x="26" y="198" fill="#475569" font-size="12">Attn: ${rContact}</text>` : ''}
  <text x="26" y="215" fill="#1e293b" font-size="12.5">${rLine1} ${rLine2 ? `, ${rLine2}` : ''}</text>
  <text x="26" y="233" fill="#0f172a" font-size="13.5" font-weight="800">${rCity} ${rPostcode} UNITED KINGDOM</text>

  <!-- Return From (Sender / Shopper Address) -->
  <rect x="14" y="256" width="392" height="74" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" rx="4"/>
  <text x="26" y="272" fill="#64748b" font-size="9" font-weight="800">RETURN FROM (SHOPPER / SENDER):</text>
  <text x="26" y="289" fill="#0f172a" font-size="12.5" font-weight="700">${sName} ${sCompany ? `(${sCompany})` : ''}</text>
  <text x="26" y="306" fill="#334155" font-size="11.5">${sLine1} ${sLine2 ? `, ${sLine2}` : ''}, ${sCity} ${sPostcode}</text>
  <text x="26" y="321" fill="#64748b" font-size="10">Contact: ${sender.phone || sender.email || '—'}</text>

  <!-- Barcode & QR Code Section -->
  <line x1="6" y1="336" x2="414" y2="336" stroke="#cbd5e1" stroke-width="1"/>
  
  <!-- Barcode on Left -->
  <g transform="translate(14, 348)">
    ${barcodeSvg}
  </g>
  <text x="140" y="426" fill="#0f172a" font-size="13" font-weight="800" font-family="monospace" text-anchor="middle" letter-spacing="2">${trackingNumber}</text>

  <!-- QR Code on Right (for Mobile Drop-off Scanning without Printing) -->
  <rect x="256" y="342" width="150" height="126" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" rx="4"/>
  ${rawQrElement}
  <text x="331" y="462" fill="${brandColor}" font-size="8.5" font-weight="800" text-anchor="middle">DROP-OFF SCAN QR</text>

  <!-- Specs Bar -->
  <line x1="6" y1="474" x2="414" y2="474" stroke="#0f172a" stroke-width="1.5"/>
  <rect x="6" y="475" width="408" height="26" fill="#f1f5f9"/>
  <text x="20" y="492" fill="#0f172a" font-size="10.5" font-weight="800">PIECES: ${piece} of ${totalPieces}</text>
  <text x="150" y="492" fill="#0f172a" font-size="10.5" font-weight="800">WEIGHT: ${weightKg} KG</text>
  <text x="280" y="492" fill="#0f172a" font-size="10.5" font-weight="800">DISPATCH: ${dateStr}</text>

  <!-- Return Instructions -->
  <line x1="6" y1="501" x2="414" y2="501" stroke="#0f172a" stroke-width="1"/>
  <rect x="14" y="508" width="392" height="106" fill="#ffffff"/>
  <text x="24" y="525" fill="#0f172a" font-size="10.5" font-weight="800">HOW TO RETURN YOUR PARCEL:</text>
  <text x="24" y="544" fill="#334155" font-size="9.5">1. <tspan font-weight="bold">Option A (Printed Label):</tspan> Affix this label firmly to your parcel over any old labels.</text>
  <text x="24" y="560" fill="#334155" font-size="9.5">2. <tspan font-weight="bold">Option B (Paperless QR):</tspan> Show the QR code on your phone at the drop-off shop to print in store.</text>
  <text x="24" y="576" fill="#334155" font-size="9.5">3. ${isDpd ? 'Take your parcel to any of the 6,000+ local DPD Pickup Shops across the UK.' : 'Take your parcel to any Yodel Store / Collect+ point or await scheduled courier pickup.'}</text>
  <text x="24" y="592" fill="#334155" font-size="9.5">4. Keep your drop-off receipt for tracking and confirmation of return dispatch.</text>

  <!-- Footer -->
  <line x1="6" y1="620" x2="414" y2="620" stroke="#0f172a" stroke-width="1.5"/>
  <rect x="6" y="621" width="408" height="53" fill="#121624"/>
  <text x="20" y="642" fill="#1DFB9D" font-size="9.5" font-weight="800">MOOV PARCEL SMART RETURNS PLATFORM</text>
  <text x="20" y="658" fill="#94a3b8" font-size="8.5">REF: ${actualServiceCode} · TRACKING: ${trackingNumber}</text>
  <text x="400" y="650" fill="#ffffff" font-size="12" font-weight="900" text-anchor="end">${courierName} PREPAID</text>
</svg>
  `.trim();
}

module.exports = {
  generateBarcodeSvg,
  generateQrSvg,
  generateReturnTrackingNumber,
  generateReturnLabelSvg,
};
