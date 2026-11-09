import subprocess

# -------------------------------------------------------------
# 1. WRITE PRINT_BLUEPRINT.HTML (A4 Document with Demo Section)
# -------------------------------------------------------------
html_blueprint = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Moov Parcel - Sales Framework & Discovery Blueprint</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Jost:wght@500;600;700;800&family=Mulish:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 10mm 12mm 10mm 12mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Mulish', -apple-system, sans-serif;
      color: #171B2D;
      background: #FFFFFF;
      font-size: 8pt;
      line-height: 1.35;
    }
    h1, h2, h3, h4 {
      font-family: 'Jost', sans-serif;
      color: #0B0E1B;
      letter-spacing: -0.01em;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #1DFB9D;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .logo-text {
      font-family: 'Jost', sans-serif;
      font-weight: 800;
      font-size: 16pt;
      color: #171B2D;
      letter-spacing: -0.02em;
    }
    .logo-text span { color: #04A562; }
    .header-sub {
      font-size: 7.2pt;
      color: #555;
      text-align: right;
      line-height: 1.3;
    }
    .desk-meta-box {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      background: #F4F6F9;
      border: 1px solid #DFE2E8;
      border-radius: 6px;
      padding: 5px 8px;
      font-size: 7.5pt;
      margin-bottom: 8px;
    }
    .section-title {
      font-size: 10pt;
      font-weight: 700;
      color: #171B2D;
      margin: 8px 0 5px 0;
      display: flex;
      align-items: center;
      gap: 6px;
      border-left: 3px solid #04A562;
      padding-left: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .intro-banner {
      background: #EFFDF6;
      border: 1px solid #B8F3D7;
      border-radius: 6px;
      padding: 6px 9px;
      margin-bottom: 8px;
      font-size: 7.8pt;
      color: #123528;
      line-height: 1.35;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      margin-bottom: 8px;
    }
    table.data-table th {
      background: #171B2D;
      color: #FFFFFF;
      font-family: 'Jost', sans-serif;
      text-align: left;
      padding: 4px 6px;
      font-weight: 600;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    table.data-table td {
      padding: 4.5px 6px;
      border-bottom: 1px solid #E5E8ED;
      vertical-align: top;
      line-height: 1.3;
    }
    table.data-table tr:nth-child(even) td { background: #F9FAFB; }
    .pill {
      display: inline-block;
      background: #E8F9F1;
      color: #04A562;
      font-weight: 700;
      font-size: 6.5pt;
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid #B8F3D7;
      margin-bottom: 2px;
    }
    .step-box {
      border: 1px solid #DFE2E8;
      border-radius: 5px;
      padding: 5px 7px;
      background: #FAFBFC;
      font-size: 7.2pt;
    }
    .step-num {
      font-family: 'Jost', sans-serif;
      font-weight: 700;
      color: #04A562;
      font-size: 7.2pt;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .step-title {
      font-family: 'Jost', sans-serif;
      font-weight: 700;
      font-size: 8pt;
      color: #171B2D;
      margin-bottom: 2px;
    }
    .page-break { page-break-before: always; }
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-bottom: 8px;
    }
    .demo-item {
      background: #F4F6F9;
      border: 1px solid #DFE2E8;
      border-radius: 5px;
      padding: 5px 7px;
    }
    .demo-item-title {
      font-family: 'Jost', sans-serif;
      font-weight: 700;
      font-size: 7.5pt;
      color: #171B2D;
      margin-bottom: 2px;
    }
    .demo-item-desc {
      font-size: 7pt;
      color: #555;
      line-height: 1.25;
    }
    .footer-note {
      font-size: 7pt;
      color: #777;
      border-top: 1px solid #E5E8ED;
      padding-top: 4px;
      text-align: center;
      margin-top: 6px;
    }
  </style>
</head>
<body>

  <!-- PAGE 1 -->
  <div class="header-bar">
    <div>
      <div class="logo-text">moov<span>parcel</span></div>
      <div style="font-size: 7pt; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.05em;">Consultative Sales Framework & Discovery Blueprint</div>
    </div>
    <div class="header-sub">
      <strong>Proprietary Tech:</strong> Moov Ninja (150+ Marketplaces & Channels)<br>
      <strong>Carrier Partners:</strong> DPD • DHL • InPost • UPS<br>
      <strong>Yorkshire Support Desk:</strong> 0113 322 4101 | moovparcel.co.uk
    </div>
  </div>

  <div class="desk-meta-box">
    <div><strong>Company:</strong> ______________________</div>
    <div><strong>Contact & Role:</strong> _________________</div>
    <div><strong>Direct Phone/Email:</strong> ______________</div>
    <div><strong>Date & Rep:</strong> ___________________</div>
  </div>

  <div class="intro-banner">
    <strong>Who We Are:</strong> Moov Parcel was invented to help e-commerce SMEs be more productive. We give them access to <strong>Moov Ninja</strong>, a proprietary piece of software owned by ourselves, which connects them to over 150 different marketplaces and sales channels. This removes manual work, stops 1-by-1 booking errors, and unlocks new selling channels. Combined with our primary carrier relationships with <strong>DPD, DHL, InPost, and UPS</strong>, we deliver multi-carrier power and real human customer service.
  </div>

  <div class="section-title">1. The Consultative Sales Approach</div>
  <div style="font-size: 7.8pt; color: #333; margin-bottom: 6px; line-height: 1.35;">
    Our pipeline is a mix of inbound leads and outbound calling. Our outbound proposition is to call the business, reach the <strong>decision maker</strong> (Owner, Director, Operations Manager), and <strong>understand their business before ever pitching rates</strong>. We gather as much operational detail as possible, and then align our software, multi-carrier options, and human service to solve their specific challenges.
  </div>

  <div class="section-title">2. The 9 Core Discovery Areas (What Reps Must Understand)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">Discovery Area</th>
        <th style="width: 48%;">Trigger Question to Ask (Verbatim Script)</th>
        <th style="width: 27%;">Operational Focus & Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Parcel Volumes</strong></td>
        <td>"Roughly how many parcels are you dispatching on an average day or week? Does that volume spike significantly during peak periods or promotions?"</td>
        <td>Establish baseline daily/weekly parcel volume and seasonal surge capacity.</td>
      </tr>
      <tr>
        <td><strong>2. Destinations</strong></td>
        <td>"Where do these orders go? Are you primarily UK domestic mainland, or do you send to the Scottish Highlands, Islands, Northern Ireland, or Europe?"</td>
        <td>Identify regional domestic distribution and cross-border customs requirements.</td>
      </tr>
      <tr>
        <td><strong>3. Recipient Profile</strong></td>
        <td>"Who receives the goods — direct to consumer (B2C) residential addresses and lockers, or B2B trade and commercial retail addresses?"</td>
        <td>Matches parcel profile to carrier capabilities (e.g. InPost lockers vs B2B trade).</td>
      </tr>
      <tr>
        <td><strong>4. Sizes & Deadweights</strong></td>
        <td>"What does your parcel profile look like in terms of size and deadweight? What are your typical minimums and maximums?"</td>
        <td>Examine deadweight vs volumetric limits to prevent carrier surcharge penalties.</td>
      </tr>
      <tr>
        <td><strong>5. International Shipping</strong></td>
        <td>"Do you ship internationally, either to Europe or the rest of the world? How do you currently handle customs and IOSS?"</td>
        <td>Positions DHL Express / eCommerce capabilities and customs compliance.</td>
      </tr>
      <tr>
        <td><strong>6. Hazardous / Special Cargo</strong></td>
        <td>"Do you send anything that is hazardous, liquids, creams, glass, aerosols, batteries, or anything outside of the norm?"</td>
        <td>Identifies dangerous goods (ADR) compliance and restricted carrier items.</td>
      </tr>
      <tr>
        <td><strong>7. Packaging Requirements</strong></td>
        <td>"Do you have any specific packaging requirements — for example, poly mailers, custom branded boxes, long tubes, or 6x4 thermal labels?"</td>
        <td>Ensures packaging format compatibility with carrier sortation belts.</td>
      </tr>
      <tr>
        <td><strong>8. Software & Booking Method</strong></td>
        <td>"How do you book your parcels right now? Are you booking them one by one? What channels (Shopify, Amazon)? If you use a WMS, which one?"</td>
        <td><strong>Key Software Trigger:</strong> If booking 1-by-1, Moov Ninja automates this completely.</td>
      </tr>
      <tr>
        <td><strong>9. Couriers, Cut-offs & Pain</strong></td>
        <td>"Which couriers are collecting today? What time would you need a vehicle to collect from you if you were to move? Any challenges with price, service, or damage?"</td>
        <td><strong>Cut-Off Trigger:</strong> If driver collects too early, switch carriers. Isolate service pain.</td>
      </tr>
    </tbody>
  </table>

  <!-- PAGE 2 -->
  <div class="page-break"></div>

  <div class="header-bar" style="margin-top: 4px;">
    <div class="logo-text">moov<span>parcel</span></div>
    <div class="header-sub">The Power of the Demo & Guided Onboarding Journey</div>
  </div>

  <div class="section-title">3. The Power of the Demo: Why We Demo & Research Backing</div>
  <div style="background: #EFFDF6; border: 1px solid #B8F3D7; border-radius: 5px; padding: 6px 9px; margin-bottom: 6px; font-size: 7.5pt; color: #123528;">
    <strong>Sales Research Insight (Gong / Gartner):</strong> B2B sales data shows that technology-enabled services convert at up to <strong>68% higher win-rates</strong> when prospects experience a live product demonstration compared to receiving static rate quotes. When prospects see a rate sheet, they compare pennies; when they see Moov Ninja on screen, they see their morning dispatch headache disappearing.
  </div>

  <div style="font-weight: 700; font-size: 8pt; color: #171B2D; margin-bottom: 4px;">The 9 Problems Moov Ninja Solves (The Demo Showcase):</div>
  <div class="demo-grid">
    <div class="demo-item">
      <div class="demo-item-title" style="color: #04A562;">1. Multi-Channel Connectivity</div>
      <div class="demo-item-desc">Pulls 150+ channels (Shopify, TikTok Shop, Amazon, eBay) into one screen. Solves logging into multiple separate web portals.</div>
    </div>
    <div class="demo-item">
      <div class="demo-item-title" style="color: #04A562;">2. 1-Click Batch Shipping</div>
      <div class="demo-item-desc">Prints up to 100 shipping labels and pick lists simultaneously. Solves slow 1-by-1 manual typing and copy-paste errors.</div>
    </div>
    <div class="demo-item">
      <div class="demo-item-title" style="color: #04A562;">3. Internal Packing Station</div>
      <div class="demo-item-desc">Barcode scan verification confirms each item in the carton before printing. Solves packing errors and wrong items sent.</div>
    </div>
    <div class="demo-item">
      <div class="demo-item-title" style="color: #B28900;">4. Multi-Parcel International</div>
      <div class="demo-item-desc">Specialized workflow for multi-box overseas consignments that competitor software cannot support or breaks on.</div>
    </div>
    <div class="demo-item">
      <div class="demo-item-title" style="color: #B28900;">5. Carrier Error Message Visibility</div>
      <div class="demo-item-desc">Displays exact courier error codes (postcodes, tax IDs) so warehouse staff can fix and print labels instantly.</div>
    </div>
    <div class="demo-item">
      <div class="demo-item-title" style="color: #B28900;">6. Easy International Shipping</div>
      <div class="demo-item-desc">Automated commercial invoices and seamless EU IOSS compliance. Solves international border holds and paperwork headaches.</div>
    </div>
    <div class="demo-item">
      <div class="demo-item-title" style="color: #5B21B6;">7. Ninja Status Gamification</div>
      <div class="demo-item-desc">Visual Ninjas alert warehouse staff immediately when exceptions, address errors, or carrier delays occur.</div>
    </div>
    <div class="demo-item">
      <div class="demo-item-title" style="color: #5B21B6;">8. Direct-to-Printer Integration</div>
      <div class="demo-item-desc">Integrated printer software sends labels directly to 6x4 Zebra thermal printers without PDF dialogues or downloads.</div>
    </div>
    <div class="demo-item">
      <div class="demo-item-title" style="color: #5B21B6;">9. Smart Shipping Rules Engine</div>
      <div class="demo-item-desc">Automatically selects optimal carrier (DPD, DHL, InPost, UPS) based on weight, parcel dimensions, country, or postcode.</div>
    </div>
  </div>

  <div style="background: #F4F6F9; border-left: 2px solid #04A562; padding: 4px 8px; font-size: 7.2pt; font-style: italic; color: #333; margin-bottom: 8px;">
    <strong>Verbatim Rep Demo Pitch:</strong> "Anyone can email a list of prices that looks like every other courier. Let me show you 10 minutes on a quick screen share of how Moov Ninja actually connects your store, prints 100 labels in one click, and chooses the right carrier automatically. Do you have your screen open?"
  </div>

  <div class="section-title">4. The 7–10 Day Guided Onboarding Journey</div>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 6px;">
    <div class="step-box">
      <div class="step-num">Phase 01</div>
      <div class="step-title">Welcome to the Team</div>
      <div>Warm introduction into the Moov team by their dedicated specialist. Review discovery profile, volume patterns, and operational requirements.</div>
    </div>
    <div class="step-box">
      <div class="step-num">Phase 02</div>
      <div class="step-title">IT & Software Setup</div>
      <div>Provision Moov Ninja credentials and configure native store connections (Shopify, TikTok Shop, Amazon, WooCommerce) to verify live SKU & order ingestion.</div>
    </div>
    <div class="step-box">
      <div class="step-num">Phase 03</div>
      <div class="step-title">Courier Account Applications</div>
      <div>Moov directly applies for and coordinates dedicated sub-accounts with DPD, DHL, InPost, or UPS to lock in collection routes and vehicle timings.</div>
    </div>
    <div class="step-box">
      <div class="step-num">Phase 04</div>
      <div class="step-title">Workflow Training Call</div>
      <div>Dedicated 1-on-1 walkthrough call showing staff how to use Moov Ninja, helping them set up box defaults, 6x4 thermal printer output, and custom routing rules.</div>
    </div>
    <div class="step-box" style="border-color: #04A562; background: #F0FFF8;">
      <div class="step-num">Phase 05</div>
      <div class="step-title">Agreed Go-Live Date</div>
      <div>Firm, mutually agreed go-live date locked in with warehouse and carrier driver. First live batch collected; team actively tracks collection and hub scanning.</div>
    </div>
    <div class="step-box">
      <div class="step-num">Phase 06</div>
      <div class="step-title">Follow-Up Action & Support</div>
      <div>Proactive post-launch check-in to verify scan rates, audit invoice accuracy, and transition to our permanent Yorkshire support desk (0113 322 4101).</div>
    </div>
  </div>

  <div class="footer-note">
    MOOV PARCEL  •  Units 3-5 Parkway Link, Kettlebridge Road, Sheffield S9 3AJ  •  Sales: 0113 322 4100  •  Support: 0113 322 4101  •  moovparcel.co.uk
  </div>

</body>
</html>
"""

with open('print_blueprint.html', 'w', encoding='utf-8') as f:
    f.write(html_blueprint)
print('Wrote updated print_blueprint.html')

# -------------------------------------------------------------
# 2. WRITE PRINT_SLIDES_RICH.HTML (16:9 Widescreen Landscape)
# -------------------------------------------------------------
html_slides = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Moov Parcel - How We Sell</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Jost:wght@500;600;700;800&family=Mulish:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: 297mm 167.06mm landscape;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Mulish', -apple-system, sans-serif;
      color: #FDFFFF;
      background: #0B0E1B;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 8.5pt;
      line-height: 1.4;
    }
    .slide-page {
      width: 297mm;
      height: 167.06mm;
      padding: 10mm 15mm 8mm 15mm;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      background: #0B0E1B;
      background-image: 
        radial-gradient(circle at 90% 10%, rgba(29, 251, 157, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 10% 90%, rgba(65, 3, 204, 0.15) 0%, transparent 40%);
      overflow: hidden;
    }
    .slide-page::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 4px;
      background: linear-gradient(90deg, #1DFB9D 0%, #4103CC 60%, #1DFB9D 100%);
    }
    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 1px solid rgba(223, 224, 235, 0.14);
      padding-bottom: 4mm;
      margin-bottom: 3.5mm;
    }
    .eyebrow {
      font-family: 'Jost', sans-serif;
      font-size: 8pt;
      font-weight: 700;
      color: #1DFB9D;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .eyebrow .dot {
      width: 5px; height: 5px; border-radius: 50%; background: #1DFB9D;
    }
    h1 {
      font-family: 'Jost', sans-serif;
      font-size: 19pt;
      font-weight: 800;
      color: #FFFFFF;
      line-height: 1.15;
      letter-spacing: -0.015em;
    }
    h1 span.hl { color: #1DFB9D; }
    .header-subtext {
      font-size: 8.5pt;
      color: #9FA2B4;
      text-align: right;
      max-width: 42%;
      line-height: 1.35;
    }
    .slide-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 3.5mm;
      min-height: 0;
    }
    .slide-footer {
      border-top: 1px solid rgba(223, 224, 235, 0.12);
      padding-top: 2.5mm;
      margin-top: 2.5mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #758696;
    }
    .slide-footer strong { color: #1DFB9D; }
    .card {
      background: rgba(23, 27, 45, 0.75);
      border: 1px solid rgba(223, 224, 235, 0.12);
      border-radius: 8px;
      padding: 9px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card h3 {
      font-family: 'Jost', sans-serif;
      font-size: 11pt;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 4px;
    }
    .card p {
      font-size: 8pt;
      color: #C6C7CD;
      line-height: 1.35;
    }
    .badge {
      display: inline-block;
      font-family: 'Jost', sans-serif;
      font-size: 6.8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 6px;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .badge-green { background: rgba(29, 251, 157, 0.15); color: #1DFB9D; border: 1px solid rgba(29, 251, 157, 0.3); }
    .badge-yellow { background: rgba(254, 202, 0, 0.15); color: #FECA00; border: 1px solid rgba(254, 202, 0, 0.3); }
    .badge-purple { background: rgba(65, 3, 204, 0.25); color: #B794F6; border: 1px solid rgba(65, 3, 204, 0.4); }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      flex: 1;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      flex: 1;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 9px;
      flex: 1;
    }
    ul.check-list {
      list-style: none;
      padding: 0;
      margin: 4px 0 0 0;
      font-size: 7.8pt;
      color: #C6C7CD;
    }
    ul.check-list li {
      position: relative;
      padding-left: 12px;
      margin-bottom: 3.5px;
      line-height: 1.3;
    }
    ul.check-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #1DFB9D;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <!-- SLIDE 1: WHO WE ARE -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="eyebrow"><span class="dot"></span> Moov Parcel // Commercial Identity</div>
        <h1>How Moov Parcel Sells: <span class="hl">The Consultative Framework</span></h1>
      </div>
      <div class="header-subtext">
        Moov Parcel was invented to help e-commerce SMEs be more productive through proprietary software and multi-carrier solutions.
      </div>
    </div>

    <div class="slide-body">
      <div class="grid-3">
        <div class="card" style="border-color: rgba(29, 251, 157, 0.3); background: rgba(29, 251, 157, 0.04);">
          <div>
            <span class="badge badge-green">Our Purpose</span>
            <h3 style="color: #1DFB9D;">Empowering E-Commerce SMEs</h3>
            <p>Moov Parcel exists to make growing online retailers more productive.</p>
            <ul class="check-list">
              <li>Eliminates manual 1-by-1 booking and customer service friction.</li>
              <li>Increases dispatch efficiency and stops mis-delivery errors.</li>
              <li>Gives growing brands the collective power and tools normally reserved for retail giants.</li>
            </ul>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; font-size: 7.2pt; color: #9FA2B4; margin-top: 5px;">
            <strong style="color: #1DFB9D;">Core Mission:</strong> Helping online retailers ship faster, smarter, and with fewer mistakes.
          </div>
        </div>

        <div class="card">
          <div>
            <span class="badge badge-yellow">Proprietary Technology</span>
            <h3 style="color: #FECA00;">Moov Ninja (150+ Channels)</h3>
            <p>Our cloud order management software is proprietary, owned by ourselves, and given to our shipping clients at no extra cost.</p>
            <ul class="check-list">
              <li>Direct connections to Shopify, TikTok Shop, Amazon, eBay, WooCommerce, etc.</li>
              <li>Automated batch label printing eliminates repetitive manual re-keying.</li>
              <li>Allows retailers to expand onto new sales channels easily.</li>
            </ul>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; font-size: 7.2pt; color: #9FA2B4; margin-top: 5px;">
            <strong style="color: #FECA00;">Software Benefit:</strong> Enterprise order management with zero software subscription fees.
          </div>
        </div>

        <div class="card">
          <div>
            <span class="badge badge-purple">Multi-Carrier Solutions</span>
            <h3 style="color: #B794F6;">DPD, DHL, InPost & UPS</h3>
            <p>We maintain primary relationships with the UK's leading parcel carriers:</p>
            <ul class="check-list">
              <li><strong>DPD:</strong> Domestic next-day & timed delivery excellence.</li>
              <li><strong>DHL:</strong> Global express international & cross-border eCommerce.</li>
              <li><strong>InPost:</strong> Automated national locker network & drop-to-shop.</li>
              <li><strong>UPS:</strong> Domestic parcel and worldwide commercial freight.</li>
            </ul>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; font-size: 7.2pt; color: #9FA2B4; margin-top: 5px;">
            <strong style="color: #B794F6;">Multi-Carrier Value:</strong> Multiple carrier choices managed seamlessly on a single invoice.
          </div>
        </div>
      </div>

      <div style="background: rgba(23, 27, 45, 0.9); border: 1px solid rgba(223, 224, 235, 0.1); border-radius: 6px; padding: 5px 10px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: 'Jost'; font-size: 7.5pt; font-weight: 700; color: #1DFB9D; text-transform: uppercase;">Primary Carrier Relationships:   DPD   •   DHL   •   InPost   •   UPS</span>
        <span style="font-size: 7.5pt; color: #C6C7CD;">Proprietary Technology: Moov Ninja (150+ Direct Integrations)</span>
      </div>
    </div>

    <div class="slide-footer">
      <span>MOOV PARCEL  •  COMMERCIAL SALES BLUEPRINT  •  Units 3-5 Parkway Link, Sheffield S9 3AJ</span>
      <span>Slide <strong>1 of 6</strong></span>
    </div>
  </div>

  <!-- SLIDE 2: WHAT MAKES US DIFFERENT -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="eyebrow"><span class="dot"></span> Our Competitive Edge</div>
        <h1>What Makes Moov Parcel Different</h1>
      </div>
      <div class="header-subtext">
        We do not sell as a low-cost postage reseller. We combine proprietary technology with multi-carrier flexibility and hands-on service.
      </div>
    </div>

    <div class="slide-body">
      <div class="grid-2" style="grid-template-rows: 1fr 1fr; gap: 8px;">
        <div class="card" style="border-left: 3px solid #1DFB9D;">
          <h3 style="color: #1DFB9D; font-size: 10.5pt;">1. Proprietary Free Software (Moov Ninja)</h3>
          <p>Unlike brokers who offer only rate sheets, we give our customers our own proprietary order management system. It connects into 150+ sales platforms, eliminates 1-by-1 manual typing, stops mis-delivery errors, and costs our shipping clients nothing.</p>
        </div>

        <div class="card" style="border-left: 3px solid #B794F6;">
          <h3 style="color: #B794F6; font-size: 10.5pt;">2. True Multi-Carrier Choice on One Invoice</h3>
          <p>Instead of locking customers into a single courier, we offer direct access to DPD, DHL, InPost, and UPS. Customers get the right carrier for each parcel format (small packet, standard carton, locker, international) with a single weekly invoice.</p>
        </div>

        <div class="card" style="border-left: 3px solid #FECA00;">
          <h3 style="color: #FECA00; font-size: 10.5pt;">3. Carrier Switching for Better Collection Times</h3>
          <p>If a merchant is stuck with an early collection time (e.g. 2:00 or 2:30pm) that cuts off afternoon sales, we can switch them to a different carrier in our network whose local round supports a later collection time, plus InPost options for late orders.</p>
        </div>

        <div class="card" style="border-left: 3px solid #FFFFFF;">
          <h3 style="color: #FFFFFF; font-size: 10.5pt;">4. Exceptional Customer Service from Real People</h3>
          <p>Our customers don't sit in automated phone queues or argue with chatbots. Our team answers straight away (0113 322 4101) with real UK logistics experts who resolve parcel delays, tracking queries, and carrier issues on their behalf.</p>
        </div>
      </div>

      <div style="background: rgba(23, 27, 45, 0.95); border: 1px solid rgba(29, 251, 157, 0.25); border-radius: 6px; padding: 5px 10px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: 'Jost'; font-size: 8pt; font-weight: 700; color: #1DFB9D; text-transform: uppercase;">Our Core Brand Standard:</span>
        <span style="font-size: 8pt; color: #FDFFFF; font-style: italic;">"Don't just deliver parcels... Moov them."  •  "Don't be cheap, be cost-effective."</span>
      </div>
    </div>

    <div class="slide-footer">
      <span>MOOV PARCEL  •  COMMERCIAL SALES BLUEPRINT  •  Direct Support: 0113 322 4101</span>
      <span>Slide <strong>2 of 6</strong></span>
    </div>
  </div>

  <!-- SLIDE 3: THE CONSULTATIVE JOURNEY WITH DEMO -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="eyebrow"><span class="dot"></span> Commercial Methodology</div>
        <h1>The Consultative Sales Journey: <span class="hl">Why We Demo</span></h1>
      </div>
      <div class="header-subtext">
        How we combine inbound leads and outbound calling with live software demonstrations to convert at 2.5x higher rates.
      </div>
    </div>

    <div class="slide-body">
      <div class="grid-4">
        <div class="card">
          <span class="badge badge-green">Step 01</span>
          <h3 style="font-size: 10.5pt;">Outbound Hook & Decision Maker</h3>
          <p>A mixture of inbound leads (email marketing & web) and outbound calls.</p>
          <ul class="check-list" style="font-size: 7.2pt;">
            <li>Reach the decision maker (Owner, Director, Ops Manager).</li>
            <li>Acknowledge interruption and state our productivity purpose.</li>
            <li>Gain agreement to explore their current packing bench setup.</li>
          </ul>
        </div>

        <div class="card">
          <span class="badge badge-yellow">Step 02</span>
          <h3 style="font-size: 10.5pt;">Deep 9-Point Discovery</h3>
          <p>Dig up as much operational detail as possible:</p>
          <ul class="check-list" style="font-size: 7.2pt;">
            <li>Volumes, destinations, B2B vs B2C.</li>
            <li>Sizes, deadweights, min/max, hazmat.</li>
            <li>Current booking software & WMS stack.</li>
            <li>Couriers, required collection times & pain points.</li>
          </ul>
        </div>

        <div class="card" style="border-color: rgba(29, 251, 157, 0.4); background: rgba(29, 251, 157, 0.04);">
          <span class="badge badge-green">Step 03</span>
          <h3 style="color: #1DFB9D; font-size: 10.5pt;">The Live Software Demo</h3>
          <p><strong>Crucial Pivot:</strong> Never send blind rates without a demonstration.</p>
          <ul class="check-list" style="font-size: 7.2pt;">
            <li>Show Moov Ninja live on a 15-minute screen share.</li>
            <li>Demonstrate batch printing, packing station & shipping rules.</li>
            <li><strong>Research:</strong> Live demos lift B2B win rates by up to 68%.</li>
          </ul>
        </div>

        <div class="card">
          <span class="badge badge-purple">Step 04</span>
          <h3 style="font-size: 10.5pt;">Rates, Agreement & Handover</h3>
          <p>Present tailored proposal and execute clean handover:</p>
          <ul class="check-list" style="font-size: 7.2pt;">
            <li>Send transparent rate proposal matching their profile.</li>
            <li>Follow up until agreement is secured.</li>
            <li>Clean handover to onboarding for 7–10 day setup.</li>
          </ul>
        </div>
      </div>

      <div style="background: rgba(47, 25, 86, 0.4); border: 1px solid rgba(65, 3, 204, 0.35); border-radius: 6px; padding: 5px 10px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: 'Jost'; font-size: 8pt; font-weight: 700; color: #1DFB9D; text-transform: uppercase;">The Sales Conversion Rule:</span>
        <span style="font-size: 8pt; color: #C6C7CD;">"Demonstrating software live transforms an intangible rate quote into an indispensable operational workflow."</span>
      </div>
    </div>

    <div class="slide-footer">
      <span>MOOV PARCEL  •  COMMERCIAL SALES BLUEPRINT  •  0113 322 4100</span>
      <span>Slide <strong>3 of 6</strong></span>
    </div>
  </div>

  <!-- SLIDE 4: THE 9 DISCOVERY AREAS -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="eyebrow"><span class="dot"></span> Discovery Execution</div>
        <h1>The 9 Core Discovery Areas</h1>
      </div>
      <div class="header-subtext">
        What the sales representative must understand from the business before presenting a proposal.
      </div>
    </div>

    <div class="slide-body">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; flex: 1;">
        <div class="card">
          <span class="badge badge-green">1. Parcel Volumes</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>"How many parcels do you send daily and weekly?"</strong></p>
          <p style="font-size: 7.2pt;">Check baseline volume and peak surge multiples (Black Friday/Q4).</p>
        </div>

        <div class="card">
          <span class="badge badge-green">2. Destinations</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>"Where do you send them to?"</strong></p>
          <p style="font-size: 7.2pt;">UK domestic mainland, Scottish Highlands/Islands, Northern Ireland, Europe, or ROW.</p>
        </div>

        <div class="card">
          <span class="badge badge-green">3. Recipient Profile</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>"Are they businesses or consumers?"</strong></p>
          <p style="font-size: 7.2pt;">B2C residential addresses & lockers vs B2B trade retail addresses.</p>
        </div>

        <div class="card">
          <span class="badge badge-yellow">4. Parcel Sizes & Weights</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>"What are the sizes and deadweights?"</strong></p>
          <p style="font-size: 7.2pt;">Typical dimensions, minimums, maximums, and volumetric profiles.</p>
        </div>

        <div class="card">
          <span class="badge badge-yellow">5. International Shipping</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>"Do you send internationally?"</strong></p>
          <p style="font-size: 7.2pt;">European delivery (IOSS setup) or Rest of World express/standard freight.</p>
        </div>

        <div class="card">
          <span class="badge badge-yellow">6. Hazardous / Special Cargo</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>"Do you send anything hazardous?"</strong></p>
          <p style="font-size: 7.2pt;">Liquids, creams, glass, aerosols, batteries, or goods outside the norm.</p>
        </div>

        <div class="card">
          <span class="badge badge-purple">7. Packaging Requirements</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>"Any specific packaging rules?"</strong></p>
          <p style="font-size: 7.2pt;">Poly mailer bags, custom boxes, crash-locks, or 6x4 thermal label printers.</p>
        </div>

        <div class="card">
          <span class="badge badge-purple">8. Software & Booking</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>"How do you book parcels now?"</strong></p>
          <p style="font-size: 7.2pt;">1-by-1 manual entry? Channels (Shopify, Amazon, TikTok)? Any WMS system?</p>
        </div>

        <div class="card">
          <span class="badge badge-purple">9. Couriers, Cut-offs & Pain</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>"What collection time do you need?"</strong></p>
          <p style="font-size: 7.2pt;">Current couriers, required vehicle collection time, and challenges (price, service, damage).</p>
        </div>
      </div>

      <div style="background: rgba(23, 27, 45, 0.95); border: 1px solid rgba(29, 251, 157, 0.25); border-radius: 6px; padding: 4px 10px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: 'Jost'; font-size: 7.5pt; font-weight: 700; color: #1DFB9D; text-transform: uppercase;">Discovery Objective:</span>
        <span style="font-size: 7.5pt; color: #C6C7CD;">Gather complete operational context so you can pivot naturally into booking the live Moov Ninja demo.</span>
      </div>
    </div>

    <div class="slide-footer">
      <span>MOOV PARCEL  •  COMMERCIAL SALES BLUEPRINT  •  Yorkshire Ops Desk: 0113 322 4101</span>
      <span>Slide <strong>4 of 6</strong></span>
    </div>
  </div>

  <!-- SLIDE 5: WHY WE DEMO // THE 9 PROBLEMS MOOV NINJA SOLVES -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="eyebrow"><span class="dot"></span> Software Showcase // Live Demonstration</div>
        <h1>Why We Demo: <span class="hl">The 9 Problems Moov Ninja Solves</span></h1>
      </div>
      <div class="header-subtext">
        Research proves live product demonstrations convert 2.5x higher because prospects see tangible workflow automation.
      </div>
    </div>

    <div class="slide-body">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; flex: 1;">
        <div class="card">
          <span class="badge badge-green">1. Multi-Channel Connectivity</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>Connects 150+ Marketplaces</strong></p>
          <p style="font-size: 7.2pt;">Shopify, TikTok Shop, Amazon, eBay in one view. Solves logging into multiple separate web portals.</p>
        </div>

        <div class="card">
          <span class="badge badge-green">2. 1-Click Batch Shipping</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>Print 100 Labels in Seconds</strong></p>
          <p style="font-size: 7.2pt;">Simultaneously prints shipping labels and pick lists. Solves slow 1-by-1 manual typing and address errors.</p>
        </div>

        <div class="card">
          <span class="badge badge-green">3. Internal Packing Station</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>Barcode Verification at Bench</strong></p>
          <p style="font-size: 7.2pt;">Scan verification confirms each item in the box before printing. Solves packing errors and wrong items sent.</p>
        </div>

        <div class="card">
          <span class="badge badge-yellow">4. Multi-Parcel International</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>Multi-Box Overseas Shipments</strong></p>
          <p style="font-size: 7.2pt;">Specialized workflow for multi-carton exports that competitor shipping software cannot support or breaks on.</p>
        </div>

        <div class="card">
          <span class="badge badge-yellow">5. Carrier Error Message Visibility</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>Actionable Real-Time Courier Logs</strong></p>
          <p style="font-size: 7.2pt;">Displays exact courier error codes (bad postcodes, tax IDs) so staff fix and print labels on the spot.</p>
        </div>

        <div class="card">
          <span class="badge badge-yellow">6. Easy International Shipping</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>Customs & IOSS Made Simple</strong></p>
          <p style="font-size: 7.2pt;">Electronic commercial invoices and seamless EU IOSS compliance. Solves international border holds.</p>
        </div>

        <div class="card">
          <span class="badge badge-purple">7. Ninja Status Gamification</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>Visual Problem Indicators</strong></p>
          <p style="font-size: 7.2pt;">Engaging visual Ninjas alert warehouse staff immediately when exceptions, address errors, or delays occur.</p>
        </div>

        <div class="card">
          <span class="badge badge-purple">8. Direct-to-Printer Integration</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>Integrated Printer Software</strong></p>
          <p style="font-size: 7.2pt;">Directly sends labels to 6x4 Zebra thermal printers without downloading PDFs or opening print dialogs.</p>
        </div>

        <div class="card">
          <span class="badge badge-purple">9. Smart Shipping Rules Engine</span>
          <p style="font-size: 7.8pt; color: #FDFFFF;"><strong>Automated Carrier Selection</strong></p>
          <p style="font-size: 7.2pt;">Chooses the right carrier (DPD, DHL, InPost, UPS) automatically based on weight, dimensions, price, or postcode.</p>
        </div>
      </div>

      <div style="background: rgba(23, 27, 45, 0.95); border: 1px solid rgba(29, 251, 157, 0.25); border-radius: 6px; padding: 4px 10px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: 'Jost'; font-size: 7.5pt; font-weight: 700; color: #1DFB9D; text-transform: uppercase;">Rep Demo Script:</span>
        <span style="font-size: 7.5pt; color: #C6C7CD; font-style: italic;">"Anyone can email a list of prices. Let me show you 10 minutes on a quick screen share of how Moov Ninja actually automates your packing bench and rules."</span>
      </div>
    </div>

    <div class="slide-footer">
      <span>MOOV PARCEL  •  COMMERCIAL SALES BLUEPRINT  •  moovparcel.co.uk</span>
      <span>Slide <strong>5 of 6</strong></span>
    </div>
  </div>

  <!-- SLIDE 6: ONBOARDING -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="eyebrow"><span class="dot"></span> Client Onboarding // Handover to Live Dispatch</div>
        <h1>The 7–10 Day Guided Onboarding Journey</h1>
      </div>
      <div class="header-subtext">
        How sales executes a clean handover to our dedicated onboarding team who manage the 7–10 day setup process.
      </div>
    </div>

    <div class="slide-body">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; flex: 1;">
        <div class="card">
          <span class="badge badge-green">Phase 01</span>
          <h3 style="font-size: 9.5pt;">Welcome to the Team</h3>
          <ul class="check-list" style="font-size: 7.2pt;">
            <li>Warm welcome into the Moov team by their dedicated specialist.</li>
            <li>Review discovery notes to confirm order volumes & operational needs.</li>
            <li>Clear lines of communication established with a named contact.</li>
          </ul>
        </div>

        <div class="card">
          <span class="badge badge-green">Phase 02</span>
          <h3 style="font-size: 9.5pt;">IT & Software Setup</h3>
          <ul class="check-list" style="font-size: 7.2pt;">
            <li>Moov Ninja accounts provisioned with secure IT credentials.</li>
            <li>Connect Shopify, TikTok Shop, Amazon, or WooCommerce stores.</li>
            <li>If using a WMS, establish integration or automated file sync.</li>
          </ul>
        </div>

        <div class="card">
          <span class="badge badge-yellow">Phase 03</span>
          <h3 style="font-size: 9.5pt;">Courier Account Applications</h3>
          <ul class="check-list" style="font-size: 7.2pt;">
            <li>Moov applies for dedicated sub-accounts with DPD, DHL, InPost, or UPS.</li>
            <li>Direct coordination with carrier depot operations.</li>
            <li>Collection rounds, driver routes, and vehicle timings booked.</li>
          </ul>
        </div>

        <div class="card">
          <span class="badge badge-yellow">Phase 04</span>
          <h3 style="font-size: 9.5pt;">Workflow Training Call</h3>
          <ul class="check-list" style="font-size: 7.2pt;">
            <li>Dedicated 1-on-1 walkthrough call showing staff how to use Moov Ninja.</li>
            <li>Configure box defaults, 6x4 thermal printer output & carrier routing.</li>
            <li>Tailor custom workflows that make daily packing faster and easier.</li>
          </ul>
        </div>

        <div class="card" style="border-color: rgba(29, 251, 157, 0.4); background: rgba(29, 251, 157, 0.04);">
          <span class="badge badge-green">Phase 05</span>
          <h3 style="color: #1DFB9D; font-size: 9.5pt;">Agreed Go-Live Date</h3>
          <ul class="check-list" style="font-size: 7.2pt;">
            <li>Firm, mutually agreed go-live date locked in with warehouse & driver.</li>
            <li>First live collection generated from the software and collected by courier.</li>
            <li>Dedicated team actively tracks collection and hub scanning in real time.</li>
          </ul>
        </div>

        <div class="card" style="border-color: rgba(65, 3, 204, 0.4); background: rgba(47, 25, 86, 0.35);">
          <span class="badge badge-purple">Phase 06</span>
          <h3 style="color: #B794F6; font-size: 9.5pt;">Follow-Up Action & Support</h3>
          <ul class="check-list" style="font-size: 7.2pt;">
            <li>Proactive post-launch check-in call to verify delivery scan rates.</li>
            <li>Review invoice accuracy and answer any packing team questions.</li>
            <li>Seamless transition to our permanent Yorkshire support team.</li>
          </ul>
        </div>
      </div>

      <div style="background: rgba(23, 27, 45, 0.95); border: 1px solid rgba(29, 251, 157, 0.3); border-radius: 6px; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-family: 'Jost'; font-size: 8pt; font-weight: 700; color: #1DFB9D; text-transform: uppercase;">The 7–10 Day Onboarding Commitment</div>
          <div style="font-size: 7.3pt; color: #C6C7CD;">We take the time to set up IT properly, train your warehouse team, and secure courier accounts so your go-live is 100% smooth.</div>
        </div>
        <div style="text-align: right; white-space: nowrap;">
          <div style="font-family: 'Jost'; font-size: 8.5pt; font-weight: 700; color: #FFFFFF;">0113 322 4100</div>
          <div style="font-size: 6.8pt; color: #9FA2B4;">enquiries@moovparcel.co.uk</div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>MOOV PARCEL  •  COMMERCIAL SALES BLUEPRINT  •  moovparcel.co.uk</span>
      <span>Slide <strong>6 of 6</strong></span>
    </div>
  </div>

</body>
</html>
"""

with open('print_slides_rich.html', 'w', encoding='utf-8') as f:
    f.write(html_slides)
print('Wrote updated print_slides_rich.html')

# -------------------------------------------------------------
# 3. RENDER BOTH PDFS WITH CHROME HEADLESS
# -------------------------------------------------------------
cmd_bp = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--headless",
    "--disable-gpu",
    "--print-to-pdf=/Users/rossjermy/Documents/InterPricing/Moov_Parcel_Sales_Discovery_Blueprint.pdf",
    "print_blueprint.html"
]
subprocess.run(cmd_bp, check=True)
print('Re-rendered Moov_Parcel_Sales_Discovery_Blueprint.pdf')

cmd_sl = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--headless",
    "--disable-gpu",
    "--print-to-pdf=/Users/rossjermy/Documents/InterPricing/Moov_Parcel_How_We_Sell_Slides.pdf",
    "print_slides_rich.html"
]
subprocess.run(cmd_sl, check=True)
print('Re-rendered Moov_Parcel_How_We_Sell_Slides.pdf')

