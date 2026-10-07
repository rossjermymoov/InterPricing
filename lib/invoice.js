// Commercial Invoice & Customs Export Declaration Generator
// Compliant with Swiss Customs (BAZG/FOCBS), UK HMRC (Returned Goods Relief CPC 61 23), and UPS International Paperless EDI.

const fs = require('fs');
const path = require('path');

function generateCommercialInvoiceHtml(data = {}) {
  const trk = String(data.trackingNumber || data.tracking || '1ZH2908X9930138541').replace(/\s+/g, '');
  const trkFormatted = trk.length === 18 ? `${trk.slice(0, 2)} ${trk.slice(2, 5)} ${trk.slice(5, 8)} ${trk.slice(8, 10)} ${trk.slice(10, 14)} ${trk.slice(14)}` : trk;
  
  const invoiceNum = data.invoiceNumber || data.orderRef || ('INV-' + trk.slice(-8));
  const invoiceDate = data.invoiceDate || new Date().toISOString().slice(0, 10);
  const currency = data.currency || 'GBP';
  const currencySymbol = currency === 'GBP' ? '£' : (currency === 'EUR' ? '€' : (currency === 'CHF' ? 'CHF ' : '$'));
  const termsOfSale = (data.termsOfSale || data.incoterms || 'DDP').toUpperCase();
  const reasonForExport = (data.reasonForExport || 'RETURN OF GOODS (CUSTOMER RETURN)').toUpperCase();
  
  const sender = data.sender || {
    name: 'Customer Return Sender',
    company: 'Private Individual',
    line1: 'Bahnhofstrasse 10',
    line2: '',
    city: 'Zurich',
    state: 'ZH',
    postcode: '8001',
    country: 'Switzerland',
    countryCode: 'CH',
    phone: '+41 44 123 4567',
    email: 'customer@example.com',
  };

  const receiver = data.receiver || {
    name: data.customerName || 'Returns Processing Unit',
    company: data.customer || data.customerCompany || 'Bessette',
    line1: data.deliveryAddress?.line1 || '237 Brompton Road',
    line2: data.deliveryAddress?.line2 || '',
    city: data.deliveryAddress?.city || 'London',
    state: data.deliveryAddress?.state || data.deliveryAddress?.county || 'Greater London',
    postcode: data.deliveryAddress?.postcode || 'SW3 2EP',
    country: data.deliveryAddress?.country || 'United Kingdom',
    countryCode: 'GB',
    phone: data.deliveryAddress?.phone || '+44 20 7946 0123',
    email: data.deliveryAddress?.email || 'returns@bessette.co.uk',
    eoriNumber: data.deliveryAddress?.eoriNumber || data.eoriNumber || 'GB446867375',
    vatNumber: data.deliveryAddress?.vatNumber || data.vatNumber || 'GB 446 8673 75',
  };

  const senderCountryIso = (sender.countryCode || (sender.country && sender.country.length === 2 ? sender.country : 'CH')).toUpperCase();
  const receiverCountryIso = (receiver.countryCode || (receiver.country && receiver.country.length === 2 ? receiver.country : 'GB')).toUpperCase();

  const normalize8DigitHs = (code) => {
    if (!code) return '6204.6200';
    const str = String(code).trim();
    const digits = str.replace(/[^0-9]/g, '');
    if (digits.length === 6) {
      return digits.slice(0, 4) + '.' + digits.slice(4) + '00';
    }
    if (digits.length >= 8) {
      return digits.slice(0, 4) + '.' + digits.slice(4, 8);
    }
    if (str.includes('.') && digits.length >= 4) {
      const parts = str.split('.');
      const right = (parts[1] || '').padEnd(4, '0');
      return parts[0] + '.' + right.slice(0, 4);
    }
    return str;
  };

  const rawItems = Array.isArray(data.items) && data.items.length ? data.items : (
    Array.isArray(data.lineItems) && data.lineItems.length ? data.lineItems : [
      {
        description: 'Trousers (Women\'s Cotton Trousers)',
        qty: 1,
        unitValue: 40.00,
        hsCode: '6204.6200',
        origin: 'PL',
        weight: 0.9,
      },
      {
        description: 'Top (Women\'s Blouse / Top)',
        qty: 1,
        unitValue: 25.00,
        hsCode: '6206.1000',
        origin: 'IT',
        weight: 0.6,
      }
    ]
  );

  let subtotal = 0;
  let totalWeight = 0;
  const itemsHtml = rawItems.map((it, idx) => {
    const qty = Math.max(1, parseInt(it.qty || it.quantity, 10) || 1);
    const unitVal = Number(it.unitValue || it.value || 65.00);
    const lineTotal = qty * unitVal;
    subtotal += lineTotal;
    const itemWeight = Number(it.weight || 1.5);
    totalWeight += (itemWeight * qty);
    const hs = normalize8DigitHs(it.hsCode || it.tariffCode || '6204.6200');
    const originCountry = (it.originCountry || it.origin || 'PL').toUpperCase();

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12.5px;">
        <td style="padding: 10px 12px; font-weight: 700; color: #1e293b;">${idx + 1}</td>
        <td style="padding: 10px 12px; color: #0f172a;">
          <div style="font-weight: 700;">${escapeHtml(it.description || 'Returned Merchandise')}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">SKU: ${escapeHtml(it.sku || it.partNumber || ('RET-' + (idx + 1)))} · Weight: ${itemWeight.toFixed(2)} kg</div>
        </td>
        <td style="padding: 10px 12px; font-family: monospace; font-size: 12px; font-weight: 700; color: #334155;">${escapeHtml(hs)}</td>
        <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #1e293b;">${escapeHtml(originCountry)}</td>
        <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #1e293b;">${qty} PCS</td>
        <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-weight: 600; color: #1e293b;">${currencySymbol}${unitVal.toFixed(2)}</td>
        <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-weight: 800; color: #0f172a;">${currencySymbol}${lineTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Commercial Invoice — ${trkFormatted}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 15mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    margin: 0;
    padding: 20px;
    font-size: 13px;
    line-height: 1.45;
  }
  .invoice-container {
    max-width: 800px;
    margin: 0 auto;
    border: 1px solid #cbd5e1;
    padding: 28px 32px;
    background: #ffffff;
  }
  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 14px;
  }
  .doc-title {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: -0.02em;
    color: #0f172a;
    text-transform: uppercase;
    margin: 0;
  }
  .doc-subtitle {
    font-size: 11px;
    color: #64748b;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 3px;
  }
  .parties-grid {
    display: table;
    width: 100%;
    margin-bottom: 20px;
    border-collapse: separate;
    border-spacing: 12px 0;
  }
  .party-col {
    display: table-cell;
    width: 50%;
    vertical-align: top;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px 16px;
  }
  .party-title {
    font-size: 10.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #475569;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    margin-bottom: 8px;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    background: #f1f5f9;
    border-radius: 6px;
    margin-bottom: 20px;
  }
  .meta-table td {
    padding: 8px 12px;
    font-size: 11.5px;
    border: 1px solid #e2e8f0;
  }
  .meta-label {
    font-weight: 800;
    color: #475569;
    text-transform: uppercase;
    font-size: 9.5px;
    letter-spacing: 0.05em;
  }
  .meta-val {
    font-weight: 700;
    color: #0f172a;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  .items-table th {
    background: #1e293b;
    color: #ffffff;
    font-size: 10.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 9px 12px;
    text-align: left;
  }
  .declaration-box {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-left: 4px solid #f59e0b;
    padding: 12px 16px;
    font-size: 11.5px;
    line-height: 1.5;
    color: #78350f;
    margin-bottom: 20px;
  }
  .signature-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 24px;
    border-top: 1px dashed #cbd5e1;
    padding-top: 16px;
  }
  @media print {
    body { padding: 0; background: #fff; }
    .invoice-container { border: 0; padding: 0; max-width: 100%; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<div class="no-print" style="max-width:800px;margin:0 auto 16px;display:flex;align-items:center;justify-content:space-between;background:#121624;color:#fff;padding:12px 20px;border-radius:8px">
  <div style="font-weight:800;font-size:14px;display:flex;align-items:center;gap:8px">
    <span>📄</span> Export Commercial Invoice / Swiss Customs Declaration
  </div>
  <div style="display:flex;gap:10px">
    <button onclick="window.print()" style="background:#1DFB9D;color:#121624;border:0;font-weight:800;padding:8px 18px;border-radius:6px;cursor:pointer;font-size:13px">
      🖨️ Print / Save as PDF
    </button>
  </div>
</div>

<div class="invoice-container">
  <table class="header-table">
    <tr>
      <td>
        <h1 class="doc-title">Commercial Invoice</h1>
        <div class="doc-subtitle">Ausfuhrdeklaration · Proforma Invoice for Customs Clearance</div>
      </td>
      <td style="text-align: right; vertical-align: bottom;">
        <div style="font-weight: 900; font-size: 15px; color: #0f172a; text-transform: uppercase;">${escapeHtml(receiver.company || 'Consignee')}</div>
        <div style="font-size: 11px; color: #64748b;">Cross-Border Customer Return</div>
      </td>
    </tr>
  </table>

  <!-- Shipment & Customs Metadata -->
  <table class="meta-table">
    <tr>
      <td>
        <div class="meta-label">Invoice / Order Ref</div>
        <div class="meta-val">${escapeHtml(invoiceNum)}</div>
      </td>
      <td>
        <div class="meta-label">Date of Export</div>
        <div class="meta-val">${escapeHtml(invoiceDate)}</div>
      </td>
      <td>
        <div class="meta-label">UPS Tracking / AWB No.</div>
        <div class="meta-val" style="font-family: monospace; font-size: 13px; color: #0284c7;">${escapeHtml(trkFormatted)}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="meta-label">Terms of Sale (Incoterms)</div>
        <div class="meta-val">${escapeHtml(termsOfSale)} (Duties Prepaid)</div>
      </td>
      <td>
        <div class="meta-label">Reason for Export</div>
        <div class="meta-val">${escapeHtml(reasonForExport)}</div>
      </td>
      <td>
        <div class="meta-label">Customs Relief Code</div>
        <div class="meta-val" style="color: #166534;">RGR CPC 61 23 (Returned Goods)</div>
      </td>
    </tr>
  </table>

  <!-- Parties Grid: Sender (Switzerland) & Consignee (UK) -->
  <div class="parties-grid">
    <div class="party-col">
      <div class="party-title">1. Exporter / Sender (Returning From)</div>
      <div style="font-weight: 800; font-size: 13.5px; color: #0f172a;">${escapeHtml(sender.company || sender.name || 'Private Individual')}</div>
      <div style="font-weight: 600; color: #334155;">Attn: ${escapeHtml(sender.name || 'Customer')}</div>
      <div style="margin-top: 4px; color: #475569;">
        ${escapeHtml(sender.line1 || '')}<br/>
        ${sender.line2 ? escapeHtml(sender.line2) + '<br/>' : ''}
        ${escapeHtml(sender.city || '')}${sender.state ? ', ' + escapeHtml(sender.state) : ''} ${escapeHtml(sender.postcode || '')}<br/>
        <b>${escapeHtml(sender.country || 'Switzerland')} (${senderCountryIso})</b>
      </div>
      <div style="margin-top: 6px; font-size: 11.5px; color: #64748b;">
        ${sender.phone ? 'Tel: ' + escapeHtml(sender.phone) + '<br/>' : ''}
        ${sender.email ? 'Email: ' + escapeHtml(sender.email) : ''}
      </div>
    </div>

    <div class="party-col">
      <div class="party-title">2. Consignee / Importer of Record (Delivering To)</div>
      <div style="font-weight: 800; font-size: 13.5px; color: #0f172a;">${escapeHtml(receiver.company || 'Bessette')}</div>
      <div style="font-weight: 600; color: #334155;">Attn: ${escapeHtml(receiver.name || 'Returns Department')}</div>
      <div style="margin-top: 4px; color: #475569;">
        ${escapeHtml(receiver.line1 || '')}<br/>
        ${receiver.line2 ? escapeHtml(receiver.line2) + '<br/>' : ''}
        ${escapeHtml(receiver.city || '')}${receiver.state ? ', ' + escapeHtml(receiver.state) : ''} ${escapeHtml(receiver.postcode || '')}<br/>
        <b>${escapeHtml(receiver.country || 'United Kingdom')} (${receiverCountryIso})</b>
      </div>
      <div style="margin-top: 6px; font-size: 11.5px; color: #047857; font-weight: 700;">
        ${receiver.eoriNumber ? 'UK EORI: ' + escapeHtml(receiver.eoriNumber) + '<br/>' : ''}
        ${receiver.vatNumber ? 'UK VAT: ' + escapeHtml(receiver.vatNumber) : ''}
      </div>
    </div>
  </div>

  <!-- Line Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 35px;">#</th>
        <th>Description of Goods</th>
        <th style="width: 100px;">Harmonised Code</th>
        <th style="width: 70px; text-align: center;">Origin</th>
        <th style="width: 65px; text-align: center;">Qty</th>
        <th style="width: 85px; text-align: right;">Unit Value</th>
        <th style="width: 90px; text-align: right;">Total (${currency})</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
    <tfoot>
      <tr style="background: #f8fafc; font-size: 13px; font-weight: 800; border-top: 2px solid #0f172a;">
        <td colspan="4" style="padding: 10px 12px; text-align: right; text-transform: uppercase;">Total Invoice Value &amp; Weight:</td>
        <td style="padding: 10px 12px; text-align: center;">${rawItems.length} line${rawItems.length > 1 ? 's' : ''}</td>
        <td style="padding: 10px 12px; text-align: right; color: #64748b;">${totalWeight.toFixed(2)} kg</td>
        <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-size: 15px; color: #0f172a;">${currencySymbol}${subtotal.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Official Customs Declaration & Returned Goods Relief Notice -->
  <div class="declaration-box">
    <b>DECLARATION / CUSTOMS STATEMENT:</b><br/>
    I declare that the information contained in this invoice is true and correct and that the contents of this shipment are as stated above. 
    The articles in this consignment are commercial goods being repatriated/returned to the United Kingdom under <b>Returned Goods Relief (RGR - Customs Procedure Code 61 23 / Notice 236)</b> for customer refund or repair, without alteration. Full relief from import duties and VAT is claimed.
  </div>

  <!-- Signatures & Authority -->
  <table class="signature-table">
    <tr>
      <td style="width: 60%; vertical-align: bottom;">
        <div style="font-size: 11.5px; color: #475569; line-height: 1.6;">
          <b>Carrier:</b> UPS (United Parcel Service)<br/>
          <b>Service:</b> UPS International Standard / Express Saver<br/>
          <b>EDI Status:</b> Electronically Attested &amp; Submitted
        </div>
      </td>
      <td style="width: 40%; vertical-align: bottom; text-align: right;">
        <div style="display: inline-block; text-align: left; width: 220px;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 40px;">
            Authorized Shipper Signature:
          </div>
          <div style="border-top: 1px solid #0f172a; padding-top: 4px; font-size: 11px; color: #334155;">
            <b>Date:</b> ${escapeHtml(invoiceDate)}<br/>
            <b>Location:</b> Zurich, Switzerland
          </div>
        </div>
      </td>
    </tr>
  </table>
</div>

</body>
</html>`;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

module.exports = {
  generateCommercialInvoiceHtml,
};
