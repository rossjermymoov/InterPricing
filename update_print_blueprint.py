with open('print_blueprint.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Section 4: 72-Hour Onboarding with the real 7-10 day journey
old_section = """  <div class="section-title">4. The 72-Hour Frictionless Onboarding Blueprint</div>
  <div class="timeline-steps">
    <div class="step-box">
      <div class="step-num">Day 1 • Step 01</div>
      <div class="step-title">Tariff Audit</div>
      <div>Side-by-side comparison generated showing carrier rate savings + £0 Moov Ninja software savings.</div>
    </div>
    <div class="step-box">
      <div class="step-num">Day 1 • Step 02</div>
      <div class="step-title">Ninja Store Sync</div>
      <div>10-minute API link to Shopify, TikTok Shop, or Amazon. SKUs and order channels imported with zero coding.</div>
    </div>
    <div class="step-box">
      <div class="step-num">Day 2 • Step 03</div>
      <div class="step-title">Bench Calibration</div>
      <div>Zebra 6x4 thermal printer test labels verified; automated routing rules configured by weight & destination.</div>
    </div>
    <div class="step-box">
      <div class="step-num">Day 2 • Step 04</div>
      <div class="step-title">Carrier Allocation</div>
      <div>Carrier collection round confirmed or switched to a carrier supporting a later local afternoon pickup window.</div>
    </div>
    <div class="step-box" style="border-color: #04A562; background: #F0FFF8;">
      <div class="step-num">Day 3 • Step 05</div>
      <div class="step-title">Live Dispatch</div>
      <div>First live manifest collected. Leeds/Sheffield desk monitors deliveries live. Parallel running ensures zero risk.</div>
    </div>
  </div>"""

new_section = """  <div class="section-title">4. The 7–10 Day Guided Onboarding Journey (Sales-to-Ops Handover)</div>
  <div style="font-size: 7.8pt; color: #555; margin-bottom: 8px;">
    Onboarding is a structured 7-to-10 day consultative process to ensure IT systems, courier sub-accounts, and warehouse workflows are calibrated perfectly before live dispatch:
  </div>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px;">
    <div class="step-box">
      <div class="step-num">Phase 01</div>
      <div class="step-title">Welcome & Account Alignment</div>
      <div>Warm introduction into the Moov team by their dedicated specialist. Review discovery profile, volume patterns, and operational requirements.</div>
    </div>
    <div class="step-box">
      <div class="step-num">Phase 02</div>
      <div class="step-title">IT & System Setup</div>
      <div>Provision Moov Ninja credentials and configure native store connections (Shopify, TikTok Shop, Amazon, WooCommerce) to verify live SKU and order sync.</div>
    </div>
    <div class="step-box">
      <div class="step-num">Phase 03</div>
      <div class="step-title">Courier Account Applications</div>
      <div>Moov directly applies for and manages courier accounts (DPD, DHL, InPost, UPS, Evri) to schedule collection rounds and vehicle routing.</div>
    </div>
    <div class="step-box">
      <div class="step-num">Phase 04</div>
      <div class="step-title">Workflow Training Call</div>
      <div>Dedicated 1-on-1 video call to walk their team through Moov Ninja, calibrate 6x4 thermal printer output, set box defaults, and build routing rules.</div>
    </div>
    <div class="step-box" style="border-color: #04A562; background: #F0FFF8;">
      <div class="step-num">Phase 05</div>
      <div class="step-title">Agreed Go-Live Date</div>
      <div>Mutually agreed go-live date locked in. First live test batch collected by driver; dedicated team actively monitors hub injection live.</div>
    </div>
    <div class="step-box">
      <div class="step-num">Phase 06</div>
      <div class="step-title">Follow-Up & Ongoing Support</div>
      <div>Proactive post-launch check-in to review delivery scan rates, audit invoice accuracy, and ensure seamless ongoing support via our Yorkshire desk.</div>
    </div>
  </div>"""

if old_section in content:
    content = content.replace(old_section, new_section)
    with open('print_blueprint.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated print_blueprint.html successfully')
else:
    print('Could not find old_section in print_blueprint.html')

