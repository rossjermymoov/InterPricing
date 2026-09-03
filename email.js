// Email dispatch service for sending shipping labels and collection confirmations via Google Workspace / SMTP.
const nodemailer = require('nodemailer');

function getTransporter() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER || 'service@moovparcel.co.uk';
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || '';
  if (!pass) return null;

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

function isConfigured() {
  return !!(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD);
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendShipmentLabelsEmail({ to, cc, shipment, customMessage, pdfBase64, pdfFilename }) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error('Email sending is not configured yet. Please set GMAIL_APP_PASSWORD in your environment variables.');
  }

  const s = (typeof shipment.sender === 'object' && shipment.sender) ? shipment.sender : {};
  const r = (typeof shipment.receiver === 'object' && shipment.receiver) ? shipment.receiver : {};
  const pkgs = (Array.isArray(shipment.packages) && shipment.packages.length) ? shipment.packages : [];
  const totalParcels = pkgs.reduce((sum, p) => sum + (parseInt(p.qty, 10) || 1), 0) || (shipment.parcels || 1);
  const totalWeight = Number(shipment.total_weight_kg) || pkgs.reduce((sum, p) => sum + (Number(p.weight) || 0) * (parseInt(p.qty, 10) || 1), 0) || 1;

  const tracking = shipment.tracking_number || '—';
  const prn = shipment.prn || 'Pending driver booking';
  const service = shipment.service_name || shipment.service_code || 'UPS Worldwide Saver';
  const pickupDate = shipment.pickup_date || 'As confirmed';
  const timeWindow = (shipment.ready_time && shipment.close_time) ? (shipment.ready_time + ' – ' + shipment.close_time) : '10:00 – 17:00';

  const supplierName = s.company || s.name || 'Supplier';
  const recipientName = r.company || r.name || 'Client';

  const subject = 'Shipping Labels & Collection Confirmed: ' + supplierName + ' → ' + recipientName + ' (Tracking: ' + tracking + ' · PRN: ' + prn + ')';

  const senderAddressStr = [s.line1, s.line2, s.city, s.postcode, s.country].filter(Boolean).join(', ');
  const receiverAddressStr = [r.line1, r.line2, r.city, r.postcode, r.country || 'GB'].filter(Boolean).join(', ');

  const docs = shipment.documents_attached || shipment.documentsAttached || {};
  const hasElectronicDocs = !!(docs.invoice || docs.packingSlip || shipment.invoiceBase64);

  const textBody = [
    'Hi ' + recipientName + ',\n',
    'Your UPS import collection has been scheduled and the shipping labels are ready.\n',
    '======================================================================',
    'COLLECTION & SHIPMENT SUMMARY',
    '======================================================================',
    '• Carrier:                  UPS (' + service + ')',
    '• Tracking Number:          ' + tracking,
    '• Pickup Request No (PRN):  ' + prn,
    '• Scheduled Collection:     ' + pickupDate,
    '• Ready / Close Window:     ' + timeWindow,
    '• Customs Invoices:         ' + (hasElectronicDocs ? '✓ Electronic (Paperless Trade)' : '⚠️ Hardcopy required (3 signed copies at collection)'),
    '• Consignment Details:      ' + totalParcels + ' parcel' + (totalParcels === 1 ? '' : 's') + ' · ' + totalWeight + ' kg total\n',
    '======================================================================',
    'ADDRESS DETAILS',
    '======================================================================',
    '• Supplier / Collection Address:',
    '  ' + supplierName,
    '  ' + senderAddressStr,
    s.phone ? ('  Tel: ' + s.phone) : '',
    s.email ? ('  Email: ' + s.email) : '',
    '',
    '• UK Delivery Address:',
    '  ' + recipientName,
    '  ' + receiverAddressStr,
    r.phone ? ('  Tel: ' + r.phone) : '',
    r.email ? ('  Email: ' + r.email) : '',
    '',
    '======================================================================',
    'SHIPPING LABELS & DOCUMENTS',
    '======================================================================',
    'The official UPS barcode shipping labels are attached to this email.\n',
    'Track live courier journey:',
    'https://www.ups.com/track?tracknum=' + encodeURIComponent(tracking) + '\n',
    '======================================================================',
    'SUPPLIER INSTRUCTIONS FOR PICKUP:',
    '======================================================================',
    '1. Print the attached shipping label(s) for each parcel.',
    '2. Securely attach one label flat to the top surface of each carton (avoid placing tape over barcodes).',
    hasElectronicDocs
      ? ('3. Hand the packages to the UPS courier driver during the collection window. Quote PRN #' + prn + ' if requested (customs documentation is uploaded electronically).\n')
      : ('3. Hand the packages to the UPS courier driver during the collection window along with 3 signed copies of the Commercial Invoice (required for customs clearance). Quote PRN #' + prn + ' if requested.\n'),
    customMessage ? ('Note from sender:\n' + customMessage + '\n') : '',
    'If you have any questions or need to amend the collection details, reply directly to this email.\n',
    'Kind regards,',
    'MOOV Parcel Team',
    'service@moovparcel.co.uk | moovparcel.co.uk'
  ].filter(line => line !== '').join('\n');

  const htmlBody = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.5; color: #201e1d; background: #f3f2f2; margin: 0; padding: 24px 12px; }' +
    '.email-card { max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(32,30,29,.12); border-top: 4px solid #7B2FBE; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }' +
    '.header { background: #171B2D; color: #ffffff; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }' +
    '.header .brand { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; }' +
    '.header .brand span { color: #7B2FBE; }' +
    '.header .badge { font-size: 10px; font-weight: 800; background: #00C853; color: #000000; padding: 3px 8px; text-transform: uppercase; letter-spacing: .08em; }' +
    '.body { padding: 26px 24px; }' +
    'h2 { font-size: 18px; font-weight: 800; margin: 0 0 14px; color: #201e1d; }' +
    '.summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 3px solid #7B2FBE; padding: 16px; margin: 18px 0; }' +
    '.summary-grid { width: 100%; border-collapse: collapse; }' +
    '.summary-grid td { padding: 5px 0; font-size: 13.5px; }' +
    '.summary-grid td.label { color: #64748b; font-weight: 600; width: 45%; }' +
    '.summary-grid td.val { color: #0f172a; font-weight: 700; }' +
    '.prn-highlight { font-family: monospace; font-size: 14px; background: #d1fae5; color: #065f46; padding: 2px 6px; font-weight: 800; }' +
    '.track-highlight { font-family: monospace; font-size: 14px; color: #7B2FBE; font-weight: 800; }' +
    '.address-grid { width: 100%; border-collapse: collapse; margin: 18px 0; }' +
    '.address-card { background: #ffffff; border: 1px solid rgba(32,30,29,.12); padding: 14px; width: 50%; vertical-align: top; }' +
    '.address-title { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin-bottom: 6px; }' +
    '.instructions-box { background: #fffbeb; border: 1px solid #fef3c7; border-left: 3px solid #f59e0b; padding: 14px 16px; margin: 20px 0; }' +
    '.instructions-box h3 { margin: 0 0 8px; font-size: 13px; font-weight: 800; color: #92400e; text-transform: uppercase; }' +
    '.instructions-box ol { margin: 0; padding-left: 18px; font-size: 13px; color: #78350f; }' +
    '.instructions-box li { margin-bottom: 4px; }' +
    '.btn-track { display: inline-block; background: #7B2FBE; color: #ffffff !important; text-decoration: none; padding: 10px 22px; font-weight: 800; font-size: 13px; margin: 8px 0; }' +
    '.custom-note { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 12px 14px; margin: 16px 0; font-size: 13px; font-style: italic; color: #334155; }' +
    '.footer { background: #f8fafc; border-top: 1px solid rgba(32,30,29,.12); padding: 16px 24px; font-size: 12px; color: #64748b; }' +
    '</style></head><body><div class="email-card">' +
    '<div class="header"><div class="brand">moov <span>parcel</span></div><div class="badge">Collection Confirmed</div></div>' +
    '<div class="body"><h2>UPS Shipping Labels &amp; Collection Details</h2>' +
    '<p style="font-size:14px;color:#334155;margin:0 0 14px">Hi <b>' + esc(recipientName) + '</b>,</p>' +
    '<p style="font-size:14px;color:#334155;margin:0 0 16px">Your UPS import collection has been scheduled and the barcode shipping labels are ready for dispatch.</p>' +
    '<div class="summary-box"><table class="summary-grid">' +
    '<tr><td class="label">Carrier &amp; Service:</td><td class="val">UPS (' + esc(service) + ')</td></tr>' +
    '<tr><td class="label">Tracking Number:</td><td class="val"><span class="track-highlight">' + esc(tracking) + '</span></td></tr>' +
    '<tr><td class="label">Pickup Request No (PRN):</td><td class="val"><span class="prn-highlight">' + esc(prn) + '</span></td></tr>' +
    '<tr><td class="label">Collection Date:</td><td class="val">' + esc(pickupDate) + '</td></tr>' +
    '<tr><td class="label">Driver Ready Window:</td><td class="val">' + esc(timeWindow) + '</td></tr>' +
    '<tr><td class="label">Customs Documentation:</td><td class="val">' + (hasElectronicDocs ? '<span style="color:#059669;font-weight:700">✓ Electronic Paperless Upload</span>' : '<span style="color:#b45309;font-weight:700">⚠️ 3x Hardcopy Invoices at Pickup</span>') + '</td></tr>' +
    '<tr><td class="label">Parcels &amp; Weight:</td><td class="val">' + totalParcels + ' parcel' + (totalParcels === 1 ? '' : 's') + ' · ' + totalWeight + ' kg total</td></tr>' +
    '</table></div>' +
    '<table class="address-grid"><tr>' +
    '<td class="address-card" style="padding-right:10px"><div class="address-title">1. Supplier Collection Address</div><div style="font-weight:800;font-size:13.5px">' + esc(supplierName) + '</div><div style="font-size:12.5px;color:#64748b;margin-top:3px">' + esc(senderAddressStr) + '</div>' + (s.phone ? ('<div style="font-size:12px;color:#64748b;margin-top:3px">Tel: ' + esc(s.phone) + '</div>') : '') + '</td>' +
    '<td class="address-card" style="padding-left:10px"><div class="address-title">2. UK Delivery Address</div><div style="font-weight:800;font-size:13.5px">' + esc(recipientName) + '</div><div style="font-size:12.5px;color:#64748b;margin-top:3px">' + esc(receiverAddressStr) + '</div>' + (r.phone ? ('<div style="font-size:12px;color:#64748b;margin-top:3px">Tel: ' + esc(r.phone) + '</div>') : '') + '</td>' +
    '</tr></table>' +
    '<div class="instructions-box"><h3>Supplier Instructions for Collection</h3><ol>' +
    '<li><b>Print</b> the attached shipping label(s) for each parcel.</li>' +
    '<li><b>Attach</b> one label flat onto the top surface of each carton (avoid placing tape over barcodes).</li>' +
    (hasElectronicDocs
      ? '<li><b>Handover</b> the packages to the UPS courier driver during the collection window (customs invoice is uploaded electronically). Quote PRN <b>#' + esc(prn) + '</b> if requested.</li>'
      : '<li><b>Handover</b> the packages to the UPS courier driver during the collection window along with <b>3 signed copies of the Commercial Invoice</b> for UK customs clearance. Quote PRN <b>#' + esc(prn) + '</b> if requested.</li>') +
    '</ol></div>' +
    (customMessage ? ('<div class="custom-note"><b>Note:</b> ' + esc(customMessage) + '</div>') : '') +
    '<div style="text-align:center;margin:24px 0 12px"><a href="https://www.ups.com/track?tracknum=' + encodeURIComponent(tracking) + '" class="btn-track" target="_blank">Track Live Courier Journey →</a></div>' +
    '</div><div class="footer"><div style="font-weight:700;color:#334155;margin-bottom:2px">MOOV Parcel Team</div>' +
    '<div>Questions? Reply directly to this email or contact <a href="mailto:service@moovparcel.co.uk" style="color:#7B2FBE">service@moovparcel.co.uk</a>.</div></div>' +
    '</div></body></html>';

  const attachments = [];
  if (pdfBase64) {
    attachments.push({
      filename: pdfFilename || ('UPS_Shipping_Labels_' + tracking + '.pdf'),
      content: Buffer.from(pdfBase64.replace(/^data:[^;]+;base64,/, ''), 'base64'),
      contentType: 'application/pdf',
    });
  } else if (shipment.label_base64) {
    attachments.push({
      filename: 'UPS_Shipping_Label_' + tracking + '.gif',
      content: Buffer.from(shipment.label_base64.replace(/^data:[^;]+;base64,/, ''), 'base64'),
      contentType: 'image/gif',
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"MOOV Parcel Team" <service@moovparcel.co.uk>',
    replyTo: process.env.EMAIL_REPLY_TO || 'service@moovparcel.co.uk',
    to,
    cc: cc || undefined,
    subject,
    text: textBody,
    html: htmlBody,
    attachments: attachments.length ? attachments : undefined,
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = { getTransporter, isConfigured, sendShipmentLabelsEmail };
